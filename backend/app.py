from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
import base64
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv
import json
from PIL import Image
import io
import requests

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# AWS clients
rekognition = boto3.client('rekognition')
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
bedrock = boto3.client('bedrock-runtime')

# Configuration
BUCKET_NAME = os.getenv('S3_BUCKET_NAME', 'alzheimer-camera-faces')
COLLECTION_ID = os.getenv('REKOGNITION_COLLECTION_ID', 'alzheimer-faces')
TABLE_NAME = os.getenv('DYNAMODB_TABLE_NAME', 'alzheimer-persons')
ELEVENLABS_API_KEY = os.getenv('ELEVEN_LAB_API_KEY')
ELEVENLABS_VOICE_ID = os.getenv('VOICE_ID')

# DynamoDB table
table = dynamodb.Table(TABLE_NAME)

@app.route('/recognize', methods=['POST'])
def recognize_face():
    print(f"[RECOGNIZE] Request received from {request.remote_addr}")
    try:
        data = request.get_json()
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Decode and convert image
        try:
            if ',' in image_data:
                image_bytes = base64.b64decode(image_data.split(',')[1])
            else:
                image_bytes = base64.b64decode(image_data)
            
            # Convert to JPEG for Rekognition
            image = Image.open(io.BytesIO(image_bytes))
            if image.mode in ('RGBA', 'P'):
                image = image.convert('RGB')
            
            buffer = io.BytesIO()
            image.save(buffer, format='JPEG')
            image_bytes = buffer.getvalue()
            print(f"Converted image size: {len(image_bytes)} bytes")
        except Exception as e:
            return jsonify({'error': f'Image conversion failed: {str(e)}'}), 400
        
        # Search for face in collection
        response = rekognition.search_faces_by_image(
            CollectionId=COLLECTION_ID,
            Image={'Bytes': image_bytes},
            MaxFaces=1,
            FaceMatchThreshold=70
        )
        
        print(f"Rekognition response: {len(response.get('FaceMatches', []))} matches found")
        
        if response['FaceMatches']:
            match = response['FaceMatches'][0]
            person_id = match['Face']['ExternalImageId']
            confidence = match['Similarity']
            print(f"Match found: person_id={person_id}, confidence={confidence}%")
            
            # Get person info from DynamoDB
            db_response = table.get_item(Key={'person_id': person_id})
            person_info = db_response.get('Item', {})
            print(f"Person info: {person_info.get('name', 'Unknown')}")
            
            # Get person details
            name = person_info.get('name', 'Unknown')
            relationship = person_info.get('relationship', 'Unknown')
            age = person_info.get('age', 'Unknown')
            raw_notes = person_info.get('notes', 'No additional information')
            
            # Generate basic info audio with prompt
            basic_info = f"This is {name}, your {relationship}, age {age}. Would you like to hear more information?"
            basic_audio = generate_tts_audio(basic_info)
            
            # Generate notes audio
            notes_audio = generate_tts_audio(raw_notes)
            
            print(f"Generated basic info: {basic_info}")
            print(f"Using raw notes: {raw_notes[:50]}...")
            
            result = {
                'matched': True,
                'person': {
                    'name': name,
                    'relationship': relationship,
                    'age': age
                },
                'note': raw_notes
            }
            
            # Add audio clips if TTS was successful
            if basic_audio and notes_audio:
                result['audio'] = {
                    'basic': basic_audio,
                    'notes': notes_audio
                }
            
            print(f"Returning result with audio clips: {bool(result.get('audio'))}")
            return jsonify(result)
        else:
            print("No matches found")
            return jsonify({
                'matched': False,
                'note': 'Person not recognized'
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_bedrock_note(person_info):
    """Generate human-like note using Amazon Bedrock"""
    try:
        name = person_info.get('name', 'Unknown')
        relationship = person_info.get('relationship', 'Unknown')
        age = person_info.get('age', 'Unknown')
        notes = person_info.get('notes', '')
        
        prompt = f"""Convert this information into a natural spoken reminder for someone with Alzheimer's:
        
        Person: {name} ({relationship}, age {age})
        Notes: {notes}
        
        Create a factual, conversational message that reflects the exact sentiment and information from the notes. Keep it under 50 words and suitable for audio playback."""
        
        body = json.dumps({
            "inputText": prompt,
            "textGenerationConfig": {
                "maxTokenCount": 100,
                "temperature": 0.7
            }
        })
        
        response = bedrock.invoke_model(
            body=body,
            modelId="amazon.titan-text-lite-v1",
            accept="application/json",
            contentType="application/json"
        )
        
        response_body = json.loads(response.get('body').read())
        return response_body.get('results', [{}])[0].get('outputText', '').strip()
    except Exception as e:
        return f"This is {name}, your {relationship}. They care about you very much."

def generate_tts_audio(text):
    """Generate TTS audio using ElevenLabs and return as base64"""
    try:
        if not ELEVENLABS_API_KEY or not ELEVENLABS_VOICE_ID:
            print("ElevenLabs API key or Voice ID not configured")
            return None
        
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
        
        print(f"[TTS] Generating audio for: {text[:50]}...")
        response = requests.post(url, json=data, headers=headers, timeout=30)
        
        if response.status_code == 200:
            audio_base64 = base64.b64encode(response.content).decode('utf-8')
            print(f"[TTS] Audio generated successfully")
            return audio_base64
        else:
            print(f"[TTS] API error: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"[TTS] Error: {str(e)}")
        return None

@app.route('/add_person', methods=['POST'])
def add_person():
    print(f"[ADD_PERSON] Request received from {request.remote_addr}")
    try:
        data = request.get_json()
        image_data = data.get('image')
        name = data.get('name')
        relationship = data.get('relationship')
        age = data.get('age')
        notes = data.get('notes', '')
        
        if not image_data or not name or not relationship:
            print(f"Validation failed - image_data: {bool(image_data)}, name: '{name}', relationship: '{relationship}'")
            return jsonify({'error': 'Image, name, and relationship required'}), 400
        
        # Decode and convert image
        try:
            if ',' in image_data:
                image_bytes = base64.b64decode(image_data.split(',')[1])
            else:
                image_bytes = base64.b64decode(image_data)
            
            # Convert to JPEG for Rekognition
            image = Image.open(io.BytesIO(image_bytes))
            if image.mode in ('RGBA', 'P'):
                image = image.convert('RGB')
            
            buffer = io.BytesIO()
            image.save(buffer, format='JPEG')
            image_bytes = buffer.getvalue()
        except Exception as e:
            return jsonify({'error': f'Image conversion failed: {str(e)}'}), 400
        
        # Check if person already exists
        try:
            search_response = rekognition.search_faces_by_image(
                CollectionId=COLLECTION_ID,
                Image={'Bytes': image_bytes},
                MaxFaces=1,
                FaceMatchThreshold=70
            )
            
            if search_response['FaceMatches']:
                # Person exists - update their info
                existing_person_id = search_response['FaceMatches'][0]['Face']['ExternalImageId']
                
                # Update DynamoDB with new info
                table.update_item(
                    Key={'person_id': existing_person_id},
                    UpdateExpression='SET #n = :name, relationship = :rel, age = :age, notes = :notes, updated_at = :updated',
                    ExpressionAttributeNames={'#n': 'name'},
                    ExpressionAttributeValues={
                        ':name': name,
                        ':rel': relationship,
                        ':age': age,
                        ':notes': notes,
                        ':updated': datetime.utcnow().isoformat()
                    }
                )
                
                # Add new image to existing person's S3 folder
                new_face_id = str(uuid.uuid4())
                s3_key = f"{existing_person_id}/{new_face_id}.jpg"
                s3.put_object(
                    Bucket=BUCKET_NAME,
                    Key=s3_key,
                    Body=image_bytes,
                    ContentType='image/jpeg'
                )
                
                return jsonify({
                    'success': True,
                    'person_id': existing_person_id,
                    'updated': True,
                    'message': 'Person info updated with new photo'
                })
        except:
            pass  # Person doesn't exist, create new
        
        # Create new person
        person_id = str(uuid.uuid4())
        
        # Add face to Rekognition collection
        response = rekognition.index_faces(
            CollectionId=COLLECTION_ID,
            Image={'Bytes': image_bytes},
            ExternalImageId=person_id,
            MaxFaces=1
        )
        
        if response['FaceRecords']:
            face_id = response['FaceRecords'][0]['Face']['FaceId']
            
            # Store image in S3
            s3_key = f"{person_id}/{face_id}.jpg"
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=image_bytes,
                ContentType='image/jpeg'
            )
            
            # Store person info in DynamoDB
            table.put_item(
                Item={
                    'person_id': person_id,
                    'name': name,
                    'relationship': relationship,
                    'age': age,
                    'notes': notes,
                    'face_id': face_id,
                    's3_key': s3_key,
                    'created_at': datetime.utcnow().isoformat()
                }
            )
            
            return jsonify({
                'success': True,
                'person_id': person_id,
                'face_id': face_id,
                'created': True
            })
        else:
            return jsonify({'error': 'No face detected'}), 400
            
    except Exception as e:
        print(f"Add person error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/reminders', methods=['GET'])
def get_reminders():
    """Get all people as reminders"""
    try:
        response = table.scan()
        people = response.get('Items', [])
        
        reminders = []
        for person in people:
            # Generate presigned URL for the image
            image_url = None
            if person.get('s3_key'):
                try:
                    image_url = s3.generate_presigned_url(
                        'get_object',
                        Params={'Bucket': BUCKET_NAME, 'Key': person.get('s3_key')},
                        ExpiresIn=3600  # 1 hour
                    )
                except Exception as e:
                    print(f"Error generating presigned URL: {e}")
            
            reminders.append({
                'person_id': person.get('person_id'),
                'name': person.get('name'),
                'relationship': person.get('relationship'),
                'age': person.get('age'),
                'notes': person.get('notes'),
                'added_date': person.get('created_at'),
                'image_url': image_url
            })
        
        return jsonify({'reminders': reminders})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/edit_person/<person_id>', methods=['PUT'])
def edit_person(person_id):
    """Edit a person's information"""
    try:
        data = request.get_json()
        name = data.get('name')
        relationship = data.get('relationship')
        age = data.get('age')
        notes = data.get('notes', '')
        
        if not name or not relationship:
            return jsonify({'error': 'Name and relationship required'}), 400
        
        # Update DynamoDB
        table.update_item(
            Key={'person_id': person_id},
            UpdateExpression='SET #n = :name, relationship = :rel, age = :age, notes = :notes, updated_at = :updated',
            ExpressionAttributeNames={'#n': 'name'},
            ExpressionAttributeValues={
                ':name': name,
                ':rel': relationship,
                ':age': age,
                ':notes': notes,
                ':updated': datetime.utcnow().isoformat()
            }
        )
        
        return jsonify({'success': True, 'message': 'Person updated successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/delete_person/<person_id>', methods=['DELETE'])
def delete_person(person_id):
    """Delete a person from all AWS services"""
    print(f"[DELETE_PERSON] Request to delete person_id: {person_id}")
    try:
        # Get person info first
        db_response = table.get_item(Key={'person_id': person_id})
        person_info = db_response.get('Item')
        
        if not person_info:
            return jsonify({'error': 'Person not found'}), 404
        
        # Delete from Rekognition (get face_id first)
        face_id = person_info.get('face_id')
        if face_id:
            try:
                rekognition.delete_faces(
                    CollectionId=COLLECTION_ID,
                    FaceIds=[face_id]
                )
            except Exception as e:
                print(f"Error deleting from Rekognition: {e}")
        
        # Delete from S3
        s3_key = person_info.get('s3_key')
        if s3_key:
            try:
                s3.delete_object(Bucket=BUCKET_NAME, Key=s3_key)
            except Exception as e:
                print(f"Error deleting from S3: {e}")
        
        # Delete from DynamoDB
        table.delete_item(Key={'person_id': person_id})
        
        return jsonify({'success': True, 'message': 'Person deleted successfully'})
        
    except Exception as e:
        print(f"Delete person error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)