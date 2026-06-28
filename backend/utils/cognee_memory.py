"""
utils/cognee_memory.py — Cognee-powered conversation memory
Drop-in replacement for utils/memory.py (ChromaDB version)
"""
import asyncio
import threading
from datetime import datetime

import cognee


def _format_conversation_text(transcript: str, intents: list, mood: str, context: str) -> str:
    intent_text = ", ".join([f"{i.get('item')} ({i.get('category')})" for i in intents])
    timestamp = datetime.now().isoformat()
    return (
        f"At {timestamp}, user said: '{transcript}'. "
        f"They wanted: {intent_text}. Mood: {mood}. Context: {context}."
    )


async def _async_save(text: str):
    await cognee.add(text)
    await cognee.cognify()


def save_conversation(transcript: str, intents: list, mood: str, context: str):
    """Writes to Cognee's graph. Runs in a background thread — does NOT block the pipeline."""
    text = _format_conversation_text(transcript, intents, mood, context)

    def _run():
        try:
            asyncio.run(_async_save(text))
        except Exception as e:
            print(f"[cognee_memory] background save error: {e}")

    threading.Thread(target=_run, daemon=True).start()
    return None


async def _async_search(query: str):
    return await cognee.search(query_text=query)


def get_similar_conversations(query: str, n: int = 3) -> list:
    try:
        results = asyncio.run(_async_search(query))
        similar = []
        for r in results:
            for item in r.get("search_result", [])[:n]:
                similar.append({"summary": item})
        return similar
    except Exception as e:
        print(f"[cognee_memory] retrieval error: {e}")
        return []


def get_past_preferences(query: str, n: int = 5) -> list:
    try:
        results = asyncio.run(_async_search(f"What does the user prefer related to: {query}"))
        prefs = []
        for r in results:
            for item in r.get("search_result", [])[:n]:
                prefs.append({"summary": item})
        return prefs
    except Exception as e:
        print(f"[cognee_memory] preference retrieval error: {e}")
        return []


def get_memory_stats() -> dict:
    return {"backend": "cognee"}