import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

class EmailService:
    def send_email(self, operator, subject, message, alert=None):
        """Send email to operator"""
        try:
            html_message = self._format_email_template(alert or message, operator)
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[operator.email],
                html_message=html_message
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {operator.email}: {str(e)}")
            return False

    def _format_email_template(self, alert, operator):
        """Format HTML email template"""
        context = {
            'alert': alert,
            'operator': operator,
        }
        return render_to_string('notifications/email/alert.html', context) 