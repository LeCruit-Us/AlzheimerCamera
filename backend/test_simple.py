import requests
import json

# Test backend connectivity
BASE_URL = "http://localhost:8000"

def test_health():
    try:
        response = requests.get(f"{BASE_URL}/health")
        print("Health check:", response.json())
        return True
    except Exception as e:
        print("Backend not running:", e)
        return False

def test_reminders():
    try:
        response = requests.get(f"{BASE_URL}/reminders")
        print("Reminders:", response.json())
    except Exception as e:
        print("Reminders error:", e)

if __name__ == "__main__":
    if test_health():
        test_reminders()
    else:
        print("Start backend first: python3 app.py")