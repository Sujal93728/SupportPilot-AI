from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.business import (
    BusinessCreate,
    BusinessResponse,
)
from app.services.business_service import (
    create_business,
    get_businesses,
)

router = APIRouter(
    prefix="/business",
    tags=["Business"],
)


@router.post(
    "/",
    response_model=BusinessResponse,
)
def create(
    data: BusinessCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_business(
        db,
        data,
        current_user.id,
    )


@router.get(
    "/",
    response_model=list[BusinessResponse],
)
def list_businesses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_businesses(
        db,
        current_user.id,
    )