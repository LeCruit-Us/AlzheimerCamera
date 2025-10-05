from flask import Flask, Response, request
import base64, cv2, numpy as np

app = Flask(__name__)

latest_frame = None  # global variable to store last uploaded frame

@app.route('/upload', methods=['POST'])
def upload():
    global latest_frame
    data = request.get_json()
    if not data or "frame" not in data:
        return "No frame provided", 400
    
    jpg_original = base64.b64decode(data["frame"])
    np_arr = np.frombuffer(jpg_original, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    latest_frame = img  # store last frame
    cv2.imwrite("received_frame.jpg", img)  # optional save

    return "Frame received", 200

def generate_mjpeg():
    global latest_frame
    while True:
        if latest_frame is not None:
            ret, jpeg = cv2.imencode('.jpg', latest_frame)
            if ret:
                frame = jpeg.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        # a small delay helps avoid CPU overload
        import time; time.sleep(0.1)

@app.route('/stream')
def stream():
    return Response(generate_mjpeg(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
