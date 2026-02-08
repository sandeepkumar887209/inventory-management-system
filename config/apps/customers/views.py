from django.shortcuts import render

# Create your views here.
from apps.common.viewsets import AuditModelViewSet
from .models import Customer
from .serializers import CustomerSerializer
from apps.common.permissions import IsStaffOrAdmin

class CustomerViewSet(AuditModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsStaffOrAdmin]
