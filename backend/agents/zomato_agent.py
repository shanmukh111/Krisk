"""
agents/zomato_agent.py — Food recommendations (mock until Zomato API available)
"""

from state import PipelineState

MOCK_DATA = {
    "biryani": [
        {"name": "Hyderabadi Biryani", "restaurant": "Paradise", "rating": 4.5, "price": "₹280", "delivery_time": "30 min"},
        {"name": "Chicken Biryani", "restaurant": "Behrouz Biryani", "rating": 4.3, "price": "₹320", "delivery_time": "40 min"},
    ],
    "burger": [
        {"name": "Classic Burger", "restaurant": "Burger King", "rating": 4.1, "price": "₹199", "delivery_time": "25 min"},
        {"name": "Cheese Burger", "restaurant": "McDonalds", "rating": 4.0, "price": "₹179", "delivery_time": "20 min"},
    ],
    "pizza": [
        {"name": "Margherita Pizza", "restaurant": "Dominos", "rating": 4.1, "price": "₹199", "delivery_time": "25 min"},
        {"name": "BBQ Chicken Pizza", "restaurant": "Pizza Hut", "rating": 4.2, "price": "₹349", "delivery_time": "35 min"},
    ],
}


def search_food(query: str) -> list:
    for key in MOCK_DATA:
        if key in query.lower():
            return MOCK_DATA[key]
    return [
        {"name": f"{query.title()} Special", "restaurant": "Top Restaurant", "rating": 4.4, "price": "₹250", "delivery_time": "30 min"},
        {"name": f"Spicy {query.title()}", "restaurant": "Local Favourite", "rating": 4.2, "price": "₹180", "delivery_time": "20 min"},
    ]


def zomato_agent(state: PipelineState) -> dict:
    food_intents = [i for i in state.get("intents", []) if i.get("category") == "food"]
    results = []
    for intent in food_intents:
        items = search_food(intent.get("item", "food"))
        for item in items:
            item.update({
                "platform": "zomato",
                "intent": intent.get("item"),
                "url": f"https://www.zomato.com/search?q={intent.get('item','').replace(' ','+')}",
                "relevance_score": 3 if intent.get("urgency") == "high" else 2
            })
        results.extend(items)
    return {"platform_results": {"zomato": results}}
