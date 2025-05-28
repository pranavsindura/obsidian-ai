#!/usr/bin/env python3
import os
import requests
import chromadb

# Config
EMBEDDING_API = "http://localhost:3000/api/embedding"
CHROMADB_COLLECTION = os.getenv("CHROMADB_COLLECTION", "obsidian-notes")

# Init ChromaDB
chroma_client = chromadb.HttpClient(host="localhost", port=8000)

print("❤️ Heartbeat", chroma_client.heartbeat())

print(chroma_client.list_collections())
collection = chroma_client.get_collection(name=CHROMADB_COLLECTION)


def get_embedding(text):
    response = requests.post(EMBEDDING_API, json={"text": text}, timeout=10)
    response.raise_for_status()
    return response.json()["vector"]


if __name__ == "__main__":
    input_query = input("Enter your query: ")
    results = collection.query(
        query_embeddings=[get_embedding(input_query)],
        n_results=5,
    )
    print(results)
