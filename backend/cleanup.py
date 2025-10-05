import boto3
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# AWS clients
rekognition = boto3.client('rekognition')
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Configuration
BUCKET_NAME = os.getenv('S3_BUCKET_NAME', 'alzheimer-camera-faces')
COLLECTION_ID = os.getenv('REKOGNITION_COLLECTION_ID', 'alzheimer-faces')
TABLE_NAME = os.getenv('DYNAMODB_TABLE_NAME', 'alzheimer-persons')

def clear_all_data():
    """Clear all data from S3, DynamoDB, and Rekognition"""
    
    print("🧹 Starting cleanup...")
    
    # 1. Clear S3 bucket
    try:
        print("Clearing S3 bucket...")
        s3_paginator = s3.get_paginator('list_objects_v2')
        pages = s3_paginator.paginate(Bucket=BUCKET_NAME)
        
        for page in pages:
            if 'Contents' in page:
                objects = [{'Key': obj['Key']} for obj in page['Contents']]
                s3.delete_objects(Bucket=BUCKET_NAME, Delete={'Objects': objects})
                print(f"Deleted {len(objects)} objects from S3")
        
        print("✅ S3 bucket cleared")
    except Exception as e:
        print(f"❌ S3 error: {e}")
    
    # 2. Clear DynamoDB table
    try:
        print("Clearing DynamoDB table...")
        table = dynamodb.Table(TABLE_NAME)
        
        # Scan and delete all items
        response = table.scan()
        items = response.get('Items', [])
        
        with table.batch_writer() as batch:
            for item in items:
                batch.delete_item(Key={'person_id': item['person_id']})
        
        print(f"✅ Deleted {len(items)} items from DynamoDB")
    except Exception as e:
        print(f"❌ DynamoDB error: {e}")
    
    # 3. Clear Rekognition collection
    try:
        print("Clearing Rekognition collection...")
        
        # List all faces
        response = rekognition.list_faces(CollectionId=COLLECTION_ID)
        faces = response.get('Faces', [])
        
        if faces:
            face_ids = [face['FaceId'] for face in faces]
            rekognition.delete_faces(CollectionId=COLLECTION_ID, FaceIds=face_ids)
            print(f"✅ Deleted {len(face_ids)} faces from Rekognition")
        else:
            print("✅ No faces to delete from Rekognition")
            
    except Exception as e:
        print(f"❌ Rekognition error: {e}")
    
    print("🎉 Cleanup complete! All duplicates removed.")

if __name__ == '__main__':
    confirm = input("⚠️  This will delete ALL data. Type 'YES' to confirm: ")
    if confirm == 'YES':
        clear_all_data()
    else:
        print("Cleanup cancelled.")