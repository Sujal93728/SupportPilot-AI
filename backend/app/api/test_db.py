from fastapi import APIRouter
from sqlalchemy import text

from app.db.database import engine

router = APIRouter()


@router.get("/db-test")
def db_test():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT current_database();"))
            return {
                "status": "connected",
                "database": result.scalar()
            }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }