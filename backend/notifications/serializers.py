from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Operator, Notification
from monitoring.serializers import AlertSerializer

User = get_user_model()

class OperatorSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = Operator
        fields = [
            'id', 'name', 'user_email', 'email', 'password', 'telegram_id', 
            'is_active', 'priority', 'priority_display', 
            'notification_preferences', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            email=email,
            password=password,
            is_operator=True
        )
        
        operator = Operator.objects.create(
            user=user,
            **validated_data
        )
        
        return operator

    def update(self, instance, validated_data):
        # Update user email if provided
        if 'email' in validated_data:
            email = validated_data.pop('email')
            instance.user.email = email
            instance.user.save()

        # Update user password if provided
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.user.set_password(password)
            instance.user.save()

        # Update operator fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance

    def validate_notification_preferences(self, value):
        required_keys = {'email_enabled', 'telegram_enabled'}
        if not all(key in value for key in required_keys):
            raise serializers.ValidationError(
                "notification_preferences must contain email_enabled and telegram_enabled"
            )
        return value

class NotificationSerializer(serializers.ModelSerializer):
    operator = OperatorSerializer(read_only=True)
    alert = AlertSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    message = serializers.CharField(read_only=True)
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'operator', 'alert', 'notification_type', 'notification_type_display',
            'status', 'status_display', 'message', 'sent_at', 'delivered_at',
            'read_at', 'retry_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'operator', 'alert', 'notification_type', 'status',
            'sent_at', 'delivered_at', 'read_at', 'retry_count',
            'created_at', 'updated_at'
        ]