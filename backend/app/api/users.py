from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
    }