from pathlib import Path
import re

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends,
    Form,
)
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.business import Business

from ai.vector_store import (
    create_vector_store,
    save_vector_store,
    rebuild_business_index,
)
from ai.pdf_loader import extract_text_from_pdf
from ai.chunking import split_text


router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


UPLOAD_DIR = Path("uploads")

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# =========================================================
# GET DOCUMENTS FOR A BUSINESS
# =========================================================

@router.get("/")
def get_documents(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # -----------------------------------------------------
    # Verify that the business belongs to the logged-in user
    # -----------------------------------------------------

    business = (
        db.query(Business)
        .filter(
            Business.id == business_id,
            Business.owner_id == current_user.id,
        )
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found.",
        )

    # -----------------------------------------------------
    # Get documents for this business only
    # -----------------------------------------------------

    documents = (
        db.query(Document)
        .filter(
            Document.business_id == business_id
        )
        .order_by(Document.created_at.desc())
        .all()
    )

    return {
        "documents": [
            {
                "id": document.id,
                "filename": document.filename,
                "filepath": document.filepath,
                "business_id": document.business_id,
                "created_at": document.created_at,
            }
            for document in documents
        ]
    }


# =========================================================
# UPLOAD DOCUMENT
# =========================================================

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    business_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # -----------------------------------------------------
    # Verify business ownership
    # -----------------------------------------------------

    business = (
        db.query(Business)
        .filter(
            Business.id == business_id,
            Business.owner_id == current_user.id,
        )
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found.",
        )

    # -----------------------------------------------------
    # Validate filename
    # -----------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No filename provided.",
        )

    original_filename = Path(
        file.filename
    ).name

    if not original_filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )

    # -----------------------------------------------------
    # Make filename safe
    # -----------------------------------------------------

    safe_filename = re.sub(
        r"[^a-zA-Z0-9._-]",
        "_",
        original_filename,
    )

    file_path = UPLOAD_DIR / safe_filename

    # -----------------------------------------------------
    # Avoid overwriting an existing PDF
    # -----------------------------------------------------

    if file_path.exists():
        stem = file_path.stem
        suffix = file_path.suffix

        counter = 1

        while file_path.exists():
            file_path = (
                UPLOAD_DIR
                / f"{stem}_{counter}{suffix}"
            )
            counter += 1

        safe_filename = file_path.name

    # -----------------------------------------------------
    # Read uploaded file
    # -----------------------------------------------------

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    # -----------------------------------------------------
    # Save PDF
    # -----------------------------------------------------

    try:
        with open(file_path, "wb") as f:
            f.write(content)

        # -------------------------------------------------
        # Extract PDF text
        # -------------------------------------------------

        text = extract_text_from_pdf(
            str(file_path)
        )

        if not text.strip():
            file_path.unlink(
                missing_ok=True
            )

            raise HTTPException(
                status_code=400,
                detail="No readable text found in PDF.",
            )

        # -------------------------------------------------
        # Split text into chunks
        # -------------------------------------------------

        chunks = split_text(text)

        if not chunks:
            file_path.unlink(
                missing_ok=True
            )

            raise HTTPException(
                status_code=400,
                detail="Could not create document chunks.",
            )

        # -------------------------------------------------
        # Create FAISS vector store
        # -------------------------------------------------

        vector_store = create_vector_store(
            chunks
        )

        # -------------------------------------------------
        # Save to business-specific FAISS index
        # -------------------------------------------------

        save_vector_store(
            vector_store,
            business_id,
        )

        # -------------------------------------------------
        # Save document in PostgreSQL
        # -------------------------------------------------

        document = Document(
            filename=safe_filename,
            filepath=str(file_path),
            business_id=business_id,
        )

        db.add(document)

        db.commit()

        db.refresh(document)

        # -------------------------------------------------
        # Return success
        # -------------------------------------------------

        return {
            "message": (
                "Document uploaded and "
                "indexed successfully."
            ),
            "id": document.id,
            "filename": document.filename,
            "characters": len(text),
            "chunks": len(chunks),
            "business_id": business_id,
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        if file_path.exists():
            file_path.unlink(
                missing_ok=True
            )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# =========================================================
# DELETE DOCUMENT
# =========================================================

@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # -----------------------------------------------------
    # Find document
    # -----------------------------------------------------

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found.",
        )

    # -----------------------------------------------------
    # Verify business ownership
    # -----------------------------------------------------

    business = (
        db.query(Business)
        .filter(
            Business.id == document.business_id,
            Business.owner_id == current_user.id,
        )
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this document.",
        )

    business_id = document.business_id

    # -----------------------------------------------------
    # Delete physical PDF
    # -----------------------------------------------------

    file_path = Path(
        document.filepath
    )

    if file_path.exists():
        file_path.unlink()

    # -----------------------------------------------------
    # Delete database record
    # -----------------------------------------------------

    db.delete(document)

    db.commit()

    # -----------------------------------------------------
    # Get remaining documents
    # -----------------------------------------------------

    remaining_documents = (
        db.query(Document)
        .filter(
            Document.business_id == business_id
        )
        .all()
    )

    # -----------------------------------------------------
    # Rebuild FAISS index
    # -----------------------------------------------------

    try:
        rebuild_business_index(
            business_id=business_id,
            documents=remaining_documents,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=(
                "Document deleted, but the business "
                "search index could not be rebuilt: "
                f"{str(e)}"
            ),
        )

    return {
        "message": (
            "Document deleted and "
            "search index updated."
        ),
        "document_id": document_id,
        "business_id": business_id,
    }