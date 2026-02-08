from django.db.models import Count, Sum
from django.utils.timezone import now

from apps.inventory.models import Laptop
from apps.rentals.models import Rental


def inventory_stats():
    return {
        "total": Laptop.objects.count(),
        "available": Laptop.objects.filter(status="AVAILABLE").count(),
        "rented": Laptop.objects.filter(status="RENTED").count(),
        "sold": Laptop.objects.filter(status="SOLD").count(),
        "scrap": Laptop.objects.filter(status="SCRAP").count(),
    }


def rental_stats():
    today = now().date()
    month_start = today.replace(day=1)

    return {
        "active_rentals": Rental.objects.filter(status="ONGOING").count(),
        "returned_rentals": Rental.objects.filter(status="RETURNED").count(),
        "rentals_today": Rental.objects.filter(rent_date=today).count(),
        "rentals_this_month": Rental.objects.filter(
            rent_date__gte=month_start
        ).count(),
    }


def revenue_stats():
    today = now().date()
    month_start = today.replace(day=1)

    return {
        "total_revenue": Rental.objects.aggregate(
            total=Sum("rental_amount")
        )["total"] or 0,

        "monthly_revenue": Rental.objects.filter(
            rent_date__gte=month_start
        ).aggregate(total=Sum("rental_amount"))["total"] or 0,
    }
