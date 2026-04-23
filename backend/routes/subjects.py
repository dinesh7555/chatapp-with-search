import os

from fastapi import APIRouter, Depends, Query, HTTPException
from routes.chat import ALLOWED_SUBJECTS, SUBJECT_TOPICS, SUBJECT_CURRICULUM
from auth import require_student
from services.note_service import fetch_or_generate_notes
from services.mindmap_service import fetch_or_generate_mindmap
from services.flashcard_service import fetch_or_generate_flashcards
from neo4j_db import get_neo4j_session

router = APIRouter(prefix="/subjects", tags=["Subjects"])

@router.get("/")
def get_subjects(current_user = Depends(require_student)):
    """
    Returns a list of all allowed subjects and their corresponding topics.
    Also fetches custom personalized subjects from the database.
    """
    subjects_data = []
    
    for subject_id, data in SUBJECT_CURRICULUM.items():
        subjects_data.append({
            "id": subject_id,
            "name": data["title"],
            "units": data["units"],
            "topics": SUBJECT_TOPICS.get(subject_id, []) # Keep flat topics for compatibility
        })
        
    try:
        query = "MATCH (u:User {user_id: $user_id})-[:HAS_SUBJECT]->(s:Subject {is_personalized: true}) RETURN s.subject_id as id, s.name as name"
        with get_neo4j_session() as session:
            result = session.run(query, user_id=current_user.id)
            for record in result:
                sub_id = record["id"]
                sub_name = record["name"]
                
                subjects_data.append({
                    "id": sub_id,
                    "name": sub_name,
                    "units": [{"id": f"unit_1_{sub_id}", "title": "Unit 1: " + sub_name, "topics": [sub_name]}],
                    "topics": [sub_name],
                    "is_personalized": True
                })
    except Exception as e:
        print(f"Failed to fetch personalized subjects: {e}")

    return {"subjects": subjects_data}

@router.get("/notes")
async def get_topic_notes(
    subject_id: str = Query(...),
    topic: str = Query(...),
    current_user = Depends(require_student)
):
    """
    Generate and return structured notes for a topic.
    """
    subject_id = subject_id.replace(" ", "_").lower()
    if subject_id not in ALLOWED_SUBJECTS:
        raise HTTPException(status_code=400, detail=f"Invalid subject: {subject_id}")
    
    allowed_topics = SUBJECT_TOPICS.get(subject_id, [])
    if topic not in allowed_topics:
        raise HTTPException(status_code=400, detail="Invalid topic for this subject")

    try:
        notes = await fetch_or_generate_notes(subject_id, topic)
        return {"notes": notes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate notes: {str(e)}")

@router.get("/{subject_id}/mindmap")
async def get_subject_mindmap(
    subject_id: str,
    current_user = Depends(require_student)
):
    """
    Get a detailed hierarchical mindmap for a subject.
    """
    if subject_id not in ALLOWED_SUBJECTS:
        subject_id = subject_id.replace(" ", "_").lower()
    
    if subject_id not in ALLOWED_SUBJECTS:
        raise HTTPException(status_code=400, detail=f"Invalid subject: {subject_id}")
    
    try:
        mindmap = await fetch_or_generate_mindmap(subject_id)
        if not mindmap:
            raise HTTPException(status_code=500, detail="Failed to generate mindmap")
        return mindmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get mindmap: {str(e)}")

@router.get("/{subject_id}/flashcards")
async def get_subject_flashcards(
    subject_id: str,
    current_user = Depends(require_student)
):
    """
    Get or generate study flashcards for a subject.
    """
    if subject_id not in ALLOWED_SUBJECTS:
        subject_id = subject_id.replace(" ", "_").lower()
    
    if subject_id not in ALLOWED_SUBJECTS:
        raise HTTPException(status_code=400, detail=f"Invalid subject: {subject_id}")
    
    try:
        flashcards = await fetch_or_generate_flashcards(subject_id)
        if not flashcards:
            raise HTTPException(status_code=500, detail="Failed to generate flashcards")
        return {"flashcards": flashcards}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get flashcards: {str(e)}")
