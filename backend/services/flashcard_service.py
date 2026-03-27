
import json
import os
from services.llm_service import get_ai_response_with_context

# directory where generated flashcards are cached
FLASHCARDS_BASE_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "flashcards"))
# ensure the root folder exists on import
os.makedirs(FLASHCARDS_BASE_DIR, exist_ok=True)


def _sanitize_filename(name: str) -> str:
    """Make a simple filesystem-safe name by replacing spaces and slashes."""
    return name.replace(" ", "_").replace("/", "_").replace("\\", "_")


async def generate_flashcards_llm(subject_id: str) -> list:
    """
    Generate a list of flashcards for a specific subject.
    Returns a list of dicts: [{"question": "...", "answer": "..."}]
    """

    system_prompt = (
        f"You are a world-class academic tutor in {subject_id}. "
        f"Your task is to generate 10 high-quality flashcards for the subject: '{subject_id}'. "
        "Each flashcard must consist of a challenging question and a clear, concise answer. "
        "The output MUST be a valid JSON list of objects with 'question' and 'answer' keys. "
        "DO NOT include any meta-talk, markdown code blocks (like ```json), or introductions. Just the raw JSON array.\n\n"
        "Example format:\n"
        '[\n  {"question": "What is Newton\'s First Law?", "answer": "An object at rest stays at rest..."}, ...\n]'
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Generate 10 flashcards for {subject_id}."}
    ]

    response_text = await get_ai_response_with_context(messages)
    
    # Try to parse JSON. Handle cases where LLM might include markdown blocks.
    try:
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        flashcards = json.loads(response_text)
        return flashcards
    except Exception as e:
        print(f"Error parsing flashcards JSON: {e}")
        # Return a fallback if parsing fails
        return [
            {"question": "Error generating flashcards", "answer": "Please try again later."}
        ]


async def fetch_or_generate_flashcards(subject_id: str) -> list:
    """Return cached flashcards if they exist; otherwise generate and save them."""
    safe_subj = _sanitize_filename(subject_id)
    os.makedirs(FLASHCARDS_BASE_DIR, exist_ok=True)

    cache_path = os.path.join(FLASHCARDS_BASE_DIR, f"{safe_subj}.json")
    if os.path.isfile(cache_path):
        with open(cache_path, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except:
                pass

    # not cached yet; call LLM and persist
    flashcards = await generate_flashcards_llm(subject_id)
    try:
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(flashcards, f, indent=2)
    except Exception:
        pass

    return flashcards
