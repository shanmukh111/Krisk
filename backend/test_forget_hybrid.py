#!/usr/bin/env python3
"""test_forget_hybrid.py - 20-memory precision test for hybrid forget."""

import time
from utils.cognee_memory import save_conversation, get_past_preferences, forget_preference

# Mix: biryani cluster + clearly unrelated. We expect forget('biryani') to hit
# ONLY the biryani ones and spare schedule/movie/shopping/music memories.
MEMORIES = [
    ("I want spicy chicken biryani",        "biryani",        "food"),
    ("biryani is my favorite dish",         "biryani",        "food"),
    ("get me some hyderabadi biryani",      "biryani",        "food"),
    ("I love mutton biryani on weekends",   "biryani",        "food"),
    ("craving biryani right now",           "biryani",        "food"),
    ("what's on my schedule this week",     "schedule",       "calendar"),
    ("book a meeting for tomorrow",         "meeting",        "calendar"),
    ("remind me about the dentist",         "dentist",        "calendar"),
    ("show me action movies",               "action movies",  "entertainment"),
    ("recommend a thriller film",           "thriller",       "entertainment"),
    ("I want to watch a comedy tonight",    "comedy",         "entertainment"),
    ("buy running shoes",                   "running shoes",  "shopping"),
    ("find me a cheap laptop",              "laptop",         "shopping"),
    ("order a phone charger",               "charger",        "shopping"),
    ("play some lofi music",                "lofi",           "music"),
    ("I like punjabi songs",                "punjabi songs",  "music"),
    ("suggest a workout playlist",          "workout playlist","music"),
    ("I enjoy pizza too",                   "pizza",          "food"),
    ("get me a masala dosa",                "dosa",           "food"),
    ("I want pasta for lunch",              "pasta",          "food"),
]

print(f"=== Seeding {len(MEMORIES)} memories (slow — gemma cognify each) ===")
for txt, item, cat in MEMORIES:
    save_conversation(txt, [{"item": item, "category": cat}], "neutral", "general")
    print("  seeded:", txt)
    time.sleep(2)  # small gap so saves queue cleanly

print("\nWaiting 90s for background cognify to finish on all 20...")
time.sleep(90)

print("\n=== Recall 'biryani' before forget ===")
before = get_past_preferences("biryani")
print(f"recall returned {len(before)} chunks")

print("\n=== PROPOSE forget('biryani', confirm=False) ===")
proposal = forget_preference("biryani", confirm=False)
print("status :", proposal.get("status"))
print("checked:", proposal.get("checked"), "candidates")
print("count  :", proposal.get("count"))
print("WILL FORGET:")
for t in proposal.get("will_forget", []):
    print("   -", t[:80])

print("\n>>> Eyeball above: should be ONLY biryani memories, NOT schedule/movie/shoes/music.")

print("\n=== CONFIRM forget('biryani', confirm=True) ===")
result = forget_preference("biryani", confirm=True)
print("status   :", result.get("status"), "| forgotten:", result.get("forgotten"))
time.sleep(10)

print("\n=== Survivor check ===")
for probe in ["biryani", "movie", "shoes", "music", "pizza"]:
    hits = get_past_preferences(probe)
    print(f"  '{probe}': {len(hits)} memories remain")

print("\n>>> 'biryani' should be ~0; movie/shoes/music should still have hits.")
