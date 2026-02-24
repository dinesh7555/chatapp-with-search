import asyncio
from services.metrics_service import calculate_metrics, update_user_topic_state, get_user_topic_state
from neo4j_db import get_neo4j_session

async def test_metrics():
    print("Testing calculate_metrics...")
    text = "I am so confused and stressed about this physics problem!"
    scores = await calculate_metrics(text)
    print(f"Scores for '{text}': {scores}")
    
    assert "confusion_score" in scores
    assert "stress_score" in scores
    
    user_id = 999  # Test user
    topic = "mechanics"
    
    print("Testing update_user_topic_state...")
    update_user_topic_state(user_id, topic, scores)
    
    print("Testing get_user_topic_state...")
    state = get_user_topic_state(user_id, topic)
    print(f"State for user {user_id} on topic '{topic}': {state}")
    
    assert state["confusion_score"] > 0
    assert state["stress_score"] > 0
    
    print("Verification complete!")

if __name__ == "__main__":
    asyncio.run(test_metrics())
