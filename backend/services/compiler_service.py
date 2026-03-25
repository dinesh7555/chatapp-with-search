import httpx
import os
from dotenv import load_dotenv

load_dotenv()

ONLINE_COMPILER_API_KEY = os.getenv("ONLINE_COMPILER_API_KEY")
BASE_URL = "https://api.onlinecompiler.io/api/"

async def run_java_code(code: str, stdin: str = ""):
    """
    Executes Java code using onlinecompiler.io API.
    """
    url = f"{BASE_URL}run-code-sync/"
    headers = {
        "Authorization": ONLINE_COMPILER_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "compiler": "openjdk-25",
        "code": code,
        "input": stdin
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print(f"HTTP Error: {e.response.text}")
            return {"error": f"API Error: {e.response.status_code}", "status": "error"}
        except Exception as e:
            print(f"Connection Error: {e}")
            return {"error": f"Connection Error: {str(e)}", "status": "error"}

async def get_supported_compilers():
    """
    Fetches the list of supported compilers from onlinecompiler.io.
    """
    url = f"{BASE_URL}compilers/"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10)
            return response.json()
        except Exception as e:
            print(f"Error fetching compilers: {e}")
            return []
