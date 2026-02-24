import json
from services.llm_service import get_ai_response_with_context
from neo4j_db import get_neo4j_session
from datetime import datetime

async def calculate_metrics(text: str) -> dict:
    """
    Analyzes the user's text to determine confusion and stress scores.
    Returns a dict with 'confusion_score' and 'stress_score' (0-100).
    """
    messages = [
        {
            "role": "system",
            "content": (
                "Analyze the user's message for confusion and stress. "
                "Return valid JSON ONLY with two keys: 'confusion_score' (0-100) and 'stress_score' (0-100). "
                "0 means none, 100 means extreme. "
                "Do not include any explanation or markdown formatting."
            )
        },
        {
            "role": "user",
            "content": text
        }
    ]

    response = await get_ai_response_with_context(messages)

    try:
        # cleanup if the model adds markdown
        cleaned_response = (response or "").strip()
        cleaned_response = cleaned_response.replace("```json", "").replace("```", "")

        if not cleaned_response:
            return {"confusion_score": 0, "stress_score": 0}

        try:
            metrics = json.loads(cleaned_response)
        except json.JSONDecodeError:
            print("Invalid JSON from metrics LLM:", cleaned_response)
            return {"confusion_score": 0, "stress_score": 0}

        return {
            "confusion_score": min(100, max(0, metrics.get("confusion_score", 0))),
            "stress_score": min(100, max(0, metrics.get("stress_score", 0)))
        }
    except Exception as e:
        print(f"Error calculating metrics: {e}")
        return {"confusion_score": 0, "stress_score": 0}

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
    MATCH (u:User {user_id: $user_id})
    MERGE (t:Topic {name: $topic,subject_id: $subject_id})
    MERGE (u)-[r:HAS_STATE]->(t)
    ON CREATE SET 
        r.confusion_score = $confusion,
        r.stress_score = $stress,
        r.last_updated = $timestamp
    ON MATCH SET 
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
            confusion=scores["confusion_score"],
            stress=scores["stress_score"],
            timestamp=str(datetime.utcnow())
        )

def get_user_topic_state(user_id: int, topic: str,subject_id: str) -> dict:
    """
    Retrieves the current confusion and stress scores for a user on a specific topic.
    """
    if not topic:
        return {"confusion_score": 0, "stress_score": 0}

    query = """
    MATCH (u:User {user_id: $user_id})
    MATCH (t:Topic {name: $topic, subject_id: $subject_id})
    OPTIONAL MATCH (u)-[r:HAS_STATE]->(t)
    RETURN
        COALESCE(r.confusion_score, 0) AS confusion,
        COALESCE(r.stress_score, 0) AS stress
    """

    with get_neo4j_session() as session:
        result = session.run(query, user_id=user_id, topic=topic,subject_id=subject_id)
        record = result.single()
        
        if record:
            return {
                "confusion_score": round(record["confusion"] or 0),
                "stress_score": round(record["stress"] or 0)
            }
        
    return {"confusion_score": 0, "stress_score": 0}
