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

from routes import user, chat , search

# 🔴 ADD THESE IMPORTS
from database import engine, Base
import models  # VERY IMPORTANT (loads User model)

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
print(">>> Routers loaded")

# 🔴 ADD THIS BLOCK
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables ensured")

@app.get("/")
def root():
    return {"status": "Chat App Backend Running"}

@app.get("/health")
def health():
    return {"status": "ok"}
