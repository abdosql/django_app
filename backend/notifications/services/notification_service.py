import logging
from .telegram_service import TelegramService
from .email_service import EmailService

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.telegram_service = TelegramService()
        self.email_service = EmailService()

    async def send_alert(self, alert, operators):
        """
        Send alert through all available channels for each operator
        """
        notification_results = {
            'telegram': [],
            'email': []
        }

        # Send Telegram notifications
        telegram_operators = [op for op in operators if op.telegram_id]
        if telegram_operators:
            telegram_results = await self.telegram_service.broadcast_alert(
                telegram_operators,
                self.telegram_service._format_alert_message(alert)
            )
            notification_results['telegram'] = telegram_results

        # Send Email notifications
        email_operators = [op for op in operators if op.email]
        if email_operators:
            for operator in email_operators:
                html_message = self.email_service._format_email_template(alert, operator)
                success = self.email_service.send_email(
                    operator=operator,
                    subject=f"Alert: {alert.type}",
                    message=str(alert.message),
                    html_message=html_message
                )
                notification_results['email'].append((operator, success))

        return notification_results

    async def notify_operators(self, message, operators, channels=None):
        """
        Send a custom message to specified operators
        """
        if channels is None:
            channels = ['telegram', 'email']

        results = {}

        if 'telegram' in channels:
            results['telegram'] = await self.telegram_service.broadcast_alert(
                operators, message
            )

        if 'email' in channels:
            results['email'] = self.email_service.send_bulk_email(
                operators,
                subject="System Notification",
                message=message
            )

        return results 