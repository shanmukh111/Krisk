#!/usr/bin/env python3
"""
memory_lifecycle.py — reference script for Cognee memory lifecycle operations.

Captures the exact commands used to:
  1. improve the knowledge graph (consolidation via global context index)
  2. visualize the graph to a self-contained HTML file

Run from backend/ with the cognee venv active:
    python memory_lifecycle.py improve     # run improve, then visualize after
    python memory_lifecycle.py visualize    # just regenerate the HTML
    python memory_lifecycle.py both         # visualize before, improve, visualize after
"""

import sys
import os
import cognee
from utils.cognee_memory import _run_async

HERE = os.path.dirname(os.path.abspath(__file__))


def visualize(path: str):
    """Render the current knowledge graph to a self-contained HTML file."""
    out = _run_async(cognee.visualize_graph(path), wait=True, timeout=120)
    size = len(out) if isinstance(out, str) else "?"
    print(f"[visualize] wrote {path} (html length: {size})")


def improve():
    """
    Enrich/consolidate the graph. build_global_context_index adds
    GlobalContextSummary nodes (thematic buckets over the raw memories);
    build_truth_subspace adds truth-subspace structure. No session_ids here,
    so this runs the structural enrichment path (not the feedback path).
    """
    print("[improve] running cognee.improve(...) — this calls gemma over the graph, be patient")
    out = _run_async(
        cognee.improve(
            build_global_context_index=True,
            build_truth_subspace=True,
        ),
        wait=True, timeout=600,
    )
    print("[improve] done:", repr(out)[:200])


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "both"

    if cmd == "visualize":
        visualize(os.path.join(HERE, "krisk_graph.html"))

    elif cmd == "improve":
        improve()
        visualize(os.path.join(HERE, "krisk_graph_after_improve.html"))

    elif cmd == "both":
        visualize(os.path.join(HERE, "krisk_graph_before_improve.html"))
        improve()
        visualize(os.path.join(HERE, "krisk_graph_after_improve.html"))

    else:
        print("usage: python memory_lifecycle.py [improve|visualize|both]")
