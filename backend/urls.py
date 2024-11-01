from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from backend.monitoring.views import ReadingViewSet, AlertViewSet

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'readings', ReadingViewSet, basename='reading')
router.register(r'alerts', AlertViewSet, basename='alert')

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
] 