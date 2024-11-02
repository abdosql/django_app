from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Operator
from .serializers import OperatorSerializer
from .permissions import IsAdminUser, IsOperatorOwner
from .services.notification_service import NotificationService

User = get_user_model()

class OperatorViewSet(viewsets.ModelViewSet):
    queryset = Operator.objects.all()
    serializer_class = OperatorSerializer

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
        operator = self.get_object()
        message = request.data.get('message', 'Test notification')
        
        notification_service = NotificationService()
        success = notification_service.notify_operator(operator, message)
        
        if success:
            return Response({'status': 'notification sent'})
        return Response(
            {'status': 'notification failed'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def broadcast(self, request):
        message = request.data.get('message')
        priority = request.data.get('priority')
        
        if not message:
            return Response(
                {'error': 'Message is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        notification_service = NotificationService()
        operators = Operator.objects.filter(is_active=True)
        if priority:
            operators = operators.filter(priority=priority)
            
        success = notification_service.notify_operators(operators, message)
        
        if success:
            return Response({'status': 'broadcast sent'})
        return Response(
            {'status': 'broadcast partially failed'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 