from langchain_google_genai import ChatGoogleGenerativeAI

from ai.vector_store import search_similar


def answer_question(question: str, business_id: int):
    """
    Answer a user question using only documents
    belonging to the selected business.
    """

    results = search_similar(
        question,
        business_id=business_id,
        k=4,
    )

    if not results:
        context = (
            "No relevant information was found "
            "in this business's uploaded documents."
        )
    else:
        context = "\n\n".join(
            result.page_content
            if hasattr(result, "page_content")
            else str(result)
            for result in results
        )

    prompt = f"""
You are SupportPilot AI, an intelligent customer support assistant.

Answer the user's question clearly and professionally.

IMPORTANT RULES:
- Use ONLY the provided document context.
- The context belongs ONLY to the selected business.
- Do not use information from other businesses.
- If the answer cannot be found in the context, say:
  "The information is not available in this business's uploaded documents."

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