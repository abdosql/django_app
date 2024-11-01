from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Reading(models.Model):
    temperature = models.FloatField(
        validators=[MinValueValidator(-10), MaxValueValidator(50)]
    )
    humidity = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    power_status = models.BooleanField(default=True)  # True = Power OK, False = Power Out
    battery_power = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def get_alert_status(self):
        alerts = []
        if not (2 <= self.temperature <= 8):
            alerts.append("temperature")
        if not self.power_status:
            alerts.append("power")
        return alerts

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['temperature']),
            models.Index(fields=['power_status']),
        ]

class Alert(models.Model):
    class AlertType(models.TextChoices):
        TEMPERATURE = 'TEMP', 'Temperature'
        POWER = 'POWER', 'Power'

    class SeverityLevel(models.TextChoices):
        WARNING = 'WARNING', 'Warning'
        CRITICAL = 'CRITICAL', 'Critical'
        EMERGENCY = 'EMERGENCY', 'Emergency'

    type = models.CharField(max_length=10, choices=AlertType.choices)
    severity = models.CharField(max_length=10, choices=SeverityLevel.choices)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    reading = models.ForeignKey(Reading, on_delete=models.CASCADE, related_name='alerts')
    notified_operators = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)

    @classmethod
    def create_temperature_alert(cls, reading, severity, consecutive_alerts=0):
        message = (
            f"Temperature Alert: {reading.temperature}°C is outside safe range (2-8°C). "
            f"Consecutive alerts: {consecutive_alerts}"
        )
        return cls.objects.create(
            type=cls.AlertType.TEMPERATURE,
            severity=severity,
            message=message,
            reading=reading
        )

    @classmethod
    def create_power_alert(cls, reading):
        message = "Power Outage Detected! System running on battery power."
        return cls.objects.create(
            type=cls.AlertType.POWER,
            severity=cls.SeverityLevel.EMERGENCY,
            message=message,
            reading=reading
        )

    @classmethod
    def get_active_alerts(cls):
        return cls.objects.filter(is_active=True).order_by('-timestamp')

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['type']),
            models.Index(fields=['is_active']),
        ] 