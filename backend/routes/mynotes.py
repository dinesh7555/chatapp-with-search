from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from services.mynote_service import MyNoteService
from schemas_mynotes import MyNoteCreate, MyNoteResponse, MiniNoteCreate, MiniNoteUpdate, MiniNoteResponse
from auth import get_current_user

router = APIRouter()

@router.post("/", response_model=MyNoteResponse)
async def create_note(request: MyNoteCreate, user=Depends(get_current_user)):
    user_id = str(user.id)
    note = MyNoteService.create_note(user_id, request.title, request.subject_id)
    if not note:
        raise HTTPException(status_code=500, detail="Failed to create note.")
    return note

@router.get("/", response_model=List[MyNoteResponse])
async def get_notes(subject_id: Optional[str] = None, user=Depends(get_current_user)):
    user_id = str(user.id)
    notes = MyNoteService.get_user_notes(user_id, subject_id)
    return notes

@router.delete("/{note_id}")
async def delete_note(note_id: str, user=Depends(get_current_user)):
    user_id = str(user.id)
    success = MyNoteService.delete_note(user_id, note_id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found or unauthorized.")
    return {"status": "deleted"}

@router.post("/{note_id}/mini", response_model=MiniNoteResponse)
async def create_mini_note(note_id: str, request: MiniNoteCreate, user=Depends(get_current_user)):
    user_id = str(user.id)
    mini_note = MyNoteService.create_mini_note(user_id, note_id, request.content)
    if not mini_note:
        raise HTTPException(status_code=404, detail="Parent note not found or unauthorized.")
    return mini_note

@router.put("/mini/{mini_note_id}", response_model=MiniNoteResponse)
async def update_mini_note(mini_note_id: str, request: MiniNoteUpdate, user=Depends(get_current_user)):
    user_id = str(user.id)
    mini_note = MyNoteService.update_mini_note(user_id, mini_note_id, request.content)
    if not mini_note:
        raise HTTPException(status_code=404, detail="MiniNote not found or unauthorized.")
    return mini_note

@router.delete("/mini/{mini_note_id}")
async def delete_mini_note(mini_note_id: str, user=Depends(get_current_user)):
    user_id = str(user.id)
    success = MyNoteService.delete_mini_note(user_id, mini_note_id)
    if not success:
        raise HTTPException(status_code=404, detail="MiniNote not found or unauthorized.")
    return {"status": "deleted"}
