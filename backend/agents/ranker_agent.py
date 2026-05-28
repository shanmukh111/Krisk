"""
agents/ranker_agent.py — Aggregates and ranks results from all platform agents
"""

from state import PipelineState


def ranker_agent(state: PipelineState) -> dict:
    """Merges all platform results and sorts by relevance score"""
    platform_results = state.get("platform_results", {})
    past_prefs = state.get("past_preferences", [])
    preferred_items = {p.get("item", "").lower() for p in past_prefs}

    all_results = []
    for platform, items in platform_results.items():
        for item in items:
            score = item.get("relevance_score", 1)
            name = (item.get("name") or item.get("title", "")).lower()
            # boost items matching past preferences
            if any(pref in name for pref in preferred_items):
                score += 1
            item["relevance_score"] = score
            all_results.append(item)

    all_results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
    return {"final_recommendations": all_results}
