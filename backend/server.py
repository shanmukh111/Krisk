"""
server.py — FastAPI REST API
Clean and minimal — just routes
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import tempfile
import subprocess
import whisper
from openai import OpenAI
from pipeline import run_pipeline
from config import OPENAI_API_KEY, WHISPER_MODEL, TTS_VOICE, OPENAI_MODEL

app = FastAPI(title="ConvoRecommender API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=OPENAI_API_KEY)

print("Loading Whisper...")
whisper_model = whisper.load_model(WHISPER_MODEL)
print("Whisper ready!")

# ── Gemma-based intent classifier ────────────────────────────────────────────
from utils.youtube_ranker import client as ollama_client

def is_followup_question(transcript: str, history: list, session: dict) -> bool:
    """Ask Gemma if this is a follow-up question or a new recommendation request."""
    if not session or not session.get('last_query'):
        return False
    try:
        prev_query = session.get("last_query", "")
        prev_recs = session.get("last_recommendations", [])
        prev_titles = ", ".join([r.get("title", "") for r in prev_recs[:3]])
        response = ollama_client.chat(
            model="gemma3:12b",
            messages=[{
                "role": "user",
                "content": f"""Previous request: "{prev_query}"
Previously shown: {prev_titles}
User now says: "{transcript}"

Reply with ONLY one word:
- "followup" if asking about previous results, scores, reasoning, comparisons, which one is better
- "new" if requesting fresh recommendations or completely different topic"""
            }]
        )
        answer = response["message"]["content"].strip().lower()
        print(f"[Intent] Gemma says: {answer}")
        return "followup" in answer
    except Exception as e:
        print(f"[Intent] Gemma error: {e} — defaulting to new request")
        return False

SYSTEM_PROMPT = """You are Convo, a chill friendly assistant who talks like a close friend.
Talk casually - use words like bro, yaar. Answer ANY question.
When recommendations are in context mention top 1-2 naturally.
If user corrects you accept it and fix your answer.
Keep responses SHORT - 2-3 sentences max."""


class ChatMessage(BaseModel):
    role: str
    content: str

class RecommendRequest(BaseModel):
    transcript: str
    conversation_history: Optional[List] = []
    session_id: Optional[str] = "default"

# In-memory session store for last recommendations
session_memory: dict = {}

class SpeakRequest(BaseModel):
    text: str
    voice: Optional[str] = TTS_VOICE


@app.get("/")
def root():
    return {"status": "ConvoRecommender v3 running", "agents": 8}

@app.get("/health")
def health():
    return {"status": "ok", "openai": bool(OPENAI_API_KEY), "whisper": WHISPER_MODEL}


@app.post("/recommend")
def recommend(req: RecommendRequest):
    if not req.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty")
    return run_pipeline(transcript=req.transcript, conversation_history=req.conversation_history or [], thread_id=req.session_id or 'default')


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_in:
            tmp_in.write(await audio.read())
            input_path = tmp_in.name
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_out:
            output_path = tmp_out.name
        subprocess.run(["ffmpeg", "-y", "-i", input_path, "-ar", "16000", "-ac", "1", output_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        result = whisper_model.transcribe(output_path, language="en", fp16=False)
        os.unlink(input_path)
        os.unlink(output_path)
        return {"transcript": result["text"].strip()}
    except Exception as e:
        return {"transcript": "", "error": str(e)}


@app.post("/speak")
def speak(req: SpeakRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    try:
        response = client.audio.speech.create(model="tts-1", voice=req.voice, input=req.text)
        def generate():
            for chunk in response.iter_bytes(1024):
                yield chunk
        return StreamingResponse(generate(), media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
def chat(req: RecommendRequest):
    transcript = req.transcript
    history = req.conversation_history or []

    session = session_memory.get(req.session_id, {})
    is_followup = is_followup_question(transcript, history, session)

    rec_keywords = ["want","need","craving","hungry","buy","watch","food","shoes","movie","video","order","find","show","looking","suggest","recommend","highlights","match","song","music"]
    recommendations = None
    if not is_followup and any(k in transcript.lower() for k in rec_keywords):
        recommendations = run_pipeline(transcript, history, thread_id=req.session_id)
        # Save to session memory for follow-up context
        all_recs = recommendations.get("recommendations", [])
        session_memory[req.session_id] = {
            "last_recommendations": all_recs,
            "last_query": transcript,
            "last_platforms": list(set([r.get("platform","youtube") for r in all_recs]))
        }

    def format_rec(i, r):
        platform = r.get("platform", "youtube")
        title = r.get("title", r.get("name", "Unknown"))
        score = r.get("final_score", r.get("relevance_score", r.get("score", 0)))
        if isinstance(score, (int, float)):
            score_str = f"{score:.1f}/10"
        else:
            score_str = str(score)
        extras = ""
        if platform == "youtube":
            channel = r.get("channel_title", "")
            if channel: extras = f" by {channel}"
        elif platform == "zomato":
            price = r.get("price", "")
            rating = r.get("rating", "")
            if price: extras += f" — {price}"
            if rating: extras += f" ★{rating}"
        elif platform == "amazon":
            price = r.get("price", "")
            if price: extras += f" — {price}"
        return f"#{i+1} [{platform.upper()}] '{title}'{extras} (score: {score_str})"

    rec_context = ""
    prev = session_memory.get(req.session_id, {})
    if prev and prev.get("last_recommendations"):
        prev_lines = [format_rec(i, r) for i, r in enumerate(prev["last_recommendations"][:6])]
        rec_context += "\n\n[Recommendations you already showed the user:\n" + "\n".join(prev_lines) + "\nReference these when user asks about them. Don't expose raw numbers like text_score or visual_score.]"
    if recommendations and recommendations.get("recommendations"):
        new_lines = [format_rec(i, r) for i, r in enumerate(recommendations["recommendations"][:6])]
        rec_context += "\n\n[New recommendations just fetched:\n" + "\n".join(new_lines) + "]"

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for h in history[-8:]:
        if isinstance(h, dict) and "role" in h:
            messages.append({"role": h["role"], "content": h.get("content", "")})
        elif isinstance(h, str) and h.strip():
            messages.append({"role": "user", "content": h})
    messages.append({"role": "user", "content": transcript + rec_context})

    response = client.chat.completions.create(model=OPENAI_MODEL, messages=messages, max_tokens=150, temperature=0.8)
    reply = response.choices[0].message.content.strip()

    # On followup: return None so frontend keeps existing cards
    recs_to_return = recommendations.get("recommendations", []) if recommendations else None
    return {
        "reply": reply,
        "recommendations": recs_to_return,
        "is_followup": is_followup,
        "intents": recommendations.get("intents", []) if recommendations else [],
        "mood": recommendations.get("mood", "neutral") if recommendations else "neutral",
        "context": recommendations.get("context", "general") if recommendations else "general",
    }
