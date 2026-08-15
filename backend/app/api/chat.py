from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User

from app.services.chat_service import (
    save_chat_history,
    get_chat_history,
)

from ai.qa import answer_question


router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


# =========================================================
# REQUEST / RESPONSE MODELS
# =========================================================

class ChatRequest(BaseModel):
    question: str
    business_id: int


class ChatResponse(BaseModel):
    answer: str


class ChatHistoryResponse(BaseModel):
    id: int
    question: str
    answer: str
    business_id: int

    class Config:
        from_attributes = True


# =========================================================
# ASK AI
# =========================================================

def process_chat(
    request: ChatRequest,
    db: Session,
    current_user: User,
):
    try:
        if not request.question.strip():
            raise HTTPException(
                status_code=400,
                detail="Question cannot be empty.",
            )

        answer = answer_question(
            question=request.question,
            business_id=request.business_id,
        )

        save_chat_history(
            db=db,
            user_id=current_user.id,
            business_id=request.business_id,
            question=request.question,
            answer=answer,
        )

        return ChatResponse(
            answer=answer
        )

    except HTTPException:
        raise

    except FileNotFoundError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# =========================================================
# POST /chat/
# =========================================================

@router.post(
    "/",
    response_model=ChatResponse,
)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return process_chat(
        request=request,
        db=db,
        current_user=current_user,
    )


# =========================================================
# POST /chat/ask
#
# Added as an alias so frontend requests to /chat/ask
# also work.
# =========================================================

@router.post(
    "/ask",
    response_model=ChatResponse,
)
def ask_chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return process_chat(
        request=request,
        db=db,
        current_user=current_user,
    )


# =========================================================
# GET /chat/history
# =========================================================

@router.get(
    "/history",
    response_model=List[ChatHistoryResponse],
)
def chat_history(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_chat_history(
        db=db,
        user_id=current_user.id,
        business_id=business_id,
    )