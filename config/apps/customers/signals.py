"""
Signals that write CustomerHistory rows automatically.

Connected in apps/customers/apps.py → CustomersConfig.ready()

Strategy mirrors LaptopHistory:
  - RentalItem post_save → RENTAL_OUT
  - Rental post_save     → RENTAL_RETURNED / RENTAL_REPLACED (on status change)
  - DemoItem post_save   → DEMO_OUT
  - Demo post_save       → DEMO_RETURNED / DEMO_CONVERTED (on status change)
  - SaleItem post_save   → SALE
  - Sale post_save       → SALE_RETURNED (on status change)
  - Customer post_save   → CUSTOMER_CREATED / PROFILE_UPDATED / DEACTIVATED / REACTIVATED

Every Rental/Demo/Sale event stores a frozen snapshot_status + snapshot_data
so the history record is self-contained even if the live record changes later.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver


# ── helpers ──────────────────────────────────────────────────────────────────

def _log(customer, action, *, event_date=None, laptop_name="", serial="",
         ref_id=None, ref_label="", amount=None, note="",
         snapshot_status="", snapshot_data=None):
    """Create a single CustomerHistory row."""
    from apps.customers.models import CustomerHistory
    CustomerHistory.objects.create(
        customer        = customer,
        action          = action,
        event_date      = event_date,
        laptop_name     = laptop_name,
        serial          = serial,
        ref_id          = ref_id,
        ref_label       = ref_label,
        amount          = amount,
        note            = note,
        snapshot_status = snapshot_status or "",
        snapshot_data   = snapshot_data   or {},
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


def _s(v):
    """Safely convert a value to string for snapshot dicts (None stays None)."""
    return str(v) if v is not None else None


# ── Track old status on Rental and Demo before save ──────────────────────────

@receiver(pre_save, sender="rentals.Rental")
def capture_rental_old_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._old_status = sender.objects.get(pk=instance.pk).status
        except Exception:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(pre_save, sender="demo.Demo")
def capture_demo_old_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._old_status = sender.objects.get(pk=instance.pk).status
        except Exception:
            instance._old_status = None
    else:
        instance._old_status = None


# ── Customer lifecycle ────────────────────────────────────────────────────────

@receiver(post_save, sender="customers.Customer")
def on_customer_save(sender, instance, created, update_fields, **kwargs):
    event_date = instance.created_at.date() if instance.created_at else None

    if created:
        _log(instance, "CUSTOMER_CREATED", event_date=event_date,
             note="Customer account created")
        return

    if update_fields and "is_active" in update_fields:
        action = "REACTIVATED" if instance.is_active else "DEACTIVATED"
        _log(instance, action, event_date=event_date,
             note=f"Customer {'reactivated' if instance.is_active else 'deactivated'}")
        return

    if update_fields and update_fields <= {"updated_at"}:
        return

    _log(instance, "PROFILE_UPDATED", event_date=event_date,
         note="Profile information updated")


# ── Rental events ─────────────────────────────────────────────────────────────

@receiver(post_save, sender="rentals.RentalItem")
def on_rentalitem_save(sender, instance, created, **kwargs):
    """Log individual laptop rented OUT when item is first attached to the rental."""
    if not created:
        return

    rental   = instance.rental
    customer = rental.customer
    if not customer:
        return

    name, serial = _laptop_snapshot(instance)

    snapshot = {
        "status":               rental.status,
        "rent_date":            _s(rental.rent_date),
        "actual_return_date":   _s(getattr(rental, "actual_return_date", None)),
        "total_amount":         _s(rental.total_amount),
        "total_items":          rental.items.count(),
        "rent_price":           _s(instance.rent_price),
        "laptop_name":          name,
        "serial":               serial,
    }

    _log(
        customer, "RENTAL_OUT",
        event_date      = rental.rent_date,
        laptop_name     = name,
        serial          = serial,
        ref_id          = rental.pk,
        ref_label       = f"R-{rental.pk}",
        amount          = instance.rent_price,
        note            = f"Rented: {rental.rent_date}",
        snapshot_status = rental.status,
        snapshot_data   = snapshot,
    )


@receiver(post_save, sender="rentals.Rental")
def on_rental_save(sender, instance, created, update_fields, **kwargs):
    """Log returns/replacements when the parent rental status changes."""
    if created or instance.status == "ONGOING":
        return

    old_status = getattr(instance, "_old_status", None)
    if old_status is not None and old_status == instance.status:
        return
    if old_status is None and (update_fields is not None and "status" not in update_fields):
        return

    customer = instance.customer
    if not customer:
        return

    if instance.status == "RETURNED":
        ret_date = instance.actual_return_date or instance.rent_date
        base_snap = {
            "status":               "RETURNED",
            "rent_date":            _s(instance.rent_date),
            "actual_return_date":   _s(instance.actual_return_date),
            "total_amount":         _s(instance.total_amount),
            "total_items":          instance.items.count(),
        }
        try:
            for item in instance.items.select_related("laptop").all():
                name, serial = _laptop_snapshot(item)
                _log(
                    customer, "RENTAL_RETURNED",
                    event_date      = ret_date,
                    laptop_name     = name,
                    serial          = serial,
                    ref_id          = instance.pk,
                    ref_label       = f"R-{instance.pk}",
                    note            = f"Returned on {ret_date}" if ret_date else "Returned to inventory",
                    snapshot_status = "RETURNED",
                    snapshot_data   = {**base_snap, "laptop_name": name, "serial": serial,
                                       "rent_price": _s(item.rent_price)},
                )
        except Exception:
            pass

    elif instance.status == "REPLACED":
        base_snap = {
            "status":       "REPLACED",
            "rent_date":    _s(instance.rent_date),
            "total_amount": _s(instance.total_amount),
            "total_items":  instance.items.count(),
        }
        try:
            for item in instance.items.select_related("laptop").all():
                name, serial = _laptop_snapshot(item)
                _log(
                    customer, "RENTAL_REPLACED",
                    event_date      = instance.rent_date,
                    laptop_name     = name,
                    serial          = serial,
                    ref_id          = instance.pk,
                    ref_label       = f"R-{instance.pk}",
                    note            = "Replacement unit issued",
                    snapshot_status = "REPLACED",
                    snapshot_data   = {**base_snap, "laptop_name": name, "serial": serial},
                )
        except Exception:
            pass


# ── Demo events ───────────────────────────────────────────────────────────────

@receiver(post_save, sender="demo.DemoItem")
def on_demoitem_save(sender, instance, created, **kwargs):
    if not created:
        return

    demo     = instance.demo
    customer = demo.customer
    if not customer:
        return

    name, serial = _laptop_snapshot(instance)

    snapshot = {
        "status":               demo.status,
        "assigned_date":        _s(demo.assigned_date),
        "actual_return_date":   _s(getattr(demo, "actual_return_date", None)),
        "total_items":          demo.items.count(),
        "purpose":              getattr(demo, "purpose", "") or "",
        "laptop_name":          name,
        "serial":               serial,
    }

    _log(
        customer, "DEMO_OUT",
        event_date      = demo.assigned_date,
        laptop_name     = name,
        serial          = serial,
        ref_id          = demo.pk,
        ref_label       = f"D-{demo.pk}",
        note            = f"Demo assigned: {demo.assigned_date}",
        snapshot_status = demo.status,
        snapshot_data   = snapshot,
    )


@receiver(post_save, sender="demo.Demo")
def on_demo_save(sender, instance, created, update_fields, **kwargs):
    if created or instance.status == "ONGOING":
        return

    old_status = getattr(instance, "_old_status", None)
    if old_status is not None and old_status == instance.status:
        return
    if old_status is None and (update_fields is not None and "status" not in update_fields):
        return

    customer = instance.customer
    if not customer:
        return

    if instance.status == "RETURNED":
        ret_date  = instance.actual_return_date or instance.assigned_date
        base_snap = {
            "status":               "RETURNED",
            "assigned_date":        _s(instance.assigned_date),
            "actual_return_date":   _s(instance.actual_return_date),
            "total_items":          instance.items.count(),
        }
        try:
            for item in instance.items.select_related("laptop").all():
                name, serial = _laptop_snapshot(item)
                _log(
                    customer, "DEMO_RETURNED",
                    event_date      = ret_date,
                    laptop_name     = name,
                    serial          = serial,
                    ref_id          = instance.pk,
                    ref_label       = f"D-{instance.pk}",
                    note            = f"Demo returned on {ret_date}" if ret_date else "Demo returned",
                    snapshot_status = "RETURNED",
                    snapshot_data   = {**base_snap, "laptop_name": name, "serial": serial},
                )
        except Exception:
            pass

    elif instance.status.startswith("CONVERTED_"):
        converted_to = instance.status.replace("CONVERTED_", "")
        ret_date     = instance.actual_return_date or instance.assigned_date
        base_snap    = {
            "status":             instance.status,
            "converted_to":       converted_to,
            "assigned_date":      _s(instance.assigned_date),
            "actual_return_date": _s(instance.actual_return_date),
            "total_items":        instance.items.count(),
        }
        try:
            for item in instance.items.select_related("laptop").all():
                name, serial = _laptop_snapshot(item)
                _log(
                    customer, "DEMO_CONVERTED",
                    event_date      = ret_date,
                    laptop_name     = name,
                    serial          = serial,
                    ref_id          = instance.pk,
                    ref_label       = f"D-{instance.pk}",
                    note            = f"Demo converted to {converted_to}",
                    snapshot_status = instance.status,
                    snapshot_data   = {**base_snap, "laptop_name": name, "serial": serial},
                )
        except Exception:
            pass


# ── Sale events ───────────────────────────────────────────────────────────────

@receiver(post_save, sender="sales.SaleItem")
def on_saleitem_save(sender, instance, created, **kwargs):
    if not created:
        return

    sale     = instance.sale
    customer = sale.customer
    if not customer:
        return

    name, serial = _laptop_snapshot(instance)

    snapshot = {
        "status":       sale.status,
        "sale_date":    _s(sale.sale_date),
        "total_amount": _s(sale.total_amount),
        "total_items":  sale.items.count(),
        "sale_price":   _s(instance.sale_price),
        "laptop_name":  name,
        "serial":       serial,
    }

    _log(
        customer, "SALE",
        event_date      = sale.sale_date,
        laptop_name     = name,
        serial          = serial,
        ref_id          = sale.pk,
        ref_label       = f"S-{sale.pk}",
        amount          = instance.sale_price,
        note            = f"Sold on {sale.sale_date}" if sale.sale_date else "Sold",
        snapshot_status = sale.status,
        snapshot_data   = snapshot,
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
        base_snap = {
            "status":       "RETURNED",
            "sale_date":    _s(instance.sale_date),
            "total_amount": _s(instance.total_amount),
            "total_items":  instance.items.count(),
        }
        try:
            for item in instance.items.select_related("laptop").all():
                name, serial = _laptop_snapshot(item)
                _log(
                    customer, "SALE_RETURNED",
                    event_date      = instance.sale_date,
                    laptop_name     = name,
                    serial          = serial,
                    ref_id          = instance.pk,
                    ref_label       = f"S-{instance.pk}",
                    note            = "Sale returned to inventory",
                    snapshot_status = "RETURNED",
                    snapshot_data   = {**base_snap, "laptop_name": name, "serial": serial,
                                       "sale_price": _s(item.sale_price)},
                )
        except Exception:
            pass
