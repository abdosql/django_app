from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

# Simple view for testing
def health_check(request):
    return HttpResponse("Backend server is running!")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', health_check, name='health_check'),  # Root URL for testing
    # Add your API URLs here later
    # path('api/', include('readings.urls')),
] 