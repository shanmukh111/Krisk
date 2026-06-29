#!/usr/bin/env python3
"""test_pipeline_calendar.py - calendar_agent inside the real pipeline."""

import time
from pipeline import run_pipeline


def show(label, result):
    print(f"\n=== {label} ===")
    print("intents          :", result.get("intents"))
    print("recommendations  :", len(result.get("recommendations", [])), "items")
    print("calendar_context :", result.get("calendar_context"))
    print("calendar_action  :", result.get("calendar_action"))
    print("error            :", result.get("error"))


show("A: food request (calendar should be None)",
     run_pipeline("I want some spicy biryani", [], "test-cal-1"))

show("B: schedule question (calendar should fire)",
     run_pipeline("what's on my schedule this week?", [], "test-cal-2"))

print("\nWaiting for background Cognee saves to flush before exit...")
time.sleep(20)
print("Done.")
