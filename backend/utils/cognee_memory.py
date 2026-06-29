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

def _llm_confirms_forget(query: str, memory_text: str) -> bool:
    """Ask gemma whether `memory_text` is something the user wants to forget."""
    from utils.youtube_ranker import client as ollama_client
    try:
        resp = ollama_client.chat(
            model="gemma3:12b",
            messages=[{
                "role": "user",
                "content": (
                    f"The user wants to forget memories about: \"{query}\".\n"
                    f"Here is one stored memory:\n\"{memory_text}\"\n\n"
                    f"Does this memory relate to what the user wants to forget? "
                    f"Reply with ONLY one word: yes or no."
                ),
            }],
        )
        answer = resp["message"]["content"].strip().lower()
        return answer.startswith("y")
    except Exception as e:
        print(f"[cognee_memory] LLM judge error: {e} — defaulting to NOT forgetting")
        return False  # fail safe: when unsure, keep the memory


async def _async_find_forget_candidates(query: str) -> list:
    """Search candidates, return list of {text, data_id, dataset_id}."""
    results = await cognee.search(query_text=query, query_type=SearchType.CHUNKS)
    candidates = []
    seen = set()
    for r in results:
        dataset_id = r.get("dataset_id")
        for item in r.get("search_result", []):
            if isinstance(item, dict):
                doc_id = item.get("document_id")
                text = item.get("text", "")
                if doc_id and dataset_id and doc_id not in seen:
                    seen.add(doc_id)
                    candidates.append({
                        "text": text,
                        "data_id": str(doc_id),
                        "dataset_id": str(dataset_id),
                    })
    return candidates


def forget_preference(query: str, confirm: bool = False) -> dict:
    """
    Hybrid forget: search narrows candidates -> gemma confirms each ->
    propose (confirm=False) or delete (confirm=True). Mirrors the calendar
    write guardrail: nothing is deleted without an explicit confirm.
    """
    import uuid
    try:
        candidates = _run_async(_async_find_forget_candidates(query), wait=True, timeout=30)
    except Exception as e:
        return {"status": "error", "error": f"search failed: {e}"}

    # LLM confirms each candidate (precision filter over the search recall).
    to_forget = [c for c in candidates if _llm_confirms_forget(query, c["text"])]

    if not to_forget:
        return {"status": "nothing_matched", "checked": len(candidates), "will_forget": []}

    if not confirm:
        return {
            "status": "needs_confirmation",
            "checked": len(candidates),
            "count": len(to_forget),
            "will_forget": [c["text"] for c in to_forget],
            "message": f"Will forget {len(to_forget)} memory(ies). Call again with confirm=True.",
        }

    # confirm=True -> actually delete the LLM-confirmed set.
    forgotten, errors = 0, []
    for c in to_forget:
        try:
            _run_async(
                cognee.forget(
                    data_id=uuid.UUID(c["data_id"]),
                    dataset_id=uuid.UUID(c["dataset_id"]),
                ),
                wait=True, timeout=60,
            )
            forgotten += 1
        except Exception as e:
            errors.append(f"{c['data_id']}: {e}")

    return {"status": "forgotten", "forgotten": forgotten,
            "forgot_texts": [c["text"] for c in to_forget], "errors": errors}


def forget_all() -> dict:
    """Hard reset — wipe all stored memory."""
    try:
        _run_async(cognee.forget(everything=True), wait=True, timeout=120)
        return {"status": "all memory forgotten"}
    except Exception as e:
        print(f"[cognee_memory] forget_all error: {e}")
        return {"status": "error", "error": str(e)}
    
def get_memory_stats() -> dict:
    return {"backend": "cognee"}
