#!/usr/bin/env python3
"""test_forget.py - Targeted forget: save biryani, confirm recall, forget, confirm gone."""

import time
from utils.cognee_memory import (
    save_conversation, get_past_preferences, forget_preference
)

print("=== 1. Seed a biryani memory ===")
save_conversation(
    "I love spicy chicken biryani",
    [{"item": "biryani", "category": "food"}],
    "hungry", "dinner",
)
print("saved (fire-and-forget). Waiting for cognify...")
time.sleep(25)

print("\n=== 2. Recall before forget ===")
before = get_past_preferences("biryani")
print(f"found {len(before)} biryani memories:")
for p in before:
    print("   ", repr(p.get("summary"))[:90])

print("\n=== 3. FORGET biryani ===")
result = forget_preference("biryani")
print("forget result:", result)
time.sleep(10)  # let deletions propagate

print("\n=== 4. Recall after forget ===")
after = get_past_preferences("biryani")
print(f"found {len(after)} biryani memories now:")
for p in after:
    print("   ", repr(p.get("summary"))[:90])

print("\n=== VERDICT ===")
if before and len(after) < len(before):
    print(f"PASS - forgot {len(before) - len(after)} of {len(before)} memories.")
elif not before:
    print("INCONCLUSIVE - nothing was there to forget (cognify may not have finished).")
else:
    print("FAIL - memories still present after forget.")
