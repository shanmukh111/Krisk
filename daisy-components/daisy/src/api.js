const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function chatWithBackend({ transcript, conversationHistory = [], sessionId = "default" }) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript,
      conversation_history: conversationHistory,
      session_id: sessionId,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.status);
    throw new Error(`Backend /chat ${res.status}: ${text}`);
  }
  return res.json();
}

export async function transcribeAudio(audioBlob) {
  const form = new FormData();
  form.append("audio", audioBlob, "recording.webm");
  const res = await fetch(`${API_BASE}/transcribe`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Backend /transcribe ${res.status}`);
  return res.json(); // { transcript: "..." }
}

export async function speakText(text) {
  const res = await fetch(`${API_BASE}/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Backend /speak ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error("Backend offline");
  return res.json();
}
