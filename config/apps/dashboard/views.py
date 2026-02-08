from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

from apps.dashboard.services import (
    inventory_stats,
    rental_stats,
    revenue_stats,
)


class DashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response({
            "inventory": inventory_stats(),
            "rentals": rental_stats(),
            "revenue": revenue_stats(),
        })
