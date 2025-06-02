#!/usr/bin/env python3
import glob
import os
import json
import requests
import tiktoken
import chromadb
import dotenv

dotenv.load_dotenv()

NEXT_PUBLIC_OBSIDIAN_VAULT_PATH = os.getenv("NEXT_PUBLIC_OBSIDIAN_VAULT_PATH", "")
CHROMADB_COLLECTION = os.getenv("CHROMADB_COLLECTION", "obsidian-notes")
EXTENSIONS = ["md"]
CHUNK_SIZE = 1024
CHUNK_OVERLAP = 200
EMBEDDING_API = "http://localhost:3000/api/embedding"
METADATA_FILE = "last_chunked.json"

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
    response = requests.post(EMBEDDING_API, json={"text": text}, timeout=30)
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


def load_metadata():
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {}
    return {}


def save_metadata(metadata):
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)


if __name__ == "__main__":
    print("Vault Path:", NEXT_PUBLIC_OBSIDIAN_VAULT_PATH)
    print("ChromaDB Collection:", CHROMADB_COLLECTION)

    # Load the metadata file
    metadata = load_metadata()

    # Find all markdown files
    files = []
    for extension in EXTENSIONS:
        files += glob.glob(
            f"{NEXT_PUBLIC_OBSIDIAN_VAULT_PATH}/**/*.{extension}", recursive=True
        )

    for filepath in files:
        try:
            file_mod_time = os.path.getmtime(filepath)
        except OSError as e:
            print(f"⚠️  Skipping {filepath} due to error: {e}")
            continue

        # Decide if file is new or has been modified since last processed
        last_chunked_time = metadata.get(filepath, 0)
        if file_mod_time > last_chunked_time:
            print(f"🔄 Processing updated/new file: {filepath}")
            try:
                process_file(filepath)
                # Update the processed time in metadata file
                metadata[filepath] = file_mod_time
            except Exception as e:
                print(f"❌ Error processing {filepath}: {e}")
        else:
            print(f"⏭️  Skipping {filepath}; no changes detected.")

    # Save the updated metadata
    save_metadata(metadata)
    print("✅ Completed processing files.")
