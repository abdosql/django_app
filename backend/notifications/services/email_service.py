import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

class EmailService:
    def send_email(self, operator, subject, message, alert=None, incident=None):
        """Send email using Django's email functionality"""
        try:
            # Format the message
            email_content = self._format_message(alert, incident, message, operator)
            
            # Send email using Django's send_mail
            send_mail(
                subject=subject,
                message=email_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[operator.user.email],
                fail_silently=False,
            )
            
            return True
                
        except Exception as e:
            logger.error(f"Failed to send email to {operator.user.email}: {str(e)}")
            return False

    def _format_message(self, alert, incident, message, operator):
        """Format a simple text message"""
        content_parts = []
        
        if alert:
            content_parts.extend([
                f"Alert Type: {alert.get_type_display()}",
                f"Severity: {alert.get_severity_display()}",
                f"Time: {alert.timestamp}",
                f"Message: {alert.message}"
            ])
        
        if incident:
            content_parts.extend([
                f"Incident Description: {incident.description}",
                f"Status: {incident.get_status_display()}",
                f"Start Time: {incident.start_time}",
                f"Alert Count: {incident.alert_count}"
            ])
        
        if not alert and not incident:
            content_parts.append(message)
        
        content_parts.extend([
            "",
            "This is an automated message from the Temperature Monitoring System.",
            f"Operator: {operator.name} (Priority: {operator.get_priority_display()})"
        ])
        
        return "\n".join(content_parts) 