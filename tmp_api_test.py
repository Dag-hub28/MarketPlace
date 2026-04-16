import requests
url = 'http://127.0.0.1:8000/api/auth/register/'
payload = {
    'username': 'testuser',
    'email': 'test@example.com',
    'password': 'Test1234',
    'role': 'client',
}
response = requests.post(url, json=payload)
print('status', response.status_code)
print(response.text)
