from sqlalchemy.orm import Session

from app.models.chat_history import ChatHistory
from ai.qa import answer_question


# =========================================================
# ASK AI
# =========================================================

def ask_question(
    question: str,
    business_id: int,
):
    """
    Ask SupportPilot AI a question using only
    the selected business's knowledge base.
    """

    return answer_question(
        question=question,
        business_id=business_id,
    )


# =========================================================
# SAVE CHAT
# =========================================================

def save_chat(
    db: Session,
    user_id: int,
    business_id: int,
    question: str,
    answer: str,
):
    """
    Save a chat message to the database.
    """

    history = ChatHistory(
        user_id=user_id,
        business_id=business_id,
        question=question,
        answer=answer,
    )

    db.add(history)
    db.commit()
    db.refresh(history)

    return history


# =========================================================
# GET CHAT HISTORY
# =========================================================

def get_chat_history(
    db: Session,
    user_id: int,
    business_id: int,
):
    """
    Return chat history for the current user
    and selected business.
    """

    return (
        db.query(ChatHistory)
        .filter(
            ChatHistory.user_id == user_id,
            ChatHistory.business_id == business_id,
        )
        .order_by(ChatHistory.created_at.desc())
        .all()
    )


# =========================================================
# BACKWARD COMPATIBILITY
# =========================================================

def save_chat_history(
    db: Session,
    user_id: int,
    business_id: int,
    question: str,
    answer: str,
):
    """
    Backward-compatible alias for older code.
    """

    return save_chat(
        db=db,
        user_id=user_id,
        business_id=business_id,
        question=question,
        answer=answer,
    )