from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Reading(models.Model):
    temperature = models.FloatField(
        validators=[MinValueValidator(-10), MaxValueValidator(50)]
    )
    humidity = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    power_status = models.BooleanField(default=True)
    battery_power = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reading at {self.timestamp}: {self.temperature}°C"

    class Meta:
        ordering = ['-timestamp']

class Alert(models.Model):
    ALERT_TYPES = [
        ('TEMP_HIGH', 'Temperature Too High'),
        ('TEMP_LOW', 'Temperature Too Low'),
        ('POWER_OUT', 'Power Outage'),
        ('POWER_RESTORED', 'Power Restored'),
    ]
    
    SEVERITY_LEVELS = [
        (1, 'Low'),
        (2, 'Medium'),
        (3, 'High'),
    ]

    type = models.CharField(max_length=20, choices=ALERT_TYPES)
    severity = models.IntegerField(choices=SEVERITY_LEVELS)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    reading = models.ForeignKey(Reading, on_delete=models.CASCADE)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.get_type_display()} - {self.timestamp}" 