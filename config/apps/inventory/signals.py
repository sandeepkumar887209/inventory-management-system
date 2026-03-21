from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import StockMovement, Laptop, LaptopHistory


# ─── Capture old state before save ──────────────────────────────────────────
@receiver(pre_save, sender=Laptop)
def capture_old_state(sender, instance, **kwargs):
    """Store old status + old customer before any save."""
    if instance.pk:
        try:
            old = Laptop.objects.select_related("customer").get(pk=instance.pk)
            instance._old_status   = old.status
            instance._old_customer = old.customer
        except Laptop.DoesNotExist:
            instance._old_status   = None
            instance._old_customer = None
    else:
        instance._old_status   = None
        instance._old_customer = None


# ─── Write history on every status change ────────────────────────────────────
@receiver(post_save, sender=Laptop)
def record_laptop_history(sender, instance, created, **kwargs):
    old_status   = getattr(instance, "_old_status", None)
    new_status   = instance.status
    old_customer = getattr(instance, "_old_customer", None)
    remarks      = getattr(instance, "_history_remarks", "")
    ref_id       = getattr(instance, "_history_ref_id", "")
    created_by   = getattr(instance, "_history_created_by", None)

    # Decide which customer to attach to this history entry
    # - For RENTED_OUT  → the new current customer
    # - For RETURNED    → the OLD customer (they just returned it)
    # - For SOLD        → the new current customer
    # - Others          → whoever is current

    if created:
        LaptopHistory.objects.create(
            laptop=instance,
            action="ADDED",
            from_status="",
            to_status=new_status,
            customer=instance.customer,
            remarks=remarks or "Laptop added to inventory",
            reference_id=ref_id,
            created_by=created_by,
        )
        return

    if old_status is None or old_status == new_status:
        return  # no status change — nothing to record

    # Map transition → action
    action_map = {
        ("AVAILABLE",         "RENTED"):               "RENTED_OUT",
        ("DEMO",              "RENTED"):               "RENTED_OUT",
        ("RENTED",            "AVAILABLE"):            "RETURNED",
        ("AVAILABLE",         "SOLD"):                 "SOLD",
        ("RENTED",            "SOLD"):                 "SOLD",
        ("DEMO",              "SOLD"):                 "SOLD",
        ("AVAILABLE",         "UNDER_MAINTENANCE"):    "SENT_FOR_MAINTENANCE",
        ("RENTED",            "UNDER_MAINTENANCE"):    "SENT_FOR_MAINTENANCE",
        ("DEMO",              "UNDER_MAINTENANCE"):    "SENT_FOR_MAINTENANCE",
        ("UNDER_MAINTENANCE", "AVAILABLE"):            "MAINTENANCE_DONE",
        ("AVAILABLE",         "RETURNED_TO_SUPPLIER"):"RETURNED_TO_SUPPLIER",
        ("UNDER_MAINTENANCE", "RETURNED_TO_SUPPLIER"):"RETURNED_TO_SUPPLIER",
        ("AVAILABLE",         "WRITTEN_OFF"):          "WRITTEN_OFF",
        ("RENTED",            "WRITTEN_OFF"):          "WRITTEN_OFF",
        ("UNDER_MAINTENANCE", "WRITTEN_OFF"):          "WRITTEN_OFF",
        ("AVAILABLE",         "DEMO"):                 "STATUS_CHANGED",
        ("DEMO",              "AVAILABLE"):            "STATUS_CHANGED",
    }
    action = action_map.get((old_status, new_status), "STATUS_CHANGED")

    # Choose the most meaningful customer for this event
    if action == "RETURNED":
        # Customer just returned the laptop — attach the OLD customer
        customer = old_customer
    else:
        # For rented-out, sold, etc — attach whoever the laptop is now with
        customer = instance.customer or old_customer

    LaptopHistory.objects.create(
        laptop=instance,
        action=action,
        from_status=old_status,
        to_status=new_status,
        customer=customer,
        remarks=remarks,
        reference_id=ref_id,
        created_by=created_by,
    )


# ─── StockMovement → update laptop status ────────────────────────────────────
@receiver(post_save, sender=StockMovement)
def apply_stock_movement(sender, instance, created, **kwargs):
    """
    When a StockMovement is created, sync laptop.status and attach
    metadata so the Laptop post_save signal can write a rich history entry.
    """
    if not created:
        return

    laptop = instance.laptop

    STATUS_MAP = {
        "IN":              "AVAILABLE",
        "OUT":             "RENTED",
        "RETURN":          "AVAILABLE",
        "SOLD":            "SOLD",
        "MAINTENANCE_OUT": "UNDER_MAINTENANCE",
        "MAINTENANCE_IN":  "AVAILABLE",
        "SUPPLIER_RETURN": "RETURNED_TO_SUPPLIER",
        "WRITTEN_OFF":     "WRITTEN_OFF",
    }

    new_status = STATUS_MAP.get(instance.movement_type)
    if not new_status or laptop.status == new_status:
        return

    # Pass context to the Laptop signals
    laptop._history_remarks    = instance.remarks or ""
    laptop._history_ref_id     = str(instance.id)
    laptop._history_created_by = instance.created_by
    laptop.status = new_status

    # Clear customer when laptop is returned / goes to maintenance
    if instance.movement_type in ("RETURN", "MAINTENANCE_IN", "IN"):
        laptop.customer = None

    laptop.save()
