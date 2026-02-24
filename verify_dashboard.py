
# import requests
# import sys

# BASE_URL = "http://localhost:8000"

# def test_get_subjects():
#     print("Testing GET /subjects/ ...")
#     try:
#         response = requests.get(f"{BASE_URL}/subjects/")
#         if response.status_code == 200:
#             data = response.json()
#             if "subjects" in data and isinstance(data["subjects"], list):
#                 print("✅ GET /subjects/ successful")
#                 print(f"   Found {len(data['subjects'])} subjects")
#                 for subject in data['subjects']:
#                     print(f"   - {subject['name']}: {subject['topics']}")
#             else:
#                 print("❌ GET /subjects/ response invalid format")
#                 print(data)
#         else:
#             print(f"❌ GET /subjects/ failed with status {response.status_code}")
#             print(response.text)
#     except Exception as e:
#         print(f"❌ Error testing topics: {e}")

# if __name__ == "__main__":
#     test_get_subjects()
