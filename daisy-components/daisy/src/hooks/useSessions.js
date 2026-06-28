import { useState, useEffect, useCallback } from "react";

// ─── Session helpers ──────────────────────────────────────────────────────────
const makeSession = () => ({
  id:        `sess_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
  name:      "New conversation",
  messages:  [],
  createdAt: Date.now(),
  autoNamed: true,   // becomes false once user renames it manually
});

const load = () => {
  try {
    const raw = localStorage.getItem("daisy-sessions");
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return null;
    return data;
  } catch { return null; }
};

const save = (sessions) => {
  try { localStorage.setItem("daisy-sessions", JSON.stringify(sessions)); }
  catch {}
};

// ─── useSessions ─────────────────────────────────────────────────────────────
// Manages multiple named chat sessions.
//
// Returns:
//   sessions       — array of all session objects
//   activeId       — id of current session
//   activeSession  — the current session object
//   newChat()      — create + switch to a fresh session
//   switchChat(id) — switch to a session by id
//   renameChat(id, name) — rename a session
//   deleteChat(id) — delete a session (switches to latest remaining)
//   addMessage(msg)  — add a message to the active session
//   setMessages(msgs) — overwrite messages in active session (for useDaisy)
//
export function useSessions() {
  const [sessions, setSessions] = useState(() => load() || [makeSession()]);
  const [activeId, setActiveId] = useState(() => {
    const saved = load();
    return saved?.[0]?.id || sessions[0]?.id;
  });

  // persist on every change
  useEffect(() => { save(sessions); }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeId) || sessions[0];

  // ── Create new chat ─────────────────────────────────────────────────────────
  const newChat = useCallback(() => {
    const s = makeSession();
    setSessions(prev => [s, ...prev]);
    setActiveId(s.id);
  }, []);

  // ── Switch to session ───────────────────────────────────────────────────────
  const switchChat = useCallback((id) => {
    setActiveId(id);
  }, []);

  // ── Rename session ──────────────────────────────────────────────────────────
  const renameChat = useCallback((id, name) => {
    setSessions(prev => prev.map(s =>
      s.id === id ? { ...s, name: name.trim() || s.name, autoNamed: false } : s
    ));
  }, []);

  // ── Delete session ──────────────────────────────────────────────────────────
  const deleteChat = useCallback((id) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (next.length === 0) {
        const fresh = makeSession();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }, [activeId]);

  // ── Add a message to active session ────────────────────────────────────────
  const addMessage = useCallback((msg) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== activeId) return s;

      const newMsgs = [...s.messages, msg];

      // auto-name from first user message
      let name = s.name;
      let autoNamed = s.autoNamed;
      if (s.autoNamed && msg.who === "me" && s.messages.filter(m=>m.who==="me").length === 0) {
        name = msg.text.length > 32 ? msg.text.slice(0, 32) + "…" : msg.text;
        autoNamed = true; // still auto but now has content
      }

      return { ...s, messages: newMsgs, name, autoNamed };
    }));
  }, [activeId]);

  // ── Replace all messages (for external state sync) ─────────────────────────
  const setActiveMessages = useCallback((msgs) => {
    setSessions(prev => prev.map(s =>
      s.id === activeId ? { ...s, messages: msgs } : s
    ));
  }, [activeId]);

  return {
    sessions,
    activeId,
    activeSession,
    messages: activeSession?.messages || [],
    newChat,
    switchChat,
    renameChat,
    deleteChat,
    addMessage,
    setActiveMessages,
  };
}
