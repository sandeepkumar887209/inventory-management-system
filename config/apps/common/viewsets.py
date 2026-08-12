from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.common.permissions import IsStaffOrAdmin
from .models import CompanySettings
from .serializers import CompanySettingsSerializer

class AuditModelViewSet(ModelViewSet):
    permission_classes = [IsStaffOrAdmin]
    """
    Base ViewSet to auto-assign created_by and updated_by
    """

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class CompanySettingsViewSet(ModelViewSet):
    """
    ViewSet for Global Company Settings.
    Treats the collection as a singleton (gets or creates the first record).
    """
    queryset = CompanySettings.objects.all()
    serializer_class = CompanySettingsSerializer
    permission_classes = [IsStaffOrAdmin]

    def get_permissions(self):
        if self.action == 'current' and self.request.method == 'GET':
            return [permission() for permission in [IsAuthenticated]]
        return [permission() for permission in self.permission_classes]

    @action(detail=False, methods=['get', 'patch', 'put'])
    def current(self, request):
        obj, created = CompanySettings.objects.get_or_create(id=1)
        if request.method in ['PATCH', 'PUT']:
            # Still require staff/admin for updates via IsStaffOrAdmin in permission_classes
            if not (request.user.is_staff or request.user.is_superuser):
                return Response({"detail": "Only staff can update settings."}, status=403)
            serializer = self.get_serializer(obj, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        
        serializer = self.get_serializer(obj)
        return Response(serializer.data)
