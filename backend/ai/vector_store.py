from langchain_community.vectorstores import FAISS

from ai.embeddings import get_embeddings


def create_vector_store(chunks):
    if not chunks:
        raise ValueError("No text chunks provided")

    embeddings = get_embeddings()

    return FAISS.from_texts(
        chunks,
        embedding=embeddings,
    )


def save_vector_store(vector_store, path="faiss_index"):
    vector_store.save_local(path)


def load_vector_store(path="faiss_index"):
    embeddings = get_embeddings()

    return FAISS.load_local(
        path,
        embeddings,
        allow_dangerous_deserialization=True,
    )


def search_similar(query, k=4, path="faiss_index"):
    """
    Search the FAISS vector store for chunks most similar to the query.
    """
    vector_store = load_vector_store(path)

    results = vector_store.similarity_search(query, k=k)

    return results