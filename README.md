# AlzheimerCamera

Assistive platform that helps people living with Alzheimer's remember loved ones. The system links live camera recognition with a mobile companion app that stores personalized profiles, synthesized reminders, and now per-person memory photo collections.

## Features
- **Face recognition loop**: Raspberry Pi or laptop camera streams frames to the Flask backend, which uses Amazon Rekognition for identification.
- **Personal profiles**: Add loved ones with name, relationship, notes, and age; information is stored in DynamoDB and photos in S3.
- **AI-generated reminders**: Amazon Bedrock summarizes the stored notes and ElevenLabs synthesizes an optional audio clip.
- **Memory albums**: Each person now has a dedicated memory gallery where caregivers can attach additional photos that help spark recognition moments.
- **Mobile experience**: Expo/React Native app surfaces people, reminders, and the new memory album view for quick access.

## Project Layout
```
backend/    Flask application and AWS integration
camera/     Desktop utilities for camera streaming/testing
frontend/   Expo app for caregivers and loved ones
network/    Networking helpers/scripts
```

## Prerequisites
- Python 3.10+
- Node.js 18+
- AWS account with permissions for Rekognition, DynamoDB, S3, and Bedrock (optional TTS via ElevenLabs)
- Mobile device or emulator for the Expo client

## Getting Started
1. **Clone and install dependencies**
   ```bash
   git clone <repo>
   cd AlzheimerCamera
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   cd frontend && npm install
   ```
2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Fill in AWS credentials, S3 bucket, Rekognition collection, DynamoDB table, TTS keys
   ```
3. **Provision AWS resources** (first-time setup)
   ```bash
   cd backend
   python setup_aws.py
   ```
4. **Run the backend**
   ```bash
   cd backend
   python app.py  # listens on 0.0.0.0:8000 by default
   ```
5. **Launch the mobile app**
   ```bash
   cd frontend
   npx expo start
   ```
   Update `frontend/services/api.js` so `API_BASE_URL` points at the machine running the backend (e.g., `http://192.168.x.x:8000`).
6. **Stream camera frames (optional)**
   ```bash
   cd camera
   python gui.py
   ```

## Using Memory Albums
- Open the **People Stored** tab in the Expo app and tap a person to open their album.
- Use **＋ Add Memory Photo** to pick a photo from the device library; the app sends it to `/person/<person_id>/memories` where S3 stores the image and DynamoDB tracks metadata.
- Memory counts appear in the list view so you know which profiles already have supporting photos.
- Deleting a person automatically purges their saved memories from S3.

## API Highlights
See `backend/README.md` for the full list. Newly added endpoints:
- `GET /person/<person_id>/memories` – returns memory metadata with time-limited presigned URLs.
- `POST /person/<person_id>/memories` – accepts a base64 image (and optional caption) to append to the person’s album.

## Development Tips
- Restart the backend whenever modifying `backend/app.py` to pick up new routes.
- The Expo dev menu (`⌘+d` on iOS simulator / `Ctrl+m` on Android) helps clear caches when testing new API hosts.
- Use `npm run lint` in `frontend/` and `pytest` in `backend/` to keep changes healthy.

## Contributors
See `contributors.md` for the full list of awesome collaborators.
