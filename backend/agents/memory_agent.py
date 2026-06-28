from state import PipelineState
from utils.cognee_memory import get_similar_conversations, get_past_preferences

def memory_agent(state: PipelineState) -> dict:
    """Retrieves similar past conversations from Cognee's knowledge graph"""
    transcript = state.get("transcript", "")
    try:
        similar = get_similar_conversations(transcript, n=3)
        prefs = get_past_preferences(transcript, n=5)
    except Exception as e:
        print(f"Memory agent error: {e}")
        similar, prefs = [], []
    return {"similar_past": similar, "past_preferences": prefs}