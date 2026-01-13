from fastapi import APIRouter, Depends, Query
from auth import get_current_user
from services.search_service import hybrid_chat_search
router = APIRouter(prefix="/search", tags=["Search"])


@router.get("")
async def unified_search(
    q: str = Query(..., min_length=2),
    current_user = Depends(get_current_user)
):
    return await hybrid_chat_search(
        user_id=current_user.id,
        query=q
    )
