from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.cache import cache

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

class SystemSettings(models.Model):
    # Temperature Thresholds
    normal_temp_min = models.FloatField(
        default=2.0,
        validators=[MinValueValidator(-10), MaxValueValidator(50)]
    )
    normal_temp_max = models.FloatField(
        default=8.0,
        validators=[MinValueValidator(-10), MaxValueValidator(50)]
    )
    critical_temp_min = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(-10), MaxValueValidator(50)]
    )
    critical_temp_max = models.FloatField(
        default=10.0,
        validators=[MinValueValidator(-10), MaxValueValidator(50)]
    )

    # Monitoring Settings
    reading_interval = models.IntegerField(
        default=20,
        choices=[(10, '10 minutes'), (20, '20 minutes'), (30, '30 minutes')],
        help_text='Reading interval in minutes'
    )
    alert_reset_time = models.IntegerField(
        default=30,
        choices=[(15, '15 minutes'), (30, '30 minutes'), (60, '1 hour')],
        help_text='Time before alert can be triggered again'
    )

    # System Access
    require_2fa = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'System Settings'
        verbose_name_plural = 'System Settings'

    def save(self, *args, **kwargs):
        # Clear cache when settings are updated
        cache.delete('system_settings')
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        """Get settings from cache or database"""
        settings = cache.get('system_settings')
        if not settings:
            settings, _ = cls.objects.get_or_create(pk=1)
            cache.set('system_settings', settings, timeout=3600)  # Cache for 1 hour
        return settings