from django.db import models
from django.conf import settings
from monitoring.models import Alert

class Operator(models.Model):
    PRIORITY_CHOICES = [
        (1, 'Primary'),
        (2, 'Secondary'),
        (3, 'Tertiary')
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    telegram_id = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=1)
    notification_preferences = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['priority', 'name']

    def __str__(self):
        return f"{self.name} (Priority: {self.get_priority_display()})"

    def get_notification_channels(self):
        channels = []
        if self.user.email and self.notification_preferences.get('email_enabled', True):
            channels.append('email')
        if self.telegram_id and self.notification_preferences.get('telegram_enabled', True):
            channels.append('telegram')
        return channels

class Notification(models.Model):
    NOTIFICATION_STATUS = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
        ('READ', 'Read')
    ]

    operator = models.ForeignKey('Operator', on_delete=models.CASCADE)
    alert = models.ForeignKey(Alert, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=NOTIFICATION_STATUS, default='PENDING')
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    retry_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        # Prevent duplicate notifications for the same alert and operator
        unique_together = ['operator', 'alert']

    def __str__(self):
        return f"Notification for {self.operator.name} - {self.alert.type}"