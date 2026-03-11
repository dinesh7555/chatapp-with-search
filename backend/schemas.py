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
    year: int
    branch: str
    status: str = "active"


class TeacherCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    subject: str
    department: str
    designation: str


class ResourceResponse(BaseModel):
    id: int
    title: str
    filename: str
    file_type: str
    branch: str
    subject: str
    teacher_name: str
    created_at: object # date/datetime

    class Config:
        from_attributes = True
