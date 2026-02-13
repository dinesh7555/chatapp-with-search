from pydantic import BaseModel, EmailStr
from typing import Literal

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Literal["admin","student"]
    
class AdminUserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str   # admin can choose role

class UserLogin(BaseModel):
    username: str
    password: str

class ChatMessage(BaseModel):
    message: str