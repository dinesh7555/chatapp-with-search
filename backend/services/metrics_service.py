import json
from services.llm_service import get_ai_response_with_context
from neo4j_db import get_neo4j_session
from datetime import datetime

async def calculate_metrics(text: str, subject_id: str = None, topic: str = None, history: list = None) -> dict:
    """
    Analyzes the user's text to determine learning state metrics.
    Includes subject, topic, and chat history context if available for better accuracy.
    """
    context_info = ""
    if subject_id and topic:
        context_info = f" The student is currently studying '{topic}' in the subject '{subject_id}'."

    system_content = (
        "You are an educational analytics engine. Your task is to analyze a student's latest message "
        "in the context of their conversation history and provide learning state metrics in JSON format."
    )

    user_prompt = f"### TASK: Analyze the LATEST message for the following metrics:\n"
    user_prompt += "- mastery_level (0-100)\n"
    user_prompt += "- misconceptions (list of strings)\n"
    user_prompt += "- learning_pace (0-100)\n"
    user_prompt += "- engagement_score (0-100)\n"
    user_prompt += "- confusion_score (0-100)\n"
    user_prompt += "- stress_score (0-100)\n\n"
    user_prompt += "### CONTEXT:\n"
    user_prompt += f"- Subject: {subject_id or 'Unknown'}\n"
    user_prompt += f"- Topic: {topic or 'Unknown'}\n\n"
    
    user_prompt += "### CONVERSATION HISTORY (for context only):\n"
    if history:
        for msg in history:
            role = "Student" if msg.get("sender") == "user" else "Tutor"
            user_prompt += f"{role}: {msg.get('text', '')}\n"
    else:
        user_prompt += "(No history available)\n"
    
    user_prompt += f"\n### LATEST MESSAGE TO ANALYZE:\nStudent: {text}\n\n"
    user_prompt += "### RESPONSE INSTRUCTIONS:\n"
    user_prompt += "Return ONLY valid JSON. No conversational filler, no markdown blocks, no explanations.\n"
    user_prompt += "Example format: {\"mastery_level\": 45, \"misconceptions\": [\"example\"], ...}"

    messages = [
        {"role": "system", "content": system_content},
        {"role": "user", "content": user_prompt}
    ]

    response = await get_ai_response_with_context(messages)

    try:
        # cleanup if the model adds markdown
        cleaned_response = (response or "").strip()
        cleaned_response = cleaned_response.replace("```json", "").replace("```", "")

        if not cleaned_response:
            return {
                "mastery_level": 0, "misconceptions": [], "learning_pace": 50,
                "engagement_score": 50, "confusion_score": 0, "stress_score": 0
            }

        try:
            metrics = json.loads(cleaned_response)
        except json.JSONDecodeError:
            print("Invalid JSON from metrics LLM:", cleaned_response)
            return {
                "mastery_level": 0, "misconceptions": [], "learning_pace": 50,
                "engagement_score": 50, "confusion_score": 0, "stress_score": 0
            }

        return {
            "mastery_level": min(100, max(0, metrics.get("mastery_level", 0))),
            "misconceptions": metrics.get("misconceptions", []),
            "learning_pace": min(100, max(0, metrics.get("learning_pace", 50))),
            "engagement_score": min(100, max(0, metrics.get("engagement_score", 50))),
            "confusion_score": min(100, max(0, metrics.get("confusion_score", 0))),
            "stress_score": min(100, max(0, metrics.get("stress_score", 0)))
        }
    except Exception as e:
        print(f"Error calculating metrics: {e}")
        return {
            "mastery_level": 0, "misconceptions": [], "learning_pace": 50,
            "engagement_score": 50, "confusion_score": 0, "stress_score": 0
        }

def update_user_topic_state(user_id: int, topic: str,subject_id: str,scores: dict):
    """
    Updates the (User)-[:HAS_STATE]->(Topic) relationship with new scores.
    We'll use a weighted average or simple replacement. 
    For now, let's just update to the latest assessment or maybe a rolling average.
    Let's stick to updating to the latest for immediate feedback loop, 
    or maybe an average of previous + current.
    Let's do: new_score = (old_score * 0.7) + (current_score * 0.3) to smooth it out?
    Or just pure update as per request "constantly updated based on new message".
    Let's do a smoothed update to avoid jumping too wildly.
    """
    if not topic:
        return

    query = """
    MERGE (u:User {user_id: $user_id})
    MERGE (t:Topic {name: $topic,subject_id: $subject_id})
    MERGE (u)-[r:HAS_STATE]->(t)
    ON CREATE SET 
        r.mastery_level = $mastery,
        r.misconceptions = $misconceptions,
        r.learning_pace = $pace,
        r.engagement_score = $engagement,
        r.confusion_score = $confusion,
        r.stress_score = $stress,
        r.last_updated = $timestamp
    ON MATCH SET 
        r.mastery_level = (COALESCE(r.mastery_level, 0) * 0.7) + ($mastery * 0.3),
        r.misconceptions = $misconceptions,
        r.learning_pace = (COALESCE(r.learning_pace, 50) * 0.7) + ($pace * 0.3),
        r.engagement_score = (COALESCE(r.engagement_score, 50) * 0.7) + ($engagement * 0.3),
        r.confusion_score = (COALESCE(r.confusion_score, 0) * 0.7) + ($confusion * 0.3),
        r.stress_score = (COALESCE(r.stress_score, 0) * 0.7) + ($stress * 0.3),
        r.last_updated = $timestamp
    """

    with get_neo4j_session() as session:
        session.run(
            query,
            user_id=user_id,
            topic=topic,
            subject_id=subject_id,
            mastery=scores.get("mastery_level", 0),
            misconceptions=scores.get("misconceptions", []),
            pace=scores.get("learning_pace", 50),
            engagement=scores.get("engagement_score", 50),
            confusion=scores.get("confusion_score", 0),
            stress=scores.get("stress_score", 0),
            timestamp=str(datetime.utcnow())
        )

def get_user_topic_state(user_id: int, topic: str,subject_id: str) -> dict:
    """
    Retrieves the current confusion and stress scores for a user on a specific topic.
    """
    if not topic:
        return {
            "mastery_level": 0, "misconceptions": [], "learning_pace": 50,
            "engagement_score": 50, "confusion_score": 0, "stress_score": 0
        }

    query = """
    MATCH (u:User {user_id: $user_id})
    MATCH (t:Topic {name: $topic, subject_id: $subject_id})
    OPTIONAL MATCH (u)-[r:HAS_STATE]->(t)
    RETURN
        COALESCE(r.mastery_level, 0) AS mastery,
        COALESCE(r.misconceptions, []) AS misconceptions,
        COALESCE(r.learning_pace, 50) AS pace,
        COALESCE(r.engagement_score, 50) AS engagement,
        COALESCE(r.confusion_score, 0) AS confusion,
        COALESCE(r.stress_score, 0) AS stress
    """

    with get_neo4j_session() as session:
        result = session.run(query, user_id=user_id, topic=topic, subject_id=subject_id)
        record = result.single()
        
        if record:
            return {
                "mastery_level": round(record["mastery"] or 0),
                "misconceptions": record["misconceptions"] or [],
                "learning_pace": round(record["pace"] or 50),
                "engagement_score": round(record["engagement"] or 50),
                "confusion_score": round(record["confusion"] or 0),
                "stress_score": round(record["stress"] or 0)
            }
        
    return {
        "mastery_level": 0, "misconceptions": [], "learning_pace": 50,
        "engagement_score": 50, "confusion_score": 0, "stress_score": 0
    }
