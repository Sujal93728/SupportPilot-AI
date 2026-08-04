import os

from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()


def get_embeddings():
    api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GOOGLE_API_KEY is missing from your .env file"
        )

    return GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=api_key,
    )