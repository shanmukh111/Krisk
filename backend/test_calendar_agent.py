#!/usr/bin/env python3
"""
test_calendar_agent.py - Exercises the calendar_agent node in isolation.

Run from backend/ with venv active:
    python test_calendar_agent.py
"""

from datetime import datetime, timedelta
from agents.calendar_agent import calendar_agent


def show(label, state_out):
    print(f"\n=== {label} ===")
    for k, v in state_out.items():
        print(f"{k}: {v}")


# 1. Non-calendar turn → node should no-op (no Google call).
show("A: non-calendar intent (should skip)",
     calendar_agent({"transcript": "I want some spicy biryani"}))

# 2. Calendar-related read → should return upcoming events context.
show("B: calendar read",
     calendar_agent({"transcript": "what's on my schedule this week?"}))

# 3. Staged write WITHOUT confirmation → should PROPOSE, not create.
tomorrow = datetime.now() + timedelta(days=1)
start = tomorrow.replace(hour=20, minute=0, second=0, microsecond=0).strftime("%Y-%m-%dT%H:%M:%S")
end = tomorrow.replace(hour=21, minute=0, second=0, microsecond=0).strftime("%Y-%m-%dT%H:%M:%S")
write = {"summary": "Krisk test dinner", "start": start, "end": end,
         "description": "created by Krisk calendar_agent test"}

show("C: write without confirm (should NOT create)",
     calendar_agent({"transcript": "book dinner tomorrow 8pm", "calendar_write": write}))

# 4. Same write WITH confirmation → should actually create the event.
#    Comment this block out if you don't want a real event on your calendar.
show("D: write WITH confirm (creates a real event)",
     calendar_agent({
         "transcript": "book dinner tomorrow 8pm",
         "calendar_write": write,
         "confirm_calendar_write": True,
     }))

print("\nDone. If D created an event, check Google Calendar for 'Krisk test dinner' tomorrow 8pm.")
