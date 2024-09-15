import json
import jwt
import time
import requests  # This requires the `requests` library
import os
print(os.getcwd())

# Load the service account key JSON file
with open('/Users/jackson/Projets/ExoFlex/Info/supabase/functions/service-account.json', 'r') as f:
    service_account = json.load(f)

# Define the JWT payload
payload = {
    'iss': service_account['client_email'],
    'sub': service_account['client_email'],
    'aud': 'https://oauth2.googleapis.com/token',
    'iat': int(time.time()),
    'exp': int(time.time()) + 3600,
    'scope': 'https://www.googleapis.com/auth/firebase.messaging'
}

# Encode the JWT
encoded_jwt = jwt.encode(payload, service_account['private_key'], algorithm='RS256')

# Request an OAuth 2.0 token
response = requests.post('https://oauth2.googleapis.com/token', data={
    'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    'assertion': encoded_jwt
})

oauth2_token = response.json()['access_token']
print(oauth2_token)