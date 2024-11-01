from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReadingViewSet, AlertViewSet

router = DefaultRouter()
router.register(r'readings', ReadingViewSet, basename='reading')
router.register(r'alerts', AlertViewSet, basename='alert')

urlpatterns = [
    path('api/', include(router.urls)),
] 