"""
agents/youtube_agent.py — YouTube video search + multimodal ranking
"""

import requests
from state import PipelineState
from config import YOUTUBE_API_KEY, MAX_YOUTUBE_RESULTS
from utils.youtube_ranker import rank_videos


def search_youtube(query: str) -> list:
    """Search YouTube Data API v3"""
    try:
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": query,
            "maxResults": MAX_YOUTUBE_RESULTS,
            "type": "video",
            "key": YOUTUBE_API_KEY,
            "relevanceLanguage": "en",
            "safeSearch": "moderate"
        }
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        results = []
        for item in data.get("items", []):
            snippet = item.get("snippet", {})
            video_id = item.get("id", {}).get("videoId", "")
            results.append({
                "video_id": video_id,
                "channel_id": snippet.get("channelId", ""),
                "title": snippet.get("title", ""),
                "channel": snippet.get("channelTitle", ""),
                "description": snippet.get("description", ""),
                "published_at": snippet.get("publishedAt", ""),
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "thumbnail": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                "views": "Loading...",
                "duration": "N/A"
            })
        return results
    except Exception as e:
        print(f"YouTube search error: {e}")
        return []


def mock_youtube_search(query: str) -> list:
    """Fallback mock data"""
    return [
        {"video_id": "", "channel_id": "", "title": f"Best {query.title()} 2024", "channel": "Top Channel", "description": "", "published_at": "", "url": f"https://www.youtube.com/results?search_query={query.replace(' ','+')}", "thumbnail": "", "views": "2.1M", "duration": "12:30"},
        {"video_id": "", "channel_id": "", "title": f"Top 10 {query.title()}", "channel": "Trending", "description": "", "published_at": "", "url": f"https://www.youtube.com/results?search_query={query.replace(' ','+')}", "thumbnail": "", "views": "890K", "duration": "8:45"},
    ]


def youtube_agent(state: PipelineState) -> dict:
    intents = state.get("intents", [])
    transcript = state.get("transcript", "")
    results = []

    for intent in intents:
        query = intent.get("item", "trending")
        items = search_youtube(query) or mock_youtube_search(query)

        if items and items[0].get("video_id"):
            print(f"Ranking {len(items)} videos with Gemma3...")
            items = rank_videos(items, transcript)

        for item in items:
            item.update({
                "platform": "youtube",
                "intent": query,
                "relevance_score": item.get("final_score", 1)
            })
        results.extend(items)

    return {"platform_results": {"youtube": results}}
