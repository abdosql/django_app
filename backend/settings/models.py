from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.cache import cache

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
        cache.delete('system_settings')
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        """Get settings from cache or database"""
        settings = cache.get('system_settings')
        if not settings:
            settings, _ = cls.objects.get_or_create(pk=1)
            cache.set('system_settings', settings, timeout=3600)
        return settings 