from django.core.management.base import BaseCommand
from django.db import transaction

from apps.customers.models import CustomerHistory, Customer
from apps.rentals.models import RentalItem
from apps.sales.models import SaleItem
from apps.demo.models import DemoItem

class Command(BaseCommand):
    help = "Backfills the CustomerHistory table from existing rentals, sales, and demos."

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting CustomerHistory backfill...")

        with transaction.atomic():
            # Clear existing history to avoid duplicates if run multiple times
            count = CustomerHistory.objects.count()
            if count > 0:
                self.stdout.write(f"Clearing {count} existing CustomerHistory records...")
                CustomerHistory.objects.all().delete()

            history_records = []

            # 1. Customers Created
            customers = Customer.objects.all()
            for c in customers:
                history_records.append(CustomerHistory(
                    customer=c,
                    action="CUSTOMER_CREATED",
                    event_date=c.created_at.date() if c.created_at else None,
                    note="Customer account created",
                ))

            # 2. Rentals (RENTAL_OUT, RENTAL_RETURNED)
            rental_items = RentalItem.objects.select_related("rental", "rental__customer", "laptop").all()
            for item in rental_items:
                rental = item.rental
                if not rental.customer:
                    continue

                rental_date = rental.rent_date
                ret_date = rental.actual_return_date

                # We need display name and serial
                name = getattr(item, "display_name", None) or " ".join(filter(None, [getattr(item, "snapshot_brand", None), getattr(item, "snapshot_model", None)])) or f"Item #{item.pk}"
                serial = getattr(item, "snapshot_serial_number", "") or ""

                # OUT
                history_records.append(CustomerHistory(
                    customer=rental.customer,
                    action="RENTAL_OUT",
                    event_date=rental_date,
                    laptop_name=name,
                    serial=serial,
                    ref_id=rental.id,
                    ref_label=f"R-{rental.id}",
                    amount=item.rent_price,
                    note=f"Rented: {rental_date}" + (f" · Due: {rental.expected_return_date}" if rental.expected_return_date else "")
                ))

                # RETURNED / REPLACED
                if rental.status in ("RETURNED", "REPLACED"):
                    is_ret = rental.status == "RETURNED"
                    history_records.append(CustomerHistory(
                        customer=rental.customer,
                        action="RENTAL_RETURNED" if is_ret else "RENTAL_REPLACED",
                        event_date=ret_date or rental_date,
                        laptop_name=name,
                        serial=serial,
                        ref_id=rental.id,
                        ref_label=f"R-{rental.id}",
                        amount=0,
                        note=(f"Returned on {ret_date}" if is_ret and ret_date else "Returned to inventory" if is_ret else "Replacement unit")
                    ))

            # 3. Demos (DEMO_OUT, DEMO_RETURNED)
            demo_items = DemoItem.objects.select_related("demo", "demo__customer", "laptop").all()
            for item in demo_items:
                demo = item.demo
                if not demo.customer:
                    continue

                out_date = demo.assigned_date
                ret_date = demo.actual_return_date

                name = getattr(item, "display_name", None) or " ".join(filter(None, [getattr(item, "snapshot_brand", None), getattr(item, "snapshot_model", None)])) or f"Item #{item.pk}"
                serial = getattr(item, "snapshot_serial_number", "") or ""

                history_records.append(CustomerHistory(
                    customer=demo.customer,
                    action="DEMO_OUT",
                    event_date=out_date,
                    laptop_name=name,
                    serial=serial,
                    ref_id=demo.id,
                    ref_label=f"D-{demo.id}",
                    amount=0,
                    note=f"Assigned: {out_date}" + (f" · Due: {demo.expected_return_date}" if demo.expected_return_date else "")
                ))

                is_done = demo.status in ("RETURNED", "CONVERTED_RENTAL", "CONVERTED_SALE")
                if is_done:
                    note = "Returned"
                    action = "DEMO_RETURNED"
                    if demo.status.startswith("CONVERTED_"):
                        note = f"Converted ({demo.status.replace('CONVERTED_', '')})"
                        action = "DEMO_CONVERTED"
                    elif ret_date:
                        note = f"Returned on {ret_date}"

                    history_records.append(CustomerHistory(
                        customer=demo.customer,
                        action=action,
                        event_date=ret_date or out_date,
                        laptop_name=name,
                        serial=serial,
                        ref_id=demo.id,
                        ref_label=f"D-{demo.id}",
                        amount=0,
                        note=note
                    ))

            # 4. Sales (SALE, SALE_RETURNED)
            sale_items = SaleItem.objects.select_related("sale", "sale__customer", "laptop").all()
            for item in sale_items:
                sale = item.sale
                if not sale.customer:
                    continue

                sale_date = sale.sale_date

                name = getattr(item, "display_name", None) or " ".join(filter(None, [getattr(item, "snapshot_brand", None), getattr(item, "snapshot_model", None)])) or f"Item #{item.pk}"
                serial = getattr(item, "snapshot_serial_number", "") or ""

                history_records.append(CustomerHistory(
                    customer=sale.customer,
                    action="SALE",
                    event_date=sale_date,
                    laptop_name=name,
                    serial=serial,
                    ref_id=sale.id,
                    ref_label=f"S-{sale.id}",
                    amount=item.sale_price,
                    note=f"Sold on {sale_date}" if sale_date else "Sold",
                ))

                if sale.status == "RETURNED":
                    history_records.append(CustomerHistory(
                        customer=sale.customer,
                        action="SALE_RETURNED",
                        event_date=sale_date,
                        laptop_name=name,
                        serial=serial,
                        ref_id=sale.id,
                        ref_label=f"S-{sale.id}",
                        amount=0,
                        note="Returned to inventory",
                    ))

            # Bulk create
            CustomerHistory.objects.bulk_create(history_records)

        self.stdout.write(self.style.SUCCESS(f"Successfully backfilled {len(history_records)} CustomerHistory records."))
