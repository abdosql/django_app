from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Reading, Alert
from .serializers import ReadingSerializer, AlertSerializer
from notifications.services.notification_service import NotificationService

class ReadingViewSet(viewsets.ModelViewSet):
    queryset = Reading.objects.all()
    serializer_class = ReadingSerializer
    notification_service = NotificationService()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reading = serializer.save()
        
        # Check temperature limits
        self._check_temperature(reading)
        
        # Check power status
        self._check_power_status(reading)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def _check_temperature(self, reading):
        if reading.temperature < 2:
            self._create_alert(reading, 'TEMP_LOW')
        elif reading.temperature > 8:
            self._create_alert(reading, 'TEMP_HIGH')

    def _check_power_status(self, reading):
        last_reading = Reading.objects.filter(
            timestamp__lt=reading.timestamp
        ).first()

        if last_reading and last_reading.power_status != reading.power_status:
            if not reading.power_status:
                self._create_alert(reading, 'POWER_OUT', severity=3)
            else:
                self._create_alert(reading, 'POWER_RESTORED', severity=1)

    def _create_alert(self, reading, alert_type, severity=2):
        alert = Alert.objects.create(
            type=alert_type,
            severity=severity,
            reading=reading,
            message=f"Alert: {alert_type} at {reading.timestamp}"
        )
        # Notify operators
        self.notification_service.send_alert(alert)

class AlertViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer

    @action(detail=False)
    def active(self, request):
        active_alerts = Alert.objects.filter(resolved=False)
        serializer = self.get_serializer(active_alerts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.resolved = True
        alert.resolved_at = timezone.now()
        alert.save()
        return Response({'status': 'alert resolved'}) 