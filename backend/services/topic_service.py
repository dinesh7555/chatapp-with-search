import json
from services.llm_service import stream_ai_response

async def extract_topics_llm(text: str) -> list[str]:
    """
    Extract 2–4 concise topics from user text.
    """

    messages = [
        {
            "role": "system",
            "content": (
                "Extract 2 to 4 short, high-level topics from the user's message. "
                "Return ONLY a JSON array of strings. "
                "No explanation, no markdown."
            )
        },
        {
            "role": "user",
            "content": text
        }
    ]

    response = await stream_ai_response(messages)

    try:
        topics = json.loads(response)
        if isinstance(topics, list):
            return [t.strip() for t in topics][:4]
    except Exception:
        pass

    return []
