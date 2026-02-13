from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from schemas import UserCreate, UserLogin, AdminUserCreate
from auth import hash_password, verify_password, create_access_token,get_current_user,require_admin,security
from redis_client import redis_client
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth import require_admin, require_student

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# @router.post("/register")
# def register(user: UserCreate, db: Session = Depends(get_db)):
#     existing = db.query(User).filter(User.username == user.username).first()
#     if existing:
#         raise HTTPException(status_code=400, detail="Username already exists")

#     new_user = User(
#         username=user.username,
#         email=user.email,
#         hashed_password=hash_password(user.password),
#         role=user.role
#     )
#     db.add(new_user)
#     db.commit()
#     return {"message": "User registered successfully"}

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db), admin_user: User = Depends(require_admin)):
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        role=user.role
    )
    db.add(new_user)
    db.commit()
    return {"message": "registered successfully"}

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()

    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token, expires_in = create_access_token({"sub": db_user.username, "role": db_user.role})
    redis_client.setex(
        f"jwt:{token}",
        expires_in,
        db_user.username
    )
    return {"access_token": token, "token_type": "bearer", "role": db_user.role}

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
    current_user: User = Depends(get_current_user)
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
    print(f"Token present: jwt:{token}") 
    redis_client.delete(f"jwt:{token}")
    print("=======================")
    print(f"Token deleted: jwt:{token}")                    
    return {"message": "Logged out successfully"}

# @router.post("/admin/create-user")
# def admin_create_user(
#     user: AdminUserCreate,
#     db: Session = Depends(get_db),
#     current_admin: User = Depends(require_admin)
# ):
#     existing = db.query(User).filter(User.username == user.username).first()
#     if existing:
#         raise HTTPException(status_code=400, detail="Username already exists")

#     new_user = User(
#         username=user.username,
#         email=user.email,
#         hashed_password=hash_password(user.password),
#         role=user.role
#     )

#     db.add(new_user)
#     db.commit()

#     return {"message": f"{user.role} created successfully"}

# @router.delete("/admin/delete-user/{user_id}")
# def delete_user(
#     user_id: int,
#     db: Session = Depends(get_db),
#     current_admin: User = Depends(require_admin)
# ):
#     user = db.query(User).filter(User.id == user_id).first()

#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     db.delete(user)
#     db.commit()

#     return {"message": "User deleted successfully"}
@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    users = db.query(User).filter(User.role == "student").all()

    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
        for user in users
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

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
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