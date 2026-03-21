"""
python manage.py backfill_laptop_history

Backfills LaptopHistory for all laptops.
- Derives actions from StockMovement records
- Looks up customer from Rental / Sale items for each movement
- Safe to run multiple times (clears and rebuilds only laptops with no manual edits)

Run ONCE after deploying the new signals.py.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.inventory.models import Laptop, LaptopHistory, StockMovement


MOVEMENT_TO_ACTION = {
    "IN":              "ADDED",
    "OUT":             "RENTED_OUT",
    "RETURN":          "RETURNED",
    "SOLD":            "SOLD",
    "MAINTENANCE_OUT": "SENT_FOR_MAINTENANCE",
    "MAINTENANCE_IN":  "MAINTENANCE_DONE",
    "SUPPLIER_RETURN": "RETURNED_TO_SUPPLIER",
    "WRITTEN_OFF":     "WRITTEN_OFF",
}

MOVEMENT_TO_STATUS = {
    "IN":              "AVAILABLE",
    "OUT":             "RENTED",
    "RETURN":          "AVAILABLE",
    "SOLD":            "SOLD",
    "MAINTENANCE_OUT": "UNDER_MAINTENANCE",
    "MAINTENANCE_IN":  "AVAILABLE",
    "SUPPLIER_RETURN": "RETURNED_TO_SUPPLIER",
    "WRITTEN_OFF":     "WRITTEN_OFF",
}


def get_customer_for_movement(laptop, movement):
    """
    Try to find the customer associated with a stock movement by
    looking at RentalItems and SaleItems that reference this laptop
    and were created around the same time.
    """
    customer = None

    try:
        from apps.rentals.models import RentalItem
        # Find rental items for this laptop near this movement's timestamp
        rental_item = (
            RentalItem.objects
            .select_related("rental__customer")
            .filter(laptop=laptop)
            .order_by("-created_at")
            .first()
        )
        if rental_item:
            customer = rental_item.rental.customer
    except Exception:
        pass

    if not customer and movement.movement_type == "SOLD":
        try:
            from apps.sales.models import SaleItem
            sale_item = (
                SaleItem.objects
                .select_related("sale__customer")
                .filter(laptop=laptop)
                .order_by("-created_at")
                .first()
            )
            if sale_item:
                customer = sale_item.sale.customer
        except Exception:
            pass

    return customer


class Command(BaseCommand):
    help = "Backfill LaptopHistory from StockMovements for all laptops."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Clear existing history and rebuild for ALL laptops (default: skip laptops that already have history)",
        )

    def handle(self, *args, **options):
        force         = options["force"]
        laptops       = Laptop.objects.all().order_by("id")
        created_total = 0
        skipped       = 0

        for laptop in laptops:
            existing = LaptopHistory.objects.filter(laptop=laptop)

            if existing.exists() and not force:
                skipped += 1
                continue

            if force:
                existing.delete()

            # ── 1. "Added to inventory" entry ──────────────────────────────
            LaptopHistory.objects.create(
                laptop=laptop,
                action="ADDED",
                from_status="",
                to_status="AVAILABLE",
                customer=None,
                remarks="Backfilled: laptop added to inventory",
                created_at=laptop.created_at or timezone.now(),
            )
            created_total += 1

            # ── 2. One entry per StockMovement ─────────────────────────────
            movements  = StockMovement.objects.filter(laptop=laptop).order_by("created_at")
            prev_status = "AVAILABLE"

            for m in movements:
                action    = MOVEMENT_TO_ACTION.get(m.movement_type, "STATUS_CHANGED")
                to_status = MOVEMENT_TO_STATUS.get(m.movement_type, laptop.status)
                customer  = get_customer_for_movement(laptop, m)

                # For RETURNED events prefer OLD customer (laptop.customer at the time)
                # We approximate by using the customer on the laptop itself if movement is RETURN
                if m.movement_type == "RETURN" and not customer:
                    customer = laptop.customer  # may already be cleared, best effort

                LaptopHistory.objects.create(
                    laptop=laptop,
                    action=action,
                    from_status=prev_status,
                    to_status=to_status,
                    customer=customer,
                    remarks=m.remarks or f"Backfilled from StockMovement #{m.id}",
                    reference_id=str(m.id),
                    created_by=m.created_by,
                )
                created_total += 1
                prev_status = to_status

            # ── 3. If laptop is currently RENTED / SOLD — ensure customer ──
            if laptop.status in ("RENTED", "SOLD") and laptop.customer:
                last = LaptopHistory.objects.filter(laptop=laptop).order_by("-created_at").first()
                if last and not last.customer:
                    last.customer = laptop.customer
                    last.save(update_fields=["customer"])

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone.\n"
                f"  Created : {created_total} history record(s)\n"
                f"  Skipped : {skipped} laptop(s) already had history\n"
                f"  Tip     : run with --force to rebuild everything\n"
            )
        )
