# TTS Announcement System

## Overview
When a person is scanned and recognized, the system automatically generates and plays an audio announcement containing the person's name, role (relationship), and age.

## How It Works

### Backend (Flask)
1. **Person Recognition**: When `/recognize` endpoint receives an image, it uses AWS Rekognition to identify the person
2. **Data Retrieval**: Person details (name, relationship, age) are fetched from DynamoDB
3. **Announcement Generation**: A structured announcement is created: `"This is {name}, your {relationship}, age {age}."`
4. **TTS Audio Generation**: ElevenLabs API converts the announcement text to speech
5. **Response**: The audio is returned as base64 encoded MP3 data

### Frontend (React Native)
1. **Camera Scanning**: Takes photos every 2 seconds during scan mode
2. **API Call**: Sends photo to backend for recognition
3. **Audio Playback**: If audio is included in response, it's automatically played using Expo Audio
4. **File Management**: Audio is temporarily saved to device storage and cleaned up after playback

## Configuration

### Environment Variables Required
```
ELEVEN_LAB_API_KEY=your_elevenlabs_api_key
VOICE_ID=your_elevenlabs_voice_id
```

### Audio Settings
- **Format**: MP3
- **Model**: eleven_monolingual_v1
- **Voice Settings**: 
  - Stability: 0.5
  - Similarity Boost: 0.5

## Example Announcement
For a person with:
- Name: "John Smith"
- Relationship: "son" 
- Age: "35"

The system will announce: **"This is John Smith, your son, age 35."**

## Testing
Run the test script to verify TTS functionality:
```bash
cd backend
python3 test_announcement.py
```

## Audio Flow
1. User points camera at person → 2. Face recognized → 3. Person data retrieved → 4. Announcement text generated → 5. ElevenLabs TTS → 6. Audio played on device