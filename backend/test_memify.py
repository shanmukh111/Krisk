#!/usr/bin/env python3
"""test_memify.py - run cognee.memify() and observe what changes."""

import time
import cognee
from utils.cognee_memory import _run_async, get_past_preferences


async def _graph_counts():
    """Best-effort node/edge count via the graph engine."""
    try:
        engine = await cognee.get_graph_engine()
        nodes, edges = await engine.get_graph_data()
        return len(nodes), len(edges)
    except Exception as e:
        return f"count error: {e}", ""


print("=== BEFORE memify ===")
n, e = _run_async(_graph_counts(), wait=True, timeout=60)
print(f"graph: {n} nodes, {e} edges")
print("biryani recall sample:")
for p in get_past_preferences("biryani")[:3]:
    print("   ", repr(p.get("summary"))[:90])

print("\n=== RUNNING cognee.memify() (this may take a while) ===")
try:
    result = _run_async(cognee.memify(), wait=True, timeout=600)
    print("memify returned:", repr(result)[:300])
except Exception as ex:
    print("memify error:", repr(ex))

time.sleep(5)

print("\n=== AFTER memify ===")
n2, e2 = _run_async(_graph_counts(), wait=True, timeout=60)
print(f"graph: {n2} nodes, {e2} edges")
print("biryani recall sample:")
for p in get_past_preferences("biryani")[:3]:
    print("   ", repr(p.get("summary"))[:90])

print("\n=== DELTA ===")
try:
    print(f"nodes: {n} -> {n2}  (delta {n2 - n})")
    print(f"edges: {e} -> {e2}  (delta {e2 - e})")
except Exception:
    print("(couldn't compute delta — see counts above)")
