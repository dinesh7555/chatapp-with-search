
import json
import os
from services.llm_service import get_ai_response_with_context

# directory where generated notes are cached
NOTES_BASE_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "notes"))
# ensure the root folder exists on import
os.makedirs(NOTES_BASE_DIR, exist_ok=True)


def _sanitize_filename(name: str) -> str:
    """Make a simple filesystem-safe name by replacing spaces and slashes."""
    return name.replace(" ", "_").replace("/", "_").replace("\\", "_")


async def generate_notes_llm(subject_id: str, topic: str) -> str:
    """
    Generate structured notes for a specific topic in a given subject.
    Format follows the TensorTonic academic style.
    """

    system_prompt = (
        f"You are a world-class academic tutor in {subject_id}. "
        f"Your task is to generate comprehensive, high-quality research-grade notes for the topic: '{topic}'. "
        "The notes MUST be strictly related to the topic and follow this EXACT structure:\n\n"
        "# {Topic}\n"
        "## Introduction\n"
        "### What is {Topic}?\n"
        "A clear, concise explanation of the core concept.\n"
        f"### Why This Matters for {subject_id} Students\n"
        "Practical importance and real-world applications.\n\n"
        "## Key Concepts\n"
        "(Create 3-5 sub-sections for specific concepts under this topic)\n"
        "### {Sub-topic Name}\n"
        "#### Definition\n"
        "Strict academic definition.\n"
        "#### Example\n"
        "A concrete, step-by-step example or visualization description.\n\n"
        "## Formulas Reference\n"
        "(Include this section ONLY if there are relevant formulas. Use LaTeX-style formatting like $E=mc^2$ or $$...$$ for blocks.)\n\n"
        "Guidelines:\n"
        "- Use Markdown for formatting.\n"
        "- Tone should be professional, encouraging, and highly educational.\n"
        "- Ensure accuracy and depth.\n"
        "- DO NOT include any meta-talk, introductions like 'Certainly!', or outs.\n"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Generate notes for the topic '{topic}' in the subject of {subject_id}."}
    ]

    notes_content = await get_ai_response_with_context(messages)
    return notes_content


async def fetch_or_generate_notes(subject_id: str, topic: str) -> str:
    """Return cached notes if they exist; otherwise generate and save them.

    Notes are stored under ``backend/notes/<subject_id>/<topic>.md``.  The
    path components are sanitised to avoid accidental traversal.
    """
    safe_subj = _sanitize_filename(subject_id)
    safe_topic = _sanitize_filename(topic)
    subj_dir = os.path.join(NOTES_BASE_DIR, safe_subj)
    os.makedirs(subj_dir, exist_ok=True)

    note_path = os.path.join(subj_dir, f"{safe_topic}.md")
    if os.path.isfile(note_path):
        # read existing file and return content
        with open(note_path, "r", encoding="utf-8") as f:
            return f.read()

    # not cached yet; call LLM and persist
    content = await generate_notes_llm(subject_id, topic)
    try:
        with open(note_path, "w", encoding="utf-8") as f:
            f.write(content)
    except Exception:
        # if writing fails we don't want to crash the whole request, just log
        # in production you'd use proper logging
        pass

    return content

