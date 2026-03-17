import httpx
import os
from dotenv import load_dotenv
import json

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# MODEL_NAME = "mistralai/mixtral-8x7b-instruct"
MODEL_NAME = "meta-llama/llama-3-8b-instruct"

async def get_ai_response_with_context(messages: list) -> str:
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
    # Defensive check for choices
    choices = data.get("choices")
    if choices and isinstance(choices, list) and len(choices) > 0:
        message = choices[0].get("message")
        if message and isinstance(message, dict):
            return message.get("content", "")
    
    # Fallback or error logging
    print(f"Unexpected API response format: {data}")
    return "I'm sorry, I encountered an error processing your request."

async def generate_quiz_from_history(history: list, subject: str):
    messages = [
        {
            "role": "system",
            "content": (
                f"You are a strict JSON quiz generator for the subject: {subject}. "
                "Based on the conversation history provided, generate a quiz of 3-5 questions "
                "that test the user's understanding of the concepts ALREADY DISCUSSED AND EXPLAINED. "
                "IMPORTANT: If the very last message in the history introduces a new question or topic (e.g., 'What is Abstraction?'), DO NOT include that in the quiz, as it hasn't been discussed yet. Focus only on the 'Previous Topic' that was clearly explained. "
                "The quiz must be a mix of Multiple Choice Questions (70-100%) and Short Answer Conceptual Questions (0-30%). "
                "Respond ONLY with a valid JSON array of objects. Do not include markdown code blocks or any other text. "
                "For MCQ, the object MUST have the following format: "
                '{"type": "mcq", "question": "The question text", "options": ["option A", "option B", "option C", "option D"], "answer": "The exact string of the correct option", "explanation": "Brief explanation of why the answer is correct"}. '
                "For Short Answer (Normal type), the object MUST have the following format (NO options field): "
                '{"type": "normal", "question": "The open-ended or reasoning question text", "answer": "The expected key points that should be in the correct answer", "explanation": "Detailed explanation of the concept"}'
            )
        }
    ]

    # Convert history dicts into a single string for context
    history_text = "\n".join([f"{msg['sender'].upper()}: {msg['text']}" for msg in history])
    messages.append({
        "role": "user",
        "content": f"Conversation history:\n{history_text}\n\nGenerate the JSON quiz now."
    })

    try:
        response_text = await get_ai_response_with_context(messages)
        # Attempt to parse json
        # Sometimes models wrap in ```json ... ```, so clean it
        if isinstance(response_text, str):
            clean_text = response_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text.replace("```json", "", 1).strip()
            if clean_text.startswith("```"):
                clean_text = clean_text.replace("```", "", 1).strip()
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3].strip()
            
            quiz_data = json.loads(clean_text)
            return quiz_data
        else:
            return []
    except Exception as e:
        print(f"Failed to generate/parse quiz: {e}")
        return []


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

async def evaluate_quiz_answers(quiz_results: list, subject: str) -> str:
    messages = [
        {
            "role": "system",
            "content": (
                f"You are a helpful {subject} tutor. The student just took a quiz based on your recent conversation. "
                "You need to evaluate the student's performance based on the provided results. "
                "For Multiple Choice Questions, point out why incorrect answers were wrong and provide the correct explanation. "
                "For Short Answer / Normal questions, evaluate if the student's answer captures the main concepts, explain any missing concepts, and provide constructive feedback. "
                "Provide an overall encouraging summary at the end. "
                "Format your response neatly in Markdown."
            )
        }
    ]

    # Convert results dict to a text format for the LLM
    results_text = "Quiz Results:\n\n"
    for i, q in enumerate(quiz_results):
        ans = q.get('answer') or q.get('correct_answer') or "N/A"
        results_text += f"Question {i+1} ({q.get('type', 'mcq')}): {q.get('question')}\n"
        results_text += f"Student's Answer: {q.get('user_answer', 'No Answer')}\n"
        results_text += f"Correct/Expected Answer: {ans}\n"
        results_text += f"Explanation: {q.get('explanation', 'N/A')}\n\n"

    messages.append({
        "role": "user",
        "content": f"Please evaluate these quiz results and provide feedback to the student:\n\n{results_text}"
    })

    try:
        response_text = await get_ai_response_with_context(messages)
        if not isinstance(response_text, str):
            response_text = str(response_text)
        return response_text
    except Exception as e:
        print(f"Failed to evaluate quiz: {e}")
        return "I received your quiz results, but I had trouble evaluating them right now. Please continue the chat!"


async def detect_topic_shift(history: list, current_message: str) -> bool:
    """
    Uses LLM to detect if the user's message indicates a desire to change the topic 
    or if they have concluded the discussion on the current topic.
    Analyzes the conceptual continuity between previous history and the current message.
    """
    # Format recent history for context (last 10 messages to include both student and AI turns)
    context_str = "\n".join([f"{m['sender'].upper()}: {m['text']}" for m in history[-10:]])
    
    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert at conversation analysis. Your task is to determine if a student "
                "is pivoting to a NEW concept or sub-topic that is different from what was just being discussed. "
                "Respond ONLY with 'YES' if they are transitioning to a COMPLETELY NEW conceptual area (e.g., shifting from 'Polymorphism' to 'Abstraction', "
                "or from 'Arrays' to 'Linked Lists'), or if they have clearly concluded the current sub-topic. "
                "Respond 'NO' if they are still exploring, clarifying, or asking questions about the same concept. "
                "Be strict: Only say 'YES' if it is a clear opening question about a different topic or an explicit statement of conclusion. "
                "If they are just digging deeper into the current topic, say 'NO'."
            )
        },
        {"role": "user", "content": f"Conversation History:\n{context_str}\n\nNew Message: {current_message}"}
    ]
    
    try:
        response = await get_ai_response_with_context(messages)
        if isinstance(response, str) and "YES" in response.upper():
            return True
        return False
    except Exception as e:
        print(f"Error detecting topic shift: {e}")
        return False
