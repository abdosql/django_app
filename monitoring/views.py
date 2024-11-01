from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Reading, Alert
from .serializers import ReadingSerializer, AlertSerializer
from .services import MonitoringService

class ReadingViewSet(viewsets.ModelViewSet):
    queryset = Reading.objects.all()
    serializer_class = ReadingSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reading = serializer.save()
        MonitoringService.check_temperature(reading)
        MonitoringService.check_power_status(reading)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class AlertViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        alert_type = self.request.query_params.get('type')
        if alert_type:
            queryset = queryset.filter(type=alert_type.upper())
        return queryset 