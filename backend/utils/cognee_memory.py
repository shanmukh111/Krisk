"""
utils/cognee_memory.py — Cognee-powered conversation memory
Drop-in replacement for utils/memory.py (ChromaDB version)
"""
import asyncio
import threading
from datetime import datetime
from cognee import SearchType

import cognee

# --- Single persistent background event loop for ALL Cognee operations ---
_loop = None
_loop_thread = None
_loop_lock = threading.Lock()


def _ensure_loop():
    global _loop, _loop_thread
    with _loop_lock:
        if _loop is None:
            _loop = asyncio.new_event_loop()

            def _run_loop():
                asyncio.set_event_loop(_loop)
                _loop.run_forever()

            _loop_thread = threading.Thread(target=_run_loop, daemon=True)
            _loop_thread.start()
    return _loop


def _run_async(coro, wait=True, timeout=60):
    loop = _ensure_loop()
    future = asyncio.run_coroutine_threadsafe(coro, loop)
    if wait:
        return future.result(timeout=timeout)
    return future


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
    """Writes to Cognee's graph via the shared background loop. Fire-and-forget."""
    text = _format_conversation_text(transcript, intents, mood, context)
    try:
        _run_async(_async_save(text), wait=False)
    except Exception as e:
        print(f"[cognee_memory] background save error: {e}")
    return None


async def _async_search(query: str):
    return await cognee.search(query_text=query)


def get_similar_conversations(query: str, n: int = 3) -> list:
    try:
        results = _run_async(_async_search(query), wait=True, timeout=30)
        similar = []
        for r in results:
            for item in r.get("search_result", [])[:n]:
                similar.append({"summary": item})
        return similar
    except Exception as e:
        print(f"[cognee_memory] retrieval error: {e}")
        return []


def _extract_chunk_text(item):
    """CHUNKS results are dicts with a 'text' field; other types yield strings."""
    if isinstance(item, dict):
        return item.get("text", "")
    return str(item)


async def _async_search_chunks(query: str):
    # CHUNKS = literal retrieved text (deterministic), not an LLM paraphrase,
    # so dish keywords survive for the ranker's substring match.
    return await cognee.search(query_text=query, query_type=SearchType.CHUNKS)


def get_past_preferences(query: str, n: int = 5) -> list:
    try:
        results = _run_async(_async_search_chunks(query), wait=True, timeout=30)
        prefs = []
        for r in results:
            for item in r.get("search_result", [])[:n]:
                text = _extract_chunk_text(item)
                if text:
                    prefs.append({"summary": text})
        return prefs
    except Exception as e:
        print(f"[cognee_memory] preference retrieval error: {e}")
        return []


def get_memory_stats() -> dict:
    return {"backend": "cognee"}
