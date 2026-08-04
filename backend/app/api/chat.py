from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ai.qa import answer_question


router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str


@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        answer = answer_question(request.question)

        return ChatResponse(
            answer=answer
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )