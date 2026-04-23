from sqlalchemy.orm import Session
from models import StudentProfile
from datetime import datetime, timedelta

def update_user_activity(db: Session, user_id: int, is_heartbeat: bool = False):
    """
    Updates the student's daily activity, total study time, and streak.
    Uses a sentinel time (00:00:00) in last_active_date to track 'seen today' vs 'qualified today'.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if not profile:
        return None

    now = datetime.now()
    today = now.date()
    
    last_active_date_val = profile.last_active_date
    last_active = last_active_date_val.date() if last_active_date_val else None
    
    # 1. New Day Transition
    if last_active != today:
        # Check if the streak is broken (missed yesterday)
        if last_active and last_active < today - timedelta(days=1):
            profile.current_streak = 0
            
        # Reset daily study time
        profile.daily_study_time = 0
        
        # Mark as 'seen today' but not yet 'qualified'. 
        # Sentinel time 00:00:00 indicates we haven't rewarded the streak for today.
        profile.last_active_date = datetime.combine(today, datetime.min.time())
        db.commit() 

    # 2. Update Time Stats 
    if is_heartbeat:
        profile.daily_study_time += 1
        profile.total_study_time += 1

    # 3. Streak Qualification Logic
    STREAK_THRESHOLD_MINUTES = 10
    is_threshold_reached = profile.daily_study_time >= STREAK_THRESHOLD_MINUTES
    should_qualify_today = is_threshold_reached

    if should_qualify_today:
        # Check if we have already rewarded the streak point for today.
        # We know we haven't if the time is still the sentinel 00:00:00.
        if profile.last_active_date.time() == datetime.min.time():
            if profile.current_streak == 0:
                profile.current_streak = 1
            else:
                profile.current_streak += 1
            print(f"[Activity] user {user_id} earned streak for today. New streak: {profile.current_streak}")
        
        # Update last_active_date to 'now' (with current time) to mark as qualified/fresh
        profile.last_active_date = now

    db.commit()
    return profile
