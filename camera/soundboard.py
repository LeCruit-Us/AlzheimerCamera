import sounddevice as sd
import numpy as np
import requests
import base64
import json
import time

url = "http://127.0.0.1:5000/audio"

duration = 3  # seconds per chunk
samplerate = 44100

while True:
    # record audio chunk
    recording = sd.rec(int(duration * samplerate), samplerate=samplerate, channels=1, dtype='int16', device=3)
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
        print("Audio sent:", r.status_code)
    except Exception as e:
        print("Error:", e)

    time.sleep(1)
