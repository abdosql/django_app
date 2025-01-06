from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from monitoring.models import Device, Reading, Alert, Incident
from notifications.models import Operator
import random
from datetime import timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Populates the database with test data'

    def create_test_users(self):
        # Create admin user
        admin = User.objects.create_superuser(
            email='admin@admin.com',
            password='1234',
            first_name='Admin',
            last_name='User'
        )

        operators = []
        # Create operators with different priority levels
        for i in range(2):
            for priority in [1, 2, 3]:
                user = User.objects.create_user(
                    email=f'operator{priority}_{i}@example.com',
                    password=f'operator{priority}_{i}',
                    first_name=f'Operator {priority}',
                    last_name=f'User {i}'
                )
                operator = Operator.objects.create(
                    user=user,
                    name=f'Operator {priority}_{i}',
                    telegram_id=f'telegram{priority}{i}',
                    priority=priority,
                    notification_preferences={
                        'email_enabled': True,
                        'telegram_enabled': True
                    }
                )
                operators.append(operator)

        return operators

    def create_test_devices(self):
        devices = []
        locations = ['Lab A', 'Lab B', 'Storage Room', 'Clean Room']
        
        for i, location in enumerate(locations, 1):
            device = Device.objects.create(
                device_id=f'ESP8266_{i}',
                name=f'Temperature Sensor {i}',
                location=location,
                status='online',
                reading_interval=20
            )
            devices.append(device)
        
        return devices

    def generate_readings(self, device, start_time, end_time):
        readings_to_create = []
        alerts_to_create = []
        
        # Calculate number of days between start and end time
        days = (end_time - start_time).days
        
        # For each day
        for day in range(days + 1):
            current_date = start_time + timedelta(days=day)
            
            # Generate readings every hour instead of every 20 minutes
            for hour in range(0, 24):
                # Add a small random offset to avoid exact hours
                minute_offset = random.randint(0, 20)
                timestamp = current_date + timedelta(hours=hour, minutes=minute_offset)
                
                # Skip if timestamp is beyond end_time
                if timestamp > end_time:
                    continue
                
                # Generate temperature with some variation
                if random.random() < 0.1:  # 10% chance of abnormal reading
                    temperature = random.choice([
                        random.uniform(-2, 1),  # Low temperature
                        random.uniform(9, 12)   # High temperature
                    ])
                else:
                    # Normal range with slight variations
                    base_temp = random.uniform(4, 6)  # Center around 5°C
                    variation = random.uniform(-2, 2)  # Add some variation
                    temperature = base_temp + variation
                
                # Generate humidity between 30% and 70%
                humidity = random.uniform(30, 70)
                
                # Create reading
                reading = Reading(
                    device_id=device.device_id,
                    temperature=round(temperature, 2),
                    humidity=round(humidity, 2),
                    timestamp=timestamp,
                    power_status='AC' if random.random() > 0.02 else 'BATTERY',  # 2% chance of battery power
                    battery_level=random.uniform(60, 100)
                )
                readings_to_create.append(reading)
                
                # Check if temperature is outside normal range
                if temperature < 2 or temperature > 8:
                    severity = 'critical' if (0 <= temperature <= 2) or (8 <= temperature <= 10) else 'severe'
                    alert_type = 'high_temperature' if temperature > 8 else 'low_temperature'
                    
                    alert = Alert(
                        device=device,
                        reading=reading,
                        alert_type=alert_type,
                        severity=severity,
                        message=f'Temperature {alert_type.replace("_", " ")}: {temperature}°C',
                        timestamp=timestamp
                    )
                    alerts_to_create.append(alert)
        
        # Bulk create all readings
        readings = Reading.objects.bulk_create(readings_to_create)
        
        # Bulk create alerts and create incidents
        if alerts_to_create:
            alerts = Alert.objects.bulk_create(alerts_to_create)
            
            # Create an incident for each alert
            for alert in alerts:
                Incident.objects.create(
                    device=device,
                    alert=alert,
                    status='open',
                    description=f'Temperature {alert.alert_type.replace("_", " ")} incident: {alert.message}',
                    current_escalation_level=1,
                    start_time=alert.timestamp
                )

    def handle(self, *args, **kwargs):
        # Clear existing data
        Reading.objects.all().delete()
        Alert.objects.all().delete()
        Incident.objects.all().delete()
        Device.objects.all().delete()
        Operator.objects.all().delete()
        User.objects.all().delete()  # Delete all users including admin

        # Create test users and operators
        operators = self.create_test_users()
        
        # Create test devices
        devices = self.create_test_devices()

        # Generate readings for each device over a shorter time period
        now = timezone.now()
        start_time = now - timedelta(days=7)  # Only 7 days of past data
        end_time = now + timedelta(days=1)    # Only 1 day of future data

        for device in devices:
            self.generate_readings(device, start_time, end_time)

        self.stdout.write(self.style.SUCCESS('Successfully populated test data'))
