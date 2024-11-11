from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReadingViewSet, AlertViewSet, IncidentViewSet, TemperatureStatsView

router = DefaultRouter()
router.register(r'readings', ReadingViewSet)
router.register(r'alerts', AlertViewSet)
router.register(r'incidents', IncidentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('temperature/stats/', TemperatureStatsView.as_view(), name='temperature-stats'),
] 