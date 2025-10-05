from flask import jsonify
import boto3
from datetime import datetime, timedelta
import os

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.getenv('DYNAMODB_TABLE_NAME', 'alzheimer-persons'))

@app.route('/reminders', methods=['GET'])
def get_reminders():
    """Get all people as reminders"""
    try:
        response = table.scan()
        people = response.get('Items', [])
        
        reminders = []
        for person in people:
            reminders.append({
                'name': person.get('name'),
                'relationship': person.get('relationship'),
                'age': person.get('age'),
                'notes': person.get('notes'),
                'added_date': person.get('created_at')
            })
        
        return jsonify({'reminders': reminders})
    except Exception as e:
        return jsonify({'error': str(e)}), 500