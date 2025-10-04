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