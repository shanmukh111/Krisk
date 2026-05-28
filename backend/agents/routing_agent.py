"""
agents/routing_agent.py — Decides which platform agents to activate
"""

from state import PipelineState

CATEGORY_MAP = {
    "food": ["zomato"],
    "shopping": ["flipkart"],
    "entertainment": ["youtube"],
    "sports": ["youtube"],
    "music": ["youtube"],
    "travel": ["youtube", "flipkart"],
}

def routing_agent(state: PipelineState) -> dict:
    """Pure logic — no LLM needed"""
    intents = state.get("intents", [])
    active = set()
    for intent in intents:
        platforms = CATEGORY_MAP.get(intent.get("category", ""), ["youtube"])
        active.update(platforms)
    if not active:
        active = {"youtube"}
    return {"active_platforms": list(active)}


def route_to_platforms(state: PipelineState):
    """Returns list of next nodes for parallel execution"""
    active = state.get("active_platforms", [])
    nodes = []
    if "zomato" in active:   nodes.append("zomato_agent")
    if "flipkart" in active: nodes.append("flipkart_agent")
    if "youtube" in active:  nodes.append("youtube_agent")
    return nodes if nodes else ["youtube_agent"]
