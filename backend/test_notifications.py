import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from notifications.services.email_service import EmailService
from notifications.models import Operator
from django.contrib.auth import get_user_model

def test_email_notification():
    print("\nTesting email notification service...")
    
    # Create a test user and operator
    User = get_user_model()
    
    # Try to get existing user or create new one
    user, created = User.objects.get_or_create(
        email='seqqal.abdelaziz@gmail.com',
        defaults={
            'password': 'testpassword123'
        }
    )
    
    if created:
        user.set_password('testpassword123')
        user.save()
    
    # Try to get existing operator or create new one
    operator, created = Operator.objects.get_or_create(
        user=user,
        defaults={
            'name': 'Test Operator',
            'is_active': True,
            'priority': 1,
            'notification_preferences': {
                'email_enabled': True
            }
        }
    )
    
    # Test email notification
    print("\nSending test email via API...")
    email_service = EmailService()
    email_result = email_service.send_email(
        operator=operator,
        subject='Temperature Monitor - Test Alert',
        message='This is a test alert message from the temperature monitoring system. If you receive this, the email notification system is working correctly.'
    )
    print(f"Email notification {'succeeded' if email_result else 'failed'}")

if __name__ == '__main__':
    test_email_notification() 