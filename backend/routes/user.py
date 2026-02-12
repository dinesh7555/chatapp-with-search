from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from schemas import UserCreate, UserLogin
from auth import hash_password, verify_password, create_access_token,get_current_user
from redis_client import redis_client
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully"}

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()

    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token, expires_in = create_access_token({"sub": db_user.username})
    redis_client.setex(
        f"jwt:{token}",
        expires_in,
        db_user.username
    )
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
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
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    token = credentials.credentials

    redis_client.delete(f"jwt:{token}")

    return {"message": "Logged out successfully"}
