from pydantic import BaseModel, EmailStr
from typing import Literal
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class ChatMessage(BaseModel):
    message: str

class StudentCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    roll_no: str
    course_id: str
    status: str = "active"


class TeacherCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    subject: str
    department: str
    designation: str