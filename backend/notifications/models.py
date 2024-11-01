from django.db import models

class Operator(models.Model):
    PRIORITY_CHOICES = [
        (1, 'Primary'),
        (2, 'Secondary'),
        (3, 'Tertiary')
    ]

    name = models.CharField(max_length=100)
    email = models.EmailField()
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
        if self.email and self.notification_preferences.get('email_enabled', True):
            channels.append('email')
        if self.telegram_id and self.notification_preferences.get('telegram_enabled', True):
            channels.append('telegram')
        return channels 