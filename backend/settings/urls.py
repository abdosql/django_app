from django.urls import path
from .views import SystemSettingsViewSet

urlpatterns = [
    path('', SystemSettingsViewSet.as_view({
        'get': 'list',
        'put': 'update',
        'patch': 'partial_update'
    })),
] 