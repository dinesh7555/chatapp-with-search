from sqlalchemy.orm import Session
from models import StudentProfile
from datetime import datetime, timedelta

def update_user_activity(db: Session, user_id: int, is_heartbeat: bool = False):
    """
    Updates the student's daily activity, total study time, and streak.
    Called from both heartbeat (time-based) and chat (action-based) routes.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if not profile:
        return None

    now = datetime.now()
    today = now.date()
    last_active = profile.last_active_date.date() if profile.last_active_date else None
    
    # Threshold for study time before it counts as a streak activity
    STREAK_THRESHOLD_MINUTES = 10

    # 1. New Day Reset
    # If the last activity was not today, we reset the daily study time
    if last_active != today:
        print(f"[Activity] New day detected ({today}). Resetting daily study time for user {user_id}")
        profile.daily_study_time = 0
        # Note: if it's a heartbeat, it will be incremented to 1 below.

    # 2. Update Time Stats (only if it's a heartbeat)
    if is_heartbeat:
        profile.daily_study_time += 1
        profile.total_study_time += 1

    # 3. Activity / Streak Logic
    # We only update the streak if:
    #   A) It's a direct action (is_heartbeat=False, like sending a chat message)
    #   B) The student has reached the 10-minute threshold today for the first time.
    
    is_threshold_reached = profile.daily_study_time >= STREAK_THRESHOLD_MINUTES
    should_trigger_activity = not is_heartbeat or is_threshold_reached

    print(f"[Activity Service] User {user_id}: Time={profile.daily_study_time}, Threshold={STREAK_THRESHOLD_MINUTES}, Action={not is_heartbeat}, Last={last_active}")

    if should_trigger_activity:
        if not last_active:
            # First activity ever
            print(f"[Activity] Initializing streak for user {user_id}")
            profile.current_streak = 1
            profile.last_active_date = now
        elif last_active == today:
            # Already active today. Just update the timestamp.
            profile.last_active_date = now
        elif last_active == today - timedelta(days=1):
            # Consecutive day! Increment streak.
            print(f"[Activity] Streak incremented for user {user_id}")
            profile.current_streak += 1
            profile.last_active_date = now
        else:
            # Missed a day or more. Reset streak.
            print(f"[Activity] Streak reset for user {user_id} (Last active: {last_active})")
            profile.current_streak = 1
            profile.last_active_date = now

    db.commit()
    return profile
