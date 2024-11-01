from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Operator
from .serializers import OperatorSerializer
from .services.notification_service import NotificationService

class OperatorViewSet(viewsets.ModelViewSet):
    queryset = Operator.objects.all()
    serializer_class = OperatorSerializer
    notification_service = NotificationService()

    @action(detail=True, methods=['post'])
    async def test_notification(self, request, pk=None):
        operator = self.get_object()
        message = request.data.get('message', 'Test notification')
        
        results = await self.notification_service.notify_operators(
            message=message,
            operators=[operator],
            channels=operator.get_notification_channels()
        )
        
        return Response({
            'message': 'Test notification sent',
            'results': results
        })

    @action(detail=False, methods=['post'])
    async def broadcast(self, request):
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

        results = await self.notification_service.notify_operators(
            message=message,
            operators=operators
        )

        return Response({
            'message': 'Broadcast sent',
            'results': results
        }) 