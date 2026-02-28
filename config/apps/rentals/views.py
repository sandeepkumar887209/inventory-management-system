from rest_framework.viewsets import ModelViewSet
from .models import Rental, RentalReturn, RentalReplacement
from .serializers import (
    RentalSerializer,
    RentalReturnSerializer,
    RentalReplacementSerializer,
)


class RentalViewSet(ModelViewSet):
    queryset = Rental.objects.all().order_by("-created_at")
    serializer_class = RentalSerializer


class RentalReturnViewSet(ModelViewSet):
    queryset = RentalReturn.objects.all()
    serializer_class = RentalReturnSerializer


class RentalReplacementViewSet(ModelViewSet):
    queryset = RentalReplacement.objects.all()
    serializer_class = RentalReplacementSerializer