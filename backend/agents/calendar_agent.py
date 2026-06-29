"""
agents/calendar_agent.py — Calendar capability for Krisk via the Google Calendar
MCP server (langchain-mcp-adapters bridge).

Design decisions (all toggleable below):
  - MODE: "read_write" — list/search/create events. delete/update reachable but
    only via explicit confirmed writes.
  - Runs only when the turn looks calendar-related (see _looks_calendar_related).
  - Any write (create/update/delete) requires an explicit confirmation flag in
    state; otherwise the node PROPOSES the action and waits.

The MCP server is launched as a stdio subprocess by MultiServerMCPClient — no
separate process to manage. Tools come back as LangChain tools.
"""

import asyncio
import json
import os
import threading
from datetime import datetime, timedelta

from langchain_mcp_adapters.client import MultiServerMCPClient

# ----------------------------------------------------------------------
# Config — change these to adjust behaviour
# ----------------------------------------------------------------------
HOME = os.path.expanduser("~")
MCP_SERVER_ENTRY = f"{HOME}/Shanmukh/cognee-hack/google-calendar-mcp/build/index.js"
OAUTH_CREDS = f"{HOME}/Shanmukh/cognee-hack/convo-recommender/backend/gcp-oauth.keys.json"

CALENDAR_ID = "primary"
LOOKAHEAD_DAYS = 7
REQUIRE_WRITE_CONFIRMATION = True   # writes need state["confirm_calendar_write"] = True

# Keywords that make us bother calling the calendar at all.
_CALENDAR_HINTS = (
    "calendar", "schedule", "event", "meeting", "appointment", "free",
    "busy", "available", "book", "remind", "tomorrow", "tonight",
    "this week", "next week", "plan", "dinner at", "reserve",
)


# ----------------------------------------------------------------------
# Persistent background event loop (same pattern as cognee_memory.py).
# FastAPI/LangGraph call us synchronously; MCP is async. One long-lived loop
# in a daemon thread lets us bridge without asyncio.run() churn.
# ----------------------------------------------------------------------
_loop = None
_loop_thread = None
_loop_lock = threading.Lock()
_client = None
_tools_by_name = None


def _ensure_loop():
    global _loop, _loop_thread
    with _loop_lock:
        if _loop is None:
            _loop = asyncio.new_event_loop()

            def _run():
                asyncio.set_event_loop(_loop)
                _loop.run_forever()

            _loop_thread = threading.Thread(target=_run, daemon=True)
            _loop_thread.start()
    return _loop


def _run_async(coro, timeout=60):
    loop = _ensure_loop()
    return asyncio.run_coroutine_threadsafe(coro, loop).result(timeout=timeout)


def _clean_env():
    # Drop PS1 etc. so the node subprocess doesn't emit prompt-var warnings.
    env = {k: v for k, v in os.environ.items() if k != "PS1"}
    env["GOOGLE_OAUTH_CREDENTIALS"] = OAUTH_CREDS
    return env


async def _ensure_tools():
    """Connect to the MCP server once and cache its tools."""
    global _client, _tools_by_name
    if _tools_by_name is not None:
        return _tools_by_name
    _client = MultiServerMCPClient(
        {
            "calendar": {
                "command": "node",
                "args": [MCP_SERVER_ENTRY],
                "transport": "stdio",
                "env": _clean_env(),
            }
        }
    )
    tools = await _client.get_tools()
    _tools_by_name = {t.name: t for t in tools}
    return _tools_by_name


def _parse_mcp_text(result):
    """MCP tool results arrive as [{'type':'text','text': '<json>'}]. Unwrap to dict."""
    try:
        if isinstance(result, list) and result and isinstance(result[0], dict):
            text = result[0].get("text", "")
            return json.loads(text)
        if isinstance(result, str):
            return json.loads(result)
    except (json.JSONDecodeError, TypeError):
        pass
    return {"raw": result}


def _looks_calendar_related(text: str) -> bool:
    t = (text or "").lower()
    return any(h in t for h in _CALENDAR_HINTS)


def _iso(dt: datetime) -> str:
    # Server wants ISO 8601 WITHOUT timezone suffix.
    return dt.strftime("%Y-%m-%dT%H:%M:%S")


# ----------------------------------------------------------------------
# Low-level helpers (each returns a plain dict)
# ----------------------------------------------------------------------
async def _list_events(days: int = LOOKAHEAD_DAYS) -> dict:
    tools = await _ensure_tools()
    now = datetime.now()
    res = await tools["list-events"].ainvoke({
        "calendarId": CALENDAR_ID,
        "timeMin": _iso(now),
        "timeMax": _iso(now + timedelta(days=days)),
    })
    return _parse_mcp_text(res)


async def _search_events(query: str) -> dict:
    tools = await _ensure_tools()
    now = datetime.now()
    res = await tools["search-events"].ainvoke({
        "calendarId": CALENDAR_ID,
        "query": query,
        "timeMin": _iso(now),
        "timeMax": _iso(now + timedelta(days=LOOKAHEAD_DAYS)),
    })
    return _parse_mcp_text(res)


async def _create_event(summary: str, start_iso: str, end_iso: str,
                        description: str = "") -> dict:
    tools = await _ensure_tools()
    res = await tools["create-event"].ainvoke({
        "calendarId": CALENDAR_ID,
        "summary": summary,
        "start": start_iso,
        "end": end_iso,
        "description": description,
    })
    return _parse_mcp_text(res)


# ----------------------------------------------------------------------
# Public sync wrappers (for non-LangGraph callers / tests)
# ----------------------------------------------------------------------
def get_upcoming_events(days: int = LOOKAHEAD_DAYS) -> dict:
    try:
        return _run_async(_list_events(days))
    except Exception as e:
        return {"error": f"calendar list failed: {e}"}


def search_calendar(query: str) -> dict:
    try:
        return _run_async(_search_events(query))
    except Exception as e:
        return {"error": f"calendar search failed: {e}"}


def create_calendar_event(summary, start_iso, end_iso, description="") -> dict:
    try:
        return _run_async(_create_event(summary, start_iso, end_iso, description))
    except Exception as e:
        return {"error": f"calendar create failed: {e}"}


# ----------------------------------------------------------------------
# LangGraph node
# ----------------------------------------------------------------------
def calendar_agent(state: dict) -> dict:
    """
    Reads:
      state["transcript"]            - latest user text (for intent gating)
      state["calendar_write"]        - optional dict: {summary, start, end, description}
      state["confirm_calendar_write"]- bool; must be True to actually create
    Writes:
      state["calendar_context"]      - upcoming events (for the ranker / LLM to use)
      state["calendar_action"]       - result/proposal of any write
    """
    transcript = state.get("transcript", "")
    out = {}

    # Gate: only touch Google when the turn smells calendar-related.
    if not _looks_calendar_related(transcript):
        return {"calendar_context": None, "calendar_action": None}

    # READ: always safe — surface upcoming events as context.
    out["calendar_context"] = get_upcoming_events()

    # WRITE: only if the pipeline explicitly staged one.
    write = state.get("calendar_write")
    if write:
        if REQUIRE_WRITE_CONFIRMATION and not state.get("confirm_calendar_write"):
            # Propose, do not execute.
            out["calendar_action"] = {
                "status": "needs_confirmation",
                "proposed": write,
                "message": (
                    f"About to create '{write.get('summary')}' "
                    f"from {write.get('start')} to {write.get('end')}. "
                    "Set confirm_calendar_write=True to proceed."
                ),
            }
        else:
            result = create_calendar_event(
                write.get("summary", "Untitled"),
                write.get("start"),
                write.get("end"),
                write.get("description", ""),
            )
            out["calendar_action"] = {"status": "created", "result": result}

    return out
