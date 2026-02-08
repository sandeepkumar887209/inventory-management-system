from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import StockMovement


@receiver(post_save, sender=StockMovement)
def update_laptop_status(sender, instance, created, **kwargs):
    if not created:
        return

    laptop = instance.laptop

    if instance.movement_type == "OUT":
        laptop.status = "RENTED"
    elif instance.movement_type == "RETURN":
        laptop.status = "AVAILABLE"
    elif instance.movement_type == "DAMAGE":
        laptop.status = "SCRAP"

    laptop.save()
