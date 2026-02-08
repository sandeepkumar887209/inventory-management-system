from rest_framework.viewsets import ModelViewSet
from apps.common.permissions import IsStaffOrAdmin

class AuditModelViewSet(ModelViewSet):
    permission_classes = [IsStaffOrAdmin]
    """
    Base ViewSet to auto-assign created_by and updated_by
    """

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
