import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from auth import get_current_user, get_db, require_teacher, require_roles
from models import Resource, User, StudentProfile
from schemas import ResourceResponse # Need to create this or use Model

router = APIRouter(prefix="/resources", tags=["resources"])

# Use absolute path inside container for reliability
UPLOAD_DIR = "/app/uploads/resources"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_resource(
    title: str = Form(...),
    branch: str = Form(...),
    subject: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    # Save file
    file_extension = os.path.splitext(file.filename)[1]
    safe_filename = f"{current_user.id}_{int(os.path.getmtime(UPLOAD_DIR))}_{file.filename}"
    # Actually use a more robust filename
    import time
    safe_filename = f"{current_user.id}_{int(time.time())}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_resource = Resource(
        title=title,
        filename=safe_filename,
        file_type=file.content_type,
        branch=branch,
        subject=subject,
        teacher_id=current_user.id
    )
    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)

    return {"message": "Resource uploaded successfully", "resource_id": new_resource.id}

@router.get("/", response_model=List[dict])
async def get_resources(
    branch: Optional[str] = None,
    subject: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Resource)

    if current_user.role == "student":
        # Automatically filter by student's branch if not specified? 
        # The prompt says: "specific students of that branch should be able to see that documents"
        # So we should strictly filter by student's branch.
        student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if student_profile and student_profile.branch:
            query = query.filter(func.lower(Resource.branch) == student_profile.branch.lower())
        
        # If subject is provided by student dashboard filter
        if subject:
            query = query.filter(func.lower(Resource.subject) == subject.lower())
    
    elif current_user.role == "teacher":
        # Teachers see what they uploaded
        query = query.filter(Resource.teacher_id == current_user.id)
        if branch:
            query = query.filter(Resource.branch == branch)
        if subject:
            query = query.filter(Resource.subject == subject)
    
    else: # Admin
        if branch:
            query = query.filter(Resource.branch == branch)
        if subject:
            query = query.filter(Resource.subject == subject)

    resources = query.all()
    
    return [
        {
            "id": r.id,
            "title": r.title,
            "filename": r.filename,
            "file_type": r.file_type,
            "branch": r.branch,
            "subject": r.subject,
            "teacher_name": r.teacher.username,
            "created_at": r.created_at
        } for r in resources
    ]

@router.get("/download/{resource_id}")
async def download_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Access control: student must be in the same branch
    if current_user.role == "student":
        student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if not student_profile or not student_profile.branch or \
           student_profile.branch.lower() != resource.branch.lower():
            raise HTTPException(status_code=403, detail="Access denied to this resource")

    file_path = os.path.join(UPLOAD_DIR, resource.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    return FileResponse(
        path=file_path,
        filename=resource.filename.split("_", 2)[-1], # Original filename
        media_type=resource.file_type
    )

@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Only uploader or admin can delete
    if current_user.role != "admin" and resource.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this resource")

    # Delete file
    file_path = os.path.join(UPLOAD_DIR, resource.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(resource)
    db.commit()

    return {"message": "Resource deleted successfully"}
