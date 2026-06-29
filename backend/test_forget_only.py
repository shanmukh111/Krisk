#!/usr/bin/env python3
"""test_forget_only.py - forget precision test against memories already in graph (no reseed)."""

import time
from utils.cognee_memory import get_past_preferences, forget_preference

print("=== PROPOSE forget('biryani', confirm=False) ===")
proposal = forget_preference("biryani", confirm=False)
print("status :", proposal.get("status"))
print("checked:", proposal.get("checked"), "candidates")
print("count  :", proposal.get("count"))
print("WILL FORGET:")
for t in proposal.get("will_forget", []):
    print("   -", t[:80])
print(">>> Should be ONLY biryani memories, NOT schedule/movie/shoes/music/pizza.")

print("\n=== CONFIRM forget('biryani', confirm=True) ===")
result = forget_preference("biryani", confirm=True)
print("status:", result.get("status"), "| forgotten:", result.get("forgotten"))
for t in result.get("forgot_texts", []):
    print("   forgot:", t[:80])
time.sleep(10)

print("\n=== Survivor check ===")
for probe in ["biryani", "movie", "shoes", "music", "pizza", "dosa"]:
    hits = get_past_preferences(probe)
    print(f"  '{probe}': {len(hits)} memories")
print(">>> biryani ~0; movie/shoes/music should survive. Watch pizza/dosa (food but not biryani).")
