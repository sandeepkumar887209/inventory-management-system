from django.utils import timezone
from django.db import transaction
from rest_framework import status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.inventory.models import Laptop, StockMovement

from .models import Demo, DemoItem
from .serializers import DemoSerializer


class DemoViewSet(ModelViewSet):
    queryset         = Demo.objects.all().order_by("-created_at")
    serializer_class = DemoSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["customer__name", "customer__phone", "purpose"]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        status_p  = params.get("status")
        purpose   = params.get("purpose")
        customer  = params.get("customer")
        overdue   = params.get("overdue")

        if status_p:
            qs = qs.filter(status=status_p.upper())
        if purpose:
            qs = qs.filter(purpose=purpose)
        if customer:
            qs = qs.filter(customer_id=customer)
        if overdue == "true":
            qs = qs.filter(
                status="ONGOING",
                expected_return_date__lt=timezone.now().date()
            )
        return qs

    # =========================================================
    # RETURN LAPTOPS
    # POST /demos/demo/{id}/return_laptops/
    # Body: { "laptops": [laptop_id, ...], "feedback": "..." }
    # =========================================================
    @action(detail=True, methods=["post"], url_path="return_laptops")
    @transaction.atomic
    def return_laptops(self, request, pk=None):
        demo       = self.get_object()
        laptop_ids = request.data.get("laptops", [])
        feedback   = request.data.get("feedback", "")

        if demo.status != "ONGOING":
            return Response(
                {"error": f"Demo is already '{demo.status}', cannot return."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not laptop_ids:
            return Response(
                {"error": "No laptops selected."},
                status=status.HTTP_400_BAD_REQUEST
            )

        returned = []

        for laptop_id in laptop_ids:
            try:
                laptop = Laptop.objects.get(
                    id=laptop_id,
                    customer=demo.customer,
                    status="DEMO"
                )
            except Laptop.DoesNotExist:
                continue

            StockMovement.objects.create(
                laptop=laptop,
                movement_type="RETURN",
                quantity=1,
                remarks=f"Returned from Demo #{demo.id}"
            )

            laptop.status   = "AVAILABLE"
            laptop.customer = None
            laptop.save()

            returned.append(laptop.serial_number)

        if not returned:
            return Response(
                {"error": "No valid demo laptops found to return."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Record feedback if provided
        if feedback:
            demo.feedback          = feedback
            demo.feedback_received = True

        # Mark demo returned only when ALL laptops are back
        all_demo_laptops = [item.laptop for item in demo.items.select_related("laptop")]
        all_returned     = all(l.status == "AVAILABLE" for l in all_demo_laptops)
        if all_returned:
            demo.status             = "RETURNED"
            demo.actual_return_date = timezone.now().date()

        demo.save()

        return Response({
            "success":          True,
            "returned_laptops": returned,
            "demo_status":      demo.status,
        })

    # =========================================================
    # CONVERT DEMO → RENTAL or SALE
    # POST /demos/demo/{id}/convert/
    # Body: { "convert_to": "rental" | "sale" }
    # =========================================================
    @action(detail=True, methods=["post"], url_path="convert")
    @transaction.atomic
    def convert(self, request, pk=None):
        demo        = self.get_object()
        convert_to  = request.data.get("convert_to", "").lower()

        if demo.status != "ONGOING":
            return Response(
                {"error": f"Demo is already '{demo.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if convert_to not in ("rental", "sale"):
            return Response(
                {"error": "convert_to must be 'rental' or 'sale'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        demo_laptops = [item.laptop for item in demo.items.select_related("laptop")]

        if not demo_laptops:
            return Response(
                {"error": "No laptops in this demo to convert."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if convert_to == "rental":
            result_id = self._convert_to_rental(demo, demo_laptops, request)
        else:
            result_id = self._convert_to_sale(demo, demo_laptops, request)

        return Response({
            "success":       True,
            "converted_to":  convert_to,
            "result_id":     result_id,
            "demo_status":   demo.status,
        })

    def _convert_to_rental(self, demo, laptops, request):
        from apps.rentals.models import Rental, RentalItem
        import datetime

        rental = Rental.objects.create(
            customer=demo.customer,
            expected_return_date=demo.expected_return_date + datetime.timedelta(days=30),
            status="ONGOING",
            gst=18,
        )

        subtotal = 0
        for laptop in laptops:
            # Move laptop from DEMO → RENTED
            StockMovement.objects.create(
                laptop=laptop,
                movement_type="OUT",
                quantity=1,
                remarks=f"Converted from Demo #{demo.id} to Rental #{rental.id}"
            )
            laptop.status = "RENTED"
            laptop.save()

            RentalItem.objects.create(
                rental=rental,
                laptop=laptop,
                rent_price=laptop.rent_per_month
            )
            subtotal += float(laptop.rent_per_month)

        gst_amount = subtotal * 0.18
        rental.subtotal      = subtotal
        rental.total_amount  = subtotal + gst_amount
        rental.save()

        demo.status           = "CONVERTED_RENTAL"
        demo.converted_rental = rental
        demo.actual_return_date = timezone.now().date()
        demo.save()

        return rental.id

    def _convert_to_sale(self, demo, laptops, request):
        from apps.sales.models import Sale, SaleItem

        sale = Sale.objects.create(
            customer=demo.customer,
            status="COMPLETED",
            gst=18,
        )

        subtotal = 0
        for laptop in laptops:
            StockMovement.objects.create(
                laptop=laptop,
                movement_type="SOLD",
                quantity=1,
                remarks=f"Converted from Demo #{demo.id} to Sale #{sale.id}"
            )
            laptop.status = "SOLD"
            laptop.save()

            SaleItem.objects.create(
                sale=sale,
                laptop=laptop,
                sale_price=laptop.price
            )
            subtotal += float(laptop.price)

        gst_amount = subtotal * 0.18
        sale.subtotal     = subtotal
        sale.total_amount = subtotal + gst_amount
        sale.save()

        demo.status          = "CONVERTED_SALE"
        demo.converted_sale  = sale
        demo.actual_return_date = timezone.now().date()
        demo.save()

        return sale.id

    # =========================================================
    # ADD / UPDATE FEEDBACK
    # POST /demos/demo/{id}/add_feedback/
    # Body: { "feedback": "...", "rating": 4 }
    # =========================================================
    @action(detail=True, methods=["post"], url_path="add_feedback")
    def add_feedback(self, request, pk=None):
        demo   = self.get_object()
        text   = request.data.get("feedback", "").strip()
        rating = request.data.get("rating")

        if not text:
            return Response(
                {"error": "Feedback text is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if rating is not None:
            rating = int(rating)
            if not (1 <= rating <= 5):
                return Response(
                    {"error": "Rating must be between 1 and 5."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            demo.feedback_rating = rating

        demo.feedback          = text
        demo.feedback_received = True
        demo.save(update_fields=["feedback", "feedback_received", "feedback_rating"])

        return Response({
            "success":  True,
            "feedback": demo.feedback,
            "rating":   demo.feedback_rating,
        })

    # =========================================================
    # STATS
    # GET /demos/demo/stats/
    # =========================================================
    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        qs = Demo.objects.all()
        today = timezone.now().date()
        return Response({
            "total":            qs.count(),
            "ongoing":          qs.filter(status="ONGOING").count(),
            "returned":         qs.filter(status="RETURNED").count(),
            "converted_rental": qs.filter(status="CONVERTED_RENTAL").count(),
            "converted_sale":   qs.filter(status="CONVERTED_SALE").count(),
            "overdue":          qs.filter(status="ONGOING", expected_return_date__lt=today).count(),
            "feedback_received":qs.filter(feedback_received=True).count(),
        })
