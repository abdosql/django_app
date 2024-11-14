from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('monitoring.urls')),
    path('api/settings/', include('settings.urls')),
    path('api/notifications/', include('notifications.urls')),
] 