from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Reading, Alert
from .serializers import ReadingSerializer, AlertSerializer
from .services.monitoring_service import MonitoringService

class ReadingViewSet(viewsets.ModelViewSet):
    queryset = Reading.objects.all()
    serializer_class = ReadingSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reading = serializer.save()
        self._check_alerts(reading)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _check_alerts(self, reading):
        monitoring_service = MonitoringService(
            notification_service=self.get_notification_service()
        )
        alerts = []
        
        temp_alert = monitoring_service.check_temperature(reading)
        if temp_alert:
            alerts.append(temp_alert)
            
        power_alert = monitoring_service.check_power_status(reading)
        if power_alert:
            alerts.append(power_alert)
            
        return alerts

    def get_notification_service(self):
        # This should be properly injected in production
        from notifications.services.notification_service import NotificationService
        return NotificationService()

class AlertViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer

    @action(detail=False, methods=['get'])
    def active(self, request):
        active_alerts = Alert.get_active_alerts()
        serializer = self.get_serializer(active_alerts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        alert_type = request.query_params.get('type')
        if not alert_type:
            return Response(
                {"error": "type parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        alerts = Alert.objects.filter(type=alert_type).order_by('-timestamp')
        serializer = self.get_serializer(alerts, many=True)
        return Response(serializer.data) 