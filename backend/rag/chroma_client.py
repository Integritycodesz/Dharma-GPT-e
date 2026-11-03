import os
from functools import lru_cache
import chromadb

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "chroma_db")

@lru_cache(maxsize=1)
def get_chroma_client():
    """Singleton PersistentClient to avoid re-opening SQLite on every request."""
    return chromadb.PersistentClient(path=DB_PATH)

@lru_cache(maxsize=10)
def get_persona_collection(persona_name: str):
    """
    Cached collection accessor.
    Maps persona (e.g. 'krishna') to pre-seeded collection 'dharma_krishna_collection'.
    """
    client = get_chroma_client()
    col_name = persona_name if persona_name.startswith("dharma_") else f"dharma_{persona_name}_collection"
    try:
        return client.get_collection(col_name)
    except Exception:
        return client.get_or_create_collection(col_name)
