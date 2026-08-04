from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    filename: str

    class Config:
        from_attributes = True