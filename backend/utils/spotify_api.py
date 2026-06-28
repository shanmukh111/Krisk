"""
utils/spotify_api.py — Spotify track search using client credentials
No user auth needed for search — only the frontend needs user tokens for playback.
"""

import requests
import time
from config import SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET

_cache = {"token": None, "expires_at": 0}


def get_client_token() -> str:
    """App-level token via client credentials (no user login needed)."""
    if _cache["token"] and time.time() < _cache["expires_at"]:
        return _cache["token"]
    res = requests.post(
        "https://accounts.spotify.com/api/token",
        data={"grant_type": "client_credentials"},
        auth=(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET),
        timeout=10,
    )
    res.raise_for_status()
    data = res.json()
    _cache["token"] = data["access_token"]
    _cache["expires_at"] = time.time() + data["expires_in"] - 60
    return _cache["token"]


def search_tracks(query: str, limit: int = 5) -> list:
    """Search Spotify for tracks matching query. Returns list of track dicts."""
    token = get_client_token()
    res = requests.get(
        "https://api.spotify.com/v1/search",
        headers={"Authorization": f"Bearer {token}"},
        params={"q": query, "type": "track", "limit": limit, "market": "IN"},
        timeout=10,
    )
    res.raise_for_status()
    items = res.json().get("tracks", {}).get("items", [])
    results = []
    for t in items:
        if not t:
            continue
        results.append({
            "uri":         t["uri"],
            "id":          t["id"],
            "name":        t["name"],
            "artist":      ", ".join(a["name"] for a in t.get("artists", [])),
            "album":       t["album"]["name"],
            "album_art":   t["album"]["images"][0]["url"] if t["album"].get("images") else "",
            "duration_ms": t["duration_ms"],
            "preview_url": t.get("preview_url") or "",
            "external_url": t["external_urls"].get("spotify", ""),
        })
    return results
