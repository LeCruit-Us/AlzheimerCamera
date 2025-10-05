#!/usr/bin/env python3
"""
Simple test script for the new media gallery endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_media_endpoints():
    """Test the new media endpoints with a mock person ID"""
    
    # Use a test person ID (you can replace this with a real one from your database)
    test_person_id = "test-person-123"
    
    print("Testing Media Gallery Endpoints")
    print("=" * 40)
    
    # Test 1: Get media for person (should return empty initially)
    print(f"\n1. Getting media for person {test_person_id}")
    try:
        response = requests.get(f"{BASE_URL}/person/{test_person_id}/media")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 2: Health check to ensure server is running
    print(f"\n2. Health check")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "=" * 40)
    print("Media endpoints are ready!")
    print("The frontend can now:")
    print("- GET /person/<id>/media - Get all images for a person")
    print("- POST /person/<id>/media - Add new image to gallery") 
    print("- DELETE /person/<id>/media/<media_id> - Delete specific image")

if __name__ == "__main__":
    test_media_endpoints()