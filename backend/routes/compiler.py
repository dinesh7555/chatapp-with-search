from fastapi import APIRouter, Depends, HTTPException, Query
from auth import require_student
from services.compiler_service import run_java_code
from schemas import CodeExecutionPayload

router = APIRouter(prefix="/compiler", tags=["Compiler"])

@router.post("/run")
async def run_code(
    payload: CodeExecutionPayload,
    current_user = Depends(require_student)
):
    """
    Endpoint to run code using the configured compiler service.
    Currently supports Java via onlinecompiler.io.
    """
    if payload.language.lower() == "java":
        result = await run_java_code(payload.code, payload.stdin)
        return result
    else:
        raise HTTPException(status_code=400, detail=f"Language {payload.language} not supported for backend execution.")
