"""
utils/memory.py — ChromaDB conversation memory
"""

__import__('pysqlite3')
import sys
sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')

import chromadb
from chromadb.utils import embedding_functions
import json
import uuid
from datetime import datetime
from config import CHROMA_DB_PATH

client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
ef = embedding_functions.DefaultEmbeddingFunction()

conversations = client.get_or_create_collection(name="conversations", embedding_function=ef)
preferences = client.get_or_create_collection(name="preferences", embedding_function=ef)


def save_conversation(transcript: str, intents: list, mood: str, context: str):
    doc_id = str(uuid.uuid4())
    intent_text = ", ".join([f"{i.get('item')} ({i.get('category')})" for i in intents])
    document = f"User said: {transcript}. Wanted: {intent_text}. Mood: {mood}. Context: {context}"
    metadata = {
        "transcript": transcript,
        "intents": json.dumps(intents),
        "mood": mood,
        "context": context,
        "timestamp": datetime.now().isoformat()
    }
    conversations.add(documents=[document], metadatas=[metadata], ids=[doc_id])
    for intent in intents:
        pref_id = str(uuid.uuid4())
        pref_doc = f"{intent.get('item')} - {intent.get('category')} - {mood} - {context}"
        preferences.add(
            documents=[pref_doc],
            metadatas={"item": intent.get("item",""), "category": intent.get("category",""), "mood": mood, "context": context, "timestamp": datetime.now().isoformat()},
            ids=[pref_id]
        )
    return doc_id


def get_similar_conversations(query: str, n: int = 3) -> list:
    try:
        count = conversations.count()
        if count == 0:
            return []
        results = conversations.query(query_texts=[query], n_results=min(n, count))
        similar = []
        for i, doc in enumerate(results["documents"][0]):
            metadata = results["metadatas"][0][i]
            similar.append({
                "transcript": metadata.get("transcript", ""),
                "intents": json.loads(metadata.get("intents", "[]")),
                "mood": metadata.get("mood", ""),
                "context": metadata.get("context", ""),
                "similarity": 1 - results["distances"][0][i]
            })
        return similar
    except Exception as e:
        print(f"Memory retrieval error: {e}")
        return []


def get_past_preferences(query: str, n: int = 5) -> list:
    try:
        count = preferences.count()
        if count == 0:
            return []
        results = preferences.query(query_texts=[query], n_results=min(n, count))
        return [{"item": m.get("item",""), "category": m.get("category",""), "mood": m.get("mood",""), "context": m.get("context","")} for m in results["metadatas"][0]]
    except Exception as e:
        print(f"Preference retrieval error: {e}")
        return []


def get_memory_stats() -> dict:
    return {"total_conversations": conversations.count(), "total_preferences": preferences.count()}
