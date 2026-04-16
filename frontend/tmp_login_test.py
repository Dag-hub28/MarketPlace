import requests
url = 'http://127.0.0.1:8000/api/auth/login/'
payload = {'username': 'nosuchuser', 'password': 'abc123'}
resp = requests.post(url, json=payload)
print('status', resp.status_code)
print(resp.text)
