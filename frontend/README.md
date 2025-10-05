# Frontend (Expo React Native)

The Expo app (`frontend/`) is the caregiver-facing interface for AlzheimerCamera. It lets you add loved ones, manage reminders, capture faces, and curate memory albums that sync with the Flask backend.

## Requirements

- Node.js 18+
- Expo CLI (`npm install -g expo-cli` or use `npx expo`)
- iOS simulator, Android emulator, or a physical device with Expo Go

Install dependencies once:

```bash
npm install
# or to keep native modules aligned with Expo:
npx expo install
```

## Running the App

```bash
npx expo start           # opens the Metro bundler dashboard
npx expo start --ios     # launch iOS simulator (macOS)
npx expo start --android # launch Android emulator
```

Update `API_BASE_URL` in `services/api.js` so the app can reach the Flask backend:

- iOS simulator: `http://127.0.0.1:8000`
- Android emulator: `http://10.0.2.2:8000`
- Physical device: `http://<your-lan-ip>:8000`

## App Structure

```
app/
  (tabs)/          Tab navigator (home, people, reminders, settings)
  memories/        Memory gallery screen per person
  add-person-modal.tsx
  edit-reminder-modal.tsx
services/api.js    REST helpers for the backend
state/remindersStore.js AsyncStorage-backed reminder store
assets/            Icons, fonts
```

Key screens:

- **Home** – entry point with quick actions (scan face, view people, open reminders).
- **People** – list of recognised loved ones with avatar, relationship, and latest memory snapshot.
- **Reminders** – local reminder manager; entries persist in AsyncStorage and vibrate when due.
- **Memories** – per-person gallery fed by `/person/<id>/memories`, with a modal to upload new memory events.

## Features

### Reminders

- Times are entered in friendly 12‑hour format (e.g. `4:37 pm`). The store normalises them to 24‑hour time for daily scheduling.
- Data lives in `state/remindersStore.js` (AsyncStorage) and survives app reloads.
- Reminders trigger Expo Haptics + native vibration once per day, and tapping the bell icon provides instant feedback.
- Pull-to-refresh syncs the list with storage; toggles and deletions update immediately.

### Memory Albums

- Each person starts with an empty `memories` array in DynamoDB.
- The Memories tab calls `GET /person/<id>/memories` to load existing memories and displays title/description overlays when present.
- Adding an event opens a modal where you provide title, description, date, and pick a photo. The app converts the image to base64 and posts to `POST /person/<id>/memories`.
- Uploaded photos are stored in S3; the backend returns presigned URLs which expire after one hour.

### People Management

- `add-person-modal.tsx` wraps the AWS Rekognition enrolment workflow exposed by `POST /add_person`.
- Editing a person (`/edit-person`) updates the DynamoDB record while preserving existing memories.

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run lint` | Run Expo's ESLint configuration to catch common mistakes |
| `npx expo prebuild` | Generate native iOS/Android projects (if you need custom native modules) |
| `npm run reset-project` | Restore the Expo template (dangerous—used for scaffolding only) |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `JSON Parse error: Unexpected character: <` | Backend returned HTML—check `API_BASE_URL`, ensure `python backend/app.py` is running, inspect Flask logs |
| Reminders stopped buzzing | Verify the reminder is still enabled, device isn't in silent/DND, and AsyncStorage contains the entry (clear via device settings if needed) |
| Memory upload fails with “Media access is required” | Grant photo-library permission in device settings, re-open the modal and pick a photo before saving |
| Images fail to load after an hour | Presigned URLs expire; pull to refresh to request new ones |

## Debug Utilities

`frontend/index.html` provides a simple testing page for the backend. Use it to upload faces, call `/recognize`, or exercise the memory endpoints without launching the mobile client.

## Contributing

1. Keep README files updated when flows change.
2. Run `npm run lint` before committing UI changes.
3. Coordinate backend schema updates with the Flask team—changes to `memories` or person payloads affect both sides of the app.

Happy building! 🚀
