#!/usr/bin/env python3
"""
Test the updated announcement functionality
"""
import requests
import json

def test_announcement():
    """Test the announcement generation"""
    
    # Test data - simulating a person recognition
    test_person = {
        'name': 'John Smith',
        'relationship': 'son',
        'age': '35'
    }
    
    # Expected announcement
    expected = f"This is {test_person['name']}, your {test_person['relationship']}, age {test_person['age']}."
    print(f"Expected announcement: {expected}")
    
    # Test the TTS endpoint directly
    try:
        response = requests.get('http://localhost:8000/test-tts')
        if response.status_code == 200:
            result = response.json()
            print(f"TTS test result: {result.get('success')}")
            if result.get('audio'):
                print(f"Audio generated: {len(result['audio'])} characters")
        else:
            print(f"TTS test failed: {response.status_code}")
    except Exception as e:
        print(f"TTS test error: {e}")

if __name__ == "__main__":
    test_announcement()