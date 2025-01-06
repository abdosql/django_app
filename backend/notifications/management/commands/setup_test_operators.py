from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from notifications.models import Operator

User = get_user_model()

class Command(BaseCommand):
    help = 'Set up test operators with proper email addresses and Telegram IDs'

    def handle(self, *args, **options):
        # Create test operators with different priority levels
        operators_data = [
            {
                'email': 'operator1@example.com',
                'name': 'Primary Operator',
                'priority': 1,
                'telegram_id': 'telegram1',
                'is_active': True,
                'notification_preferences': {
                    'email_enabled': True,
                    'telegram_enabled': True
                }
            },
            {
                'email': 'operator2@example.com',
                'name': 'Secondary Operator',
                'priority': 2,
                'telegram_id': 'telegram2',
                'is_active': True,
                'notification_preferences': {
                    'email_enabled': True,
                    'telegram_enabled': True
                }
            },
            {
                'email': 'operator3@example.com',
                'name': 'Tertiary Operator',
                'priority': 3,
                'telegram_id': 'telegram3',
                'is_active': True,
                'notification_preferences': {
                    'email_enabled': True,
                    'telegram_enabled': True
                }
            }
        ]

        for data in operators_data:
            # Create or update user
            user, created = User.objects.update_or_create(
                email=data['email'],
                defaults={
                    'is_active': True,
                    'is_operator': True
                }
            )
            
            if created:
                user.set_password('testpass123')
                user.save()
                self.stdout.write(f"Created user: {user.email}")
            else:
                self.stdout.write(f"Updated user: {user.email}")

            # Create or update operator
            operator, created = Operator.objects.update_or_create(
                user=user,
                defaults={
                    'name': data['name'],
                    'priority': data['priority'],
                    'telegram_id': data['telegram_id'],
                    'is_active': data['is_active'],
                    'notification_preferences': data['notification_preferences']
                }
            )

            if created:
                self.stdout.write(f"Created operator: {operator.name}")
            else:
                self.stdout.write(f"Updated operator: {operator.name}")

        self.stdout.write(self.style.SUCCESS('Successfully set up test operators')) 