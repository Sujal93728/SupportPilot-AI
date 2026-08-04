from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.db.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True)

    filename = Column(String(255), nullable=False)

    filepath = Column(String(500), nullable=False)

    business_id = Column(Integer, ForeignKey("businesses.id"))

    created_at = Column(DateTime(timezone=True), server_default=func.now())