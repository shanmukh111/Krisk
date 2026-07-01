#!/usr/bin/env python3
"""
inspect_summaries.py - read the GlobalContextSummary nodes that improve() created.
Run from backend/ with the cognee venv active:
    python inspect_summaries.py
"""

import re
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
HTML = os.path.join(HERE, "krisk_graph.html")


def load_nodes():
    html = open(HTML, encoding="utf-8", errors="ignore").read()
    m = re.search(r"var nodes = (\[.*?\]);", html, re.S)
    if not m:
        raise RuntimeError("could not find 'var nodes' array in HTML")
    return json.loads(m.group(1))


def main():
    nodes = load_nodes()
    print(f"parsed {len(nodes)} total nodes")

    gcs = [n for n in nodes if n.get("type") == "GlobalContextSummary"]
    print(f"GlobalContextSummary nodes: {len(gcs)}\n")

    if not gcs:
        from collections import Counter
        types = Counter(n.get("type") for n in nodes)
        print("node types present:", dict(types))
        return

    print("sample node keys:", list(gcs[0].keys()), "\n")

    text_fields = ("name", "text", "summary", "label", "description", "content")
    for i, n in enumerate(gcs, 1):
        print(f"=== summary {i} ===")
        printed = False
        for k in text_fields:
            if n.get(k):
                print(f"  [{k}] {str(n[k])[:300]}")
                printed = True
        if not printed:
            print("  (no known text field; full node:)")
            print("  ", json.dumps(n)[:300])
        print()


if __name__ == "__main__":
    main()
