import json
import os
from services.llm_service import get_ai_response_with_context
from routes.chat import SUBJECT_TOPICS

# directory where generated mindmaps are cached
MINDMAPS_BASE_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "mindmaps"))
os.makedirs(MINDMAPS_BASE_DIR, exist_ok=True)

def _sanitize_filename(name: str) -> str:
    return name.lower().replace(" ", "_").replace("/", "_").replace("\\", "_")

async def generate_mindmap_llm(subject_id: str, topics: list) -> dict:
    """
    Generate a detailed hierarchical mindmap JSON for a subject.
    """
    system_prompt = (
        f"You are a pedagogical expert in {subject_id}. "
        "Your task is to generate a detailed hierarchical mindmap in JSON format. "
        "The mindmap should help students understand the overall structure of the subject. "
        "Include the main topics provided and for each topic, identify 3-5 key sub-topics or concepts. "
        "For each sub-topic, provide a very brief (1 sentence) description. "
        "Respond ONLY with a valid JSON object. Do not include markdown code blocks or any other text. "
        "The object MUST have the following format: "
        "{"
        '  "subject": "Subject Name", '
        '  "root": {'
        '    "id": "root", "text": "Subject Name", "children": ['
        '      {'
        '        "id": "topic_id", "text": "Topic Name", "children": ['
        '          {"id": "subtopic_id", "text": "Subtopic Name", "description": "Brief description"} '
        '        ]'
        '      }'
        '    ]'
        '  }'
        "}"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Generate a detailed mindmap for {subject_id} with these main topics: {', '.join(topics)}."}
    ]

    try:
        print(f">>> Requesting mindmap for {subject_id} with topics: {topics}")
        response_text = await get_ai_response_with_context(messages)
        # Attempt to parse json
        if isinstance(response_text, str):
            clean_text = response_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text.replace("```json", "", 1).strip()
            if clean_text.startswith("```"):
                clean_text = clean_text.replace("```", "", 1).strip()
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3].strip()
            
            print(f">>> LLM response for {subject_id} received, length: {len(clean_text)}")
            mindmap_data = json.loads(clean_text)
            
            # Basic validation
            if "root" not in mindmap_data:
                 print(f"!!! Mindmap JSON missing 'root' key for {subject_id}")
                 return {}
                 
            return mindmap_data
        else:
            print(f"!!! Mindmap LLM returned non-string response for {subject_id}")
            return {}
    except Exception as e:
        print(f"!!! Failed to generate/parse mindmap for {subject_id}: {e}")
        # print(f"DEBUG response_text: {response_text if 'response_text' in locals() else 'N/A'}")
        return {}

async def fetch_or_generate_mindmap(subject_id: str) -> dict:
    """Return cached mindmap if it exists; otherwise generate and save it."""
    safe_subj = _sanitize_filename(subject_id)
    mindmap_path = os.path.join(MINDMAPS_BASE_DIR, f"{safe_subj}.json")

    if os.path.isfile(mindmap_path):
        with open(mindmap_path, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except:
                pass

    # Not cached; get topics and call LLM
    topics = SUBJECT_TOPICS.get(subject_id, [])
    content = await generate_mindmap_llm(subject_id, topics)
    
    if content:
        try:
            with open(mindmap_path, "w", encoding="utf-8") as f:
                json.dump(content, f, indent=2)
        except Exception:
            pass

    return content
