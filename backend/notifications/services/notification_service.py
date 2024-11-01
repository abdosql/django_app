import logging
from django.utils import timezone
from .telegram_service import TelegramService
from .email_service import EmailService
from ..models import Operator

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.telegram_service = TelegramService()
        self.email_service = EmailService()

    def send_alert(self, alert):
        """Send alert to operators based on severity and priority"""
        operators = self._get_operators_for_alert(alert)
        return self.notify_operators(
            message=alert.message,
            operators=operators,
            alert=alert
        )

    def notify_operators(self, message, operators, alert=None, channels=None):
        """Send notification to specified operators through their preferred channels"""
        results = {
            'telegram': [],
            'email': []
        }

        for operator in operators:
            operator_channels = channels or operator.get_notification_channels()
            
            if 'telegram' in operator_channels and operator.telegram_id:
                success = self.telegram_service.send_message(
                    operator.telegram_id,
                    self._format_alert_message(alert or message, operator)
                )
                results['telegram'].append((operator, success))

            if 'email' in operator_channels and operator.email:
                success = self.email_service.send_email(
                    operator=operator,
                    subject=f"Alert: {alert.type if alert else 'Notification'}",
                    message=message,
                    alert=alert
                )
                results['email'].append((operator, success))

        return results

    def _get_operators_for_alert(self, alert):
        """Get operators based on alert severity"""
        operators = Operator.objects.filter(is_active=True)
        
        if alert.severity == 3:  # High severity - notify all operators
            return operators
        elif alert.severity == 2:  # Medium severity - notify primary and secondary
            return operators.filter(priority__lte=2)
        else:  # Low severity - notify only primary
            return operators.filter(priority=1)

    def _format_alert_message(self, alert, operator):
        if isinstance(alert, str):
            return alert
            
        return f"""
🚨 *Alert Notification*
Type: {alert.get_type_display()}
Severity: {alert.get_severity_display()}
Message: {alert.message}
Time: {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S')}

Operator: {operator.name}
Priority: {operator.get_priority_display()}
        """ 