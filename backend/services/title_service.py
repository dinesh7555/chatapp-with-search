# def generate_chat_title(topics: list[str]) -> str:
#     if not topics:
#         return "New Chat"

#     # Take first 2–3 topics
#     return " · ".join(topics[:3])


from services.llm_service import get_ai_response_with_context


async def generate_title_from_messages(messages: list[str]) -> str:
    """
    Generate a short chat title from the first 3 user messages.
    """
    if len(messages) < 3:
        return "New Chat"

    llm_messages = [
        {
            "role": "system",
            "content": (
                "You are a chat title generator. "
                "Generate a short, clear chat title."
            )
        },
        {
            "role": "user",
            "content": (
                "Create a short chat title (maximum 5 words).\n"
                "Do NOT use quotes.\n"
                "Do NOT end with punctuation.\n\n"
                f"User messages:\n"
                f"1. {messages[0]}\n"
                f"2. {messages[1]}\n"
                f"3. {messages[2]}"
            )
        }
    ]

    title = await get_ai_response_with_context(llm_messages)
    return title.strip()

