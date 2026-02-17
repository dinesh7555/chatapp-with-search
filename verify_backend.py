import requests

BASE_URL = "http://localhost:8000"

def test_backend():
    # 1. Register
    username = "testuser_topics"
    password = "password123"
    email = "testuser_topics@example.com"
    
    print("Registering...")
    resp = requests.post(f"{BASE_URL}/auth/register", json={
        "username": username,
        "password": password,
        "email": email,
        "role": "student"
    })
    if resp.status_code == 200:
        print("Registered successfully")
    elif resp.status_code == 400 and "already exists" in resp.text:
         print("User already exists, proceeding to login")
    else:
        print(f"Registration failed: {resp.text}")
        return

    # 2. Login
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "username": username,
        "password": password
    })
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
    
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in")

    # 3. Get Topics
    print("Fetching topics for physics...")
    resp = requests.get(f"{BASE_URL}/chat/topics?subject_id=physics", headers=headers)
    if resp.status_code == 200:
        print(f"Topics: {resp.json()}")
    else:
        print(f"Failed to get topics: {resp.text}")

    # 4. Start Chat with Topic
    print("Starting chat with topic 'Thermodynamics'...")
    resp = requests.post(f"{BASE_URL}/chat/start?subject_id=physics&topic=Thermodynamics", headers=headers)
    if resp.status_code == 200:
        print(f"Chat created: {resp.json()}")
    else:
        print(f"Failed to start chat: {resp.text}")

if __name__ == "__main__":
    test_backend()
