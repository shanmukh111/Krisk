"""
agents/intent_agent.py — Extracts intents, mood, context from conversation
"""

import json
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from state import PipelineState
from config import OPENAI_API_KEY, OPENAI_MODEL
from utils.cognee_memory import save_conversation

llm = ChatOpenAI(model=OPENAI_MODEL, api_key=OPENAI_API_KEY, temperature=0.3)

SYSTEM_PROMPT = """You are an intent extraction engine for a recommendation system.
Analyze the conversation and extract what the user wants. Return ONLY valid JSON.

JSON format:
{
  "intents": [
    {
      "category": "food|shopping|entertainment|travel|sports|music",
      "item": "specific item they want",
      "urgency": "high|medium|low",
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "mood": "one word mood",
  "context": "brief context"
}"""


def intent_agent(state: PipelineState) -> dict:
    buffer = state.get("conversation_buffer", [])
    full_conversation = " | ".join([h.get("content", h) if isinstance(h, dict) else h for h in buffer])

    past_prefs = state.get("past_preferences", [])
    past_context = ""
    if past_prefs:
        pref_text = ", ".join(p.get("summary", "") for p in past_prefs[:3] if p.get("summary"))
        if pref_text:
            past_context = f"\nUser past preferences: {pref_text}"

    try:
        response = llm.invoke([
            SystemMessage(content=SYSTEM_PROMPT + past_context),
            HumanMessage(content=f"Conversation: {full_conversation}")
        ])
        raw = response.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        parsed = json.loads(raw)
        intents = parsed.get("intents", [])
        mood = parsed.get("mood", "neutral")
        context = parsed.get("context", "general")

        try:
            save_conversation(state.get("transcript", ""), intents, mood, context)
        except Exception as e:
            print(f"Memory save error: {e}")

        return {"intents": intents, "mood": mood, "context": context, "error": None}

    except Exception as e:
        return {"intents": [], "mood": "neutral", "context": "general", "error": f"Intent agent error: {str(e)}"}