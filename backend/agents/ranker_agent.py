"""
agents/ranker_agent.py — Aggregates and ranks results from all platform agents
"""

from state import PipelineState


def ranker_agent(state: PipelineState) -> dict:
    """Merges all platform results and sorts by relevance score"""
    platform_results = state.get("platform_results", {})
    past_prefs = state.get("past_preferences", [])
    preferred_text = " ".join(p.get("summary", "") for p in past_prefs).lower()

    all_results = []
    for platform, items in platform_results.items():
        for item in items:
            score = item.get("relevance_score", 1)
            name = (item.get("name") or item.get("title", "")).lower()
            # boost items whose name words appear in recalled preference text
            name_words = [w for w in name.split() if len(w) > 2]
            if preferred_text and any(word in preferred_text for word in name_words):
                score += 1
            item["relevance_score"] = score
            all_results.append(item)

    all_results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
    return {"final_recommendations": all_results}