from .models import Reading, Alert, Operator
from notifications.services.notification_service import NotificationService

class MonitoringService:
    @staticmethod
    def check_temperature(reading: Reading):
        if not (2 <= reading.temperature <= 8):
            severity = 'HIGH' if reading.temperature < 2 or reading.temperature > 8 else 'MEDIUM'
            message = f"Temperature out of range: {reading.temperature}°C"
            notified_operators = NotificationService.notify_operators(AlertType='TEMPERATURE', message=message)
            Alert.create_temperature_alert(reading, severity, message, notified_operators)

    @staticmethod
    def check_power_status(reading: Reading):
        if not reading.power_status:
            severity = 'HIGH'
            message = "Power status is OFF."
            notified_operators = NotificationService.notify_operators(AlertType='POWER', message=message)
            Alert.create_power_alert(reading, severity, message, notified_operators) 