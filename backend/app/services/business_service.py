from sqlalchemy.orm import Session

from app.models.business import Business
from app.schemas.business import BusinessCreate


def create_business(db: Session, data: BusinessCreate, owner_id: int):
    business = Business(
        name=data.name,
        website=data.website,
        owner_id=owner_id,
    )

    db.add(business)
    db.commit()
    db.refresh(business)

    return business


def get_businesses(db: Session, owner_id: int):
    return db.query(Business).filter(
        Business.owner_id == owner_id
    ).all()