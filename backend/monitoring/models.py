from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Reading(models.Model):
    device_id = models.CharField(
        max_length=100,
        default='default_device',
        help_text='Unique identifier for the monitoring device'
    )
    temperature = models.FloatField(
        validators=[MinValueValidator(-10), MaxValueValidator(50)]
    )
    humidity = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    power_status = models.BooleanField(default=True)
    battery_level = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=100,
        help_text="Battery level percentage (0-100)"
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.device_id} reading at {self.timestamp}: {self.temperature}°C"

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['device_id', 'timestamp']),
        ]

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
        indexes = [
            models.Index(fields=['type', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.get_type_display()} - {self.timestamp}" 

class Incident(models.Model):
    INCIDENT_STATES = [
        ('active', 'Active'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=INCIDENT_STATES, default='active')
    alert_count = models.IntegerField(default=1)
    current_escalation_level = models.IntegerField(default=1)
    resolved_by = models.ForeignKey(
        'notifications.Operator', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='resolved_incidents'
    )
    
    class Meta:
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['status', 'start_time']),
        ]

class IncidentComment(models.Model):
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name='comments')
    operator = models.ForeignKey('notifications.Operator', on_delete=models.CASCADE)
    comment = models.TextField()
    action_taken = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

class IncidentTimelineEvent(models.Model):
    EVENT_TYPES = [
        ('alert_created', 'Alert Created'),
        ('notification_sent', 'Notification Sent'),
        ('comment_added', 'Comment Added'),
        ('status_changed', 'Status Changed'),
        ('escalation_changed', 'Escalation Changed'),
    ]

    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name='timeline_events')
    timestamp = models.DateTimeField(auto_now_add=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    description = models.TextField()
    temperature = models.FloatField(null=True, blank=True)
    operator = models.ForeignKey(
        'notifications.Operator', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    metadata = models.JSONField(default=dict, blank=True)