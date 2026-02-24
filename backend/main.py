# from fastapi import FastAPI

# app = FastAPI()

# @app.get("/")
# def read_root():
#     return {"message": "Backend is running inside Docker"}


# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from routes import user, chat

# print(">>> Starting FastAPI app")

# app = FastAPI()

# # ✅ THIS IS MANDATORY FOR REACT
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:3000",
#         "http://127.0.0.1:3000"
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.include_router(user.router)
# app.include_router(chat.router)
# print(">>> Routers loaded")


# @app.get("/")
# def root():
#     return {"status": "Chat App Backend Running"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import user, chat , search, subjects

# 🔴 ADD THESE IMPORTS
from database import engine, Base
from models import User # VERY IMPORTANT (loads User model)
from auth import hash_password
import os
from database import SessionLocal
print(">>> Starting FastAPI app")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://172.168.12.101:3000",
        "http://172.168.12.102:3000"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(chat.router)
app.include_router(search.router) 
app.include_router(subjects.router)
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
