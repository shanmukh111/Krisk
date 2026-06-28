import cognee
 
from agents.ranker_agent import ranker_agent
# _run_async keeps every Cognee call on the same persistent background loop,
# avoiding the "cannot schedule new futures after shutdown" crash.
from utils.cognee_memory import get_past_preferences, _run_async
 
 
# ----------------------------------------------------------------------
# TEST A - Deterministic unit test of the boost logic (no Cognee, no LLM).
# Proves the ranker ranks a matching item above a non-matching one, and
# that it reads `past_preferences` (the field it actually consumes).
# ----------------------------------------------------------------------
def test_a_boost_logic():
    print("\n=== TEST A: ranker boost logic (deterministic) ===")
    state = {
        "past_preferences": [
            {"summary": "the user prefers spicy biryani and pizza"}
        ],
        "platform_results": {
            "zomato": [
                {"name": "Chicken Biryani", "relevance_score": 1},
                {"name": "Sushi Platter",   "relevance_score": 1},
            ]
        },
    }
 
    recs = ranker_agent(state)["final_recommendations"]
    by_name = {r["name"]: r["relevance_score"] for r in recs}
 
    print("scores:", by_name)
    print("order :", [r["name"] for r in recs])
 
    ok = (
        by_name.get("Chicken Biryani") == 2
        and by_name.get("Sushi Platter") == 1
        and recs[0]["name"] == "Chicken Biryani"
    )
    print("RESULT:", "PASS" if ok else "FAIL")
    if not ok:
        print("  -> boost did not fire. Bug is in ranker_agent itself "
              "(check it reads `past_preferences`, not `similar_past`).")
    return ok
 
 
# ----------------------------------------------------------------------
# TEST B - Integration: does real Cognee recall return text the ranker
# can match against? Seeds one preference, WAITS for cognify, then shows
# exactly what get_past_preferences() hands the ranker.
# ----------------------------------------------------------------------
async def _seed(text):
    await cognee.add(text)
    await cognee.cognify()
 
 
def test_b_recall_shape():
    print("\n=== TEST B: real Cognee recall feeding the ranker ===")
 
    # Clean slate - all through the persistent loop.
    _run_async(cognee.prune.prune_data(), wait=True, timeout=120)
    _run_async(cognee.prune.prune_system(metadata=True), wait=True, timeout=120)
 
    seed_text = (
        "At 2026-06-29T10:00:00, user said: 'I want spicy chicken biryani'. "
        "They wanted: biryani (food). Mood: hungry. Context: dinner."
    )
    print("seeding + cognifying (can take 30-90s on gemma3:12b)...")
    _run_async(_seed(seed_text), wait=True, timeout=300)
 
    prefs = get_past_preferences("biryani")
    print("get_past_preferences('biryani') returned:")
    for p in prefs:
        print("   ", repr(p.get("summary"))[:200])
 
    if not prefs:
        print("RESULT: FAIL - recall returned nothing. Either cognify hadn't "
              "finished, or the search return shape changed (check the parse "
              "in get_past_preferences).")
        return False
 
    preferred_text = " ".join(p.get("summary", "") for p in prefs).lower()
    has_keyword = "biryani" in preferred_text
    print("contains literal 'biryani':", has_keyword)
 
    if not has_keyword:
        print("RESULT: PARTIAL - recall returned text but the LLM paraphrased "
              "'biryani' away, so the substring boost will miss. Fix: switch "
              "get_past_preferences to a chunk/summary search type that returns "
              "literal stored text (stays within Option A).")
        return False
 
    # Feed real recall through the real ranker.
    state = {
        "past_preferences": prefs,
        "platform_results": {
            "zomato": [
                {"name": "Hyderabadi Biryani", "relevance_score": 1},
                {"name": "Veg Sandwich",       "relevance_score": 1},
            ]
        },
    }
    recs = ranker_agent(state)["final_recommendations"]
    by_name = {r["name"]: r["relevance_score"] for r in recs}
    print("ranker scores:", by_name)
 
    ok = (
        by_name.get("Hyderabadi Biryani") == 2
        and recs[0]["name"] == "Hyderabadi Biryani"
    )
    print("RESULT:", "PASS" if ok else "FAIL")
    return ok
 
 
if __name__ == "__main__":
    a = test_a_boost_logic()
    b = test_b_recall_shape()
 
    print("\n================ SUMMARY ================")
    print("Test A (boost logic): ", "PASS" if a else "FAIL")
    print("Test B (real recall): ", "PASS" if b else "FAIL")
    if a and not b:
        print("\nDiagnosis: ranker logic is correct; the problem is in what "
              "Cognee recall returns. Inspect the get_past_preferences output "
              "above.")
    elif not a:
        print("\nDiagnosis: ranker boost logic itself is broken - fix "
              "ranker_agent before anything else.")
    else:
        print("\nBoost verified end to end.")
