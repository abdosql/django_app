from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Reading, Alert

class ReadingTests(APITestCase):
    def test_create_reading_with_high_temperature(self):
        data = {
            "temperature": 9.5,
            "humidity": 45.0,
            "power_status": True,
            "battery_power": False
        }
        response = self.client.post('/api/readings/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Reading.objects.count(), 1)
        self.assertEqual(Alert.objects.count(), 1)

    def test_create_reading_with_power_outage(self):
        data = {
            "temperature": 5.0,
            "humidity": 45.0,
            "power_status": False,
            "battery_power": True
        }
        response = self.client.post('/api/readings/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Alert.objects.count(), 1)
        alert = Alert.objects.first()
        self.assertEqual(alert.type, Alert.AlertType.POWER) 