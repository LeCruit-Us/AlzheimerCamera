import boto3
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def setup_aws_resources():
    """Setup AWS Rekognition collection, S3 bucket, and DynamoDB table"""
    
    rekognition = boto3.client('rekognition')
    s3 = boto3.client('s3')
    dynamodb = boto3.resource('dynamodb')
    
    collection_id = os.getenv('REKOGNITION_COLLECTION_ID', 'alzheimer-faces')
    bucket_name = os.getenv('S3_BUCKET_NAME', 'alzheimer-camera-faces')
    table_name = os.getenv('DYNAMODB_TABLE_NAME', 'alzheimer-persons')
    
    try:
        # Create Rekognition collection
        rekognition.create_collection(CollectionId=collection_id)
        print(f"Created Rekognition collection: {collection_id}")
    except rekognition.exceptions.ResourceAlreadyExistsException:
        print(f"Collection {collection_id} already exists")
    
    try:
        # Create S3 bucket
        region = os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
        if region == 'us-east-1':
            s3.create_bucket(Bucket=bucket_name)
        else:
            s3.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={'LocationConstraint': region}
            )
        print(f"Created S3 bucket: {bucket_name}")
    except Exception as e:
        if "BucketAlreadyExists" in str(e) or "BucketAlreadyOwnedByYou" in str(e):
            print(f"Bucket {bucket_name} already exists")
        else:
            print(f"Error creating bucket: {e}")
    
    try:
        # Create DynamoDB table
        table = dynamodb.create_table(
            TableName=table_name,
            KeySchema=[{'AttributeName': 'person_id', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'person_id', 'AttributeType': 'S'}],
            BillingMode='PAY_PER_REQUEST'
        )
        table.wait_until_exists()
        print(f"Created DynamoDB table: {table_name}")
    except Exception as e:
        if "ResourceInUseException" in str(e):
            print(f"Table {table_name} already exists")
        else:
            print(f"Error creating table: {e}")

if __name__ == '__main__':
    setup_aws_resources()