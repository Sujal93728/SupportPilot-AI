from fastapi import FastAPI

from app.db.database import Base, engine
from app.models import User
from app.api.test_db import router as test_router
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.business import router as business_router
from app.api.document import router as document_router
from app.api.chat import router as chat_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SupportPilot AI",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(test_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(business_router)
app.include_router(document_router)
app.include_router(chat_router)

@app.get("/")
def root():
    return {"message": "Welcome to SupportPilot AI 🚀"}


@app.get("/health")
def health():
    return {"status": "healthy"}