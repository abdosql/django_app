from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReadingViewSet, AlertViewSet

router = DefaultRouter()
router.register(r'readings', ReadingViewSet)
router.register(r'alerts', AlertViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 