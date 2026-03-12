from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from schemas import UserCreate, UserLogin , StudentCreate, TeacherCreate
from auth import hash_password, verify_password, create_access_token, get_current_user
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from redis_client import redis_client
from jose import jwt
from auth import require_admin, require_student , require_roles, security
from models import StudentProfile, TeacherProfile
from models import StudentProfile
from routes.chat import ALLOWED_SUBJECTS
router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register/admin")
def register_admin(
    user: UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_admin = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        role="admin"  # force admin role
    )
    db.add(new_admin)
    db.commit()
    return {"message": "Admin registered successfully"}

@router.post("/register/student")
def register_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles("admin", "teacher"))
):
    existing = db.query(User).filter(User.username == student.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = User(
        username=student.username,
        email=student.email,
        hashed_password=hash_password(student.password),
        role="student"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    profile = StudentProfile(
        user_id=new_user.id,
        roll_no=student.roll_no,
        course_id=student.course_id,
        year=student.year,
        branch=student.branch,
        status=student.status
    )

    db.add(profile)
    db.commit()

    return {"message": "Student registered successfully"}

@router.post("/register/teacher")
def register_teacher(
    teacher: TeacherCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    existing = db.query(User).filter(User.username == teacher.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = User(
        username=teacher.username,
        email=teacher.email,
        hashed_password=hash_password(teacher.password),
        role="teacher"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    profile = TeacherProfile(
        user_id=new_user.id,
        subject=teacher.subject,
        department=teacher.department,
        designation=teacher.designation
    )

    db.add(profile)
    db.commit()

    return {"message": "Teacher registered successfully"}

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if db_user.role == "student":
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == db_user.id).first()
        if profile and profile.status == "inactive":
            raise HTTPException(status_code=403, detail="Your account is inactive. Contact teacher.")
    token, expires_in = create_access_token({"sub": db_user.username})
    # ✅ Store token in Redis with expiration
    redis_client.setex(
        f"jwt:{token}",
        expires_in,
        db_user.username
    )   
    return {"access_token": token, "token_type": "bearer" , "role": db_user.role}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role
    }

@router.post("/chat")
def chat(
    message: str,
    current_user: User = Depends(require_student)
):
    return {
        "user": current_user.username,
        "message": message
    }
@router.post("/logout")
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    redis_client.delete(f"jwt:{token}") 
    #print(f"Deleted token from Redis: jwt:{token}")
    return {"message": "Logged out successfully"}

@router.get("/students")
def list_students(
    year: int = Query(None),
    branch: str = Query(None),
    subject: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "teacher"))
):

    query = db.query(User, StudentProfile).join(StudentProfile, User.id == StudentProfile.user_id).filter(User.role == "student")

    if year:
        query = query.filter(StudentProfile.year == year)
    if branch:
        query = query.filter(StudentProfile.branch == branch)
    
    if subject:
        if subject not in ALLOWED_SUBJECTS:
             return [] # Or raise an exception, but returning empty list if subject is invalid for the system is safe
        # In this implementation, we assume all students are associated with all allowed subjects
        # So we just keep the existing filters.

    students = query.all()

    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "roll_no": profile.roll_no,
            "course_id": profile.course_id,
            "year": profile.year,
            "branch": profile.branch,
            "status": profile.status
        }
        for user, profile in students
    ]
@router.get("/admins")
def list_admins(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    admins = db.query(User).filter(User.role == "admin").all()

    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
        for user in admins
    ]

@router.get("/teachers")
def list_teachers(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    from models import TeacherProfile
    teachers = (
        db.query(User, TeacherProfile)
        .join(TeacherProfile, User.id == TeacherProfile.user_id)
        .filter(User.role == "teacher")
        .all()
    )

    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "department": profile.department,
            "designation": profile.designation
        }
        for user, profile in teachers
    ]

@router.put("/students/{student_id}/status")
def update_student_status(
    student_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "teacher"))
):
    if status not in ["active", "inactive"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == student_id).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Student not found")

    profile.status = status
    db.commit()
    return {"message": f"Student marked as {status}"}
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles("admin", "teacher"))
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Optional safety: prevent admin deleting themselves
    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete yourself")

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}