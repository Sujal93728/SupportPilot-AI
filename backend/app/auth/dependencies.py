from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.user import User

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        print("JWT PAYLOAD:", payload)
        print("JWT ALGORITHM:", settings.ALGORITHM)
        print("SECRET KEY LENGTH:", len(settings.SECRET_KEY))

        user_id = int(payload["sub"])

    except JWTError as e:
        print("JWT ERROR:", repr(e))
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}",
        )

    except (KeyError, ValueError, TypeError) as e:
        print("JWT PAYLOAD ERROR:", repr(e))
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token payload: {str(e)}",
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    return user