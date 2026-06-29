

from typing import List, Dict
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from state import PipelineState
from agents import (
    audio_agent, transcript_agent, memory_agent,
    intent_agent, routing_agent, zomato_agent,
    flipkart_agent, youtube_agent, ranker_agent,
    calendar_agent
)
from agents.routing_agent import route_to_platforms


def build_graph():
    graph = StateGraph(PipelineState)

    # Add all nodes
    graph.add_node("audio_agent",      audio_agent)
    graph.add_node("transcript_agent", transcript_agent)
    graph.add_node("memory_agent",     memory_agent)
    graph.add_node("intent_agent",     intent_agent)
    graph.add_node("calendar_agent",   calendar_agent)
    graph.add_node("routing_agent",    routing_agent)
    graph.add_node("zomato_agent",     zomato_agent)
    graph.add_node("flipkart_agent",   flipkart_agent)
    graph.add_node("youtube_agent",    youtube_agent)
    graph.add_node("ranker_agent",     ranker_agent)

    # Sequential edges
    graph.set_entry_point("audio_agent")
    graph.add_edge("audio_agent",      "transcript_agent")
    graph.add_edge("transcript_agent", "memory_agent")
    graph.add_edge("memory_agent",     "intent_agent")
    graph.add_edge("intent_agent",     "calendar_agent")
    graph.add_edge("calendar_agent",   "routing_agent")

    # Parallel fan-out to platform agents
    graph.add_conditional_edges(
        "routing_agent",
        route_to_platforms,
        {
            "zomato_agent":   "zomato_agent",
            "flipkart_agent": "flipkart_agent",
            "youtube_agent":  "youtube_agent",
        }
    )

    # All platforms converge to ranker
    graph.add_edge("zomato_agent",   "ranker_agent")
    graph.add_edge("flipkart_agent", "ranker_agent")
    graph.add_edge("youtube_agent",  "ranker_agent")
    graph.add_edge("ranker_agent",   END)

    return graph.compile()


# Build once on import
pipeline = build_graph()


def run_pipeline(transcript: str, conversation_history: List[str] = [], thread_id: str = "default") -> Dict:
    """Entry point called by FastAPI server"""
    initial_state: PipelineState = {
        "audio_chunk":            None,
        "is_speech":              True,
        "transcript":             transcript,
        "conversation_buffer":    conversation_history,
        "similar_past":           [],
        "past_preferences":       [],
        "intents":                [],
        "mood":                   "neutral",
        "context":                "general",
        "active_platforms":       [],
        "platform_results":       {},
        "final_recommendations":  [],
        "error":                  None,
        "iteration":              len(conversation_history),
        "calendar_context":       None,
        "calendar_action":        None,
        "calendar_write":         None,
        "confirm_calendar_write": False,
    }
    config = {"configurable": {"thread_id": thread_id}}
    result = pipeline.invoke(initial_state, config=config)
    return {
        "intents":          result.get("intents", []),
        "mood":             result.get("mood", "neutral"),
        "context":          result.get("context", "general"),
        "active_platforms": result.get("active_platforms", []),
        "recommendations":  result.get("final_recommendations", []),
        "similar_past":     result.get("similar_past", []),
        "calendar_context": result.get("calendar_context"),
        "calendar_action":  result.get("calendar_action"),
        "error":            result.get("error"),
    }