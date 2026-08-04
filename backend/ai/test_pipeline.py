from ai.pdf_loader import extract_text_from_pdf
from ai.chunking import split_text
from ai.vector_store import (
    create_vector_store,
    save_vector_store,
)


PDF_PATH = "uploads/test.pdf"


text = extract_text_from_pdf(PDF_PATH)

print("Extracted characters:", len(text))

chunks = split_text(text)

print("Created chunks:", len(chunks))

vector_store = create_vector_store(chunks)

save_vector_store(vector_store)

print("FAISS index created successfully!")