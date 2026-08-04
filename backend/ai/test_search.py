from ai.vector_store import load_vector_store


vector_store = load_vector_store()

question = "What is the return policy?"

results = vector_store.similarity_search(
    question,
    k=3,
)

print("\nRelevant information:\n")

for i, result in enumerate(results, 1):
    print(f"--- Result {i} ---")
    print(result.page_content)
    print()