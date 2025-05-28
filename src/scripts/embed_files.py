#!/usr/bin/env python3
import glob
import os
import requests
import tiktoken
import chromadb
import dotenv

dotenv.load_dotenv()

OBSIDIAN_VAULT_PATH = os.getenv("OBSIDIAN_VAULT_PATH", "")
CHROMADB_COLLECTION = os.getenv("CHROMADB_COLLECTION", "obsidian-notes")
EXTENSIONS = ["md"]
CHUNK_SIZE = 500
CHUNK_OVERLAP = 100
EMBEDDING_API = "http://localhost:3000/api/embedding"

chroma_client = chromadb.HttpClient(host="localhost", port=8000)

print("❤️ Heartbeat", chroma_client.heartbeat())

collection = chroma_client.get_or_create_collection(name=CHROMADB_COLLECTION)

# Tokenizer (match ada-002: uses cl100k_base)
tokenizer = tiktoken.get_encoding("cl100k_base")


def tokenize_text(text):
    return tokenizer.encode(text)


def detokenize(tokens):
    return tokenizer.decode(tokens)


def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    tokens = tokenize_text(text)
    chunks = []
    start = 0
    while start < len(tokens):
        end = start + chunk_size
        chunk = detokenize(tokens[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def get_embedding(text):
    response = requests.post(EMBEDDING_API, json={"text": text}, timeout=10)
    response.raise_for_status()
    return response.json()["vector"]


def process_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()
    chunks = chunk_text(text)
    for idx, chunk in enumerate(chunks):
        embedding = get_embedding(file_path + "\n" + chunk)
        chunk_id = file_path + "-" + str(idx)
        collection.delete(ids=[chunk_id])
        collection.add(
            documents=[chunk],
            embeddings=[embedding],
            ids=[chunk_id],
            metadatas=[{"source": file_path, "chunk_index": idx}],
        )
        print(f"✅ Processed {chunk_id}")
    print(f"✅ Processed {file_path} with {len(chunks)} chunks.")


if __name__ == "__main__":
    print("Vault Path:", OBSIDIAN_VAULT_PATH)
    print("ChromaDB Collection:", CHROMADB_COLLECTION)
    files = []
    for extension in EXTENSIONS:
        files += glob.glob(f"{OBSIDIAN_VAULT_PATH}/**/*.{extension}", recursive=True)

    files = files[0:1]

    for filepath in files:
        process_file(filepath)
