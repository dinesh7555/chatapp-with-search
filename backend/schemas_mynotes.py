from pydantic import BaseModel
from typing import List, Optional

class MyNoteCreate(BaseModel):
    title: str
    content: Optional[str] = ""
    subject_id: str

class MyNoteUpdate(BaseModel):
    title: str
    content: str

class MyNoteResponse(BaseModel):
    id: str
    title: str
    content: Optional[str] = ""
    subject_id: str
    created_at: str
