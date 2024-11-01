from django.conf import settings
from ..models import Alert

class MonitoringService:
    def __init__(self, notification_service):
        self.notification_service = notification_service
        self.temp_alert_threshold = getattr(settings, 'CONSECUTIVE_ALERTS_THRESHOLD', 3)

    def check_temperature(self, reading):
        if not (2 <= reading.temperature <= 8):
            consecutive_alerts = self._count_consecutive_alerts(Alert.AlertType.TEMPERATURE)
            severity = self._determine_severity(consecutive_alerts)
            
            alert = Alert.create_temperature_alert(
                reading=reading,
                severity=severity,
                consecutive_alerts=consecutive_alerts
            )
            
            self.notification_service.send_alert(alert)
            return alert
        return None

    def check_power_status(self, reading):
        if not reading.power_status:
            alert = Alert.create_power_alert(reading)
            self.notification_service.send_alert(alert)
            return alert
        return None

    def _count_consecutive_alerts(self, alert_type):
        return Alert.objects.filter(
            type=alert_type,
            is_active=True
        ).count()

    def _determine_severity(self, consecutive_alerts):
        if consecutive_alerts >= self.temp_alert_threshold * 2:
            return Alert.SeverityLevel.EMERGENCY
        elif consecutive_alerts >= self.temp_alert_threshold:
            return Alert.SeverityLevel.CRITICAL
        return Alert.SeverityLevel.WARNING 