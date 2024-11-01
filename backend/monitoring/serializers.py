from rest_framework import serializers
from backend.monitoring.models import Reading, Alert

class ReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reading
        fields = ['id', 'temperature', 'humidity', 'power_status', 
                 'battery_power', 'timestamp']
        read_only_fields = ['id', 'timestamp']

class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ['id', 'type', 'severity', 'message', 'timestamp', 
                 'reading', 'notified_operators', 'is_active']
        read_only_fields = ['id', 'timestamp'] 