import httpx
import os
from dotenv import load_dotenv
import json

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# MODEL_NAME = "mistralai/mixtral-8x7b-instruct"
MODEL_NAME = "meta-llama/llama-3-8b-instruct"





async def get_ai_response_with_context(messages: list):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": messages
    }
    # print("=======================")
    # print(messages)
    async with httpx.AsyncClient() as client:
        response = await client.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=60
        )

    data = response.json()
    
    # Defensive check for choices
    if "choices" in data and len(data["choices"]) > 0:
        return data["choices"][0]["message"]["content"]
    
    # Fallback or error logging
    print(f"Unexpected API response format: {data}")
    return "I'm sorry, I encountered an error processing your request."

async def stream_ai_response(messages: list):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": True
    }

    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream(
            "POST",
            OPENROUTER_URL,
            headers=headers,
            json=payload
        ) as response:

            async for line in response.aiter_lines():
                if not line or not line.startswith("data:"):
                    continue

                data_str = line.replace("data: ", "").strip()
                if data_str == "[DONE]":
                    break

                try:
                    chunk = json.loads(data_str)
                    
                    # Defensive check for choices and delta
                    if "choices" in chunk and len(chunk["choices"]) > 0:
                        delta = chunk["choices"][0].get("delta", {})
                        if "content" in delta:
                            yield delta["content"]
                except json.JSONDecodeError:
                    print(f"Failed to decode JSON chunk: {data_str}")
                    continue
                except Exception as e:
                    print(f"Error processing chunk: {e}")
                    continue

