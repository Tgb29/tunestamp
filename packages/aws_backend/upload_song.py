import boto3
import uuid
import json
import mimetypes

dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    song_id = str(uuid.uuid1())
    body = json.loads(event['body'])
    file_ext = body['file_ext']

    if file_ext not in ['mp3']:
        return {
            "error": 'unsupported file type'
        }

    file_name = song_id + "." + file_ext
    mime_type = mimetypes.guess_type(file_name)[0]
    response = create_presigned_url('sudocoins-art-bucket', file_name, mime_type, expiration=360)

    return {
        'file_name': file_name,
        'cdn_url': f'https://cdn.sudocoins.com/{file_name}',
        'presigned_url': response,
        'headers': {'content-type': mime_type}
    }


def create_presigned_url(bucket_name, object_name, mime_type, expiration=360):
    # Generate a pre-signed URL for the S3 object
    s3_client = boto3.client('s3')
    try:
        response = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket_name,
                'Key': object_name,
                'ACL': 'public-read',
                'ContentType': mime_type
            },
            ExpiresIn=expiration
        )
    except Exception as e:
        return None

    # The response contains the pre-signed URL
    return response
