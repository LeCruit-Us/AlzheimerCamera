import sounddevice as sd
import numpy as np
import requests
import base64
import json
import time

url = "http://127.0.0.1:5000/audio"

duration = 3  # seconds per chunk
samplerate = 44100

# List available audio devices
print("Available audio devices:")
print(sd.query_devices())

# Try to find a working input device
try:
    device_info = sd.query_devices(kind='input')
    device_id = device_info['index'] if isinstance(device_info, dict) else 0
    print(f"Using audio device: {device_id}")
except Exception as e:
    print(f"Audio device error: {e}")
    device_id = None

while True:
    try:
        # record audio chunk
        recording = sd.rec(int(duration * samplerate), samplerate=samplerate, channels=1, dtype='int16', device=device_id)
        sd.wait()

        # convert to bytes
        audio_bytes = recording.tobytes()

        # base64 encode
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')

        payload = json.dumps({
            "samplerate": samplerate,
            "channels": 1,
            "audio": audio_b64
        })

        headers = {"Content-Type": "application/json"}
        try:
            r = requests.post(url, data=payload, headers=headers, timeout=5)
            if r.status_code == 200:
                print("✓ Audio sent successfully")
            else:
                print(f"✗ Server error: {r.status_code}")
        except requests.exceptions.ConnectionError:
            print("✗ Cannot connect to server")
        except Exception as e:
            print(f"✗ Network error: {e}")

    except Exception as e:
        print(f"✗ Audio recording error: {e}")
        
    pass  # No delay
