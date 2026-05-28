from state import PipelineState
from config import MAX_CONVERSATION_BUFFER

def transcript_agent(state: PipelineState) -> dict:
    """Maintains rolling conversation buffer"""
    current = state.get("transcript", "")
    buffer = list(state.get("conversation_buffer", []))
    if current:
        buffer.append(current)
        if len(buffer) > MAX_CONVERSATION_BUFFER:
            buffer = buffer[-MAX_CONVERSATION_BUFFER:]
    return {"conversation_buffer": buffer}
