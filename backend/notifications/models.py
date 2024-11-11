from django.db import models
from django.conf import settings
from monitoring.models import Alert, Incident

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
    NOTIFICATION_TYPES = [
        ('EMAIL', 'Email'),
        ('TELEGRAM', 'Telegram'),
        ('SMS', 'SMS'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
        ('DELIVERED', 'Delivered'),
        ('READ', 'Read'),
    ]

    operator = models.ForeignKey(Operator, on_delete=models.CASCADE, related_name='notifications')
    incident = models.ForeignKey('monitoring.Incident', on_delete=models.CASCADE, related_name='notifications')
    alert = models.ForeignKey('monitoring.Alert', on_delete=models.CASCADE, null=True, blank=True)
    
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    message = models.TextField()
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    error_message = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['operator', 'created_at']),
        ]

    def __str__(self):
        return f"{self.get_notification_type_display()} to {self.operator.name} - {self.status}"