from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReadingViewSet, AlertViewSet, IncidentViewSet, DeviceViewSet,
    TemperatureStatsView, ESPDataCollectionView
)

router = DefaultRouter()
router.register(r'readings', ReadingViewSet, basename='readings')
router.register(r'alerts', AlertViewSet)
router.register(r'incidents', IncidentViewSet)
router.register(r'devices', DeviceViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('temperature/stats/', TemperatureStatsView.as_view(), name='temperature-stats'),
    path('esp/reading/', ESPDataCollectionView.as_view(), name='esp-reading'),
]