from neo4j_db import get_neo4j_session
import uuid
from datetime import datetime

class MyNoteService:
    @staticmethod
    def create_note(user_id: str, title: str, content: str, subject_id: str):
        # Normalize the subject_id (replace spaces with underscores, lowercase)
        normalized_subject_id = subject_id.replace(" ", "_").lower()
        
        query = """
        MERGE (u:Student {id: $user_id})
        MERGE (s:Subject {name: $subject_id})
        
        CREATE (n:MyNote {
            id: randomUUID(),
            title: $title,
            content: $content,
            created_at: toString(datetime())
        })
        CREATE (u)-[:HAS_NOTE]->(n)
        CREATE (n)-[:BELONGS_TO]->(s)
        
        RETURN n {.id, .title, .content, .created_at, subject_id: s.name}
        """
        with get_neo4j_session() as session:
            result = session.run(query, user_id=user_id, title=title, content=content, subject_id=normalized_subject_id).single()
            return result[0] if result else None

    @staticmethod
    def get_user_notes(user_id: str, subject_id: str = None):
        if subject_id:
            query = """
            MATCH (u:Student {id: $user_id})-[:HAS_NOTE]->(n:MyNote)-[:BELONGS_TO]->(s:Subject)
            WHERE toLower(s.name) = toLower($subject_id)
            RETURN n {.id, .title, .content, .created_at, subject_id: s.name}
            ORDER BY n.created_at DESC
            """
            params = {"user_id": user_id, "subject_id": subject_id}
        else:
            query = """
            MATCH (u:Student {id: $user_id})-[:HAS_NOTE]->(n:MyNote)-[:BELONGS_TO]->(s:Subject)
            RETURN n {.id, .title, .content, .created_at, subject_id: s.name}
            ORDER BY n.created_at DESC
            """
            params = {"user_id": user_id}

        with get_neo4j_session() as session:
            result = session.run(query, **params)
            return [record[0] for record in result]

    @staticmethod
    def update_note(user_id: str, note_id: str, title: str, content: str):
        query = """
        MATCH (u:Student {id: $user_id})-[:HAS_NOTE]->(n:MyNote {id: $note_id})-[:BELONGS_TO]->(s:Subject)
        SET n.title = $title, n.content = $content
        RETURN n {.id, .title, .content, .created_at, subject_id: s.name}
        """
        with get_neo4j_session() as session:
            result = session.run(query, user_id=user_id, note_id=note_id, title=title, content=content).single()
            return result[0] if result else None

    @staticmethod
    def delete_note(user_id: str, note_id: str):
        query = """
        MATCH (u:Student {id: $user_id})-[:HAS_NOTE]->(n:MyNote {id: $note_id})
        DETACH DELETE n
        RETURN true AS success
        """
        with get_neo4j_session() as session:
            result = session.run(query, user_id=user_id, note_id=note_id).single()
            return result and result[0]
