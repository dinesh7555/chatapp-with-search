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
        f"Analyze the user's LATEST message for learning state indicators.{context_info} "
        "You are provided with several previous messages for context ONLY. "
        "Evaluate the LATEST message based on how it relates to the previous conversation. "
        "For example, if the latest message is 'explain more', look at what was previously discussed. "
        "Return valid JSON ONLY with these keys: "
        "'mastery_level' (0-100), 'misconceptions' (list of descriptive strings), "
        "'learning_pace' (0-100), 'engagement_score' (0-100), "
        "'confusion_score' (0-100), 'stress_score' (0-100). "
        "0 means none/low, 100 means extreme/full mastery. "
        "For learning_pace: 50 is average, 100 is very fast, 0 is very slow/struggling. "
        "For misconceptions: provide clear, specific descriptions of what the student is getting wrong "
        "(e.g., 'Confuses past perfect with simple past' instead of 'wrong tense'). "
        "Do not include any explanation or markdown formatting."
    )

    messages = [{"role": "system", "content": system_content}]

    # Add history for context
    if history:
        for msg in history:
            messages.append({
                "role": "user" if msg.get("sender") == "user" else "assistant",
                "content": msg.get("text", "")
            })

    # Add the current message to be evaluated
    messages.append({
        "role": "user",
        "content": text
    })

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
