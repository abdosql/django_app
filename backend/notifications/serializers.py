from rest_framework import serializers
from .models import Operator

class OperatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Operator
        fields = [
            'id', 'name', 'email', 'telegram_id', 'is_active',
            'priority', 'notification_preferences', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_notification_preferences(self, value):
        required_keys = {'email_enabled', 'telegram_enabled'}
        if not all(key in value for key in required_keys):
            raise serializers.ValidationError(
                "notification_preferences must contain email_enabled and telegram_enabled"
            )
        return value 