
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import user, chat , search

# 🔴 ADD THESE IMPORTS
from database import engine, Base
from database import SessionLocal
from models import User
from auth import hash_password
import os

print(">>> Starting FastAPI app")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://172.168.11.81:3000"
    ],
    # allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(chat.router)
app.include_router(search.router) 
print(">>> Routers loaded")

# 🔴 ADD THIS BLOCK
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables ensured")
    db = SessionLocal()

    # Check if any admin exists
    admin_exists = db.query(User).filter(User.role == "admin").first()

    if not admin_exists:
        print("⚠ No admin found. Creating default admin...")

        default_username = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
        default_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")
        default_email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@institution.com")

        new_admin = User(
            username=default_username,
            email=default_email,
            hashed_password=hash_password(default_password),
            role="admin"
        )

        db.add(new_admin)
        db.commit()

        print("✅ Default admin created")

    db.close()

@app.get("/")
def root():
    return {"status": "Chat App Backend Running"}

@app.get("/health")
def health():
    return {"status": "ok"}