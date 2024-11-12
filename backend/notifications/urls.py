from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OperatorViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'operators', OperatorViewSet)
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
] 