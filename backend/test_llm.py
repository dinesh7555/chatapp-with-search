import asyncio
import os
from dotenv import load_dotenv

load_dotenv(".env.docker")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

import httpx

async def test_api():
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "meta-llama/llama-3-8b-instruct",
        "messages": [{"role": "user", "content": "Hello!"}],
        "stream": True
    }

    print(f"Key used: {OPENROUTER_API_KEY[:10]}...")
    async with httpx.AsyncClient() as client:
        async with client.stream("POST", "https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload) as response:
            print(f"Status: {response.status_code}")
            await response.aread()
            print(f"Body: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_api())
