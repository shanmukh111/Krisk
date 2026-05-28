"""
utils/youtube_ranker.py — Multimodal YouTube video ranking
Uses Gemma3:4b (Ollama) to analyze video frames + metadata scoring
"""

import ollama
client = ollama.Client(host="http://172.26.185.163:11434")
import httpx
import json
from datetime import datetime, timezone
from config import YOUTUBE_API_KEY, OLLAMA_VISION_MODEL, TEXT_WEIGHT, METADATA_WEIGHT, VISUAL_WEIGHT


def fetch_video_stats(video_ids: list) -> dict:
    try:
        url = "https://www.googleapis.com/youtube/v3/videos"
        params = {"part": "statistics,contentDetails", "id": ",".join(video_ids), "key": YOUTUBE_API_KEY}
        res = httpx.get(url, params=params, timeout=10)
        stats = {}
        for item in res.json().get("items", []):
            vid_id = item["id"]
            stats[vid_id] = {
                "views": int(item.get("statistics", {}).get("viewCount", 0)),
                "likes": int(item.get("statistics", {}).get("likeCount", 0)),
                "duration": item.get("contentDetails", {}).get("duration", "")
            }
        return stats
    except Exception as e:
        print(f"Video stats error: {e}")
        return {}


def fetch_channel_subs(channel_ids: list) -> dict:
    try:
        url = "https://www.googleapis.com/youtube/v3/channels"
        params = {"part": "statistics", "id": ",".join(set(channel_ids)), "key": YOUTUBE_API_KEY}
        res = httpx.get(url, params=params, timeout=10)
        return {item["id"]: int(item.get("statistics", {}).get("subscriberCount", 0)) for item in res.json().get("items", [])}
    except Exception as e:
        print(f"Channel subs error: {e}")
        return {}


def freshness_score(published_at: str) -> float:
    try:
        pub_date = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        days_old = (datetime.now(timezone.utc) - pub_date).days
        if days_old <= 1:    return 10.0
        elif days_old <= 7:  return 9.0
        elif days_old <= 30: return 7.0
        elif days_old <= 90: return 5.0
        elif days_old <= 365: return 3.0
        else:                return 1.0
    except:
        return 5.0


def normalize_count(count: int) -> float:
    if count >= 10_000_000: return 10.0
    elif count >= 1_000_000: return 8.0
    elif count >= 100_000: return 6.0
    elif count >= 10_000: return 4.0
    elif count >= 1_000: return 2.0
    else: return 1.0


def visual_verify(video_id: str, title: str, user_query: str) -> dict:
    """Use Gemma3:4b to analyze 4 video frames"""
    try:
        frame_urls = [f"https://i.ytimg.com/vi/{video_id}/{i}.jpg" for i in range(4)]
        frames = []
        for url in frame_urls:
            try:
                resp = httpx.get(url, timeout=5)
                if resp.status_code == 200:
                    frames.append(resp.content)
            except:
                pass

        if not frames:
            return {"score": 5.0, "reason": "no frames available"}

        prompt = f"""User wants: "{user_query}"
Video title: "{title}"

Look at these video frames. Does this video match what user wants?
Return ONLY JSON: {{"score": 7, "reason": "brief reason"}}
Score 1-10."""

        response = client.chat(
            model=OLLAMA_VISION_MODEL,
            messages=[{"role": "user", "content": prompt, "images": frames}]
        )

        raw = response["message"]["content"].strip()
        if "{" in raw:
            raw = raw[raw.index("{"):raw.rindex("}")+1]
        result = json.loads(raw)
        return {"score": float(result.get("score", 5)), "reason": result.get("reason", "")}

    except Exception as e:
        print(f"Visual verify error: {e}")
        return {"score": 5.0, "reason": "analysis failed"}


def rank_videos(videos: list, user_query: str) -> list:
    """Multi-criteria ranking: text 40% + metadata 40% + visual 20%"""
    if not videos:
        return videos

    video_ids = [v.get("video_id", "") for v in videos if v.get("video_id")]
    channel_ids = [v.get("channel_id", "") for v in videos if v.get("channel_id")]

    stats = fetch_video_stats(video_ids) if video_ids else {}
    subs = fetch_channel_subs(channel_ids) if channel_ids else {}

    scored = []
    for v in videos:
        vid_id = v.get("video_id", "")
        chan_id = v.get("channel_id", "")
        title = v.get("title", "")
        description = v.get("description", "")
        published_at = v.get("published_at", "")

        # Tier 1: Text relevance
        query_words = set(user_query.lower().split())
        title_overlap = len(query_words & set(title.lower().split())) / max(len(query_words), 1)
        desc_overlap = len(query_words & set(description.lower().split())) / max(len(query_words), 1)
        text_score = min(10, (title_overlap * 7 + desc_overlap * 3) * 10)

        # Tier 2: Metadata
        date_score = freshness_score(published_at)
        view_score = normalize_count(stats.get(vid_id, {}).get("views", 0))
        sub_score = normalize_count(subs.get(chan_id, 0))
        metadata_score = (date_score + view_score + sub_score) / 3

        # Tier 3: Visual
        visual = visual_verify(vid_id, title, user_query)
        visual_score = visual["score"]

        # Final
        final_score = text_score * TEXT_WEIGHT + metadata_score * METADATA_WEIGHT + visual_score * VISUAL_WEIGHT

        v.update({
            "text_score": round(text_score, 2),
            "date_score": round(date_score, 2),
            "view_score": round(view_score, 2),
            "sub_score": round(sub_score, 2),
            "visual_score": round(visual_score, 2),
            "visual_reason": visual["reason"],
            "final_score": round(final_score, 2),
            "views": f"{stats.get(vid_id, {}).get('views', 0):,}",
            "subscribers": f"{subs.get(chan_id, 0):,}",
        })
        scored.append(v)

    scored.sort(key=lambda x: x["final_score"], reverse=True)
    return scored
