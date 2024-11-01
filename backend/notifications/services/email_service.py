import logging
from django.core.mail import send_mail, send_mass_mail
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

class EmailService:
    def send_email(self, operator, subject, message, html_message=None):
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[operator.email],
                html_message=html_message
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

    def send_bulk_email(self, operators, subject, message, html_message=None):
        messages = [
            (subject, message, settings.DEFAULT_FROM_EMAIL, [op.email])
            for op in operators if op.email
        ]
        try:
            send_mass_mail(messages)
            return True
        except Exception as e:
            logger.error(f"Failed to send bulk email: {str(e)}")
            return False

    def _format_email_template(self, alert, operator):
        context = {
            'alert': alert,
            'operator': operator,
        }
        return render_to_string('notifications/email/alert.html', context) 