from flask import Flask, Response, request
import base64, cv2, numpy as np
import wave
import io

app = Flask(__name__)

latest_frame = None   # global video frame
latest_audio = None   # global audio chunk

@app.route('/upload', methods=['POST'])
def upload():
    global latest_frame
    data = request.get_json()
    if not data or "frame" not in data:
        return "No frame provided", 400
    
    # decode base64 → numpy → OpenCV image
    jpg_original = base64.b64decode(data["frame"])
    np_arr = np.frombuffer(jpg_original, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    latest_frame = img
    cv2.imwrite("received_frame.jpg", img)  # optional

    return "Frame received", 200


@app.route('/audio', methods=['POST'])
def audio():
    global latest_audio
    data = request.get_json()
    if not data or "audio" not in data:
        return "No audio provided", 400

    # decode base64 → raw PCM bytes
    audio_bytes = base64.b64decode(data["audio"])
    samplerate = data.get("samplerate", 44100)
    channels = data.get("channels", 1)

    # store most recent audio
    latest_audio = (audio_bytes, samplerate, channels)

    # optionally save to .wav for testing
    with wave.open("received_audio.wav", "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(2)  # int16 = 2 bytes
        wf.setframerate(samplerate)
        wf.writeframes(audio_bytes)

    return "Audio received", 200


def generate_mjpeg():
    global latest_frame
    while True:
        if latest_frame is not None:
            ret, jpeg = cv2.imencode('.jpg', latest_frame)
            if ret:
                frame = jpeg.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        import time; time.sleep(0.1)


@app.route('/stream')
def stream():
    return Response(generate_mjpeg(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
