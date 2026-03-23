import requests
try:
    response = requests.get("http://localhost:8000/docs", timeout=5)
    print(f"Status: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
