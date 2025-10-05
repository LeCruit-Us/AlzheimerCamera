import requests
import base64
import json

# Server URL
BASE_URL = "http://localhost:8000"

def encode_image(image_path):
    """Convert image to base64"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def test_add_person():
    """Test adding a new person"""
    # You need to put a face photo in the backend folder
    image_b64 = encode_image("test_face.jpg")
    
    data = {
        "image": image_b64,
        "name": "John Doe",
        "age": 65,
        "notes": "Test patient"
    }
    
    response = requests.post(f"{BASE_URL}/add_person", json=data)
    print("Add Person Response:", response.json())
    return response.json()

def test_recognize(image_path="test_face.jpg"):
    """Test face recognition"""
    image_b64 = encode_image(image_path)
    
    data = {"image": image_b64}
    
    response = requests.post(f"{BASE_URL}/recognize", json=data)
    print("Recognition Response:", response.json())
    return response.json()

def test_health():
    """Test health endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    print("Health Response:", response.json())

def test_get_media(person_id):
    """Test getting person's media gallery"""
    response = requests.get(f"{BASE_URL}/person/{person_id}/media")
    print("Get Media Response:", response.json())
    return response.json()

def test_add_media(person_id, image_path="test_face.jpg"):
    """Test adding media to person's gallery"""
    image_b64 = encode_image(image_path)
    
    data = {"image": image_b64}
    
    response = requests.post(f"{BASE_URL}/person/{person_id}/media", json=data)
    print("Add Media Response:", response.json())
    return response.json()

def test_delete_media(person_id, media_id):
    """Test deleting media from person's gallery"""
    response = requests.delete(f"{BASE_URL}/person/{person_id}/media/{media_id}")
    print("Delete Media Response:", response.json())
    return response.json()

if __name__ == "__main__":
    print("Testing API...")
    
    # Test health
    test_health()
    
    # Test adding person (run this first)
    print("\n--- Adding Person ---")
    add_result = test_add_person()
    
    # Test recognition (run this after adding)
    print("\n--- Testing Recognition ---")
    test_recognize()
    
    # Test media endpoints if person was added successfully
    if add_result.get('success') and add_result.get('person_id'):
        person_id = add_result['person_id']
        
        print(f"\n--- Testing Media Gallery for {person_id} ---")
        
        # Get initial media
        print("\n--- Get Media ---")
        test_get_media(person_id)
        
        # Add media
        print("\n--- Add Media ---")
        add_media_result = test_add_media(person_id)
        
        # Get media again to see the new addition
        print("\n--- Get Media After Adding ---")
        test_get_media(person_id)
        
        # Delete media if it was added successfully
        if add_media_result.get('success') and add_media_result.get('media', {}).get('id'):
            media_id = add_media_result['media']['id']
            print(f"\n--- Delete Media {media_id} ---")
            test_delete_media(person_id, media_id)