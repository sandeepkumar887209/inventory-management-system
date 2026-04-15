"""
Signals that write CustomerHistory rows automatically.

Connected in apps/customers/apps.py → CustomersConfig.ready().

Strategy mirrors LaptopHistory:
  - RentalItem post_save → RENTAL_OUT
  - Rental post_save     → RENTAL_RETURNED / RENTAL_REPLACED (on status change)
  - DemoItem post_save   → DEMO_OUT
  - Demo post_save       → DEMO_RETURNED / DEMO_CONVERTED (on status change)
  - SaleItem post_save   → SALE
  - Sale post_save       → SALE_RETURNED (on status change)
  - Customer post_save   → CUSTOMER_CREATED / PROFILE_UPDATED / DEACTIVATED / REACTIVATED
"""
from django.db.models.signals import post_save
from django.dispatch import receiver


# ─── helpers ────────────────────────────────────────────────────────────────

def _log(customer, action, *, event_date=None, laptop_name="", serial="",
         ref_id=None, ref_label="", amount=None, note=""):
    """Create a single CustomerHistory row."""
    from apps.customers.models import CustomerHistory
    CustomerHistory.objects.create(
        customer    = customer,
        action      = action,
        event_date  = event_date,
        laptop_name = laptop_name,
        serial      = serial,
        ref_id      = ref_id,
        ref_label   = ref_label,
        amount      = amount,
        note        = note,
    )


def _laptop_snapshot(item):
    """Pull display name + serial from a RentalItem / DemoItem / SaleItem."""
    name = (
        getattr(item, "display_name", None)
        or " ".join(
            filter(None, [
                getattr(item, "snapshot_brand", None),
                getattr(item, "snapshot_model", None),
            ])
        )
        or f"Item #{item.pk}"
    )
    serial = getattr(item, "snapshot_serial_number", "") or ""
    return name, serial


# ─── Customer lifecycle ──────────────────────────────────────────────────────

@receiver(post_save, sender="customers.Customer")
def on_customer_save(sender, instance, created, update_fields, **kwargs):
    event_date = instance.created_at.date() if instance.created_at else None

    if created:
        _log(instance, "CUSTOMER_CREATED", event_date=event_date, note=f"Customer account created")
        return

    # Detect deactivation / reactivation via is_active toggle
    if update_fields and "is_active" in update_fields:
        action = "REACTIVATED" if instance.is_active else "DEACTIVATED"
        _log(instance, action, event_date=event_date, note=f"Customer {'reactivated' if instance.is_active else 'deactivated'}")
        return

    # Generic profile update (skip if only updated_at changed)
    if update_fields and update_fields <= {"updated_at"}:
        return

    _log(instance, "PROFILE_UPDATED", event_date=event_date, note="Profile information updated")


# ─── Rental events ──────────────────────────────────────────────────────────

@receiver(post_save, sender="rentals.RentalItem")
def on_rentalitem_save(sender, instance, created, **kwargs):
    """Log individual laptop rented OUT when item is attached to the rental."""
    if not created:
        return
        
    rental = instance.rental
    customer = rental.customer
    if not customer:
        return

    name, serial = _laptop_snapshot(instance)
    _log(
        customer, "RENTAL_OUT",
        event_date  = rental.rent_date,
        laptop_name = name,
        serial      = serial,
        ref_id      = rental.pk,
        ref_label   = f"R-{rental.pk}",
        amount      = instance.rent_price,
        note        = f"Rented: {rental.rent_date}" + (f" · Due: {rental.expected_return_date}" if rental.expected_return_date else ""),
    )


@receiver(post_save, sender="rentals.Rental")
def on_rental_save(sender, instance, created, update_fields, **kwargs):
    """Log returns/replacements when the parent rental status changes."""
    if created or instance.status == "ONGOING":
        return

    # We only log returns/replacements when status explicitly changes
    # If update_fields is None, it means a generic save(). We do not want to spam logs on every generic save.
    if update_fields is None or "status" not in update_fields:
        return

    customer = instance.customer
    if not customer:
        return

    if instance.status == "RETURNED":
        ret_date = instance.actual_return_date or instance.rent_date
        try:
            for item in instance.items.select_related("laptop").all():
                name, serial = _laptop_snapshot(item)
                _log(
                    customer, "RENTAL_RETURNED",
                    event_date  = ret_date,
                    laptop_name = name,
                    serial      = serial,
                    ref_id      = instance.pk,
                    ref_label   = f"R-{instance.pk}",
                    note        = f"Returned on {ret_date}" if ret_date else "Returned to inventory",
                )
        except Exception:
            pass

    elif instance.status == "REPLACED":
        try:
            for item in instance.items.select_related("laptop").all():
                name, serial = _laptop_snapshot(item)
                _log(
                    customer, "RENTAL_REPLACED",
                    event_date  = instance.rent_date,
                    laptop_name = name,
                    serial      = serial,
                    ref_id      = instance.pk,
                    ref_label   = f"R-{instance.pk}",
                    note        = "Replacement unit issued",
                )
        except Exception:
            pass


# ─── Demo events ─────────────────────────────────────────────────────────────

@receiver(post_save, sender="demo.DemoItem")
def on_demoitem_save(sender, instance, created, **kwargs):
    if not created:
        return
        
    demo = instance.demo
    customer = demo.customer
    if not customer:
        return

    name, serial = _laptop_snapshot(instance)
    _log(
        customer, "DEMO_OUT",
        event_date  = demo.assigned_date,
        laptop_name = name,
        serial      = serial,
        ref_id      = demo.pk,
        ref_label   = f"D-{demo.pk}",
        note        = f"Demo assigned: {demo.assigned_date}" + (f" · Due: {demo.expected_return_date}" if demo.expected_return_date else ""),
    )


@receiver(post_save, sender="demo.Demo")
def on_demo_save(sender, instance, created, update_fields, **kwargs):
    if created or instance.status == "ONGOING":
        return

    if update_fields is None or "status" not in update_fields:
        return

    customer = instance.customer
    if not customer:
        return

    if instance.status == "RETURNED":
        ret_date = instance.actual_return_date or instance.assigned_date
        try:
            for item in instance.items.select_related("laptop").all():
                name, serial = _laptop_snapshot(item)
                _log(
                    customer, "DEMO_RETURNED",
                    event_date  = ret_date,
                    laptop_name = name,
                    serial      = serial,
                    ref_id      = instance.pk,
                    ref_label   = f"D-{instance.pk}",
                    note        = f"Demo returned on {ret_date}" if ret_date else "Demo returned",
                )
        except Exception:
            pass

    elif instance.status.startswith("CONVERTED_"):
        converted_to = instance.status.replace("CONVERTED_", "")
        ret_date = instance.actual_return_date or instance.assigned_date
        try:
            for item in instance.items.select_related("laptop").all():
                name, serial = _laptop_snapshot(item)
                _log(
                    customer, "DEMO_CONVERTED",
                    event_date  = ret_date,
                    laptop_name = name,
                    serial      = serial,
                    ref_id      = instance.pk,
                    ref_label   = f"D-{instance.pk}",
                    note        = f"Demo converted to {converted_to}",
                )
        except Exception:
            pass


# ─── Sale events ─────────────────────────────────────────────────────────────

@receiver(post_save, sender="sales.SaleItem")
def on_saleitem_save(sender, instance, created, **kwargs):
    if not created:
        return
        
    sale = instance.sale
    customer = sale.customer
    if not customer:
        return

    name, serial = _laptop_snapshot(instance)
    _log(
        customer, "SALE",
        event_date  = sale.sale_date,
        laptop_name = name,
        serial      = serial,
        ref_id      = sale.pk,
        ref_label   = f"S-{sale.pk}",
        amount      = instance.sale_price,
        note        = f"Sold on {sale.sale_date}" if sale.sale_date else "Sold",
    )


@receiver(post_save, sender="sales.Sale")
def on_sale_save(sender, instance, created, update_fields, **kwargs):
    if created or instance.status == "COMPLETED":
        return

    if update_fields is None or "status" not in update_fields:
        return

    customer = instance.customer
    if not customer:
        return

    if instance.status == "RETURNED":
        try:
            for item in instance.items.select_related("laptop").all():
                name, serial = _laptop_snapshot(item)
                _log(
                    customer, "SALE_RETURNED",
                    event_date  = instance.sale_date,
                    laptop_name = name,
                    serial      = serial,
                    ref_id      = instance.pk,
                    ref_label   = f"S-{instance.pk}",
                    note        = "Sale returned to inventory",
                )
        except Exception:
            pass
