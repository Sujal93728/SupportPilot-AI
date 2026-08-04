from langchain_google_genai import ChatGoogleGenerativeAI

from ai.vector_store import search_similar


def answer_question(question: str):
    """
    Answer a user question using relevant document context.
    """

    results = search_similar(question)

    if not results:
        context = "No relevant information was found in the uploaded documents."
    else:
        context = "\n\n".join(
            result["text"] if isinstance(result, dict) else str(result)
            for result in results
        )

    prompt = f"""
You are SupportPilot AI, an intelligent customer support assistant.

Answer the user's question clearly and professionally.

Use ONLY the provided document context when answering.
If the answer cannot be found in the context, say that the information
is not available in the uploaded documents.

Document context:
{context}

User question:
{question}

Answer:
"""

    llm = ChatGoogleGenerativeAI(
        model="gemini-3.5-flash"
    )

    response = llm.invoke(prompt)

    content = response.content

    if isinstance(content, list):
        text_parts = []

        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                text_parts.append(item.get("text", ""))
            elif isinstance(item, str):
                text_parts.append(item)

        return "\n".join(text_parts).strip()

    return str(content)