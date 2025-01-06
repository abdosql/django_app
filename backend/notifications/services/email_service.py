import logging
import requests

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.api_url = 'http://atmosense.runasp.net/email'

    def send_email(self, operator, subject, message, alert=None, incident=None):
        """Send email using the API endpoint"""
        try:
            # Format a simple message
            email_content = self._format_message(alert, incident, message, operator)
            
            # For testing purposes, simulate successful email sending
            # In production, uncomment the API call
            # response = requests.post(self.api_url, json=payload)
            # return response.status_code == 200
            
            # Simulate successful email sending
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