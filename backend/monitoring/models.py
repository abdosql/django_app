from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class Device(models.Model):
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('warning', 'Warning'),
        ('error', 'Error'),
    ]

    device_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='offline')
    reading_interval = models.IntegerField(default=300)  # in seconds
    last_reading = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.device_id})"

class Reading(models.Model):
    device_id = models.CharField(max_length=100, default='ESP8266_1')  # Default for migration
    temperature = models.FloatField(
        validators=[MinValueValidator(-50), MaxValueValidator(100)]
    )
    humidity = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    power_status = models.CharField(
        max_length=20,
        choices=[
            ('AC', 'AC Power'),
            ('BATTERY', 'Battery Power')
        ],
        default='AC'
    )
    battery_level = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Battery level percentage (0-100)",
        default=100
    )
    timestamp = models.DateTimeField()

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['device_id', '-timestamp']),
            models.Index(fields=['-timestamp']),
        ]

    def __str__(self):
        return f"{self.device_id} - {self.temperature}°C at {self.timestamp}"

class Alert(models.Model):
    ALERT_TYPES = [
        ('high_temperature', 'High Temperature'),
        ('low_temperature', 'Low Temperature'),
        ('power_failure', 'Power Failure'),
        ('low_battery', 'Low Battery'),
        ('connection_lost', 'Connection Lost'),
    ]
    
    SEVERITY_LEVELS = [
        ('critical', 'Critical'),
        ('severe', 'Severe'),
        ('warning', 'Warning'),
    ]
    
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='alerts')
    reading = models.ForeignKey(Reading, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS)
    message = models.TextField()
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        'notifications.Operator',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_alerts'
    )
    resolution_notes = models.TextField(blank=True)
    timestamp = models.DateTimeField()
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['device', '-timestamp']),
            models.Index(fields=['-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.device.name} - {self.get_alert_type_display()} at {self.timestamp}"

class Incident(models.Model):
    INCIDENT_STATES = [
        ('open', 'Open'),
        ('acknowledged', 'Acknowledged'),
        ('investigating', 'Under Investigation'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='incidents')
    alert = models.ForeignKey(Alert, on_delete=models.CASCADE, related_name='incidents')
    description = models.TextField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=INCIDENT_STATES, default='open')
    alert_count = models.IntegerField(default=1)
    current_escalation_level = models.IntegerField(default=1)
    assigned_to = models.ForeignKey(
        'notifications.Operator',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_incidents'
    )
    resolved_by = models.ForeignKey(
        'notifications.Operator',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_incidents'
    )
    
    def check_escalation(self):
        """Check and handle alert escalation based on alert count"""
        if self.alert_count == 4 and self.current_escalation_level < 2:
            self.current_escalation_level = 2
            self._create_escalation_event(2)
            
        elif self.alert_count == 7 and self.current_escalation_level < 3:
            self.current_escalation_level = 3
            self._create_escalation_event(3)
            
        self.save()
    
    def _create_escalation_event(self, new_level):
        IncidentTimelineEvent.objects.create(
            incident=self,
            event_type='escalation_changed',
            description=f'Escalated to level {new_level} operators after {self.alert_count} alerts',
            metadata={'new_level': new_level}
        )

    class Meta:
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['status', 'start_time']),
            models.Index(fields=['device', 'start_time']),
        ]

    def __str__(self):
        return f"Incident {self.id} - {self.device.name} - {self.status}"

class IncidentComment(models.Model):
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name='comments')
    operator = models.ForeignKey('notifications.Operator', on_delete=models.SET_NULL, null=True)
    comment = models.TextField()
    action_taken = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Comment on {self.incident} by {self.operator}"

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