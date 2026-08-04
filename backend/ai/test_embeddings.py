from ai.embeddings import get_embeddings


embeddings = get_embeddings()

result = embeddings.embed_query(
    "What is the return policy?"
)

print("Embedding created!")
print("Vector dimensions:", len(result))
print("First 5 values:", result[:5])