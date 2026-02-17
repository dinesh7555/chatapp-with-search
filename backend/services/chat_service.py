from neo4j_db import get_neo4j_session
import uuid
from datetime import datetime



def create_chat_session(user_id: int, subject_id: str):
    chat_id = str(uuid.uuid4())

    query = """
    MERGE (u:User {user_id: $user_id})

    MERGE (s:Subject {subject_id: $subject_id})
    ON CREATE SET s.name = $subject_id

    MERGE (u)-[:HAS_SUBJECT]->(s)

    CREATE (c:ChatSession {
        chat_id: $chat_id,
        created_at: $created_at
    })

    CREATE (s)-[:HAS_CHAT]->(c)
    """

    with get_neo4j_session() as session:
        session.run(
            query,
            user_id=user_id,
            subject_id=subject_id,
            chat_id=chat_id,
            created_at=str(datetime.utcnow())
        )

    return chat_id



def store_message(chat_id: str, user_id: int,sender: str, text: str ,subject_id: str):
    query = """
    MATCH (u:User {user_id: $user_id})
      -[:HAS_SUBJECT]->(:Subject {subject_id: $subject_id})
      -[:HAS_CHAT]->(c:ChatSession {chat_id: $chat_id})

    OPTIONAL MATCH (c)-[oldRel:LAST_MESSAGE]->(last:Message)

    WITH c, last, oldRel, COALESCE(last.sequence, 0) + 1 AS nextSeq

    CREATE (m:Message {
        sender: $sender,
        text: $text,
        timestamp: $timestamp,
        sequence: nextSeq
    })

    FOREACH (_ IN CASE WHEN last IS NOT NULL THEN [1] ELSE [] END |
        CREATE (last)-[:NEXT]->(m)
    )

    FOREACH (_ IN CASE WHEN oldRel IS NOT NULL THEN [1] ELSE [] END |
        DELETE oldRel
    )

    CREATE (c)-[:LAST_MESSAGE]->(m)
    CREATE (c)-[:HAS_MESSAGE]->(m)

    RETURN m.sequence AS sequence
    """

    with get_neo4j_session() as session:
        result = session.run(
            query,
            user_id=user_id,
            chat_id=chat_id,
            sender=sender,
            text=text,
            subject_id=subject_id,
            timestamp=str(datetime.utcnow())
        )

        record = result.single()
        return record["sequence"]

def get_chat_history(chat_id: str, user_id: int, subject_id: str):
    query = """
    MATCH (u:User {user_id: $user_id})
      -[:HAS_SUBJECT]->(:Subject {subject_id: $subject_id})
      -[:HAS_CHAT]->(c:ChatSession {chat_id: $chat_id})
      -[:HAS_MESSAGE]->(m:Message)
    RETURN m
    ORDER BY m.sequence ASC
    """

    messages = []

    with get_neo4j_session() as session:
        result = session.run(
            query,
            user_id=user_id,
            chat_id=chat_id,
            subject_id=subject_id
        )

        for record in result:
            m = record["m"]
            messages.append({
                "sender": m["sender"],
                "text": m["text"],
                "timestamp": m["timestamp"],
                "sequence": m["sequence"]
            })

    return messages

def link_message_to_topics(
    chat_id: str,
    user_id: int,
    message_sequence: int,
    topics: list[str],
    subject_id: str
):
    if not topics:
        return

    query = """
    MATCH (u:User {user_id: $user_id})
          -[:HAS_SUBJECT]->(:Subject {subject_id: $subject_id})
          -[:HAS_CHAT]->(c:ChatSession {chat_id: $chat_id})
          -[:HAS_MESSAGE]->(m:Message {sequence: $sequence})

    UNWIND $topics AS topicName
    MERGE (t:Topic {name: topicName, user_id: $user_id})
    MERGE (m)-[:ABOUT_TOPIC]->(t)
    """

    with get_neo4j_session() as session:
        session.run(
            query,
            user_id=user_id,
            chat_id=chat_id,
            subject_id=subject_id,
            sequence=message_sequence,
            topics=topics
        )

def get_first_user_messages(chat_id: str, user_id: int, subject_id: str, limit: int = 3):
    """
    Returns the first N user messages in a chat (ordered by sequence).
    """
    query = """
    MATCH (u:User {user_id: $user_id})
          -[:HAS_SUBJECT]->(:Subject {subject_id: $subject_id})
          -[:HAS_CHAT]->(c:ChatSession {chat_id: $chat_id})
          -[:HAS_MESSAGE]->(m:Message {sender: 'user'})
    RETURN m.text AS text
    ORDER BY m.sequence ASC
    LIMIT $limit
    """

    messages = []

    with get_neo4j_session() as session:
        result = session.run(
            query,
            user_id=user_id,
            chat_id=chat_id,
            limit=limit,
            subject_id=subject_id
        )

        for record in result:
            messages.append(record["text"])

    return messages


def update_chat_title_if_empty(
    chat_id: str,
    user_id: int,
    title: str,
    subject_id: str
):
    query = """
    MATCH (u:User {user_id: $user_id})
          -[:HAS_SUBJECT]->(:Subject {subject_id: $subject_id})
          -[:HAS_CHAT]->(c:ChatSession {chat_id: $chat_id})
    WHERE c.title IS NULL
    SET c.title = $title
    """
    with get_neo4j_session() as session:
        session.run(
            query,
            user_id=user_id,
            chat_id=chat_id,
            title=title,
            subject_id=subject_id
        )

def get_user_chat_sessions(user_id: int,subject_id: str):
    query = """
    MATCH (u:User {user_id: $user_id})
          -[:HAS_SUBJECT]->(s:Subject {subject_id: $subject_id})
          -[:HAS_CHAT]->(c:ChatSession)
    OPTIONAL MATCH (c)-[:HAS_MESSAGE]->(m:Message)
    WITH c, count(m) AS messageCount
    RETURN
        c.chat_id AS chat_id,
        COALESCE(c.title, 'New Chat') AS title,
        c.created_at AS created_at,
        messageCount
    ORDER BY c.created_at DESC
    """

    sessions = []

    with get_neo4j_session() as session:
        result = session.run(query, user_id=user_id, subject_id=subject_id)

        for record in result:
            sessions.append({
                "chat_id": record["chat_id"],
                "title": record["title"],
                "created_at": record["created_at"],
                "message_count": record["messageCount"]
            })

    return sessions

