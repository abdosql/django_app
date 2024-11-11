from rest_framework import serializers
from .models import Reading, Alert, Incident, IncidentComment, IncidentTimelineEvent

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
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)

    class Meta:
        model = Alert
        fields = '__all__'

class IncidentCommentSerializer(serializers.ModelSerializer):
    operator_name = serializers.CharField(source='operator.name', read_only=True)

    class Meta:
        model = IncidentComment
        fields = ['id', 'comment', 'action_taken', 'operator_name', 'timestamp']
        read_only_fields = ['operator_name', 'timestamp']

class IncidentTimelineEventSerializer(serializers.ModelSerializer):
    operator_name = serializers.CharField(source='operator.name', read_only=True)

    class Meta:
        model = IncidentTimelineEvent
        fields = ['timestamp', 'event_type', 'description', 'temperature', 
                 'operator_name', 'metadata']
        read_only_fields = ['timestamp']

class IncidentSerializer(serializers.ModelSerializer):
    comments = IncidentCommentSerializer(many=True, read_only=True)
    timeline_events = IncidentTimelineEventSerializer(many=True, read_only=True)
    temperature_readings = ReadingSerializer(many=True, read_only=True)
    
    class Meta:
        model = Incident
        fields = ['id', 'start_time', 'end_time', 'status', 'alert_count',
                 'current_escalation_level', 'comments', 'timeline_events',
                 'temperature_readings']