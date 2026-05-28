import { useState, useRef, useEffect, useCallback } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8000";

// ─── HELPERS ───────────────────────────────────────────────────────────────
const fmt_subs = (n) => {
  if (!n && n !== 0) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
};

const fmt_views = (n) => {
  if (!n && n !== 0) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M views";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K views";
  return n + " views";
};

const score_color = (score) => {
  if (score >= 8) return "#4ade80";
  if (score >= 6) return "#facc15";
  if (score >= 4) return "#fb923c";
  return "#f87171";
};

const score_bar_width = (score, max = 10) =>
  Math.min(100, Math.round((score / max) * 100)) + "%";

// ─── SCORE BAR ──────────────────────────────────────────────────────────────
function ScoreBar({ label, value, max = 10 }) {
  const pct = Math.min(100, Math.round(((value || 0) / max) * 100));
  const color = score_color(value || 0);
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: "#94a3b8", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{label}</span>
        <span style={{ color, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{(value || 0).toFixed(1)}</span>
      </div>
      <div style={{ height: 4, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: pct + "%", background: color,
          borderRadius: 2, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)"
        }} />
      </div>
    </div>
  );
}

// ─── YOUTUBE CARD ───────────────────────────────────────────────────────────
function YouTubeCard({ item, rank }) {
  const [expanded, setExpanded] = useState(false);
  const final = item.final_score ?? item.score ?? 0;
  const color = score_color(final);

  return (
    <div style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1a2035 100%)",
      border: `1px solid ${expanded ? color + "55" : "#1e293b"}`,
      borderRadius: 14, overflow: "hidden",
      transition: "border-color 0.3s, box-shadow 0.3s",
      boxShadow: expanded ? `0 0 20px ${color}22` : "none",
      cursor: "pointer",
    }}
      onClick={() => setExpanded(e => !e)}
    >
      {/* Header row */}
      <div style={{ display: "flex", gap: 12, padding: "12px 14px", alignItems: "flex-start" }}>
        {/* Rank badge */}
        <div style={{
          minWidth: 32, height: 32, borderRadius: "50%",
          background: rank <= 1 ? "linear-gradient(135deg, #f59e0b, #ef4444)" : "#1e293b",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, color: rank <= 1 ? "#fff" : "#64748b",
          fontFamily: "'DM Mono', monospace", border: "1px solid #2d3748",
          flexShrink: 0, marginTop: 2
        }}>
          {rank === 0 ? "★" : rank + 1}
        </div>

        {/* Thumbnail */}
        {item.thumbnail && (
          <img
            src={item.thumbnail}
            alt=""
            style={{ width: 80, height: 54, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
            onError={e => { e.target.style.display = "none"; }}
          />
        )}

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.4,
            fontFamily: "'Sora', sans-serif",
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden"
          }}>
            {item.title}
          </div>
          <div style={{ marginTop: 5, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {item.channel_title && (
              <span style={{
                fontSize: 11, color: "#64748b", fontFamily: "'DM Mono', monospace",
                background: "#1e293b", borderRadius: 4, padding: "2px 7px"
              }}>
                📺 {item.channel_title}
              </span>
            )}
            {item.subscriber_count != null && (
              <span style={{
                fontSize: 11, color: "#818cf8", fontFamily: "'DM Mono', monospace",
                background: "#1e293b22", borderRadius: 4, padding: "2px 7px",
                border: "1px solid #818cf822"
              }}>
                👥 {fmt_subs(item.subscriber_count)}
              </span>
            )}
            {item.view_count != null && (
              <span style={{
                fontSize: 11, color: "#38bdf8", fontFamily: "'DM Mono', monospace",
                background: "#1e293b22", borderRadius: 4, padding: "2px 7px",
                border: "1px solid #38bdf822"
              }}>
                {fmt_views(item.view_count)}
              </span>
            )}
            {item.published_at && (
              <span style={{
                fontSize: 11, color: "#94a3b8", fontFamily: "'DM Mono', monospace",
                background: "#1e293b22", borderRadius: 4, padding: "2px 7px"
              }}>
                🗓 {new Date(item.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
        </div>

        {/* Final score pill */}
        <div style={{
          minWidth: 48, display: "flex", flexDirection: "column",
          alignItems: "center", flexShrink: 0
        }}>
          <div style={{
            fontSize: 20, fontWeight: 800, color,
            fontFamily: "'DM Mono', monospace", lineHeight: 1
          }}>
            {final.toFixed(1)}
          </div>
          <div style={{ fontSize: 10, color: "#475569", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
            SCORE
          </div>
        </div>
      </div>

      {/* Expandable score breakdown */}
      {expanded && (
        <div style={{
          padding: "0 14px 14px",
          borderTop: "1px solid #1e293b",
          paddingTop: 12,
          animation: "fadeSlide 0.2s ease"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            {item.text_score != null && <ScoreBar label="Text Relevance" value={item.text_score} />}
            {item.date_score != null && <ScoreBar label="Freshness" value={item.date_score} />}
            {item.channel_score != null && <ScoreBar label="Channel Cred" value={item.channel_score} />}
            {item.view_score != null && <ScoreBar label="Popularity" value={item.view_score} />}
            {item.visual_score != null && <ScoreBar label="Visual (Gemma)" value={item.visual_score} />}
            {item.metadata_score != null && <ScoreBar label="Metadata Avg" value={item.metadata_score} />}
          </div>

          {item.gemma_description && (
            <div style={{
              marginTop: 10, padding: "8px 10px",
              background: "#0f172a", borderRadius: 8,
              border: "1px solid #1e293b", fontSize: 12,
              color: "#94a3b8", fontFamily: "'Sora', sans-serif", lineHeight: 1.5
            }}>
              <span style={{ color: "#818cf8", fontWeight: 600 }}>🤖 Gemma: </span>
              {item.gemma_description}
            </div>
          )}

          <a
            href={item.url || `https://youtube.com/watch?v=${item.video_id}`}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: "inline-block", marginTop: 10,
              padding: "6px 14px", borderRadius: 20,
              background: "linear-gradient(90deg, #ef4444, #f97316)",
              color: "#fff", fontSize: 12, fontWeight: 700,
              fontFamily: "'DM Mono', monospace", textDecoration: "none",
              letterSpacing: "0.04em"
            }}
          >
            ▶ Watch on YouTube
          </a>
        </div>
      )}
    </div>
  );
}

// ─── PLATFORM SECTION ────────────────────────────────────────────────────────
function PlatformSection({ platform, items }) {
  if (!items || items.length === 0) return null;

  const icons = { youtube: "🎥", zomato: "🍽️", amazon: "📦" };
  const labels = { youtube: "YouTube", zomato: "Zomato", amazon: "Amazon" };
  const colors = { youtube: "#ef4444", zomato: "#f97316", amazon: "#f59e0b" };

  const isYT = platform === "youtube";
  const color = colors[platform] || "#818cf8";

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 12, paddingBottom: 8,
        borderBottom: `1px solid ${color}33`
      }}>
        <span style={{ fontSize: 18 }}>{icons[platform] || "🔗"}</span>
        <span style={{
          fontSize: 13, fontWeight: 700, color,
          fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em",
          textTransform: "uppercase"
        }}>
          {labels[platform] || platform}
        </span>
        <span style={{
          marginLeft: "auto", fontSize: 11, color: "#475569",
          fontFamily: "'DM Mono', monospace"
        }}>
          {items.length} result{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {isYT
          ? items.map((item, i) => <YouTubeCard key={item.video_id || i} item={item} rank={i} />)
          : items.map((item, i) => (
            <div key={i} style={{
              background: "#0f172a", border: "1px solid #1e293b",
              borderRadius: 12, padding: "12px 14px",
              display: "flex", justifyContent: "space-between",
              alignItems: "center", gap: 12
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", fontFamily: "'Sora', sans-serif" }}>
                  {item.title || item.name}
                </div>
                {item.price && (
                  <div style={{ fontSize: 12, color: "#4ade80", marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
                    {item.price}
                  </div>
                )}
                {item.rating && (
                  <div style={{ fontSize: 11, color: "#facc15", marginTop: 2 }}>
                    ★ {item.rating}
                  </div>
                )}
              </div>
              {item.url && (
                <a href={item.url} target="_blank" rel="noreferrer" style={{
                  padding: "6px 12px", borderRadius: 20, fontSize: 11,
                  background: color, color: "#fff", textDecoration: "none",
                  fontWeight: 700, fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap"
                }}>
                  View →
                </a>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── CHAT BUBBLE ────────────────────────────────────────────────────────────
function ChatBubble({ role, text }) {
  const isUser = role === "user";
  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 8
    }}>
      <div style={{
        maxWidth: "78%", padding: "9px 14px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser
          ? "linear-gradient(135deg, #6366f1, #818cf8)"
          : "#1e293b",
        color: "#e2e8f0", fontSize: 13,
        fontFamily: "'Sora', sans-serif", lineHeight: 1.5,
        border: isUser ? "none" : "1px solid #2d3748"
      }}>
        {text}
      </div>
    </div>
  );
}

// ─── VOICE ORB ──────────────────────────────────────────────────────────────
function VoiceOrb({ state }) {
  const colors = {
    idle: "#1e293b",
    listening: "#ef4444",
    processing: "#f59e0b",
    speaking: "#818cf8"
  };
  const pulses = { listening: true, speaking: true };
  const color = colors[state] || colors.idle;
  return (
    <div style={{ position: "relative", width: 72, height: 72 }}>
      {pulses[state] && (
        <>
          <div style={{
            position: "absolute", inset: -8, borderRadius: "50%",
            border: `2px solid ${color}`, opacity: 0.4,
            animation: "orbPulse 1.2s ease-out infinite"
          }} />
          <div style={{
            position: "absolute", inset: -16, borderRadius: "50%",
            border: `2px solid ${color}`, opacity: 0.2,
            animation: "orbPulse 1.2s ease-out 0.4s infinite"
          }} />
        </>
      )}
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}44)`,
        border: `2px solid ${color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, boxShadow: `0 0 20px ${color}44`,
        transition: "background 0.4s, border-color 0.4s, box-shadow 0.4s"
      }}>
        {state === "idle" && "🎙️"}
        {state === "listening" && "👂"}
        {state === "processing" && "⚡"}
        {state === "speaking" && "🔊"}
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [orbState, setOrbState] = useState("idle"); // idle | listening | processing | speaking
  const [transcript, setTranscript] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [statusMsg, setStatusMsg] = useState("Tap to start talking");
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState("voice"); // voice | chat
  const [backendStatus, setBackendStatus] = useState("checking");
  const sessionId = useRef("sess_" + Math.random().toString(36).substr(2, 9));

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const chatEndRef = useRef(null);

  // ── check backend health ─────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(r => r.json())
      .then(d => setBackendStatus(d.status === "ok" ? "online" : "degraded"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // ── voice recording ───────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(t => t.stop());
        await processAudio(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setOrbState("listening");
      setStatusMsg("Listening… tap to stop");
    } catch {
      setStatusMsg("Mic access denied");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setOrbState("processing");
    setStatusMsg("Processing…");
  }, []);

  const processAudio = async (blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      const transcribeRes = await fetch(`${API_BASE}/transcribe`, {
        method: "POST", body: formData
      });
      const { transcript: text } = await transcribeRes.json();
      setTranscript(text);
      setStatusMsg(`"${text}"`);
      await sendToChat(text);
    } catch (err) {
      setStatusMsg("Transcription failed — try again");
      setOrbState("idle");
    }
  };

  // ── send to /chat endpoint ────────────────────────────────────────────────
  const sendToChat = async (userText) => {
    if (!userText.trim()) return;
    setOrbState("processing");

    const newHistory = [...chatHistory, { role: "user", content: userText }];
    setChatHistory(h => [...h, { role: "user", text: userText }]);
    setChatInput("");

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: userText,
          session_id: sessionId.current,
          conversation_history: newHistory.map(m => ({ role: m.role, content: m.content || m.text || "" }))
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Parse response — /chat returns {reply, recommendations: [...flat array]}
      const reply = data.reply || data.response || data.text || "";
      // Backend returns a flat array; group youtube items
      const flatRecs = data.recommendations || [];
      const recs = (!data.is_followup && flatRecs.length > 0)
        ? { youtube: flatRecs.filter(r => r.video_id || r.url?.includes("youtube")), zomato: flatRecs.filter(r => r.platform === "zomato"), amazon: flatRecs.filter(r => r.platform === "amazon") }
        : null;

      setChatHistory(h => [...h, { role: "assistant", text: reply }]);
      if (recs) setRecommendations(recs);

      // TTS
      if (reply) {
        await speakReply(reply);
      } else {
        setOrbState("idle");
        setStatusMsg("Tap to start talking");
      }
    } catch (err) {
      // Fallback: try /recommend endpoint
      await sendToRecommend(userText);
    }
  };

  // ── fallback: /recommend ─────────────────────────────────────────────────
  const sendToRecommend = async (userText) => {
    try {
      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: userText,
          session_id: sessionId.current,
          conversation_history: chatHistory.map(m => ({ role: m.role, content: m.content || m.text || "" })) })
      });
      const data = await res.json();
      const reply = data.reply || data.response || "Here are some recommendations!";
      setChatHistory(h => [...h, { role: "assistant", text: reply }]);
      setRecommendations(data.recommendations || data);
      await speakReply(reply);
    } catch {
      setChatHistory(h => [...h, { role: "assistant", text: "Sorry, something went wrong. Is the backend running?" }]);
      setOrbState("idle");
      setStatusMsg("Backend error");
    }
  };

  // ── TTS speak ────────────────────────────────────────────────────────────
  const speakReply = async (text) => {
    setOrbState("speaking");
    setStatusMsg("Speaking…");
    try {
      const res = await fetch(`${API_BASE}/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setOrbState("idle");
        setStatusMsg("Tap to start talking");
      };
      await audio.play();
    } catch {
      // Fallback to browser TTS
      const utt = new SpeechSynthesisUtterance(text);
      utt.onend = () => { setOrbState("idle"); setStatusMsg("Tap to start talking"); };
      window.speechSynthesis.speak(utt);
    }
  };

  // ── parse recs into platform groups ──────────────────────────────────────
  const groupedRecs = (() => {
    if (!recommendations) return {};
    if (recommendations.youtube || recommendations.zomato || recommendations.amazon) {
      return recommendations;
    }
    // Flat array fallback
    if (Array.isArray(recommendations)) {
      return { youtube: recommendations };
    }
    return {};
  })();

  const hasRecs = Object.keys(groupedRecs).some(k => groupedRecs[k]?.length > 0);

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #020817 0%, #0a1628 50%, #0d1f3c 100%)",
      color: "#e2e8f0",
      fontFamily: "'Sora', 'DM Mono', sans-serif",
      display: "flex", flexDirection: "column"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
        @keyframes orbPulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .tab-btn { transition: all 0.2s; }
        .tab-btn:hover { opacity: 0.8; }
      `}</style>

      {/* Header */}
      <header style={{
        padding: "16px 20px", display: "flex",
        alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #1e293b",
        background: "rgba(2, 8, 23, 0.8)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>
            <span style={{ color: "#818cf8" }}>Convo</span>
            <span style={{ color: "#e2e8f0" }}>Recommender</span>
          </div>
          <div style={{ fontSize: 11, color: "#475569", fontFamily: "'DM Mono', monospace", marginTop: 1 }}>
            AI · Multi-Stream · Multimodal
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: backendStatus === "online" ? "#4ade80"
              : backendStatus === "offline" ? "#f87171" : "#facc15",
            boxShadow: backendStatus === "online" ? "0 0 8px #4ade80" : "none"
          }} />
          <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'DM Mono', monospace" }}>
            {backendStatus}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div style={{
        display: "flex", borderBottom: "1px solid #1e293b",
        background: "rgba(2, 8, 23, 0.6)"
      }}>
        {["voice", "chat"].map(tab => (
          <button
            key={tab}
            className="tab-btn"
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: "12px", fontSize: 13, fontWeight: 600,
              fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em",
              textTransform: "uppercase", background: "transparent", border: "none",
              cursor: "pointer", color: activeTab === tab ? "#818cf8" : "#475569",
              borderBottom: activeTab === tab ? "2px solid #818cf8" : "2px solid transparent",
              transition: "color 0.2s, border-color 0.2s"
            }}
          >
            {tab === "voice" ? "🎙️ Voice" : "💬 Chat"}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 16px", maxWidth: 640, width: "100%", margin: "0 auto" }}>

        {/* VOICE TAB */}
        {activeTab === "voice" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <div style={{ marginTop: 24 }}>
              <VoiceOrb state={orbState} />
            </div>

            <div style={{
              fontSize: 14, color: "#94a3b8", textAlign: "center",
              fontFamily: "'Sora', sans-serif", minHeight: 40, maxWidth: 300
            }}>
              {statusMsg}
            </div>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={orbState === "processing" || orbState === "speaking"}
              style={{
                padding: "14px 40px", borderRadius: 50, fontSize: 14, fontWeight: 700,
                fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em",
                border: "none", cursor: orbState === "idle" || orbState === "listening" ? "pointer" : "not-allowed",
                background: isRecording
                  ? "linear-gradient(135deg, #ef4444, #b91c1c)"
                  : "linear-gradient(135deg, #6366f1, #818cf8)",
                color: "#fff", boxShadow: isRecording ? "0 0 24px #ef444466" : "0 0 24px #6366f166",
                transition: "all 0.3s", opacity: orbState === "processing" || orbState === "speaking" ? 0.5 : 1
              }}
            >
              {isRecording ? "⏹ Stop" : "🎙 Speak"}
            </button>

            {transcript && (
              <div style={{
                width: "100%", padding: "12px 16px",
                background: "#0f172a", borderRadius: 12, border: "1px solid #1e293b",
                fontSize: 13, color: "#94a3b8", fontFamily: "'Sora', sans-serif",
                lineHeight: 1.5
              }}>
                <span style={{ color: "#475569", fontFamily: "'DM Mono', monospace", fontSize: 11 }}>TRANSCRIPT · </span>
                {transcript}
              </div>
            )}
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ minHeight: 200, marginBottom: 12 }}>
              {chatHistory.length === 0 && (
                <div style={{
                  textAlign: "center", padding: "40px 20px",
                  color: "#334155", fontSize: 13, fontFamily: "'Sora', sans-serif"
                }}>
                  Start a conversation — ask for YouTube videos, food, products…
                </div>
              )}
              {chatHistory.map((m, i) => (
                <ChatBubble key={i} role={m.role} text={m.text} />
              ))}
              <div ref={chatEndRef} />
            </div>

            <div style={{ display: "flex", gap: 8, position: "sticky", bottom: 0, paddingBottom: 4 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendToChat(chatInput)}
                placeholder="Type a message…"
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 50,
                  background: "#0f172a", border: "1px solid #1e293b",
                  color: "#e2e8f0", fontSize: 13, fontFamily: "'Sora', sans-serif",
                  outline: "none"
                }}
              />
              <button
                onClick={() => sendToChat(chatInput)}
                disabled={!chatInput.trim() || orbState === "processing"}
                style={{
                  padding: "12px 20px", borderRadius: 50,
                  background: "linear-gradient(135deg, #6366f1, #818cf8)",
                  border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: chatInput.trim() ? "pointer" : "not-allowed",
                  opacity: chatInput.trim() ? 1 : 0.5, fontFamily: "'DM Mono', monospace"
                }}
              >
                →
              </button>
            </div>
          </div>
        )}

        {/* RECOMMENDATIONS */}
        {hasRecs && (
          <div style={{ marginTop: 28 }}>
            <div style={{
              fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#334155",
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16,
              paddingBottom: 8, borderBottom: "1px solid #1e293b"
            }}>
              Recommendations
            </div>
            {["youtube", "zomato", "amazon"].map(platform =>
              groupedRecs[platform]?.length > 0
                ? <PlatformSection key={platform} platform={platform} items={groupedRecs[platform]} />
                : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}
