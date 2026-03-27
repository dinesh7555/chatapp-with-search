from pydantic import BaseModel
from typing import List, Optional

class MiniNoteCreate(BaseModel):
    content: str

class MiniNoteUpdate(BaseModel):
    content: str

class MiniNoteResponse(BaseModel):
    id: str
    content: str
    created_at: str

class MyNoteCreate(BaseModel):
    title: str
    subject_id: str

class MyNoteResponse(BaseModel):
    id: str
    title: str
    subject_id: str
    created_at: str
    mini_notes: List[MiniNoteResponse] = []
