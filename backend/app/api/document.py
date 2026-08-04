from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path

from ai.pdf_loader import extract_text_from_pdf
from ai.chunking import split_text
from ai.vector_store import create_vector_store, save_vector_store


router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)

UPLOAD_DIR = Path("uploads")
FAISS_DIR = "faiss_index"

UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    file_path = UPLOAD_DIR / file.filename

    content = await file.read()

    with open(file_path, "wb") as f:
        f.write(content)

    try:
        text = extract_text_from_pdf(str(file_path))

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="No readable text found in PDF."
            )

        chunks = split_text(text)

        vector_store = create_vector_store(chunks)

        save_vector_store(
            vector_store,
            FAISS_DIR
        )

        return {
            "message": "Document uploaded and indexed successfully.",
            "filename": file.filename,
            "characters": len(text),
            "chunks": len(chunks),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )