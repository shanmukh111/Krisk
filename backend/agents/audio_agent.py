from state import PipelineState

def audio_agent(state: PipelineState) -> dict:
    """Checks if speech is present — in production runs VAD"""
    return {"is_speech": True}
