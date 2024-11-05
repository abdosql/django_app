from rest_framework import viewsets, status, mixins
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework.decorators import action
from .models import SystemSettings
from .serializers import SystemSettingsSerializer

class SystemSettingsViewSet(viewsets.GenericViewSet,
                          mixins.ListModelMixin,
                          mixins.UpdateModelMixin):
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAdminUser]

    def get_object(self):
        """Always return the single settings instance"""
        return SystemSettings.get_settings()

    def list(self, request):
        """Get current settings"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """Update settings"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """Partial update settings"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)