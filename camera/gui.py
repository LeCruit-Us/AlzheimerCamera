import cv2
import requests
import base64
import json
import time

url = "http://127.0.0.1:5000/upload"

# Try different camera indices
camera_found = False
for camera_id in [0, 1, 2, 3]:
    cap = cv2.VideoCapture(camera_id)
    if cap.isOpened():
        print(f"Using camera {camera_id}")
        camera_found = True
        break
    cap.release()

if not camera_found:
    print("Error: Could not open any webcam")
    exit()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Convert raw frame directly to base64 (much faster)
    frame_bytes = frame.tobytes()
    frame_b64 = base64.b64encode(frame_bytes).decode('utf-8')

    # Build JSON payload with raw frame data
    payload = json.dumps({"frame": frame_b64, "shape": frame.shape})

    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, data=payload, headers=headers, timeout=1)
        if response.status_code == 200:
            print("✓ Frame sent successfully")
        else:
            print(f"✗ Server error: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to server - is ex_backend.py running?")
    except Exception as e:
        print(f"✗ Error sending frame: {e}")

    # No delay - send as fast as possible
    pass

cap.release()