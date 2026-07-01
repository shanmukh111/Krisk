#!/usr/bin/env python3
"""test_session_improve.py - build a session+feedback loop, then improve(session_ids).
Demonstrates the deeper half of Cognee's improve: feedback weighting + session
Q&A persistence + (optionally) truth subspace from distilled learnings."""

import cognee
from utils.cognee_memory import _run_async

SID = "krisk_feedback_session_1"
DATASET = "main_dataset"


async def run():
    # 1. RECALL with a known session_id -> creates the session, returns answers
    print("=== 1. recall (creates session) ===")
    results = await cognee.recall("What food does the user love most?", session_id=SID)
    print(f"recall returned {len(results)} entries")
    for r in results[:2]:
        print("  entry:", repr(r)[:200])

    # 2. GET_SESSION -> find the qa_id(s) to give feedback on
    print("\n=== 2. get_session (find qa_id) ===")
    entries = await cognee.session.get_session(SID)
    print(f"session has {len(entries)} Q&A entries")
    qa_id = None
    for e in entries:
        qa_id = getattr(e, "qa_id", None) or getattr(e, "id", None)
        print("  qa entry:", repr(e)[:200], "| qa_id=", qa_id)
    if not qa_id:
        print("!! no qa_id found - inspect entry shape above")
        return

    # 3. ADD_FEEDBACK -> positive rating on that answer
    print("\n=== 3. add_feedback (thumbs up) ===")
    ok = await cognee.session.add_feedback(
        session_id=SID, qa_id=qa_id,
        feedback_text="Yes, biryani is exactly right - great recommendation",
        feedback_score=5,
    )
    print("add_feedback returned:", ok)

    # 4. IMPROVE with the session -> deeper pipeline fires
    print("\n=== 4. improve(session_ids) - deeper pipeline ===")
    out = await cognee.improve(
        dataset=DATASET,
        session_ids=[SID],
        build_truth_subspace=True,
        build_global_context_index=False,  # already built; isolate session effect
    )
    print("improve returned:", repr(out)[:200])


_run_async(run(), wait=True, timeout=600)
print("\nDone. Regenerate graph to look for user_sessions_from_cache / session_learnings nodes.")
