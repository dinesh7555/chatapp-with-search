from neo4j_db import get_neo4j_session

async def hybrid_chat_search(user_id: int, subject_id: str, query: str, limit: int = 10):
    """
    Run ALL strategies and merge results.

    Priority:
    1. topic
    2. keyword
    Deduplicate by chat_id (higher priority wins).
    """

    results_by_chat = {}

    # 1️⃣ Topic-based search
    topic_results = search_chats_by_topic(user_id, subject_id,query, limit)
    for r in topic_results:
        results_by_chat[r["chat_id"]] = {
            **r,
            "strategy": "topic",
            "priority": 1
        }

    # 2️⃣ Keyword-based search
    keyword_results = search_chats_by_keyword(user_id, subject_id, query, limit)
    for r in keyword_results:
        if r["chat_id"] not in results_by_chat:
            results_by_chat[r["chat_id"]] = {
                **r,
                "strategy": "keyword",
                "priority": 2
            }

    # 🔹 Sort by priority
    ordered_results = sorted(
        results_by_chat.values(),
        key=lambda x: x["priority"]
    )

    return {
        "query": query,
        "total_results": len(ordered_results),
        "results": ordered_results
    }

def search_chats_by_keyword(user_id: int, subject_id: str, keyword: str, limit: int = 10):
    """
    Keyword-based search across all chats for a user
    """
    query = """
    MATCH (u:User {user_id: $user_id})
          -[:HAS_SUBJECT]->(:Subject {subject_id: $subject_id})
          -[:HAS_CHAT]->(c:ChatSession)
          -[:HAS_MESSAGE]->(m:Message {sender: 'user'})
    WHERE toLower(m.text) CONTAINS toLower($keyword)
    WITH c, collect(m.text)[0..3] AS matchedMessages
    RETURN
        c.chat_id AS chat_id,
        COALESCE(c.title, 'New Chat') AS title,
        matchedMessages
    ORDER BY c.created_at DESC
    LIMIT $limit
    """

    with get_neo4j_session() as session:
        result = session.run(
            query,
            user_id=user_id,
            subject_id=subject_id,
            keyword=keyword,
            limit=limit
        )

        return [
            {
                "chat_id": r["chat_id"],
                "title": r["title"],
                "matched_messages": r["matchedMessages"]
            }
            for r in result
        ]

def search_chats_by_topic(user_id: int, subject_id: str, keyword: str, limit: int = 10):
    """
    Topic-based search across chats for a user
    """
    query = """
    MATCH (u:User {user_id: $user_id})
          -[:HAS_SUBJECT]->(:Subject {subject_id: $subject_id})
          -[:HAS_CHAT]->(c:ChatSession)
          -[:HAS_MESSAGE]->(m:Message)
          -[:ABOUT_TOPIC]->(t:Topic)
    WHERE toLower(t.name) CONTAINS toLower($keyword)
    WITH c, collect(DISTINCT m.text)[0..3] AS matchedMessages
    RETURN
        c.chat_id AS chat_id,
        COALESCE(c.title, 'New Chat') AS title,
        matchedMessages
    ORDER BY c.created_at DESC
    LIMIT $limit
    """

    with get_neo4j_session() as session:
        result = session.run(
            query,
            user_id=user_id,
            subject_id=subject_id,
            keyword=keyword,
            limit=limit
        )

        return [
            {
                "chat_id": r["chat_id"],
                "title": r["title"],
                "matched_messages": r["matchedMessages"]
            }
            for r in result
        ]
