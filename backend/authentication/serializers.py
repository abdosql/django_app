from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

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

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        
        # Add extra response data
        data['user_id'] = user.id
        data['email'] = user.email
        data['is_staff'] = user.is_staff
        
        # Add operator info if user is an operator
        if user.is_operator and hasattr(user, 'operator'):
            data['operator_id'] = user.operator.id
            data['operator_priority'] = user.operator.priority
            
        return data 