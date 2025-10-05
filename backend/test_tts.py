#!/usr/bin/env python3
"""
Test TTS audio generation directly
"""
import requests
import base64
import os
from dotenv import load_dotenv

load_dotenv()

ELEVENLABS_API_KEY = os.getenv('ELEVEN_LAB_API_KEY')
ELEVENLABS_VOICE_ID = os.getenv('VOICE_ID')

def test_elevenlabs_direct():
    """Test ElevenLabs API directly"""
    print("Testing ElevenLabs API directly...")
    print(f"API Key: {ELEVENLABS_API_KEY[:10]}..." if ELEVENLABS_API_KEY else "No API Key")
    print(f"Voice ID: {ELEVENLABS_VOICE_ID}")
    
    if not ELEVENLABS_API_KEY or not ELEVENLABS_VOICE_ID:
        print("❌ Missing API key or Voice ID")
        return False
    
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    
    data = {
        "text": "Hello, this is a test of the text to speech system.",
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        }
    }
    
    try:
        response = requests.post(url, json=data, headers=headers, timeout=30)
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✅ Audio generated successfully! Size: {len(response.content)} bytes")
            
            # Save to file for testing
            with open('test_audio.mp3', 'wb') as f:
                f.write(response.content)
            print("Audio saved as test_audio.mp3")
            
            # Convert to base64
            audio_base64 = base64.b64encode(response.content).decode('utf-8')
            print(f"Base64 length: {len(audio_base64)}")
            return True
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_backend_recognize():
    """Test the backend recognize endpoint"""
    print("\nTesting backend /recognize endpoint...")
    
    # Use a simple test image (1x1 pixel base64)
    test_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    
    try:
        response = requests.post('http://localhost:8000/recognize', json={
            'image': test_image
        })
        
        print(f"Backend response status: {response.status_code}")
        result = response.json()
        print(f"Response: {result}")
        
        if result.get('matched'):
            print(f"✅ Person matched: {result.get('person', {}).get('name')}")
            if result.get('audio'):
                print(f"✅ Audio included in response, length: {len(result['audio'])}")
                return True
            else:
                print("❌ No audio in response")
        else:
            print("ℹ️ No person matched (expected for test image)")
            
    except Exception as e:
        print(f"❌ Backend test failed: {e}")
        
    return False

if __name__ == "__main__":
    print("🔊 Testing TTS Audio System")
    print("=" * 40)
    
    # Test 1: Direct ElevenLabs API
    tts_works = test_elevenlabs_direct()
    
    # Test 2: Backend endpoint
    backend_works = test_backend_recognize()
    
    print("\n" + "=" * 40)
    print("📊 Test Results:")
    print(f"ElevenLabs API: {'✅ Working' if tts_works else '❌ Failed'}")
    print(f"Backend Audio: {'✅ Working' if backend_works else '❌ Failed'}")