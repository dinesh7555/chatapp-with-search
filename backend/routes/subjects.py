from fastapi import APIRouter, Depends, Query, HTTPException
from routes.chat import ALLOWED_SUBJECTS, SUBJECT_TOPICS
from auth import require_student
from services.note_service import generate_notes_llm

router = APIRouter(prefix="/subjects", tags=["Subjects"])

@router.get("/")
def get_subjects():
    """
    Returns a list of all allowed subjects and their corresponding topics.
    """
    subjects_data = []
    for subject in ALLOWED_SUBJECTS:
        subjects_data.append({
            "name": subject,
            "topics": SUBJECT_TOPICS.get(subject, [])
        })
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
    if subject_id not in ALLOWED_SUBJECTS:
        raise HTTPException(status_code=400, detail="Invalid subject")
    
    allowed_topics = SUBJECT_TOPICS.get(subject_id, [])
    if topic not in allowed_topics:
        raise HTTPException(status_code=400, detail="Invalid topic for this subject")

    try:
        notes = await generate_notes_llm(subject_id, topic)
        return {"notes": notes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate notes: {str(e)}")
