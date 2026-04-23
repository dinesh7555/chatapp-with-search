from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, StudentProfile
from auth import get_current_user, require_student
from datetime import datetime, date, timedelta
from sqlalchemy import func

router = APIRouter(prefix="/activity", tags=["Activity Tracking"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from services.activity_service import update_user_activity

@router.post("/heartbeat")
def heartbeat(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """
    Called by the frontend every minute to track active time and maintain streaks.
    """
    profile = update_user_activity(db, current_user.id, is_heartbeat=True)
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    return {
        "daily_study_time": profile.daily_study_time,
        "current_streak": profile.current_streak
    }

@router.get("/stats")
def get_activity_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """
    Returns current activity statistics for the dashboard.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Use the service to handle new-day resets and sentinel initialization
    profile = update_user_activity(db, current_user.id, is_heartbeat=False)
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    return {
        "current_streak": profile.current_streak,
        "daily_study_time": profile.daily_study_time,
        "total_study_time": profile.total_study_time,
        "last_active": profile.last_active_date
    }
