# Backend (Flask + AWS)

The Flask app under `backend/` exposes the REST endpoints that power AlzheimerCamera. It integrates with Amazon Rekognition, S3, and DynamoDB to recognise faces, store profile photos, and manage per-person memory events.

## Prerequisites

- Python 3.10+
- AWS account with permissions for Rekognition, DynamoDB, and S3
- (Optional) ElevenLabs API key for spoken reminders

Install dependencies once:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file inside `backend/` with the following keys:

```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-west-2
S3_BUCKET_NAME=alzheimer-camera-faces
REKOGNITION_COLLECTION_ID=alzheimer-faces
DYNAMODB_TABLE_NAME=alzheimer-persons
VOICE_ID=<elevenlabs voice id>
ELEVEN_LAB_API_KEY=<elevenlabs api key>
```

> Tip: The API works without ElevenLabs (audio will be omitted), but AWS credentials are required.

Run the service:

```bash
python app.py  # serves on http://0.0.0.0:8000
```

## Data Model

Each entry in the DynamoDB table resembles:

```json
{
  "person_id": "40ea0044-ed8b-4eff-8c16-a4d4f733707c",
  "name": "Ahmad",
  "relationship": "Sibling",
  "age": 52,
  "notes": "Visits every weekend",
  "face_id": "rekognition-face-id",
  "s3_key": "40ea0044-ed8b-4eff/moment.jpg",
  "memories": [
    {
      "memory_id": "f2c3...",
      "type": "image",
      "s3_key": "40ea0044-ed8b-4eff/memories/f2c3....jpg",
      "title": "Holiday dinner",
      "description": "Everyone together in 2023",
      "event_date": "Dec 2023",
      "created_at": "2024-02-01T18:05:23.153925"
    }
  ],
  "created_at": "2024-01-30T18:15:02.074Z",
  "updated_at": "2024-02-01T18:06:03.101Z"
}
```

The `memories` attribute is a list of JSON objects appended by the memory endpoints.

## API Reference

### `POST /recognize`

Recognise a face in a base64 encoded image. The backend converts to JPEG and submits it to Amazon Rekognition. If a match is found, the stored notes (and optional ElevenLabs audio) are returned.

```json
{
  "image": "<base64>"
}
```

### `POST /add_person`

Create or update a person. If the uploaded image matches an existing face, the record is updated; otherwise a new `person_id` is generated.

```json
{
  "image": "<base64>",
  "name": "Jane Doe",
  "relationship": "Daughter",
  "age": 32,
  "notes": "Visits on weekends"
}
```

### `GET /reminders`

List every stored person. Useful for populating the “People” or “Reminders” tab in the mobile client.

Response snippet:

```json
{
  "reminders": [
    {
      "person_id": "...",
      "name": "Jane Doe",
      "relationship": "Daughter",
      "notes": "Visits on weekends",
      "image_url": "https://...presigned..."
    }
  ]
}
```

### `PUT /edit_person/<person_id>`

Update name, relationship, age, or notes for a person. If an image is provided, it is uploaded and becomes the new reference photo.

### `DELETE /delete_person/<person_id>`

Remove the person across Rekognition, S3 (including memory images), and DynamoDB.

### `GET /person/<person_id>/memories`

Fetch all memory events for a person. Each entry includes the ID, type, presigned URI, optional title/description, and timestamps. Results are ordered newest first.

```json
{
  "memories": [
    {
      "id": "f2c3...",
      "type": "image",
      "uri": "https://...presigned...",
      "title": "Holiday dinner",
      "description": "Everyone together in 2023",
      "eventDate": "Dec 2023",
      "createdAt": "2024-02-01T18:05:23.153925"
    }
  ]
}
```

### `POST /person/<person_id>/memories`

Attach a new memory. Currently only image memories are supported. The request mirrors the format consumed by the Expo client.

```json
{
  "type": "image",
  "image": "<base64>",
  "title": "Trip to the lake",
  "description": "Fishing with grandkids",
  "event_date": "July 2024"
}
```

### `GET /health`

Simple health check that returns `{"status":"healthy"}`.

## Development Tips

- The test harness (`frontend/index.html`) can hit endpoints without the mobile app.
- Use `curl http://localhost:8000/person/<id>/memories` to verify memory payloads while debugging.
- When Rekognition returns 400/404, check that the collection exists (`python backend/setup_aws.py`).
- Flask logs to stdout; a stack trace usually accompanies any HTML error page the client receives.

## Tests

There are lightweight smoke tests in `backend/test_api.py`. Run them with:

```bash
pytest
```

(Ensure AWS environment variables are set, or mock the boto3 clients before running unit tests in CI.)
