from rest_framework import serializers
from .models import Reading, Alert, SystemSettings

class ReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reading
        fields = '__all__'

class AlertSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)

    class Meta:
        model = Alert
        fields = '__all__'

class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = [
            'normal_temp_min', 'normal_temp_max',
            'critical_temp_min', 'critical_temp_max',
            'reading_interval', 'alert_reset_time',
            'require_2fa', 'updated_at'
        ]

    def validate(self, data):
        """
        Check that temperature ranges are valid
        """
        if 'normal_temp_min' in data and 'normal_temp_max' in data:
            if data['normal_temp_min'] >= data['normal_temp_max']:
                raise serializers.ValidationError(
                    "Normal minimum temperature must be less than maximum"
                )

        if 'critical_temp_min' in data and 'critical_temp_max' in data:
            if data['critical_temp_min'] >= data['critical_temp_max']:
                raise serializers.ValidationError(
                    "Critical minimum temperature must be less than maximum"
                )

        return data 