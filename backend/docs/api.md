# Temperature Monitoring System API Documentation

## Base URL
`/api/`

## Authentication

### Token Generation
- **Endpoint**: `/api/auth/token/`
- **Method**: `POST`
- **Description**: Obtain JWT token pair for authentication
- **Request Body**:
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```
- **Response**:
```json
{
    "access": "jwt_access_token",
    "refresh": "jwt_refresh_token",
    "user_id": 1,
    "email": "user@example.com",
    "is_staff": false,
    "operator_id": 1,        // if user is operator
    "operator_priority": 1   // if user is operator
}
```

### Token Refresh
- **Endpoint**: `/api/auth/token/refresh/`
- **Method**: `POST`
- **Description**: Refresh JWT access token
- **Request Body**:
```json
{
    "refresh": "jwt_refresh_token"
}
```
- **Response**:
```json
{
    "access": "new_jwt_access_token"
}
```

## Monitoring Endpoints

### Readings
#### List/Create Readings
- **Endpoint**: `/api/readings/`
- **Methods**: `GET`, `POST`
- **Authentication**: Required
- **POST Request Body**:
```json
{
    "temperature": 5.5,
    "humidity": 45.0,
    "power_status": true,
    "battery_level": 85.5
}
```

#### Get Single Reading
- **Endpoint**: `/api/readings/{id}/`
- **Methods**: `GET`
- **Authentication**: Required

### Alerts
#### List Alerts
- **Endpoint**: `/api/alerts/`
- **Method**: `GET`
- **Authentication**: Required

#### Get Active Alerts
- **Endpoint**: `/api/alerts/active/`
- **Method**: `GET`
- **Authentication**: Required

#### Resolve Alert
- **Endpoint**: `/api/alerts/{id}/resolve/`
- **Method**: `POST`
- **Authentication**: Required

### System Settings
#### Get/Update Settings
- **Endpoint**: `/api/settings/`
- **Methods**: `GET`, `PUT`, `PATCH`
- **Authentication**: Admin only
- **Request Body Example**:
```json
{
    "normal_temp_min": 2.0,
    "normal_temp_max": 8.0,
    "critical_temp_min": 0.0,
    "critical_temp_max": 10.0,
    "reading_interval": 20,
    "alert_reset_time": 30,
    "require_2fa": true
}
```

## User Management

### Users
#### List/Create Users
- **Endpoint**: `/api/auth/users/`
- **Methods**: `GET`, `POST`
- **Authentication**: Admin only
- **POST Request Body**:
```json
{
    "email": "user@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe",
    "is_operator": true
}
```

#### User Detail
- **Endpoint**: `/api/auth/users/{id}/`
- **Methods**: `GET`, `PUT`, `PATCH`, `DELETE`
- **Authentication**: Admin only

### Operators
#### List/Create Operators
- **Endpoint**: `/api/operators/`
- **Methods**: `GET`, `POST`
- **Authentication**: 
  - GET: Authenticated users
  - POST: Admin only
- **POST Request Body**:
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secure_password",
    "telegram_id": "telegram123",
    "is_active": true,
    "priority": 1,
    "notification_preferences": {
        "email_enabled": true,
        "telegram_enabled": true,
        "phone_enabled": false
    }
}
```
### Notifications
#### List Notifications
- **Endpoint**: `/api/notifications/`
- **Method**: `GET`
- **Authentication**: Required
- **Response Example**:
```json
[
    {
        "id": 1,
        "operator": {
            "id": 1,
            "name": "John Doe",
            "priority": "Primary"
        },
        "alert": {
            "id": 1,
            "type": "TEMP_HIGH",
            "severity": "High",
            "message": "Temperature exceeded critical threshold"
        },
        "status": "SENT",
        "sent_at": "2024-11-04T14:30:00Z",
        "read_at": null,
        "retry_count": 0,
        "created_at": "2024-11-04T14:30:00Z",
        "updated_at": "2024-11-04T14:30:00Z"
    }
]
```

#### Mark Notification as Read
- **Endpoint**: `/api/notifications/{id}/read/`
- **Method**: `POST`
- **Authentication**: Required (Operator owner or Admin)
- **Response**:
```json
{
    "status": "notification marked as read"
}
```

#### Get Unread Notifications Count
- **Endpoint**: `/api/notifications/unread_count/`
- **Method**: `GET`
- **Authentication**: Required
- **Response**:
```json
{
    "count": 5
}
```

#### Get Notifications by Status
- **Endpoint**: `/api/notifications/by_status/`
- **Method**: `GET`
- **Parameters**: 
  - `status`: One of ['PENDING', 'SENT', 'FAILED', 'READ']
- **Authentication**: Required
- **Response**: Same as List Notifications

### Alert Notifications Process
When an alert is created (based on readings), the system will:
1. Create notifications for relevant operators based on alert severity:
   - High (3): All operators
   - Medium (2): Primary and secondary operators
   - Low (1): Only primary operators
2. Store notifications in the database with initial status 'PENDING'
3. Attempt to send notifications through configured channels (email, telegram)
4. Update notification status based on delivery result

### Notification Statuses
- `PENDING`: Initial state, notification created but not yet processed
- `SENT`: Successfully delivered through at least one channel
- `FAILED`: Failed to deliver through any channel
- `READ`: Operator has marked the notification as read


#### Operator Actions

##### Test Notification
- **Endpoint**: `/api/operators/{id}/test_notification/`
- **Method**: `POST`
- **Authentication**: Admin or operator owner
- **Request Body**:
```json
{
    "message": "Test notification message"
}
```

##### Broadcast Message
- **Endpoint**: `/api/operators/broadcast/`
- **Method**: `POST`
- **Authentication**: Admin only
- **Request Body**:
```json
{
    "message": "Broadcast message",
    "priority": 1  // Optional
}
```

##### Reset Alerts
- **Endpoint**: `/api/operators/{id}/reset_alerts/`
- **Method**: `POST`
- **Authentication**: Admin or operator owner

##### Reset All Alerts
- **Endpoint**: `/api/operators/reset_all_alerts/`
- **Method**: `POST`
- **Authentication**: Admin only

##### Update Notification Threshold
- **Endpoint**: `/api/operators/{id}/update_threshold/`
- **Method**: `PATCH`
- **Authentication**: Admin or operator owner
- **Request Body**:
```json
{
    "notification_threshold": 1  // 1, 4, or 7
}
```

## Incident Management

### Incidents
#### List Incidents
- **Endpoint**: `/api/incidents/`
- **Method**: `GET`
- **Authentication**: Required
- **Query Parameters**:
  - `status`: Filter by status (active/acknowledged/resolved/closed)
  - `start_date`: Filter from date (YYYY-MM-DD)
  - `end_date`: Filter to date (YYYY-MM-DD)
- **Response Example**:
```json
[
    {
        "id": 1,
        "start_time": "2024-03-20T14:30:00Z",
        "end_time": null,
        "status": "active",
        "alert_count": 3,
        "current_escalation_level": 1,
        "comments": [
            {
                "id": 1,
                "comment": "Investigating temperature increase",
                "action_taken": true,
                "timestamp": "2024-03-20T14:35:00Z",
                "operator_name": "John Doe",
                "operator_priority": 1
            }
        ],
        "timeline_events": [
            {
                "timestamp": "2024-03-20T14:30:00Z",
                "event_type": "alert_created",
                "description": "Temperature exceeded normal range",
                "temperature": 8.5,
                "operator_name": null,
                "metadata": {}
            }
        ],
        "temperature_readings": [
            {
                "id": 1,
                "device_id": "FRIDGE_01",
                "temperature": 8.5,
                "humidity": 45.0,
                "power_status": true,
                "battery_level": 85,
                "timestamp": "2024-03-20T14:30:00Z"
            }
        ]
    }
]
```

#### Get Incident Comments
- **Endpoint**: `/api/incidents/{id}/comments/`
- **Method**: `GET`
- **Authentication**: Required
- **Response Example**:
```json
[
    {
        "id": 1,
        "comment": "Investigating temperature increase",
        "action_taken": true,
        "timestamp": "2024-03-20T14:35:00Z",
        "operator_name": "John Doe",
        "operator_priority": 1
    }
]
```

#### Add Comment to Incident
- **Endpoint**: `/api/incidents/{id}/add_comment/`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
```json
{
    "comment": "Taking action to address temperature issue",
    "action_taken": true
}
```
- **Response**: Returns the created comment with operator information
```json
{
    "id": 2,
    "comment": "Taking action to address temperature issue",
    "action_taken": true,
    "timestamp": "2024-03-20T14:40:00Z",
    "operator_name": "John Doe",
    "operator_priority": 1
}
```
- **Notes**: 
  - If `action_taken` is true, incident status will be updated to "acknowledged"
  - Creates timeline events for both comment and action taken
  - All changes are atomic (transaction-protected)

#### Acknowledge Incident
- **Endpoint**: `/api/incidents/{id}/acknowledge/`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
```json
{
    "acknowledgment_note": "Issue being investigated"
}
```
- **Response**:
```json
{
    "status": "incident acknowledged"
}
```
- **Error Responses**:
  - 422 Unprocessable Entity if incident is already resolved
```json
{
    "detail": "Cannot acknowledge resolved incident"
}
```

#### Get Incident Timeline
- **Endpoint**: `/api/incidents/{id}/timeline/`
- **Method**: `GET`
- **Authentication**: Required
- **Response Example**:
```json
[
    {
        "timestamp": "2024-03-20T14:30:00Z",
        "event_type": "alert_created",
        "description": "Temperature exceeded normal range",
        "temperature": 8.5,
        "operator_name": null,
        "metadata": {}
    },
    {
        "timestamp": "2024-03-20T14:35:00Z",
        "event_type": "comment_added",
        "description": "Comment added by John Doe",
        "temperature": null,
        "operator_name": "John Doe",
        "metadata": {
            "comment": "Investigating temperature increase",
            "action_taken": true
        }
    },
    {
        "timestamp": "2024-03-20T14:35:00Z",
        "event_type": "status_changed",
        "description": "Action taken by John Doe",
        "temperature": null,
        "operator_name": "John Doe",
        "metadata": {
            "action": "acknowledged"
        }
    }
]
```

#### Generate Incident Report
- **Endpoint**: `/api/incidents/{id}/report/`
- **Method**: `GET`
- **Authentication**: Required
- **Query Parameters**:
  - `format`: json/pdf/csv (currently only json is implemented)
- **Response**: 
  - For JSON format: Complete incident details including comments, timeline, and readings
  - For PDF/CSV: Currently returns 501 Not Implemented
- **Error Response**:
```json
{
    "detail": "PDF report generation not implemented"
}
```

### Alert Escalation
#### Get Current Escalation Status
- **Endpoint**: `/api/alerts/{id}/escalation/`
- **Method**: `GET`
- **Authentication**: Required
- **Response Example**:
```json
{
    "alert_id": 1,
    "consecutive_alerts": 5,
    "escalation_level": 2,
    "notified_operators": [
        {
            "id": 1,
            "name": "Primary Operator",
            "priority": 1
        },
        {
            "id": 2,
            "name": "Secondary Operator",
            "priority": 2
        }
    ],
    "next_escalation": {
        "threshold": 7,
        "operators": [
            {
                "id": 3,
                "name": "Tertiary Operator",
                "priority": 3
            }
        ]
    }
}
```

### Temperature Analysis
#### Get Temperature Statistics
- **Endpoint**: `/api/temperature/stats/`
- **Method**: `GET`
- **Authentication**: Required
- **Query Parameters**:
  - `period`: daily/weekly/monthly
  - `start_date`: YYYY-MM-DD
  - `end_date`: YYYY-MM-DD
- **Response Example**:
```json
{
    "period": "daily",
    "statistics": [
        {
            "date": "2024-03-20",
            "min_temperature": 2.5,
            "max_temperature": 7.8,
            "average_temperature": 5.2,
            "alert_count": 3
        }
    ]
}
```

### Device Management
#### Register Device
- **Endpoint**: `/api/devices/`
- **Method**: `POST`
- **Authentication**: Admin only
- **Request Body**:
```json
{
    "device_id": "FRIDGE_01",
    "name": "Laboratory Fridge 1",
    "location": "Lab Room 101",
    "reading_interval": 20  // in minutes
}
```

#### Get Device Status
- **Endpoint**: `/api/devices/{device_id}/status/`
- **Method**: `GET`
- **Authentication**: Required
- **Response Example**:
```json
{
    "device_id": "FRIDGE_01",
    "name": "Laboratory Fridge 1",
    "last_reading": {
        "temperature": 5.2,
        "humidity": 45.0,
        "timestamp": "2024-03-20T14:30:00Z",
        "power_status": true,
        "battery_level": 85
    },
    "status": "normal",  // normal, warning, critical
    "last_communication": "2024-03-20T14:30:00Z",
    "active_incidents": 0
}
```

### Monitoring Configuration
#### Update Temperature Thresholds
- **Endpoint**: `/api/settings/temperature-thresholds/`
- **Method**: `PUT`
- **Authentication**: Admin only
- **Request Body**:
```json
{
    "normal_range": {
        "min": 2.0,
        "max": 8.0
    },
    "critical_range": {
        "min": 0.0,
        "max": 10.0
    }
}
```

#### Update Reading Interval
- **Endpoint**: `/api/settings/reading-interval/`
- **Method**: `PUT`
- **Authentication**: Admin only
- **Request Body**:
```json
{
    "interval": 20,  // minutes
    "device_id": "FRIDGE_01"  // optional, applies to all devices if not specified
}
```

## Error Responses
All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
    "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
    "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
    "detail": "Not found."
}
```

### 400 Bad Request
```json
{
    "field_name": [
        "Error message"
    ]
}
```

### 409 Conflict (for Escalation)
```json
{
    "detail": "Alert escalation already in progress",
    "current_level": 2,
    "started_at": "2024-03-20T14:30:00Z"
}
```

### 422 Unprocessable Entity
```json
{
    "detail": "Cannot acknowledge resolved incident"
}
```

## Notes
1. All requests must include the JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

2. Temperature thresholds:
   - Normal range: 2°C to 8°C
   - Critical range: 0°C to 10°C

3. Alert severities:
   - High (3): All operators notified
   - Medium (2): Primary and secondary operators notified
   - Low (1): Only primary operators notified

4. Operator priorities:
   - Primary (1)
   - Secondary (2)
   - Tertiary (3)

5. Alert Escalation Process
   - First alert: Primary operator notified
   - After 4 consecutive alerts: Secondary operator also notified
   - After 7 consecutive alerts: Tertiary operator also notified
   - Temperature returns to normal: Escalation resets

6. Incident States
   - `active`: Ongoing temperature issue
   - `acknowledged`: Operator has acknowledged the incident
   - `resolved`: Temperature returned to normal
   - `closed`: Incident manually closed with resolution notes

7. Operator Response Requirements
   - Primary operators must acknowledge alerts within 15 minutes
   - Secondary operators must acknowledge alerts within 30 minutes
   - Tertiary operators must acknowledge alerts within 1 hour

8. Report Types
   - Incident Summary Report
     - Timeline of events
     - Temperature graph
     - Operator responses
     - Resolution notes

   - Daily/Weekly/Monthly Reports
     - Temperature trends
     - Alert statistics
     - Response times
     - Compliance metrics

9. Reading Intervals
   - Default interval: 20 minutes
   - Minimum interval: 1 minute
   - Maximum interval: 60 minutes

10. Temperature Classifications
    - Normal: 2°C to 8°C
    - Critical: 0°C to 2°C or 8°C to 10°C
    - Severe: < 0°C or > 10°C

11. Device Requirements
    - Must report temperature every 20 minutes
    - Must include humidity readings
    - Must report power status and battery level
    - Should maintain connection status

12. Alert Response Times
    - Primary operator: 15 minutes
    - Secondary operator: 30 minutes
    - Tertiary operator: 60 minutes