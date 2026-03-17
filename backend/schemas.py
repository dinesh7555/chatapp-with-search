from pydantic import BaseModel, EmailStr , ConfigDict
from typing import Literal, List, Optional

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class ChatMessage(BaseModel):
    message: str

class QuizSubmit(BaseModel):
    score: int
    total: int
    incorrect_questions: List[dict] # Contains question, user_answer, correct_answer, explanation

class QuizAnswerItem(BaseModel):
    model_config = ConfigDict(extra='allow')
    
    type: str
    question: str
    user_answer: str
    answer: Optional[str] = None # Using 'answer' to match generation prompt
    correct_answer: Optional[str] = None 
    explanation: Optional[str] = None
    options: Optional[List[str]] = None

class QuizSubmission(BaseModel):
    answers: List[dict]

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
