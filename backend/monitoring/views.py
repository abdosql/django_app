from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.utils import timezone
from datetime import timedelta
from .models import Reading, Alert
from .serializers import ReadingSerializer, AlertSerializer
from notifications.services.notification_service import NotificationService
from settings.models import SystemSettings

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
        settings = SystemSettings.get_settings()
        
        if reading.temperature < settings.normal_temp_min:
            if reading.temperature <= settings.critical_temp_min:
                self._create_alert(reading, 'TEMP_LOW', severity=3)
            else:
                self._create_alert(reading, 'TEMP_LOW', severity=2)
        elif reading.temperature > settings.normal_temp_max:
            if reading.temperature >= settings.critical_temp_max:
                self._create_alert(reading, 'TEMP_HIGH', severity=3)
            else:
                self._create_alert(reading, 'TEMP_HIGH', severity=2)

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
        settings = SystemSettings.get_settings()
        
        # Check if similar alert exists within reset time
        recent_alert = Alert.objects.filter(
            type=alert_type,
            reading__device_id=reading.device_id,
            timestamp__gte=timezone.now() - timedelta(minutes=settings.alert_reset_time)
        ).exists()
        
        if not recent_alert:
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