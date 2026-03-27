from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from services.mynote_service import MyNoteService
from schemas_mynotes import MyNoteCreate, MyNoteUpdate, MyNoteResponse
from auth import get_current_user

router = APIRouter()

@router.post("/", response_model=MyNoteResponse)
async def create_note(request: MyNoteCreate, user=Depends(get_current_user)):
    user_id = str(user.id)
    note = MyNoteService.create_note(user_id, request.title, request.content or "", request.subject_id)
    if not note:
        raise HTTPException(status_code=500, detail="Failed to create note.")
    return note

@router.get("/", response_model=List[MyNoteResponse])
async def get_notes(subject_id: Optional[str] = None, user=Depends(get_current_user)):
    user_id = str(user.id)
    notes = MyNoteService.get_user_notes(user_id, subject_id)
    return notes
    
@router.put("/{note_id}", response_model=MyNoteResponse)
async def update_note(note_id: str, request: MyNoteUpdate, user=Depends(get_current_user)):
    user_id = str(user.id)
    note = MyNoteService.update_note(user_id, note_id, request.title, request.content)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found or unauthorized.")
    return note

@router.delete("/{note_id}")
async def delete_note(note_id: str, user=Depends(get_current_user)):
    user_id = str(user.id)
    success = MyNoteService.delete_note(user_id, note_id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found or unauthorized.")
    return {"status": "deleted"}
