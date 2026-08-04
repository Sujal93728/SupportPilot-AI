from pydantic import BaseModel


class BusinessCreate(BaseModel):
    name: str
    website: str | None = None


class BusinessResponse(BaseModel):
    id: int
    name: str
    website: str | None = None

    class Config:
        from_attributes = True