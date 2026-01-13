# def generate_chat_title(topics: list[str]) -> str:
#     if not topics:
#         return "New Chat"

#     # Take first 2–3 topics
#     return " · ".join(topics[:3])

import requests
import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# MODEL_NAME = "mistralai/mixtral-8x7b-instruct"
MODEL_NAME = "meta-llama/llama-3-8b-instruct"

async def generate_title_from_messages(messages: list[str]) -> str:

    if not OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_API_KEY is not set") 
    messages = [
        {
            "role": "system",
            "content": (
                "You are a conversation title generator. "
                "Summarize the topic in 3 to 6 words. "
                "Return ONLY the title. "
                "Do NOT explain. "
                "Do NOT use full sentences."
            )
        }
    ] + [
        {"role": "user", "content": msg}
        for msg in messages
    ]

    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "max_tokens": 20,        
        "temperature": 0.2       
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.post(
        OPENROUTER_URL,
        headers=headers,
        json=payload,
        timeout=20
    )

    response.raise_for_status()
    data = response.json()

    title = data["choices"][0]["message"]["content"]

    # sanitize
    title = title.strip().split("\n")[0]
    title = title.replace('"', "").replace("'", "")
    title = " ".join(title.split()[:6])

    return title

