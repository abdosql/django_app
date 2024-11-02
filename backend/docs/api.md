# Temperature Monitoring System API Documentation

## Base URL
`/api/`

## Authentication

### Token Generation
- **Endpoint**: `/api/token/`
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
- **Endpoint**: `/api/token/refresh/`
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
    "battery_power": false
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
- **Endpoint**: `/api/users/`
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
- **Endpoint**: `/api/users/{id}/`
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
    "phone": "+1234567890",
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