from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False)

    website = Column(String(255), nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User")