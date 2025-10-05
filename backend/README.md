# Flask Backend for Facial Recognition

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure AWS credentials:
```bash
cp .env.example .env
# Edit .env with your AWS credentials
```

3. Setup AWS resources:
```bash
python setup_aws.py
```

4. Run the server:
```bash
python app.py
```

## API Endpoints

### POST /recognize
Recognize a face from uploaded image
```json
{
  "image": "base64_encoded_image"
}
```

### POST /add_face
Add a new face to the database
```json
{
  "image": "base64_encoded_image",
  "person_id": "unique_person_identifier"
}
```

### GET /health
Health check endpoint