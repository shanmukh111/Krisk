"""
utils/amazon_api.py — Amazon product search via RapidAPI
"""

import requests
from config import RAPIDAPI_KEY


def search_amazon(query: str, max_results: int = 3) -> list:
    """Search Amazon India for products"""
    try:
        url = "https://real-time-amazon-data.p.rapidapi.com/search"
        headers = {
            "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com",
            "x-rapidapi-key": RAPIDAPI_KEY
        }
        params = {
            "query": query,
            "page": "1",
            "country": "IN",
            "sort_by": "RELEVANCE",
            "product_condition": "ALL"
        }
        response = requests.get(url, headers=headers, params=params, timeout=10)
        data = response.json()
        results = []
        for item in data.get("data", {}).get("products", [])[:max_results]:
            results.append({
                "name": item.get("product_title", "")[:60],
                "price": item.get("product_price", "N/A"),
                "rating": item.get("product_star_rating", "N/A"),
                "discount": item.get("product_original_price", ""),
                "url": item.get("product_url", "https://www.amazon.in"),
                "thumbnail": item.get("product_photo", "")
            })
        return results
    except Exception as e:
        print(f"Amazon API error: {e}")
        return []


def mock_amazon_search(query: str) -> list:
    """Fallback mock data"""
    return [
        {"name": f"{query.title()} - Top Pick", "price": "₹2,499", "rating": "4.3", "discount": "₹3,499", "url": f"https://www.amazon.in/s?k={query.replace(' ','+')}"},
        {"name": f"Premium {query.title()}", "price": "₹1,999", "rating": "4.1", "discount": "₹2,999", "url": f"https://www.amazon.in/s?k={query.replace(' ','+')}"},
    ]
