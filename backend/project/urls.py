from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/monitoring/', include('monitoring.urls')),
    path('api/', include('myapi.urls')),
    path('api/auth/', include('authentication.urls')),
    path('api/', include('notifications.urls')),
    path('api/settings/', include('settings.urls')),
]
