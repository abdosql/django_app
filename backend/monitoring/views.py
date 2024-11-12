from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.utils import timezone
from datetime import timedelta
from .models import Reading, Alert, Incident, IncidentComment, IncidentTimelineEvent
from .serializers import ReadingSerializer, AlertSerializer, IncidentSerializer, IncidentCommentSerializer, IncidentTimelineEventSerializer
from notifications.services.notification_service import NotificationService
from settings.models import SystemSettings
import logging
from django.db import transaction
from notifications.models import Operator
from rest_framework.views import APIView
from django.db.models import Min, Max, Avg
from django.db.models.functions import TruncDate
from django.core.exceptions import PermissionDenied

logger = logging.getLogger(__name__)

class ReadingViewSet(viewsets.ModelViewSet):
    queryset = Reading.objects.all()
    serializer_class = ReadingSerializer
    notification_service = NotificationService()

    def _determine_severity(self, temperature):
        """
        Determine alert severity based on temperature:
        - Normal: 2°C to 8°C
        - Critical: 0°C to 2°C or 8°C to 10°C
        - Severe: < 0°C or > 10°C
        """
        settings = SystemSettings.get_settings()
        
        if temperature < settings.critical_temp_min or temperature > settings.critical_temp_max:
            return 3  # High severity for severe temperatures
        elif (settings.critical_temp_min <= temperature < settings.normal_temp_min or 
              settings.normal_temp_max < temperature <= settings.critical_temp_max):
            return 2  # Medium severity for critical temperatures
        else:
            return 1  # Low severity for normal range (shouldn't typically occur)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reading = serializer.save()
        
        # Check temperature limits
        self._check_temperature(reading)
        
        # Check power status
        self._check_power_status(reading)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def _check_temperature(self, reading):
        settings = SystemSettings.get_settings()
        
        if not (settings.normal_temp_min <= reading.temperature <= settings.normal_temp_max):
            # Get or create active incident
            incident = Incident.objects.filter(
                status__in=['active', 'acknowledged']
            ).first()
            
            if not incident:
                incident = Incident.objects.create()
                alert_type = 'TEMP_HIGH' if reading.temperature > settings.normal_temp_max else 'TEMP_LOW'
                severity = self._determine_severity(reading.temperature)
                
                # Create initial alert
                alert = self._create_alert(reading, alert_type, severity)
                
                # Create timeline event
                IncidentTimelineEvent.objects.create(
                    incident=incident,
                    event_type='alert_created',
                    description=f"Temperature {alert_type.lower().replace('_', ' ')}",
                    temperature=reading.temperature
                )
            else:
                incident.alert_count += 1
                
                # Check for escalation
                if incident.alert_count == 4:
                    incident.current_escalation_level = 2
                    self._notify_secondary_operators(incident)
                elif incident.alert_count == 7:
                    incident.current_escalation_level = 3
                    self._notify_tertiary_operators(incident)
                
                incident.save()
        else:
            # Temperature back to normal, resolve any active incidents
            active_incidents = Incident.objects.filter(
                status__in=['active', 'acknowledged']
            )
            
            for incident in active_incidents:
                incident.status = 'resolved'
                incident.end_time = timezone.now()
                incident.save()
                
                IncidentTimelineEvent.objects.create(
                    incident=incident,
                    event_type='status_changed',
                    description="Temperature returned to normal range",
                    temperature=reading.temperature
                )

    def _notify_secondary_operators(self, incident):
        operators = Operator.objects.filter(priority=2, is_active=True)
        self._create_notifications(operators, incident)
        
        IncidentTimelineEvent.objects.create(
            incident=incident,
            event_type='escalation_changed',
            description="Escalated to secondary operators"
        )

    def _notify_tertiary_operators(self, incident):
        operators = Operator.objects.filter(priority=3, is_active=True)
        self._create_notifications(operators, incident)
        
        IncidentTimelineEvent.objects.create(
            incident=incident,
            event_type='escalation_changed',
            description="Escalated to tertiary operators"
        )

    def _check_power_status(self, reading):
        last_reading = Reading.objects.filter(
            timestamp__lt=reading.timestamp
        ).first()

        if last_reading and last_reading.power_status != reading.power_status:
            if not reading.power_status:
                self._create_alert(reading, 'POWER_OUT', severity=3)
            else:
                self._create_alert(reading, 'POWER_RESTORED', severity=1)

    def _create_alert(self, reading, alert_type, severity=2):
        print(f"\n=== Creating alert ===")
        print(f"Type: {alert_type}")
        print(f"Severity: {severity}")
        
        settings = SystemSettings.get_settings()
        
        try:
            # Create the alert
            alert = Alert.objects.create(
                type=alert_type,
                severity=severity,
                reading=reading,
                message=f"Alert: {alert_type} at {reading.timestamp}"
            )
            print(f"Alert created with ID: {alert.id}")
            
            # Create notifications using notification service
            notification_service = NotificationService()
            notifications = notification_service.process_alert(alert)
            print(f"Notifications created: {notifications}")
            
            return alert
            
        except Exception as e:
            print(f"Error creating alert: {str(e)}")
            logger.error(f"Failed to create alert: {str(e)}")
            raise

class AlertViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer

    @action(detail=False)
    def active(self, request):
        active_alerts = Alert.objects.filter(resolved=False)
        serializer = self.get_serializer(active_alerts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.resolved = True
        alert.resolved_at = timezone.now()
        alert.save()
        return Response({'status': 'alert resolved'})

class IncidentViewSet(viewsets.ModelViewSet):
    queryset = Incident.objects.all()
    serializer_class = IncidentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status', None)
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if status:
            queryset = queryset.filter(status=status)
        if start_date:
            queryset = queryset.filter(start_time__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(start_time__date__lte=end_date)
            
        return queryset

    def _get_operator_or_fail(self):
        """Get operator for current user or raise appropriate error"""
        try:
            return self.request.user.operator
        except User.operator.RelatedObjectDoesNotExist:
            raise PermissionDenied(
                detail="You must be an operator to perform this action. Please contact an administrator."
            )

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """
        Add a comment to an incident with optional action taken flag.
        Endpoint: POST /api/incidents/{id}/add_comment/
        """
        incident = self.get_object()
        operator = self._get_operator_or_fail()
        serializer = IncidentCommentSerializer(data=request.data)
        
        if serializer.is_valid():
            with transaction.atomic():
                # Save the comment
                comment = serializer.save(
                    incident=incident,
                    operator=operator
                )
                
                # Create timeline event
                IncidentTimelineEvent.objects.create(
                    incident=incident,
                    event_type='comment_added',
                    description=f"Comment added by {operator.name}",
                    operator=operator,
                    metadata={
                        'comment': serializer.validated_data['comment'],
                        'action_taken': serializer.validated_data.get('action_taken', False)
                    }
                )

                # If action was taken, update incident status
                if serializer.validated_data.get('action_taken', False):
                    incident.status = 'acknowledged'
                    incident.save()
                    
                    # Create additional timeline event for action taken
                    IncidentTimelineEvent.objects.create(
                        incident=incident,
                        event_type='status_changed',
                        description=f"Action taken by {operator.name}",
                        operator=operator,
                        metadata={'action': 'acknowledged'}
                    )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        incident = self.get_object()
        operator = self._get_operator_or_fail()
        
        if incident.status == 'resolved':
            return Response(
                {'detail': 'Cannot acknowledge resolved incident'},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        
        note = request.data.get('acknowledgment_note', '')
        
        with transaction.atomic():
            incident.status = 'acknowledged'
            incident.save()
            
            # Create comment
            IncidentComment.objects.create(
                incident=incident,
                operator=operator,
                comment=f"Incident acknowledged: {note}"
            )
            
            # Create timeline event
            IncidentTimelineEvent.objects.create(
                incident=incident,
                event_type='status_changed',
                description=f"Incident acknowledged by {operator.name}",
                operator=operator
            )
            
        return Response({'status': 'incident acknowledged'})

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """
        Get all comments for an incident.
        Endpoint: GET /api/incidents/{id}/comments/
        """
        incident = self.get_object()
        comments = incident.comments.all().select_related('operator')
        serializer = IncidentCommentSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        incident = self.get_object()
        events = incident.timeline_events.all()
        serializer = IncidentTimelineEventSerializer(events, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def report(self, request, pk=None):
        incident = self.get_object()
        format = request.query_params.get('format', 'json')
        
        if format == 'json':
            serializer = self.get_serializer(incident)
            return Response(serializer.data)
        elif format in ['pdf', 'csv']:
            # Implementation for PDF and CSV reports will be added
            return Response(
                {'detail': f'{format.upper()} report generation not implemented'},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )
        else:
            return Response(
                {'detail': 'Invalid format specified'},
                status=status.HTTP_400_BAD_REQUEST
            )

class TemperatureStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        period = request.query_params.get('period', 'daily')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = Reading.objects.all()
        
        if start_date:
            queryset = queryset.filter(timestamp__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__date__lte=end_date)
            
        if period == 'daily':
            stats = queryset.annotate(
                date=TruncDate('timestamp')
            ).values('date').annotate(
                min_temperature=Min('temperature'),
                max_temperature=Max('temperature'),
                average_temperature=Avg('temperature'),
                alert_count=models.Count(
                    'alert',
                    filter=models.Q(alert__type__in=['TEMP_HIGH', 'TEMP_LOW'])
                )
            ).order_by('date')
            
            return Response({
                'period': period,
                'statistics': stats
            })
        
        # Add weekly/monthly aggregation if needed
        return Response({
            'detail': f'Period {period} not implemented'
        }, status=status.HTTP_501_NOT_IMPLEMENTED)