"""
agents/flipkart_agent.py — Shopping recommendations via Amazon RapidAPI
"""

from state import PipelineState
from utils.amazon_api import search_amazon, mock_amazon_search


def flipkart_agent(state: PipelineState) -> dict:
    shopping_intents = [i for i in state.get("intents", []) if i.get("category") == "shopping"]
    results = []
    for intent in shopping_intents:
        query = intent.get("item", "product")
        items = search_amazon(query) or mock_amazon_search(query)
        for item in items:
            if not item.get("url"):
                item["url"] = f"https://www.amazon.in/s?k={query.replace(' ','+')}"
            item.update({
                "platform": "amazon",
                "source": "amazon",
                "intent": query,
                "relevance_score": 2
            })
        results.extend(items)
    return {"platform_results": {"amazon": results}}
