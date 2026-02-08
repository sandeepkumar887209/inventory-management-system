from django.shortcuts import render


from apps.common.viewsets import AuditModelViewSet
from .models import Laptop
from .serializers import LaptopSerializer
from apps.common.permissions import IsStaffOrAdmin

from rest_framework.viewsets import ModelViewSet
from .models import StockMovement
from .serializers import StockMovementSerializer

class LaptopViewSet(AuditModelViewSet):
    queryset = Laptop.objects.all()
    serializer_class = LaptopSerializer
    permission_classes = [IsStaffOrAdmin]
    filterset_fields = ['status', 'brand', 'model']



class StockMovementViewSet(ModelViewSet):
    queryset = StockMovement.objects.all().select_related("laptop")
    serializer_class = StockMovementSerializer
