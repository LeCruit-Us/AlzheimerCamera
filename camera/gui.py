import cv2
import requests
import base64
import json
import time

url = "http://your-server.com/upload"

cap = cv2.VideoCapture(2)

if not cap.isOpened():
    print("Error: Could not open webcam")
    exit()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Encode frame to JPEG
    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])

    # Convert to base64 string
    jpg_as_text = base64.b64encode(buffer).decode('utf-8')

    # Build JSON payload
    payload = json.dumps({"frame": jpg_as_text})

    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, data=payload, headers=headers, timeout=5)
        print("Server response:", response.status_code)
    except Exception as e:
        print("Error sending frame:", e)

    # Send frame every 3 seconds
    time.sleep(3)

cap.release()
