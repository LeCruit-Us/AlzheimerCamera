# Flask Backend

REST API that powers AlzheimerCamera by handling face recognition, person management, AI-generated reminders, and memory photo albums.

## Setup
1. **Install dependencies**
   ```bash
   pip install -r ../requirements.txt
   ```
2. **Environment variables**
   Copy `.env.example` to `.env` and provide values for:
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
   - `S3_BUCKET_NAME`, `REKOGNITION_COLLECTION_ID`, `DYNAMODB_TABLE_NAME`
   - `VOICE_ID`, `ELEVEN_LAB_API_KEY` (optional for audio reminders)
3. **Provision AWS resources** (once per environment)
   ```bash
   python setup_aws.py
   ```
   Creates the Rekognition collection, S3 bucket, and DynamoDB table if they do not exist.
4. **Run the server**
   ```bash
   python app.py  # starts on http://0.0.0.0:8000
   ```

## Data Model Overview
- **DynamoDB Table (`alzheimer-persons`)**
  - `person_id` (PK) with attributes: `name`, `relationship`, `age`, `notes`, `face_id`, `s3_key`, timestamps, and `memories` (list).
- **Amazon S3**
  - Primary face: `<person_id>/<face_id>.jpg`
  - Memory photos: `<person_id>/memories/<memory_id>.jpg`
- **Amazon Rekognition**
  - Collection stores indexed faces keyed by `ExternalImageId = person_id`.

## API Endpoints

### `POST /recognize`
Identify a face using Amazon Rekognition.
```json
{
  "image": "<base64-encoded image>"
}
```
Returns `{ matched: bool, person, note, audio? }` depending on recognition and available TTS.

### `POST /add_person`
Add a new person (or update an existing match) with a captured photo.
```json
{
  "image": "<base64 image>",
  "name": "Jane Doe",
  "relationship": "Daughter",
  "age": 32,
  "notes": "Visits every weekend"
}
```
On success stores image in S3, indexes face in Rekognition, and persists profile + empty `memories` array.

### `PUT /edit_person/<person_id>`
Update profile metadata (excludes photo).
```json
{
  "name": "Jane Doe",
  "relationship": "Daughter",
  "age": 33,
  "notes": "Visits every weekend"
}
```

### `DELETE /delete_person/<person_id>`
Removes the person across Rekognition, DynamoDB, and their S3 assets (including memory photos).

### `GET /reminders`
Lists all people with presigned URLs for their primary photo and memory counts.
Response excerpt:
```json
{
  "reminders": [
    {
      "person_id": "...",
      "name": "Jane Doe",
      "relationship": "Daughter",
      "memory_count": 3,
      "image_url": "https://...",
      "latest_memory_url": "https://..."
    }
  ]
}
```

### Memory Album Endpoints
- `GET /person/<person_id>/memories`
  - Returns ordered list of memory objects with presigned `image_url` fields.
  ```json
  {
    "person": {
      "person_id": "...",
      "name": "Jane Doe"
    },
    "memories": [
      {
        "memory_id": "...",
        "created_at": "2024-03-10T18:05:02.123456",
        "caption": "Holiday dinner",
        "image_url": "https://..."
      }
    ]
  }
  ```
- `POST /person/<person_id>/memories`
  - Attach a new memory photo (optional `caption`).
  ```json
  {
    "image": "<base64 image>",
    "caption": "Trip to the lake"
  }
  ```
  - Responds with `{ success: true, memory: { ... } }` on success.

### `GET /health`
Simple health check returning `{ "status": "healthy" }`.

## Testing
- `pytest test_api.py` exercises core endpoints with mocked AWS responses.
- Use `curl`/Postman to manually verify memory endpoints while reviewing presigned URLs.

## Operational Notes
- Restart the Flask app after code changes to register new routes.
- Presigned URLs default to a 1-hour lifetime; adjust `ExpiresIn` if you need longer-lived links.
- Cloud credentials should be scoped with the minimum permissions for Rekognition, DynamoDB, and S3 operations described above.
