from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.schemas.user import LoginRequest, Token
from app.auth.jwt_handler import create_access_token
from app.services.user_service import authenticate_user
from app.services.user_service import (
    create_user,
    get_user_by_email,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)
@router.post(
    "/login",
    response_model=Token,
)


def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db),
):
    user = authenticate_user(
        db,
        credentials.email,
        credentials.password,
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }

@router.post(
    "/register",
    response_model=UserResponse,
)
def register(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    existing = get_user_by_email(db, user.email)

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    return create_user(db, user)