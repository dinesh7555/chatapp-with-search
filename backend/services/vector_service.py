
# import os
# import httpx
# import faiss
# import pickle
# import numpy as np
# from typing import List

# # ---------------- CONFIG ----------------

# OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# EMBED_URL = "https://openrouter.ai/api/v1/embeddings"
# EMBED_MODEL = "text-embedding-3-small"

# EMBED_DIM = 1536

# FAISS_DIR = "/app/faiss"
# FAISS_INDEX_PATH = f"{FAISS_DIR}/faiss.index"
# META_PATH = f"{FAISS_DIR}/faiss_meta.pkl"

# os.makedirs(FAISS_DIR, exist_ok=True)

# # ---------------- LOAD / INIT FAISS ----------------

# if os.path.exists(FAISS_INDEX_PATH):
#     index = faiss.read_index(FAISS_INDEX_PATH)
# else:
#     index = faiss.IndexFlatL2(EMBED_DIM)

# if os.path.exists(META_PATH):
#     with open(META_PATH, "rb") as f:
#         METADATA = pickle.load(f)
# else:
#     METADATA = []

# # ---------------- EMBEDDING ----------------

# async def embed_text(text: str) -> List[float]:
#     headers = {
#         "Authorization": f"Bearer {OPENROUTER_API_KEY}",
#         "Content-Type": "application/json"
#     }

#     payload = {
#         "model": EMBED_MODEL,
#         "input": text
#     }

#     async with httpx.AsyncClient(timeout=30) as client:
#         response = await client.post(EMBED_URL, headers=headers, json=payload)
#         response.raise_for_status()
#         data = response.json()

#     return data["data"][0]["embedding"]

# # ---------------- STORE EMBEDDING ----------------

# async def store_embedding(user_id: int, message_id: str, text: str):
#     embedding = await embed_text(text)

#     # ✅ Convert to NumPy float32, shape (1, dim)
#     vector = np.array([embedding], dtype="float32")

#     index.add(vector)

#     METADATA.append({
#         "user_id": user_id,
#         "message_id": message_id,
#         "text": text
#     })

#     faiss.write_index(index, FAISS_INDEX_PATH)
#     with open(META_PATH, "wb") as f:
#         pickle.dump(METADATA, f)

# # ---------------- SEMANTIC SEARCH ----------------

# async def search_similar(user_id: int, query: str, top_k: int = 3):
#     if index.ntotal == 0:
#         return []

#     query_embedding = await embed_text(query)

#     # ✅ Convert query to NumPy
#     query_vector = np.array([query_embedding], dtype="float32")

#     distances, indices = index.search(query_vector, top_k * 5)

#     results = []
#     for idx in indices[0]:
#         if idx == -1:
#             continue

#         meta = METADATA[idx]
#         if meta["user_id"] != user_id:
#             continue

#         results.append(meta["text"])
#         if len(results) == top_k:
#             break

#     return results



import os
import httpx
import faiss
import pickle
import numpy as np
from typing import List

# ---------------- CONFIG ----------------

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

EMBED_URL = "https://openrouter.ai/api/v1/embeddings"
EMBED_MODEL = "openai/text-embedding-3-small"

EMBED_DIM = 1536

FAISS_DIR = "/app/faiss"
FAISS_INDEX_PATH = f"{FAISS_DIR}/faiss.index"
META_PATH = f"{FAISS_DIR}/faiss_meta.pkl"

os.makedirs(FAISS_DIR, exist_ok=True)

# ---------------- LOAD / INIT FAISS ----------------

if os.path.exists(FAISS_INDEX_PATH):
    index = faiss.read_index(FAISS_INDEX_PATH)
else:
    index = faiss.IndexFlatL2(EMBED_DIM)

if os.path.exists(META_PATH):
    with open(META_PATH, "rb") as f:
        METADATA = pickle.load(f)
else:
    METADATA = []

# ---------------- EMBEDDING ----------------

# async def embed_text(text: str) -> List[float]:
#     headers = {
#         "Authorization": f"Bearer {OPENROUTER_API_KEY}",
#         "Content-Type": "application/json"
#     }

#     payload = {
#         "model": EMBED_MODEL,
#         "input": text
#     }

#     async with httpx.AsyncClient(timeout=30) as client:
#         response = await client.post(EMBED_URL, headers=headers, json=payload)
#         response.raise_for_status()
#         data = response.json()

#     return data["data"][0]["embedding"]

async def embed_text(text: str) -> List[float]:

    if not text or not text.strip():
        return None

    if not OPENROUTER_API_KEY:
        raise Exception("OPENROUTER_API_KEY missing")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",   # REQUIRED sometimes
        "X-Title": "ai-backend"
    }

    payload = {
        "model": EMBED_MODEL,
        "input": text
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            EMBED_URL,
            headers=headers,
            json=payload
        )

        # 🔥 IMPORTANT DEBUG
        if response.status_code != 200:
            print("Embedding error:", response.status_code)
            print(response.text)

        response.raise_for_status()
        data = response.json()

    return data["data"][0]["embedding"]

# ---------------- STORE EMBEDDING ----------------

async def store_embedding(user_id: int, message_id: str, text: str, subject_id: str):
    embedding = await embed_text(text)

    # ✅ Convert to NumPy float32, shape (1, dim)
    vector = np.array([embedding], dtype="float32")

    index.add(vector)

    METADATA.append({
        "user_id": user_id,
        "subject_id": subject_id,
        "message_id": message_id,
        "text": text
          
    })

    faiss.write_index(index, FAISS_INDEX_PATH)
    with open(META_PATH, "wb") as f:
        pickle.dump(METADATA, f)

# ---------------- SEMANTIC SEARCH ----------------

async def search_similar(user_id: int, query: str, subject_id: str, top_k: int = 3):
    if index.ntotal == 0:
        return []

    query_embedding = await embed_text(query)

    # ✅ Convert query to NumPy
    query_vector = np.array([query_embedding], dtype="float32")

    distances, indices = index.search(query_vector, top_k * 5)

    results = []
    for idx in indices[0]:
        if idx == -1:
            continue

        meta = METADATA[idx]
        if meta["user_id"] != user_id:
            continue
        if meta["subject_id"] != subject_id:
            continue

        results.append(meta["text"])
        if len(results) == top_k:
            break
    print(results)
    return results

