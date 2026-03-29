from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
import io

from .models import Invoice
from .serializers import InvoiceSerializer

from apps.audit.middleware import AuditModelMixin
from apps.audit.models import AuditLog

# --- Safe PDF backend detection (works on Windows without GTK) ---
PDF_BACKEND = None

try:
    from weasyprint import HTML as WeasyHTML
    PDF_BACKEND = "weasyprint"
except Exception:
    pass  # WeasyPrint needs GTK libs on Windows - skip silently

if PDF_BACKEND is None:
    try:
        from xhtml2pdf import pisa
        PDF_BACKEND = "xhtml2pdf"
    except Exception:
        pass  # Neither backend available


def render_pdf(html_string):
    """Render HTML string to PDF bytes using whichever backend is available."""
    if PDF_BACKEND == "weasyprint":
        return WeasyHTML(string=html_string).write_pdf()
    if PDF_BACKEND == "xhtml2pdf":
        buffer = io.BytesIO()
        pisa.CreatePDF(io.StringIO(html_string), dest=buffer)
        return buffer.getvalue()
    return None


class InvoiceViewSet(AuditModelMixin,viewsets.ModelViewSet):
    audit_module = AuditLog.MODULE_INVOICES
    queryset = Invoice.objects.select_related("customer").prefetch_related("items__laptop").all()
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        # Search
        search = params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(invoice_number__icontains=search) |
                Q(customer__name__icontains=search)
            )

        # Status filter
        status_filter = params.get("status", "").strip().upper()
        if status_filter and status_filter != "ALL":
            qs = qs.filter(status=status_filter)

        # Type filter
        type_filter = params.get("type", "").strip().upper()
        if type_filter and type_filter != "ALL":
            qs = qs.filter(invoice_type=type_filter)

        # Date range filter
        date_range = params.get("date_range", "").strip().lower()
        now = timezone.now()
        if date_range == "today":
            qs = qs.filter(created_at__date=now.date())
        elif date_range == "week":
            qs = qs.filter(created_at__gte=now - timedelta(days=7))
        elif date_range == "month":
            qs = qs.filter(created_at__gte=now - timedelta(days=30))
        elif date_range == "quarter":
            qs = qs.filter(created_at__gte=now - timedelta(days=90))

        return qs

    @action(detail=True, methods=["get"], url_path="pdf")
    def download_pdf(self, request, pk=None):
        """Generate and return invoice as PDF."""
        invoice = self.get_object()

        if PDF_BACKEND is None:
            return Response(
                {
                    "error": "No PDF library installed.",
                    "fix": "Run: pip install xhtml2pdf"
                },
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

        html_string = render_to_string(
            "invoices/invoice_pdf.html",
            {"invoice": invoice},
            request=request
        )
        pdf_bytes = render_pdf(html_string)

        if not pdf_bytes:
            return Response(
                {"error": "PDF generation failed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
        )
        return response

    @action(detail=True, methods=["post"], url_path="send-email")
    def send_email(self, request, pk=None):
        """Send invoice via email to customer."""
        invoice = self.get_object()
        customer = invoice.customer

        recipient_email = request.data.get("email") or customer.email
        if not recipient_email:
            return Response(
                {"error": "No email address found for this customer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        subject = f"Invoice {invoice.invoice_number} from Ditel Network Solutions"
        html_body = render_to_string("invoices/invoice_email.html", {"invoice": invoice})

        email = EmailMessage(
            subject=subject,
            body=html_body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "accounts@ditel.co.in"),
            to=[recipient_email],
        )
        email.content_subtype = "html"

        # Attach PDF if any backend is available
        if PDF_BACKEND is not None:
            html_string = render_to_string(
                "invoices/invoice_pdf.html",
                {"invoice": invoice},
                request=request
            )
            pdf_bytes = render_pdf(html_string)
            if pdf_bytes:
                email.attach(
                    f"invoice_{invoice.invoice_number}.pdf",
                    pdf_bytes,
                    "application/pdf"
                )

        email.send()

        return Response({"message": f"Invoice sent to {recipient_email}"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], url_path="update-status")
    def update_status(self, request, pk=None):
        """Update invoice status."""
        invoice = self.get_object()
        new_status = request.data.get("status", "").upper()
        valid = [s[0] for s in Invoice.STATUS_CHOICES]

        if new_status not in valid:
            return Response(
                {"error": f"Invalid status. Choose from: {', '.join(valid)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        invoice.status = new_status
        invoice.save(update_fields=["status"])
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """Return summary stats for dashboard cards."""
        qs = self.get_queryset()
        from django.db.models import Sum, Count

        data = qs.aggregate(
            total_count=Count("id"),
            total_amount=Sum("total_amount"),
            paid_amount=Sum("total_amount", filter=Q(status="PAID")),
            pending_amount=Sum("total_amount", filter=Q(status__in=["UNPAID", "PARTIAL"])),
        )

        return Response({
            "total_invoices": data["total_count"] or 0,
            "total_amount": float(data["total_amount"] or 0),
            "paid_amount": float(data["paid_amount"] or 0),
            "pending_amount": float(data["pending_amount"] or 0),
        })