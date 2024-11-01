from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Operator, User
from .serializers import (
    OperatorSerializer, 
    UserSerializer,
    CustomTokenObtainPairSerializer
)
from .permissions import IsAdminUser, IsOperatorOwner
from .services.notification_service import NotificationService

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_create(self, serializer):
        user = serializer.save()
        if user.is_operator:
            Operator.objects.create(
                user=user,
                name=user.get_full_name() or user.email,
                email=user.email
            )

class OperatorViewSet(viewsets.ModelViewSet):
    queryset = Operator.objects.all()
    serializer_class = OperatorSerializer
    notification_service = NotificationService()

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAdminUser|IsOperatorOwner]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['post'])
    def test_notification(self, request, pk=None):
        """Test notification for a specific operator"""
        operator = self.get_object()
        if not (request.user.is_staff or request.user == operator.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
            
        message = request.data.get('message', 'Test notification')
        results = self.notification_service.notify_operators(
            message=message,
            operators=[operator],
            channels=operator.get_notification_channels()
        )
        return Response({
            'message': 'Test notification sent',
            'results': results
        })

    @action(detail=False, methods=['post'])
    def broadcast(self, request):
        """Broadcast message to all operators or operators of specific priority"""
        if not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
            
        message = request.data.get('message')
        priority = request.data.get('priority')
        
        if not message:
            return Response(
                {'error': 'Message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        operators = Operator.objects.filter(is_active=True)
        if priority:
            operators = operators.filter(priority=priority)

        results = self.notification_service.notify_operators(
            message=message,
            operators=operators
        )

        return Response({
            'message': 'Broadcast sent',
            'results': results
        }) 