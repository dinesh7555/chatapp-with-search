
import json
from services.llm_service import get_ai_response_with_context

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
        "- DO NOT include any meta-talk, introductions like 'Certainly!', or outros.\n"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Generate notes for the topic '{topic}' in the subject of {subject_id}."}
    ]

    notes_content = await get_ai_response_with_context(messages)
    return notes_content
