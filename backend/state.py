"""
state.py — Shared LangGraph pipeline state
"""

from typing import TypedDict, Optional, List, Dict, Any, Annotated


def keep_last(a, b):
    return b


def merge_dicts(a: dict, b: dict) -> dict:
    result = dict(a)
    result.update(b)
    return result


class PipelineState(TypedDict):
    audio_chunk:            Annotated[Optional[bytes],        keep_last]
    is_speech:              Annotated[bool,                   keep_last]
    transcript:             Annotated[str,                    keep_last]
    conversation_buffer:    Annotated[List[str],              keep_last]
    similar_past:           Annotated[List[Dict],             keep_last]
    past_preferences:       Annotated[List[Dict],             keep_last]
    intents:                Annotated[List[Dict[str, Any]],   keep_last]
    mood:                   Annotated[str,                    keep_last]
    context:                Annotated[str,                    keep_last]
    active_platforms:       Annotated[List[str],              keep_last]
    platform_results:       Annotated[Dict[str, List],        merge_dicts]
    final_recommendations:  Annotated[List[Dict],             keep_last]
    error:                  Annotated[Optional[str],          keep_last]
    iteration:              Annotated[int,                    keep_last]
    calendar_context:       Annotated[Optional[Dict],         keep_last]
    calendar_action:        Annotated[Optional[Dict],         keep_last]
    calendar_write:         Annotated[Optional[Dict],         keep_last]
    confirm_calendar_write: Annotated[bool,                   keep_last]