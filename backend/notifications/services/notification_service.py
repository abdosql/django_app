import logging
from django.utils import timezone
from django.db.models import Count
from .telegram_service import TelegramService
from .email_service import EmailService
from ..models import Operator, Notification
from monitoring.models import Alert
from settings.models import SystemSettings

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.telegram_service = TelegramService()
        self.email_service = EmailService()

    def process_alert(self, alert):
        """Process new alert and create notifications"""
        print(f"\n=== Processing alert {alert.id} ===")
        try:
            # Get operators based on alert severity
            operators = self._get_operators_for_alert(alert)
            print(f"Found {len(operators)} operators for severity {alert.severity}")
            
            # Create notifications for each operator
            notifications = []
            for operator in operators:
                print(f"Creating notification for operator: {operator.name}")
                notification = self._create_notification(operator, alert)
                if notification:
                    notifications.append(notification)
                    print(f"Notification created with ID: {notification.id}")
            
            print(f"Created {len(notifications)} notifications")
            return notifications
            
        except Exception as e:
            print(f"Error processing alert: {str(e)}")
            logger.error(f"Failed to process alert: {str(e)}")
            raise

    def _get_operators_for_alert(self, alert):
        """Get operators based on alert severity"""
        print(f"\n=== Getting operators for alert severity {alert.severity} ===")
        operators = Operator.objects.filter(is_active=True)
        print(f"Total active operators: {operators.count()}")
        
        if alert.severity == 3:  # High severity - notify all operators
            print("HIGH severity - returning all operators")
            return operators
        elif alert.severity == 2:  # Medium severity - notify primary and secondary
            operators = operators.filter(priority__lte=2)
            print(f"MEDIUM severity - returning {operators.count()} primary/secondary operators")
            return operators
        else:  # Low severity - notify only primary
            operators = operators.filter(priority=1)
            print(f"LOW severity - returning {operators.count()} primary operators")
            return operators
    
    def _create_notification(self, operator, alert):
        """Create a notification for an operator"""
        try:
            notification = Notification.objects.create(
                operator=operator,
                alert=alert,
                status='PENDING'
            )
            return notification
        except Exception as e:
            logger.error(f"Failed to create notification: {str(e)}")
            return None

    def get_pending_notifications(self, max_retries=3):
        """Get pending notifications that haven't exceeded max retries"""
        return Notification.objects.filter(
            status='PENDING',
            retry_count__lt=max_retries
        )

    def mark_notification_sent(self, notification):
        """Mark notification as sent"""
        notification.status = 'SENT'
        notification.sent_at = timezone.now()
        notification.save()

    def mark_notification_failed(self, notification):
        """Mark notification as failed and increment retry count"""
        notification.status = 'FAILED'
        notification.retry_count += 1
        notification.save()

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