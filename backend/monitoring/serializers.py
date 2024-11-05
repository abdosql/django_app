from rest_framework import serializers
from .models import Reading, Alert

class ReadingSerializer(serializers.ModelSerializer):
    battery_level = serializers.FloatField(
        min_value=0,
        max_value=100,
        help_text="Battery level percentage (0-100)"
    )
    
    class Meta:
        model = Reading
        fields = [
            'id', 'temperature', 'humidity', 
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