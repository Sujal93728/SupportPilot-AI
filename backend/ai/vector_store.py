from pathlib import Path

from langchain_community.vectorstores import FAISS

from ai.embeddings import get_embeddings


BASE_FAISS_DIR = Path("faiss_index")


def get_business_index_path(business_id: int) -> str:
    """
    Return the FAISS directory for a specific business.
    Example:
        faiss_index/business_1
        faiss_index/business_2
    """

    path = BASE_FAISS_DIR / f"business_{business_id}"

    path.mkdir(parents=True, exist_ok=True)

    return str(path)


def create_vector_store(chunks):
    if not chunks:
        raise ValueError("No text chunks provided")

    embeddings = get_embeddings()

    return FAISS.from_texts(
        chunks,
        embedding=embeddings,
    )


def save_vector_store(
    vector_store,
    business_id: int,
):
    """
    Save a vector store inside the business-specific directory.
    """

    path = get_business_index_path(business_id)

    vector_store.save_local(path)


def load_vector_store(
    business_id: int,
):
    """
    Load only the FAISS index belonging to the requested business.
    """

    path = get_business_index_path(business_id)

    index_file = Path(path) / "index.faiss"

    if not index_file.exists():
        raise FileNotFoundError(
            f"No vector index exists for business {business_id}"
        )

    embeddings = get_embeddings()

    return FAISS.load_local(
        path,
        embeddings,
        allow_dangerous_deserialization=True,
    )


def search_similar(
    query: str,
    business_id: int,
    k: int = 4,
):
    """
    Search ONLY the vector store belonging to the selected business.
    """

    vector_store = load_vector_store(business_id)

    return vector_store.similarity_search(
        query,
        k=k,
    )

def delete_business_index(business_id: int):
    """
    Completely remove the FAISS index for a business.
    """
    import shutil

    path = Path(
        get_business_index_path(business_id)
    )

    if path.exists():
        shutil.rmtree(path)


def rebuild_business_index(
    business_id: int,
    documents,
):
    """
    Rebuild the FAISS index for a business
    using the remaining documents.
    """

    from ai.pdf_loader import extract_text_from_pdf
    from ai.chunking import split_text

    all_chunks = []

    for document in documents:

        file_path = Path(
            document.filepath
        )

        if not file_path.exists():
            continue

        text = extract_text_from_pdf(
            str(file_path)
        )

        if not text.strip():
            continue

        chunks = split_text(text)

        if chunks:
            all_chunks.extend(chunks)

    # -----------------------------------------------------
    # No remaining documents
    # -----------------------------------------------------

    if not all_chunks:
        delete_business_index(
            business_id
        )

        return False

    # -----------------------------------------------------
    # Create new FAISS index
    # -----------------------------------------------------

    vector_store = create_vector_store(
        all_chunks
    )

    save_vector_store(
        vector_store,
        business_id
    )

    return True