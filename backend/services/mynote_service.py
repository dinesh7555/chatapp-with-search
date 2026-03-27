from neo4j_db import get_neo4j_session
import uuid
from datetime import datetime

class MyNoteService:
    @staticmethod
    def create_note(user_id: str, title: str, subject_id: str):
        query = """
        MERGE (u:Student {id: $user_id})
        // Merge subject to ensure it exists
        MERGE (s:Subject {name: $subject_id})
        
        CREATE (n:MyNote {
            id: randomUUID(),
            title: $title,
            created_at: toString(datetime())
        })
        CREATE (u)-[:HAS_NOTE]->(n)
        CREATE (n)-[:BELONGS_TO]->(s)
        
        RETURN n {.id, .title, .created_at, subject_id: s.name}
        """
        with get_neo4j_session() as session:
            result = session.run(query, user_id=user_id, title=title, subject_id=subject_id).single()
            if result and result[0]:
                note_data = result[0]
                note_data['mini_notes'] = []
                return note_data
            return None

    @staticmethod
    def get_user_notes(user_id: str, subject_id: str = None):
        if subject_id:
            query = """
            MATCH (u:Student {id: $user_id})-[:HAS_NOTE]->(n:MyNote)-[:BELONGS_TO]->(s:Subject)
            WHERE toLower(s.name) = toLower($subject_id)
            OPTIONAL MATCH (n)-[:HAS_MININOTE]->(m:MiniNote)
            WITH n, s, m
            ORDER BY m.created_at ASC
            RETURN n {.id, .title, .created_at, subject_id: s.name}, collect(m {.id, .content, .created_at}) AS mini_notes
            ORDER BY n.created_at DESC
            """
            params = {"user_id": user_id, "subject_id": subject_id}
        else:
            query = """
            MATCH (u:Student {id: $user_id})-[:HAS_NOTE]->(n:MyNote)-[:BELONGS_TO]->(s:Subject)
            OPTIONAL MATCH (n)-[:HAS_MININOTE]->(m:MiniNote)
            WITH n, s, m
            ORDER BY m.created_at ASC
            RETURN n {.id, .title, .created_at, subject_id: s.name}, collect(m {.id, .content, .created_at}) AS mini_notes
            ORDER BY n.created_at DESC
            """
            params = {"user_id": user_id}

        with get_neo4j_session() as session:
            result = session.run(query, **params)
            notes = []
            for record in result:
                note = record[0]
                minis = record["mini_notes"]
                # Filter out None from collect if no MiniNotes exist
                note['mini_notes'] = [m for m in minis if m.get('id')]
                notes.append(note)
            return notes

    @staticmethod
    def create_mini_note(user_id: str, note_id: str, content: str):
        query = """
        MATCH (u:Student {id: $user_id})-[:HAS_NOTE]->(n:MyNote {id: $note_id})
        CREATE (m:MiniNote {
            id: randomUUID(),
            content: $content,
            created_at: toString(datetime())
        })
        CREATE (n)-[:HAS_MININOTE]->(m)
        RETURN m {.id, .content, .created_at}
        """
        with get_neo4j_session() as session:
            result = session.run(query, user_id=user_id, note_id=note_id, content=content).single()
            return result[0] if result else None

    @staticmethod
    def update_mini_note(user_id: str, mini_note_id: str, content: str):
        query = """
        MATCH (u:Student {id: $user_id})-[:HAS_NOTE]->(n:MyNote)-[:HAS_MININOTE]->(m:MiniNote {id: $mini_note_id})
        SET m.content = $content
        RETURN m {.id, .content, .created_at}
        """
        with get_neo4j_session() as session:
            result = session.run(query, user_id=user_id, mini_note_id=mini_note_id, content=content).single()
            return result[0] if result else None

    @staticmethod
    def delete_mini_note(user_id: str, mini_note_id: str):
        query = """
        MATCH (u:Student {id: $user_id})-[:HAS_NOTE]->(n:MyNote)-[:HAS_MININOTE]->(m:MiniNote {id: $mini_note_id})
        DETACH DELETE m
        RETURN true AS success
        """
        with get_neo4j_session() as session:
            result = session.run(query, user_id=user_id, mini_note_id=mini_note_id).single()
            return result and result[0]

    @staticmethod
    def delete_note(user_id: str, note_id: str):
        query = """
        MATCH (u:Student {id: $user_id})-[:HAS_NOTE]->(n:MyNote {id: $note_id})
        OPTIONAL MATCH (n)-[:HAS_MININOTE]->(m:MiniNote)
        DETACH DELETE m, n
        RETURN true AS success
        """
        with get_neo4j_session() as session:
            result = session.run(query, user_id=user_id, note_id=note_id).single()
            return result and result[0]
