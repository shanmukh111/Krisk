#!/usr/bin/env python3
"""
test_calendar_mcp.py - Standalone check that the Calendar MCP server is reachable
from Python via langchain-mcp-adapters, BEFORE wiring it into the Krisk pipeline.

Run from backend/ with the venv active:
    cd ~/Shanmukh/cognee-hack/convo-recommender/backend
    source ~/Shanmukh/cognee-hack/venv/bin/activate
    python test_calendar_mcp.py

What it does:
  1. Launches the local Calendar MCP server as a stdio subprocess.
  2. Lists the MCP tools it exposes (proves the bridge works).
  3. Calls list-events for the next 7 days and prints your real calendar.
"""

import asyncio
import os
from datetime import datetime, timedelta, timezone

from langchain_mcp_adapters.client import MultiServerMCPClient

# --- Absolute paths (adjust if your layout differs) ---
HOME = os.path.expanduser("~")
MCP_SERVER_ENTRY = f"{HOME}/Shanmukh/cognee-hack/google-calendar-mcp/build/index.js"
OAUTH_CREDS = f"{HOME}/Shanmukh/cognee-hack/convo-recommender/backend/gcp-oauth.keys.json"


def _make_client() -> MultiServerMCPClient:
    return MultiServerMCPClient(
        {
            "calendar": {
                "command": "node",
                "args": [MCP_SERVER_ENTRY],
                "transport": "stdio",
                # The server reads creds from this env var; token is already on disk.
                "env": {
                    **os.environ,
                    "GOOGLE_OAUTH_CREDENTIALS": OAUTH_CREDS,
                },
            }
        }
    )


async def main():
    print("Launching Calendar MCP server via langchain-mcp-adapters...\n")
    client = _make_client()

    # 1. Discover tools
    tools = await client.get_tools()
    print(f"Loaded {len(tools)} tools from the calendar server:")
    for t in tools:
        print(f"  - {t.name}")
    print()

    # 2. Find list-events (tool names use hyphens in this server)
    by_name = {t.name: t for t in tools}
    list_events = by_name.get("list-events")
    list_calendars = by_name.get("list-calendars")

    if list_calendars is not None:
        print("Calendars on your account:")
        cals = await list_calendars.ainvoke({})
        print(cals)
        print()

    if list_events is None:
        print("No 'list-events' tool found - tool names may have changed. "
              "See the list above and tell me which to call.")
        return

    # 3. Pull this week's events.
    now = datetime.now()
    week_later = now + timedelta(days=7)
    args = {
        "calendarId": "primary",
        "timeMin": now.strftime("%Y-%m-%dT%H:%M:%S"),
        "timeMax": week_later.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    print(f"Calling list-events on 'primary' from {now.date()} to {week_later.date()}...\n")
    try:
        result = await list_events.ainvoke(args)
        print("=== RAW RESULT ===")
        print(result)
    except Exception as e:
        print("list-events call failed:", repr(e))
        print("\nThe argument schema may differ. Print the schema with:")
        print("  python -c \"import asyncio; ...\"  (tell me and I'll adjust args)")


if __name__ == "__main__":
    asyncio.run(main())
