from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Operator, User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'first_name', 'last_name', 
                 'is_operator', 'is_staff']
        read_only_fields = ['is_staff']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class OperatorSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', 
                                          read_only=True)
    
    class Meta:
        model = Operator
        fields = [
            'id', 'name', 'email', 'telegram_id', 'is_active',
            'priority', 'priority_display', 'notification_preferences',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_notification_preferences(self, value):
        required_keys = {'email_enabled', 'telegram_enabled'}
        if not all(key in value for key in required_keys):
            raise serializers.ValidationError(
                "notification_preferences must contain email_enabled and telegram_enabled"
            )
        return value

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user_id'] = self.user.id
        data['email'] = self.user.email
        data['is_staff'] = self.user.is_staff
        if self.user.is_operator:
            operator = Operator.objects.get(user=self.user)
            data['operator_id'] = operator.id
            data['operator_priority'] = operator.priority
        return data 