from flask import Flask, Response, request, jsonify
from flask_cors import CORS
import base64

app = Flask(__name__)
CORS(app)

latest_frame_b64 = None  # global variable to store last uploaded frame as base64

@app.route('/upload', methods=['POST'])
def upload():
    global latest_frame_b64
    try:
        data = request.get_json()
        if not data or "frame" not in data:
            return jsonify({"error": "No frame provided"}), 400
        
        latest_frame_b64 = data["frame"]  # store base64 string directly

        return jsonify({"success": True, "message": "Frame received"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_frame')
def get_frame():
    global latest_frame_b64
    if latest_frame_b64:
        return jsonify({"frame": latest_frame_b64})
    else:
        return jsonify({"error": "No frame available"}), 404

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, threaded=True)
