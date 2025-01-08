from rest_framework import serializers
from .models import Reading, Alert, Incident, IncidentComment, IncidentTimelineEvent, Device
from notifications.models import Notification
from django.utils import timezone

class DeviceSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    last_reading_temperature = serializers.SerializerMethodField()
    last_reading_humidity = serializers.SerializerMethodField()

    class Meta:
        model = Device
        fields = [
            'device_id', 'name', 'location', 'status', 'status_display',
            'reading_interval', 'last_reading', 'last_reading_temperature',
            'last_reading_humidity', 'created_at', 'updated_at'
        ]
        read_only_fields = ['status_display', 'last_reading', 'created_at', 'updated_at']

    def get_last_reading_temperature(self, obj):
        if hasattr(obj, 'last_reading'):
            reading = Reading.objects.filter(
                device_id=obj.device_id,
                timestamp__lte=timezone.now()
            ).order_by('-timestamp').first()
            return reading.temperature if reading else None
        return None

    def get_last_reading_humidity(self, obj):
        if hasattr(obj, 'last_reading'):
            reading = Reading.objects.filter(
                device_id=obj.device_id,
                timestamp__lte=timezone.now()
            ).order_by('-timestamp').first()
            return reading.humidity if reading else None
        return None

class ReadingSerializer(serializers.ModelSerializer):
    battery_level = serializers.FloatField(
        min_value=0,
        max_value=100,
        help_text="Battery level percentage (0-100)"
    )
    
    class Meta:
        model = Reading
        fields = [
            'id', 'device_id', 'temperature', 'humidity', 
            'power_status', 'battery_level', 'timestamp'
        ]

    def validate_battery_level(self, value):
        """Ensure battery level is a valid percentage"""
        if not 0 <= value <= 100:
            raise serializers.ValidationError(
                "Battery level must be between 0 and 100"
            )
        return value

class AlertSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    temperature = serializers.FloatField(source='reading.temperature', read_only=True)
    device = DeviceSerializer(read_only=True)
    consecutive_count = serializers.SerializerMethodField()

    class Meta:
        model = Alert
        fields = [
            'id', 'alert_type', 'type_display', 'severity', 'severity_display',
            'message', 'timestamp', 'resolved', 'resolved_at', 'device',
            'temperature', 'consecutive_count'
        ]

    def get_consecutive_count(self, obj):
        if hasattr(obj, 'incidents') and obj.incidents.exists():
            return obj.incidents.first().alert_count
        return 1

class IncidentCommentSerializer(serializers.ModelSerializer):
    operator_name = serializers.CharField(source='operator.name', read_only=True)
    operator_priority = serializers.IntegerField(source='operator.priority', read_only=True)

    class Meta:
        model = IncidentComment
        fields = [
            'id', 
            'comment', 
            'action_taken',
            'is_read',
            'timestamp', 
            'operator_name',
            'operator_priority'
        ]
        read_only_fields = ['id', 'timestamp', 'operator_name', 'operator_priority']

    def validate(self, data):
        # Ensure comment is not empty
        if not data.get('comment', '').strip():
            raise serializers.ValidationError({
                'comment': 'Comment cannot be empty'
            })
        return data

class IncidentTimelineEventSerializer(serializers.ModelSerializer):
    operator_name = serializers.CharField(source='operator.name', read_only=True)

    class Meta:
        model = IncidentTimelineEvent
        fields = ['timestamp', 'event_type', 'description', 'temperature', 
                 'operator_name', 'metadata']
        read_only_fields = ['timestamp']

class NotificationSerializer(serializers.ModelSerializer):
    operator_name = serializers.CharField(source='operator.name', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'operator_name', 'message', 'status', 'sent_at', 'read_at', 'created_at']

class IncidentSerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source='device.name', read_only=True)
    device_location = serializers.CharField(source='device.location', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    notifications = NotificationSerializer(many=True, read_only=True)
    timeline_events = IncidentTimelineEventSerializer(many=True, read_only=True)
    can_acknowledge = serializers.SerializerMethodField()
    device_id = serializers.CharField(write_only=True)
    
    class Meta:
        model = Incident
        fields = [
            'id', 'device', 'device_id', 'device_name', 'device_location', 'alert', 
            'description', 'status', 'status_display', 'current_escalation_level',
            'alert_count', 'start_time', 'end_time', 'assigned_to', 'resolved_by',
            'notifications', 'timeline_events', 'can_acknowledge'
        ]
        read_only_fields = ['device']

    def get_can_acknowledge(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return False
        
        try:
            operator = request.user.operator
            return obj.status == 'open' and operator.is_active
        except:
            return False

    def create(self, validated_data):
        device_id = validated_data.pop('device_id')
        try:
            device = Device.objects.get(device_id=device_id)
            validated_data['device'] = device
            return super().create(validated_data)
        except Device.DoesNotExist:
            raise serializers.ValidationError({'device_id': f'Device with id {device_id} does not exist'})