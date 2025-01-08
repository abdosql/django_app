from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from .models import Reading, Alert, Incident, IncidentComment, IncidentTimelineEvent, Device
from .serializers import ReadingSerializer, AlertSerializer, IncidentSerializer, IncidentCommentSerializer, IncidentTimelineEventSerializer, DeviceSerializer
from notifications.services.notification_service import NotificationService
from settings.models import SystemSettings
import logging
from django.db import transaction
from notifications.models import Operator
from rest_framework.views import APIView
from django.db.models import Min, Max, Avg
from django.db.models.functions import TruncDate
from django.core.exceptions import PermissionDenied
import csv
from django.http import HttpResponse
import json
import io
from reportlab.pdfgen import canvas

logger = logging.getLogger(__name__)

class ReadingViewSet(viewsets.ModelViewSet):
    serializer_class = ReadingSerializer
    notification_service = NotificationService()

    def get_queryset(self):
        queryset = Reading.objects.all()
        device_id = self.request.query_params.get('device_id', None)
        if device_id:
            queryset = queryset.filter(device_id=device_id)
        return queryset.order_by('-timestamp')

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get the latest temperature reading."""
        try:
            device_id = request.query_params.get('device_id', None)
            queryset = self.get_queryset()
            
            if device_id and device_id != 'ALL':
                queryset = queryset.filter(device_id=device_id)
            
            latest_reading = queryset.first()  # Already ordered by -timestamp from get_queryset
            
            if not latest_reading:
                return Response({
                    'error': 'No readings available'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get previous reading for trend
            previous_reading = queryset[1] if queryset.count() > 1 else None
            
            # Calculate trend
            trend = 'stable'
            if previous_reading:
                if latest_reading.temperature > previous_reading.temperature:
                    trend = 'increasing'
                elif latest_reading.temperature < previous_reading.temperature:
                    trend = 'decreasing'
            
            response_data = {
                'timestamp': latest_reading.timestamp,
                'temperature': latest_reading.temperature,
                'humidity': latest_reading.humidity,
                'device_id': latest_reading.device_id,
                'power_status': latest_reading.power_status,
                'trend': trend
            }
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error getting latest reading: {str(e)}")
            return Response({
                'error': f'Failed to get latest reading: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        """
        Check temperature against thresholds and create alerts if needed:
        - Normal: 2°C to 8°C
        - Critical: 0°C to 2°C or 8°C to 10°C
        - Severe: Outside these ranges
        """
        try:
            temperature = reading.temperature
            
            # Define temperature ranges
            NORMAL_MIN, NORMAL_MAX = 2.0, 8.0
            CRITICAL_MIN, CRITICAL_MAX = 0.0, 10.0
            
            # Get or create device
            device, created = Device.objects.get_or_create(
                device_id=reading.device_id,
                defaults={
                    'name': f'Device {reading.device_id}',
                    'location': 'Unknown',
                    'status': 'online'
                }
            )
            
            # Update device status and last reading
            device.status = 'online'
            device.last_reading = timezone.now()
            device.save()
            
            # Determine alert type and severity
            if NORMAL_MIN <= temperature <= NORMAL_MAX:
                # Temperature is normal, resolve any active incidents
                active_incidents = Incident.objects.filter(
                    device=device,
                    status__in=['open', 'acknowledged', 'investigating']
                )
                
                for incident in active_incidents:
                    incident.status = 'resolved'
                    incident.end_time = timezone.now()
                    incident.save()
                    
                    IncidentTimelineEvent.objects.create(
                        incident=incident,
                        event_type='status_changed',
                        description=f"Temperature returned to normal range: {temperature}°C",
                        temperature=temperature
                    )
                
                return  # No need to create alert for normal temperature
            
            # Temperature is outside normal range
            severity = 'critical' if CRITICAL_MIN <= temperature <= CRITICAL_MAX else 'severe'
            alert_type = 'high_temperature' if temperature > NORMAL_MAX else 'low_temperature'
            
            # Create alert with transaction to ensure it's created successfully
            with transaction.atomic():
                # Create alert
                alert = Alert.objects.create(
                    device=device,
                    reading=reading,
                    alert_type=alert_type,
                    severity=severity,
                    message=f"Temperature {alert_type.replace('_', ' ')}: {temperature}°C"
                )
                
                # Save the alert to ensure it has an ID
                alert.save()
                
                # Get or create incident
                active_incident = Incident.objects.filter(
                    device=device,
                    status__in=['open', 'acknowledged', 'investigating']
                ).first()
                
                if active_incident:
                    # Update existing incident
                    active_incident.alert_count += 1
                    active_incident.save()
                    
                    # Check for escalation
                    if active_incident.alert_count == 4:
                        active_incident.current_escalation_level = 2
                        self._notify_operators(active_incident, level=2)
                    elif active_incident.alert_count == 7:
                        active_incident.current_escalation_level = 3
                        self._notify_operators(active_incident, level=3)
                else:
                    # Create new incident
                    incident = Incident.objects.create(
                        device=device,
                        alert=alert,  # Now we're sure the alert exists and has an ID
                        description=f"Temperature {alert_type.replace('_', ' ')} incident",
                        status='open',
                        current_escalation_level=1
                    )
                    
                    # Notify primary operators
                    self._notify_operators(incident, level=1)
                    
                    # Create initial timeline event
                    IncidentTimelineEvent.objects.create(
                        incident=incident,
                        event_type='alert_created',
                        description=f"Initial alert: Temperature {alert_type.replace('_', ' ')} ({temperature}°C)",
                        temperature=temperature
                    )
            
        except Exception as e:
            logger.error(f"Error processing ESP8266 data: {str(e)}")
            raise

    def _notify_operators(self, incident, level):
        """Notify operators based on escalation level"""
        operators = Operator.objects.filter(priority=level, is_active=True)
        
        for operator in operators:
            try:
                # Create notification (implement your notification logic here)
                NotificationService().notify_operator(
                    operator=operator,
                    incident=incident,
                    message=f"Temperature alert - Level {level} escalation"
                )
                
                # Log notification in timeline
                IncidentTimelineEvent.objects.create(
                    incident=incident,
                    event_type='notification_sent',
                    description=f"Notification sent to {operator.name} (Level {level})",
                    operator=operator
                )
                
            except Exception as e:
                logger.error(f"Failed to notify operator {operator.id}: {str(e)}")

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

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export readings in CSV format."""
        try:
            # Get date range from query params
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            # Get readings
            readings = self.get_queryset().order_by('timestamp')
            if start_date and end_date:
                try:
                    readings = readings.filter(timestamp__range=[start_date, end_date])
                except Exception as e:
                    return Response(
                        {'error': 'Invalid date format. Please use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            if not readings.exists():
                return Response(
                    {'error': 'No readings found for the specified date range'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Create CSV response
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="temperature_readings.csv"'
            
            # Write CSV data
            writer = csv.writer(response)
            writer.writerow(['Timestamp (UTC)', 'Temperature (°C)', 'Humidity (%)', 'Device ID'])
            
            for reading in readings:
                writer.writerow([
                    reading.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                    f"{reading.temperature:.2f}",
                    f"{reading.humidity:.2f}",
                    reading.device_id
                ])
            
            return response
            
        except Exception as e:
            logger.error(f"Export error: {str(e)}")
            return Response(
                {'error': 'Failed to export readings'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AlertViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer

    @action(detail=False)
    def active(self, request):
        page = int(request.query_params.get('page', 1))
        limit = int(request.query_params.get('limit', 10))
        offset = (page - 1) * limit

        active_alerts = Alert.objects.filter(resolved=False)
        total = active_alerts.count()
        alerts = active_alerts[offset:offset + limit]
        
        serializer = self.get_serializer(alerts, many=True)
        return Response({
            'alerts': serializer.data,
            'total': total
        })

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
            if not hasattr(self.request.user, 'operator'):
                logger.error(f"User {self.request.user.email} does not have an associated operator record")
                raise PermissionDenied(
                    detail=f"User {self.request.user.email} is not an operator. Please contact an administrator."
                )
            return self.request.user.operator
        except Exception as e:
            logger.error(f"Error getting operator for user {self.request.user.email}: {str(e)}")
            raise PermissionDenied(
                detail=f"Error accessing operator record for {self.request.user.email}. Please contact an administrator."
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
                event_description = "Comment added"
                if serializer.validated_data.get('action_taken', False):
                    event_description += " (Action taken)"
                if serializer.validated_data.get('is_read', False):
                    event_description += " (Marked as read)"

                IncidentTimelineEvent.objects.create(
                    incident=incident,
                    event_type='comment_added',
                    description=f"{event_description} by {operator.name}",
                    operator=operator,
                    metadata={
                        'comment': serializer.validated_data['comment'],
                        'action_taken': serializer.validated_data.get('action_taken', False),
                        'is_read': serializer.validated_data.get('is_read', False)
                    }
                )

                # If action was taken or marked as read, update incident status
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
        try:
            incident = self.get_object()
            
            try:
                operator = self._get_operator_or_fail()
            except PermissionDenied as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if incident.status == 'resolved':
                return Response(
                    {'error': 'Cannot acknowledge resolved incident'},
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY
                )
            
            note = request.data.get('acknowledgment_note', '')
            
            with transaction.atomic():
                # Update incident status
                incident.status = 'acknowledged'
                incident.acknowledged_by = operator
                incident.acknowledged_at = timezone.now()
                incident.save()
                
                # Create comment
                IncidentComment.objects.create(
                    incident=incident,
                    operator=operator,
                    comment=f"Incident acknowledged: {note}",
                    action_taken=True
                )
                
                # Create timeline event
                IncidentTimelineEvent.objects.create(
                    incident=incident,
                    event_type='status_changed',
                    description=f"Incident acknowledged by {operator.name}",
                    operator=operator,
                    metadata={
                        'status': 'acknowledged',
                        'note': note,
                        'operator': operator.name
                    }
                )
                
                # Check if temperature is back to normal
                try:
                    latest_reading = incident.device.readings.order_by('-timestamp').first()
                    if latest_reading and 2 <= latest_reading.temperature <= 8:
                        # Temperature is back to normal, resolve the incident
                        incident.status = 'resolved'
                        incident.resolved_by = operator
                        incident.resolved_at = timezone.now()
                        incident.save()
                        
                        # Create resolution timeline event
                        IncidentTimelineEvent.objects.create(
                            incident=incident,
                            event_type='status_changed',
                            description=f"Incident automatically resolved - Temperature back to normal: {latest_reading.temperature}°C",
                            operator=operator,
                            metadata={
                                'status': 'resolved',
                                'temperature': latest_reading.temperature,
                                'operator': operator.name
                            }
                        )
                except Exception as e:
                    logger.error(f"Error checking temperature for auto-resolution: {str(e)}")
                    # Continue with acknowledgment even if temperature check fails
                
            return Response({
                'status': incident.status,
                'message': f'Incident {incident.status}',
                'acknowledged_by': operator.name,
                'acknowledged_at': incident.acknowledged_at
            })
            
        except Exception as e:
            logger.error(f"Error acknowledging incident: {str(e)}")
            return Response(
                {'error': f'Failed to acknowledge incident: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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

    def create(self, request, *args, **kwargs):
        try:
            # Create the incident first
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            incident = serializer.save()

            # Get the temperature from the alert's reading
            alert = incident.alert
            if alert and alert.reading:
                temperature = alert.reading.temperature
                severity = self._determine_severity(temperature)
                
                # Notify operators based on severity and escalation level
                if severity >= 3:  # Severe - notify all operators
                    self._notify_operators(incident, level=1)  # Primary
                    self._notify_operators(incident, level=2)  # Secondary
                    self._notify_operators(incident, level=3)  # Tertiary
                elif severity == 2:  # Critical - notify primary and secondary
                    self._notify_operators(incident, level=1)  # Primary
                    self._notify_operators(incident, level=2)  # Secondary
                else:  # Normal - notify only primary
                    self._notify_operators(incident, level=1)  # Primary

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def _determine_severity(self, temperature):
        settings = SystemSettings.get_settings()
        
        if temperature < 0 or temperature > 10:
            return 3  # Severe - outside safe range
        elif temperature < 2 or temperature > 8:
            return 2  # Critical - outside normal range
        else:
            return 1  # Normal range

    def _notify_operators(self, incident, level):
        """Notify operators based on escalation level"""
        operators = Operator.objects.filter(priority=level, is_active=True)
        notification_service = NotificationService()
        
        for operator in operators:
            try:
                # Create notification
                notification_service.notify_operator(
                    operator=operator,
                    incident=incident,
                    message=self._get_notification_message(incident, level)
                )
                
                # Log notification in timeline
                IncidentTimelineEvent.objects.create(
                    incident=incident,
                    event_type='notification_sent',
                    description=f"Notification sent to {operator.name} (Level {level})",
                    operator=operator
                )
                
            except Exception as e:
                logger.error(f"Failed to notify operator {operator.id}: {str(e)}")

    def _get_notification_message(self, incident, level):
        temperature = incident.alert.reading.temperature if incident.alert and incident.alert.reading else None
        severity_text = "SEVERE" if temperature and (temperature < 0 or temperature > 10) else \
                       "CRITICAL" if temperature and (temperature < 2 or temperature > 8) else \
                       "NORMAL"
        
        return f"""Temperature {severity_text} Alert
Temperature: {temperature}°C
Device: {incident.device.name}
Location: {incident.device.location}
Alert Count: {incident.alert_count}
Escalation Level: {level}"""

class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['put'])
    def status(self, request, pk=None):
        device = self.get_object()
        status = request.data.get('status')
        if status not in ['online', 'offline', 'warning', 'error']:
            return Response(
                {'error': 'Invalid status value'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        device.status = status
        device.save()
        
        return Response(self.get_serializer(device).data)

class ESPDataCollectionView(APIView):
    authentication_classes = []  # Allow unauthenticated access
    permission_classes = []  # Allow unauthenticated access
    
    def post(self, request):
        """
        Endpoint for ESP8266 to post temperature and humidity readings
        Expected format:
        {
            "device_id": "ESP8266_1",
            "temperature": 23.5,
            "humidity": 45.0,
            "power_status": "AC",
            "battery_level": 100
        }
        """
        try:
            # Validate required fields
            required_fields = ['device_id', 'temperature', 'humidity']
            for field in required_fields:
                if field not in request.data:
                    return Response(
                        {'error': f'Missing required field: {field}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Get or create device
            device, _ = Device.objects.get_or_create(
                device_id=request.data['device_id'],
                defaults={
                    'name': f'ESP8266 Sensor {request.data["device_id"]}',
                    'location': 'Default Location'
                }
            )
            
            # Update device status
            device.status = 'online'
            device.last_reading = timezone.now()
            device.save()
            
            # Create reading
            serializer = ReadingSerializer(data={
                'device_id': request.data['device_id'],
                'temperature': request.data['temperature'],
                'humidity': request.data['humidity'],
                'power_status': request.data.get('power_status', 'AC'),
                'battery_level': request.data.get('battery_level', 100)
            })
            
            if serializer.is_valid():
                reading = serializer.save()
                
                # Check temperature limits and create alerts if needed
                self._check_temperature(reading)
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error processing ESP8266 data: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _check_temperature(self, reading):
        """
        Check temperature against thresholds and create alerts if needed:
        - Normal: 2°C to 8°C
        - Critical: 0°C to 2°C or 8°C to 10°C
        - Severe: Outside these ranges
        """
        try:
            temperature = reading.temperature
            
            # Define temperature ranges
            NORMAL_MIN, NORMAL_MAX = 2.0, 8.0
            CRITICAL_MIN, CRITICAL_MAX = 0.0, 10.0
            
            # Get or create device
            device, created = Device.objects.get_or_create(
                device_id=reading.device_id,
                defaults={
                    'name': f'Device {reading.device_id}',
                    'location': 'Unknown',
                    'status': 'online'
                }
            )
            
            # Update device status and last reading
            device.status = 'online'
            device.last_reading = timezone.now()
            device.save()
            
            # Determine alert type and severity
            if NORMAL_MIN <= temperature <= NORMAL_MAX:
                # Temperature is normal, resolve any active incidents
                active_incidents = Incident.objects.filter(
                    device=device,
                    status__in=['open', 'acknowledged', 'investigating']
                )
                
                for incident in active_incidents:
                    incident.status = 'resolved'
                    incident.end_time = timezone.now()
                    incident.save()
                    
                    IncidentTimelineEvent.objects.create(
                        incident=incident,
                        event_type='status_changed',
                        description=f"Temperature returned to normal range: {temperature}°C",
                        temperature=temperature
                    )
                
                return  # No need to create alert for normal temperature
            
            # Temperature is outside normal range
            severity = 'critical' if CRITICAL_MIN <= temperature <= CRITICAL_MAX else 'severe'
            alert_type = 'high_temperature' if temperature > NORMAL_MAX else 'low_temperature'
            
            # Create alert with transaction to ensure it's created successfully
            with transaction.atomic():
                # Create alert
                alert = Alert.objects.create(
                    device=device,
                    reading=reading,
                    alert_type=alert_type,
                    severity=severity,
                    message=f"Temperature {alert_type.replace('_', ' ')}: {temperature}°C"
                )
                
                # Save the alert to ensure it has an ID
                alert.save()
                
                # Get or create incident
                active_incident = Incident.objects.filter(
                    device=device,
                    status__in=['open', 'acknowledged', 'investigating']
                ).first()
                
                if active_incident:
                    # Update existing incident
                    active_incident.alert_count += 1
                    active_incident.save()
                    
                    # Check for escalation
                    if active_incident.alert_count == 4:
                        active_incident.current_escalation_level = 2
                        self._notify_operators(active_incident, level=2)
                    elif active_incident.alert_count == 7:
                        active_incident.current_escalation_level = 3
                        self._notify_operators(active_incident, level=3)
                else:
                    # Create new incident
                    incident = Incident.objects.create(
                        device=device,
                        alert=alert,  # Now we're sure the alert exists and has an ID
                        description=f"Temperature {alert_type.replace('_', ' ')} incident",
                        status='open',
                        current_escalation_level=1
                    )
                    
                    # Notify primary operators
                    self._notify_operators(incident, level=1)
                    
                    # Create initial timeline event
                    IncidentTimelineEvent.objects.create(
                        incident=incident,
                        event_type='alert_created',
                        description=f"Initial alert: Temperature {alert_type.replace('_', ' ')} ({temperature}°C)",
                        temperature=temperature
                    )
            
        except Exception as e:
            logger.error(f"Error processing ESP8266 data: {str(e)}")
            raise

    def _notify_operators(self, incident, level):
        """Notify operators based on escalation level"""
        operators = Operator.objects.filter(priority=level, is_active=True)
        
        for operator in operators:
            try:
                # Create notification (implement your notification logic here)
                NotificationService().notify_operator(
                    operator=operator,
                    incident=incident,
                    message=f"Temperature alert - Level {level} escalation"
                )
                
                # Log notification in timeline
                IncidentTimelineEvent.objects.create(
                    incident=incident,
                    event_type='notification_sent',
                    description=f"Notification sent to {operator.name} (Level {level})",
                    operator=operator
                )
                
            except Exception as e:
                logger.error(f"Failed to notify operator {operator.id}: {str(e)}")

    def _determine_severity(self, temperature):
        settings = SystemSettings.get_settings()
        
        if temperature < settings.critical_temp_min or temperature > settings.critical_temp_max:
            return 3  # High severity for severe temperatures
        elif (settings.critical_temp_min <= temperature < settings.normal_temp_min or 
              settings.normal_temp_max < temperature <= settings.critical_temp_max):
            return 2  # Medium severity for critical temperatures
        else:
            return 1  # Low severity for normal range (shouldn't typically occur)

class TemperatureStatsView(APIView):
    def get(self, request):
        period = request.query_params.get('period', '24h')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        device_id = request.query_params.get('device_id')
        
        # Get current time as reference point instead of latest reading
        reference_time = timezone.now()
        
        if start_date and end_date:
            try:
                start_time = timezone.datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                end_time = timezone.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use ISO format (YYYY-MM-DDTHH:mm:ss)'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            if period == '24h':
                start_time = reference_time - timedelta(hours=24)
            elif period == '7d':
                start_time = reference_time - timedelta(days=7)
            elif period == '30d':
                start_time = reference_time - timedelta(days=30)
            else:
                return Response(
                    {'error': 'Invalid period. Must be 24h, 7d, or 30d'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            end_time = reference_time

        # Get readings for the period, order by timestamp ascending
        readings = Reading.objects.filter(
            timestamp__gte=start_time,
            timestamp__lte=end_time
        )

        # Filter by device_id if provided
        if device_id:
            readings = readings.filter(device_id=device_id)

        readings = readings.order_by('timestamp')  # Changed to ascending order

        if not readings.exists():
            return Response({
                'readings': [],
                'average_temperature': 0,
                'max_temperature': 0,
                'min_temperature': 0
            })

        # Calculate statistics
        stats = readings.aggregate(
            avg_temp=Avg('temperature'),
            max_temp=Max('temperature'),
            min_temp=Min('temperature')
        )

        # Serialize the readings
        serializer = ReadingSerializer(readings, many=True)

        return Response({
            'readings': serializer.data,
            'average_temperature': round(stats['avg_temp'], 2) if stats['avg_temp'] else 0,
            'max_temperature': round(stats['max_temp'], 2) if stats['max_temp'] else 0,
            'min_temperature': round(stats['min_temp'], 2) if stats['min_temp'] else 0
        })

class ReadingExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # Get parameters from query params
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            device_id = request.query_params.get('device_id')
            export_format = request.query_params.get('format', 'csv').lower()

            if not start_date or not end_date:
                return Response(
                    {'error': 'Both start_date and end_date are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                start_time = timezone.datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                end_time = timezone.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use ISO format (YYYY-MM-DDTHH:mm:ss)'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Base queryset
            queryset = Reading.objects.all().order_by('timestamp')

            # Apply filters
            queryset = queryset.filter(timestamp__gte=start_time, timestamp__lte=end_time)
            if device_id:
                queryset = queryset.filter(device_id=device_id)

            if export_format == 'csv':
                return self._export_csv(queryset)
            elif export_format == 'json':
                return self._export_json(queryset)
            elif export_format == 'pdf':
                return self._export_pdf(queryset)
            else:
                return Response(
                    {'error': 'Invalid export format. Must be csv, json, or pdf'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except ValueError as e:
            return Response(
                {'error': f'Invalid date format: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Export failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _export_csv(self, queryset):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="temperature_readings.csv"'

        writer = csv.writer(response)
        writer.writerow(['Timestamp', 'Device ID', 'Temperature (°C)', 'Humidity (%)', 
                        'Power Status', 'Battery Level (%)', 'Alert Status'])

        for reading in queryset:
            alert = reading.alert_set.first()
            alert_status = alert.get_type_display() if alert else 'Normal'
            
            writer.writerow([
                reading.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                reading.device_id,
                reading.temperature,
                reading.humidity,
                'Powered' if reading.power_status else 'Battery',
                reading.battery_level,
                alert_status
            ])

        return response

    def _export_json(self, queryset):
        data = []
        for reading in queryset:
            alert = reading.alert_set.first()
            alert_status = alert.get_type_display() if alert else 'Normal'
            
            data.append({
                'timestamp': reading.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'device_id': reading.device_id,
                'temperature': reading.temperature,
                'humidity': reading.humidity,
                'power_status': 'Powered' if reading.power_status else 'Battery',
                'battery_level': reading.battery_level,
                'alert_status': alert_status
            })

        response = HttpResponse(
            content=json.dumps(data, indent=2),
            content_type='application/json'
        )
        response['Content-Disposition'] = 'attachment; filename="temperature_readings.json"'
        return response

    def _export_pdf(self, queryset):
        # Create a file-like buffer to receive PDF data
        buffer = io.BytesIO()

        # Create the PDF object using the buffer as its "file"
        p = canvas.Canvas(buffer)

        # Write the header
        y = 800  # Starting y position
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, y, "Temperature Readings Report")
        y -= 20

        # Add timestamp of report generation
        p.setFont("Helvetica", 10)
        p.drawString(100, y, f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")
        y -= 20
        p.drawString(100, y, "=" * 50)
        y -= 30

        # Set font for data
        p.setFont("Helvetica", 10)

        for reading in queryset:
            if y < 50:  # Start a new page if we're near the bottom
                p.showPage()
                y = 800
                p.setFont("Helvetica", 10)

            alert = reading.alert_set.first()
            alert_status = alert.get_type_display() if alert else 'Normal'
            
            p.drawString(100, y, f"Timestamp: {reading.timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
            y -= 15
            p.drawString(100, y, f"Device ID: {reading.device_id}")
            y -= 15
            p.drawString(100, y, f"Temperature: {reading.temperature}°C")
            y -= 15
            p.drawString(100, y, f"Humidity: {reading.humidity}%")
            y -= 15
            p.drawString(100, y, f"Power Status: {'Powered' if reading.power_status else 'Battery'}")
            y -= 15
            p.drawString(100, y, f"Battery Level: {reading.battery_level}%")
            y -= 15
            p.drawString(100, y, f"Alert Status: {alert_status}")
            y -= 30

        # Save the PDF
        p.showPage()
        p.save()

        # Get the value of the BytesIO buffer and write it to the response
        pdf = buffer.getvalue()
        buffer.close()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="temperature_readings.pdf"'
        response.write(pdf)
        return response