# AlzheimerCamera

AlzheimerCamera is a hybrid hardware/software prototype built for caregivers who support loved ones living with Alzheimer's. The system recognises familiar faces, plays contextual reminders, and stores shared memories that can be reviewed from an Expo mobile client.

## Contents

- [Architecture](#architecture)
- [Key Features](#key-features)
- [Project Layout](#project-layout)
- [Quick Start](#quick-start)
- [Typical Workflow](#typical-workflow)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Architecture

| Piece | Responsibility | Stack |
|-------|----------------|-------|
| `backend/` | Flask REST API, AWS integrations (Rekognition, S3, DynamoDB), reminder/memory logic | Python 3, Flask, boto3 |
| `camera/` | Scripts for streaming images from a Raspberry Pi or webcam to the backend | Python 3, OpenCV |
| `frontend/` | Expo React Native mobile app for caregivers (reminders UI, memory albums, face scanning) | React Native, Expo Router |

All artefacts run locally by default. Production deployment would involve hosting the Flask service (with access to AWS resources) and compiling the Expo client for iOS/Android.

## Key Features

- **Face recognition pipeline** – capture frames via `camera/gui.py`, send them to `/recognize`, and receive a spoken reminder plus optional ElevenLabs audio.
- **People directory** – add or edit stored loved ones with name, relationship, notes, and primary photo.
- **Reminders** – persistent 12‑hour reminders with vibration alerts and manual toggles, stored on-device using AsyncStorage.
- **Memory albums** – attach event photos (with title, description, and date) per person; assets live in S3 with presigned URLs for viewing in the app.
- **Health/debug endpoints** – `/health`, `/reminders`, `/person/<id>/memories` to help verify backend health quickly.

## Project Layout

```
backend/        Flask API, AWS glue code, setup scripts
camera/         Webcam / Raspberry Pi upload utilities
frontend/       Expo app (tabs for home, people, reminders, memories)
network/        Networking helpers and experiments
README.md       High-level documentation (this file)
requirements.txtPython dependencies for the backend
```

## Quick Start

### 1. Backend

```bash
# From the repo root
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r requirements.txt

# Configure AWS credentials and required IDs in backend/.env
# see [Environment Variables](#environment-variables) below

python backend/app.py  # runs on http://0.0.0.0:8000
```

### 2. Frontend

```bash
cd frontend
npm install
# or: npx expo install ensures native modules (expo-haptics, async-storage) are linked
npx expo start
```

When running on a device/simulator, update `frontend/services/api.js` so `API_BASE_URL` targets the machine that is running the Flask API:

- iOS simulator: `http://127.0.0.1:8000`
- Android emulator: `http://10.0.2.2:8000`
- Physical device: `http://<your-lan-ip>:8000`

### 3. Camera streamer (optional)

```bash
cd camera
python gui.py  # streams frames to the backend /recognize endpoint
```

## Typical Workflow

1. **Add a loved one** from the mobile app or the test page (`frontend/index.html`). The backend stores profile data in DynamoDB and uploads the reference photo to S3.
2. **Capture frames** using the `camera` utilities or the Expo vision tab. `/recognize` looks up the face via Amazon Rekognition and responds with the stored notes (and an optional ElevenLabs audio clip).
3. **Create reminders** inside the app. Times are accepted in 12‑hour format (e.g. `4:37 pm`). Entries persist in AsyncStorage and trigger a haptic + vibration alert once per day at the scheduled time.
4. **Save shared memories** from the Memories tab. Pick a photo, fill in the event metadata, and the app uploads it to `/person/<id>/memories`. The gallery refreshes instantly and presigned URLs let you view the S3 assets for one hour.
5. **Monitor health** using `/health`, `/reminders`, and `/person/<id>/memories` for quick diagnostics.

## Environment Variables

Create `backend/.env` with values for: 

```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-west-2
S3_BUCKET_NAME=alzheimer-camera-faces
REKOGNITION_COLLECTION_ID=alzheimer-faces
DYNAMODB_TABLE_NAME=alzheimer-persons
VOICE_ID=your_elevenlabs_voice_id
ELEVEN_LAB_API_KEY=sk-...
DYNAMODB_EVENTS_TABLE_NAME=alzheimer-events   # optional, if using events helper scripts
```

The app works locally without ElevenLabs (audio is optional), but AWS credentials are required for recognition, S3 storage, and DynamoDB persistence.

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `JSON Parse error: Unexpected character: <` in the Expo logs | Backend endpoint not reachable, returning an HTML error page | Verify `API_BASE_URL`, restart `python backend/app.py`, check the Flask console for the stack trace |
| Reminders do not vibrate | Device is muted/do not disturb or AsyncStorage entry missing | Ensure vibration is permitted, verify reminder still exists under Settings → Reminders |
| Memory upload fails with `Image is required` | Modal closed before picking an image | Tap “Pick a photo” before hitting “Save Memory” |
| `botocore.exceptions.NoCredentialsError` | AWS environment variables not set | Double-check `.env` and that `load_dotenv()` is finding it |

## Contributing

Pull requests are welcome! Please keep the following in mind:

- Run `npm run lint` inside `frontend/` before submitting UI changes.
- Sync your branch with the latest main (`git pull --rebase`) to avoid merge conflicts.
- Update the READMEs if you introduce new endpoints, screens, or configuration requirements.

Happy hacking!
