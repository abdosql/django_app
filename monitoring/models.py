from django.db import models
from django.utils import timezone

class Reading(models.Model):
    temperature = models.FloatField()
    humidity = models.FloatField()
    power_status = models.BooleanField()
    timestamp = models.DateTimeField(default=timezone.now)
    battery_power = models.BooleanField()

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.get_alert_status()

    def get_alert_status(self):
        # Logic to determine alert status based on reading
        pass

class Alert(models.Model):
    ALERT_TYPES = [
        ('TEMPERATURE', 'Temperature'),
        ('POWER', 'Power'),
    ]

    SEVERITY_LEVELS = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]

    type = models.CharField(max_length=20, choices=ALERT_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS)
    message = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    notified_operators = models.JSONField()
    reading = models.ForeignKey(Reading, on_delete=models.CASCADE, related_name='alerts')

    @classmethod
    def create_temperature_alert(cls, reading, severity, message, notified_operators):
        return cls.objects.create(
            type='TEMPERATURE',
            severity=severity,
            message=message,
            reading=reading,
            notified_operators=notified_operators
        )

    @classmethod
    def create_power_alert(cls, reading, severity, message, notified_operators):
        return cls.objects.create(
            type='POWER',
            severity=severity,
            message=message,
            reading=reading,
            notified_operators=notified_operators
        )

    @staticmethod
    def get_active_alerts():
        return Alert.objects.filter(severity__in=['MEDIUM', 'HIGH']) 