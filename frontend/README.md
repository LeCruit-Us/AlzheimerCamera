# AlzheimerCamera Mobile App

Expo/React Native companion app that lets caregivers manage recognized people, review AI reminders, and curate memory photos for each profile.

## Quick Start
1. Install dependencies
   ```bash
   npm install
   ```
2. Configure backend URL
   - Edit `services/api.js` and set `API_BASE_URL` to the machine/IP where the Flask backend runs (e.g., `http://192.168.x.x:8000`).
3. Launch Expo
   ```bash
   npx expo start
   ```
   Scan the QR code with Expo Go or run on an emulator/simulator.

## App Structure
- `app/(tabs)/` – Main tab navigator (home, people, reminders, settings).
- `app/add-person-modal.tsx` – Modal for creating/editing profiles with camera integration.
- `app/person/[personId].tsx` – Memory gallery screen; displays and uploads per-person photos.
- `services/api.js` – Fetch helpers for all backend endpoints.

## Memory Albums Workflow
1. Open **People Stored** and tap a person row to open their album. The row shows how many memories are saved.
2. Press **＋ Add Memory Photo** to pick a picture from the device library. The app uploads it as base64 to `/person/<person_id>/memories` and refreshes the grid with the returned presigned URL.
3. Pull-to-refresh the album to request a fresh set of presigned links if the backend restarts.
4. Removing a person from the list will also delete their memory assets via the backend, so photos disappear automatically from the album the next time it loads.

## Development Tips
- Use `npm run lint` to check for common issues.
- If you change the backend IP mid-session, reload the app (shake device → Reload) so `API_BASE_URL` takes effect.
- Expo logs warn that `ImagePicker.MediaTypeOptions` is deprecated; we plan to migrate to `ImagePicker.MediaType` in a future update.

## Troubleshooting
- **Unexpected character `<` when parsing JSON**: The app received HTML (often from a network error). Ensure `API_BASE_URL` is reachable from the device and the backend is running.
- **Stale presigned URLs**: Pull-to-refresh the album or reopen the screen—each request generates fresh URLs that remain valid for one hour by default.

## Related Docs
- Backend endpoint details live in `../backend/README.md`.
- Overall project overview is in the root `README.md`.
