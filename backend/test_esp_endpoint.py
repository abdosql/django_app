import requests
import json
import time
from datetime import datetime

def send_reading(temperature, humidity, device_id="ESP8266_TEST", power_status="AC", battery_level=100):
    """Send a reading to the ESP8266 endpoint"""
    url = "http://localhost:8000/api/monitoring/esp/reading/"
    data = {
        "device_id": device_id,
        "temperature": temperature,
        "humidity": humidity,
        "power_status": power_status,
        "battery_level": battery_level
    }
    headers = {
        "Content-Type": "application/json"
    }
    response = requests.post(url, json=data, headers=headers)
    print(f"\nSent reading: {json.dumps(data, indent=2)}")
    print(f"Response status: {response.status_code}")
    print(f"Response body: {json.dumps(response.json(), indent=2)}")
    return response

def test_normal_temperature():
    """Test reading within normal range (2-8°C)"""
    print("\nTesting normal temperature range...")
    response = send_reading(temperature=5.0, humidity=45.0)
    assert response.status_code == 201
    time.sleep(2)  # Wait for notifications to be processed

def test_critical_temperature():
    """Test reading in critical range (0-2°C or 8-10°C)"""
    print("\nTesting critical temperature range...")
    response = send_reading(temperature=9.5, humidity=45.0)
    assert response.status_code == 201
    time.sleep(2)  # Wait for notifications to be processed

def test_severe_temperature():
    """Test reading in severe range (< 0°C or > 10°C)"""
    print("\nTesting severe temperature range...")
    response = send_reading(temperature=11.0, humidity=45.0)
    assert response.status_code == 201
    time.sleep(2)  # Wait for notifications to be processed

def test_temperature_recovery():
    """Test temperature returning to normal after being critical"""
    print("\nTesting temperature recovery...")
    response = send_reading(temperature=5.0, humidity=45.0)
    assert response.status_code == 201
    time.sleep(2)  # Wait for notifications to be processed

def test_power_status_change():
    """Test power status change notification"""
    print("\nTesting power status change...")
    response = send_reading(temperature=5.0, humidity=45.0, power_status="BATTERY")
    assert response.status_code == 201
    time.sleep(2)  # Wait for notifications to be processed

def test_escalation():
    """Test alert escalation after multiple critical readings"""
    print("\nTesting alert escalation...")
    # Send 5 critical readings to trigger escalation
    for i in range(5):
        print(f"\nSending critical reading {i+1}/5...")
        response = send_reading(temperature=9.5, humidity=45.0)
        assert response.status_code == 201
        time.sleep(5)  # Wait between readings

def run_all_tests():
    """Run all test cases"""
    print("\nStarting ESP8266 endpoint tests at", datetime.now())
    
    try:
        test_normal_temperature()
        test_critical_temperature()
        test_severe_temperature()
        test_temperature_recovery()
        test_power_status_change()
        test_escalation()
        print("\nAll tests completed successfully!")
    except AssertionError as e:
        print(f"\nTest failed: {str(e)}")
    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")

if __name__ == "__main__":
    run_all_tests() 