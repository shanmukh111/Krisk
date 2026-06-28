import { useState, useRef, useEffect, useCallback } from "react";
import { guessAction, cannedReply } from "../utils.js";

// ─── useDaisy ───────────────────────────────────────────────────────────────
// Central state hook — owns all Daisy logic so App.jsx stays clean.
//
// dstate values:
//   dormant → waking → listening → thinking → speaking → idleActive
//
export function useDaisy() {
  const [dstate, setDstate]     = useState("dormant");
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [busy, setBusy]         = useState(false);
  const [amp, setAmp]           = useState(0);

  const energy    = useRef(0);   // 0–1 background energy, read live by FluidGL
  const ampTimer  = useRef(null);
  const scrollRef = useRef(null);

  // ── amplitude driver ──────────────────────────────────────────────────────
  // Drives orb scale + background energy when Daisy is active.
  useEffect(() => {
    const live =
      dstate === "listening" ||
      dstate === "speaking"  ||
      dstate === "thinking";

    if (live) {
      ampTimer.current = setInterval(() => {
        const target =
          dstate === "speaking"  ? 0.4 + Math.random() * 0.6 :
          dstate === "thinking"  ? 0.3 + Math.random() * 0.2 :
                                   0.15 + Math.random() * 0.35;
        setAmp(p => p + (target - p) * 0.4);
        energy.current += (target - energy.current) * 0.3;
      }, 90);
    } else {
      setAmp(0);
      energy.current *= 0.9;
    }

    return () => clearInterval(ampTimer.current);
  }, [dstate]);

  // ── auto-scroll messages ──────────────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" });
  }, [messages, busy]);

  // ── wake Daisy ────────────────────────────────────────────────────────────
  const wake = useCallback(() => {
    if (dstate !== "dormant") return;
    setDstate("waking");
    setTimeout(() => setDstate("listening"), 1400); // dog morph duration
  }, [dstate]);

  // ── put Daisy to sleep ────────────────────────────────────────────────────
  const rest = useCallback(() => setDstate("dormant"), []);

  // ── generate reply ────────────────────────────────────────────────────────
  const respond = useCallback(async (text) => {
    setDstate("thinking");
    let reply = "";

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system:
            "You are Daisy, a warm casual personal assistant that DOES things " +
            "(orders food, plays videos, sends messages, sets reminders, makes calls). " +
            "Reply in 1-2 short friendly sentences, lowercase-ish, no emojis, no lists. " +
            "Sound like a helpful friend who is already on it.",
          messages: [{ role: "user", content: text }],
        }),
      });
      const data = await res.json();
      reply = (data.content || [])
        .filter(c => c.type === "text")
        .map(c => c.text)
        .join(" ")
        .trim();
    } catch (e) {
      reply = "";
    }

    if (!reply) reply = cannedReply(text);
    const action = guessAction(text);

    setDstate("speaking");
    setMessages(m => [...m, { who: "daisy", text: reply, action }]);
    setBusy(false);
    setTimeout(() => setDstate("idleActive"), 2600);
  }, []);

  // ── send a user message ───────────────────────────────────────────────────
  const send = useCallback(() => {
    const text = input.trim();
    if (!text || busy) return;
    if (dstate === "dormant") setDstate("listening");
    setMessages(m => [...m, { who: "me", text }]);
    setInput("");
    setBusy(true);
    respond(text);
  }, [input, busy, dstate, respond]);

  return {
    dstate, messages, input, setInput,
    busy, amp, energy, scrollRef,
    wake, rest, send,
  };
}
