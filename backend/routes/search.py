# from fastapi import APIRouter, Depends, Query
# from auth import get_current_user
# from services.search_service import hybrid_chat_search
# router = APIRouter(prefix="/search", tags=["Search"])


# @router.get("")
# async def unified_search(
#     q: str = Query(..., min_length=2),
#     current_user = Depends(get_current_user)
# ):
#     return await hybrid_chat_search(
#         user_id=current_user.id,
#         query=q
#     )

from fastapi import APIRouter, Depends, HTTPException, Query
from auth import require_student
from services.search_service import hybrid_chat_search
router = APIRouter(prefix="/search", tags=["Search"])


@router.get("")
async def unified_search(
    subject_id: str = Query(...),
    q: str = Query(..., min_length=2),
    current_user = Depends(require_student)
):
    if subject_id not in {"database_management", "operating_systems", "computer_networks", "data_structures", "javascript", "java"}:
        raise HTTPException(status_code=400, detail="Invalid subject")
    return await hybrid_chat_search(
        user_id=current_user.id,
        subject_id=subject_id,
        query=q
    )
