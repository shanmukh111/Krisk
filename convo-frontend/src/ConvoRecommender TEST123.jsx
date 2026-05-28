import { useState, useRef, useEffect } from "react";

const BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : `http://${window.location.hostname}:8000`;

console.log("BASE_URL =", BASE_URL);

const PLATFORM_CONFIG = {
  zomato: { label: "Zomato", color: "#E23744", bg: "#fff1f2", emoji: "🍽️" },
  flipkart: { label: "Amazon", color: "#FF9900", bg: "#fff7ed", emoji: "🛒" },
  youtube: { label: "YouTube", color: "#FF0000", bg: "#fff5f5", emoji: "▶️" },
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DM Sans', sans-serif; background: #0a0a0f; color: #f0f0f5; min-height: 100vh; }

  .app { min-height: 100vh; background: radial-gradient(ellipse at 20% 20%, #1a0533 0%, #0a0a0f 50%, #001a33 100%); padding: 24px 20px; max-width: 1100px; margin: 0 auto; }

  .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
  .logo-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #a855f7, #3b82f6); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 0 30px rgba(168,85,247,0.4); }
  .logo-text { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; background: linear-gradient(135deg, #c084fc, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .tagline { font-size: 12px; color: #6b7280; letter-spacing: 0.05em; text-transform: uppercase; margin-top: 2px; }

  /* CHAT AREA */
  .chat-area { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 20px; margin-bottom: 20px; min-height: 200px; max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
  .chat-empty { text-align: center; padding: 40px; color: #4b5563; font-size: 14px; }
  .chat-empty-icon { font-size: 40px; margin-bottom: 12px; opacity: 0.4; }

  .msg { display: flex; gap: 10px; align-items: flex-start; }
  .msg.user { flex-direction: row-reverse; }
  .msg-bubble { padding: 10px 14px; border-radius: 14px; max-width: 75%; font-size: 14px; line-height: 1.5; }
  .msg.user .msg-bubble { background: linear-gradient(135deg, #a855f7, #3b82f6); color: white; border-bottom-right-radius: 4px; }
  .msg.assistant .msg-bubble { background: rgba(255,255,255,0.07); color: #e5e7eb; border-bottom-left-radius: 4px; }
  .msg-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .msg.user .msg-avatar { background: linear-gradient(135deg, #a855f7, #3b82f6); }
  .msg.assistant .msg-avatar { background: rgba(255,255,255,0.1); }

  /* INPUT AREA */
  .input-area { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 16px 20px; margin-bottom: 24px; }
  .input-row { display: flex; gap: 10px; align-items: center; }
  .text-input { flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #f0f0f5; font-family: 'DM Sans', sans-serif; font-size: 15px; padding: 12px 16px; outline: none; transition: border-color 0.2s; }
  .text-input:focus { border-color: rgba(168,85,247,0.5); }
  .text-input::placeholder { color: #4b5563; }

  .btn-mic { width: 46px; height: 46px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); color: #9ca3af; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: all 0.2s; flex-shrink: 0; }
  .btn-mic:hover { border-color: rgba(168,85,247,0.5); color: #a855f7; }
  .btn-mic.recording { background: rgba(239,68,68,0.2); border-color: #ef4444; color: #ef4444; animation: pulse 1s infinite; }
  .btn-mic.processing { background: rgba(168,85,247,0.2); border-color: #a855f7; color: #a855f7; }

  .btn-send { padding: 12px 22px; background: linear-gradient(135deg, #a855f7, #3b82f6); color: white; border: none; border-radius: 12px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .btn-send:hover { transform: translateY(-1px); box-shadow: 0 0 20px rgba(168,85,247,0.4); }
  .btn-send:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  /* VOICE STATUS */
  .voice-status { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 12px; color: #9ca3af; min-height: 20px; }
  .voice-dot { width: 8px; height: 8px; border-radius: 50%; background: #6b7280; }
  .voice-dot.recording { background: #ef4444; animation: pulse 0.8s infinite; }
  .voice-dot.processing { background: #a855f7; animation: pulse 0.8s infinite; }
  .voice-dot.speaking { background: #10b981; animation: pulse 0.8s infinite; }

  @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }

  /* TRANSCRIPT PREVIEW */
  .transcript-preview { margin-top: 8px; padding: 8px 12px; background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.2); border-radius: 8px; font-size: 13px; color: #c084fc; font-style: italic; }

  /* CONTEXT BAR */
  .context-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; align-items: center; }
  .pill { padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 500; display: flex; align-items: center; gap: 4px; }
  .pill-mood { background: rgba(168,85,247,0.15); color: #c084fc; border: 1px solid rgba(168,85,247,0.3); }
  .pill-intent { background: rgba(16,185,129,0.1); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.2); }

  /* PLATFORM SECTIONS */
  .platform-section { margin-bottom: 24px; }
  .platform-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .platform-dot { width: 10px; height: 10px; border-radius: 50%; }
  .platform-name { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; }
  .platform-count { font-size: 11px; color: #6b7280; margin-left: auto; }

  .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
  .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 16px; cursor: pointer; text-decoration: none; color: inherit; transition: all 0.2s; display: block; position: relative; overflow: hidden; }
  .card:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.15); }
  .card-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600; margin-bottom: 4px; line-height: 1.3; }
  .card-subtitle { font-size: 11px; color: #9ca3af; margin-bottom: 10px; }
  .card-meta { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .card-badge { padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 500; background: rgba(255,255,255,0.06); color: #d1d5db; }
  .card-open { font-size: 11px; color: #6b7280; }

  /* LOADING */
  .typing { display: flex; gap: 4px; align-items: center; padding: 10px 14px; background: rgba(255,255,255,0.07); border-radius: 14px; width: fit-content; }
  .typing-dot { width: 6px; height: 6px; border-radius: 50%; background: #9ca3af; animation: typing 1.2s infinite; }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes typing { 0%,60%,100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-6px); opacity: 1; } }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
`;

function Card({ item }) {
  const config = PLATFORM_CONFIG[item.platform] || {};
  const title = item.name || item.title || "Result";
  const subtitle = item.restaurant || item.brand || item.channel || "";
  const detail1 = item.price || item.views || item.delivery_time || "";
  const detail2 = item.rating ? `⭐ ${item.rating}` : item.duration || item.discount || "";
  return (
    <a href={item.url || "#"} target="_blank" rel="noopener noreferrer" className="card">
      <div className="card-title">{title}</div>
      {subtitle && <div className="card-subtitle">{subtitle}</div>}
      <div className="card-meta">
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {detail1 && <span className="card-badge">{detail1}</span>}
          {detail2 && <span className="card-badge">{detail2}</span>}
        </div>
        <span className="card-open">Open ↗</span>
      </div>
    </a>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [mood, setMood] = useState("");
  const [intents, setIntents] = useState([]);
  const [voiceState, setVoiceState] = useState("idle"); // idle, recording, processing, speaking
  const [transcript, setTranscript] = useState("");
  const [convHistory, setConvHistory] = useState([]);

  const chatEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── SPEAK RESPONSE ──────────────────────────────────────────────────────────
  const speakText = async (text) => {
    try {
      setVoiceState("speaking");
      const response = await fetch(`${BASE_URL}/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "nova" })
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setVoiceState("idle"); URL.revokeObjectURL(url); };
      audio.play();
    } catch (e) {
      console.error("TTS error:", e);
      setVoiceState("idle");
    }
  };

  // ── SEND MESSAGE ────────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, conversation_history: convHistory })
      });
      const data = await res.json();

      const reply = data.reply || "Sorry something went wrong yaar";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      setConvHistory(prev => [...prev, text, reply]);

      if (data.recommendations?.length > 0) {
        setRecommendations(data.recommendations);
        setMood(data.mood || "");
        setIntents(data.intents || []);
      }

      // auto speak reply
      await speakText(reply);

    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "something broke yaar, try again" }]);
    } finally {
      setLoading(false);
    }
  };

  // ── VOICE RECORDING ─────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setVoiceState("processing");
        setTranscript("");

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob, "audio.webm");

        try {
          const res = await fetch(`${BASE_URL}/transcribe`, { method: "POST", body: formData });
          const data = await res.json();
          const text = data.transcript?.trim();

          if (text && text.length > 2) {
            setTranscript(text);
            setVoiceState("idle");
            await sendMessage(text);
          } else {
            setVoiceState("idle");
            setTranscript("Didn't catch that, try again");
          }
        } catch (e) {
          setVoiceState("idle");
        }
      };

      recorder.start();
      setVoiceState("recording");
    } catch (e) {
      alert("Mic access denied! Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleMicClick = () => {
    if (voiceState === "recording") stopRecording();
    else if (voiceState === "idle") startRecording();
    else if (voiceState === "speaking") {
      audioRef.current?.pause();
      setVoiceState("idle");
    }
  };

  const groupedRecs = recommendations.reduce((acc, item) => {
    acc[item.platform] = acc[item.platform] || [];
    acc[item.platform].push(item);
    return acc;
  }, {});

  const voiceStatusText = {
    idle: "Tap mic to speak",
    recording: "Listening... tap to stop",
    processing: "Transcribing...",
    speaking: "Speaking... tap to stop",
  }[voiceState];

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* HEADER */}
        <div className="header">
          <div className="logo-icon">🎙️</div>
          <div>
            <div className="logo-text">ConvoRecommender</div>
            <div className="tagline">Your AI friend for recommendations</div>
          </div>
        </div>

        {/* CHAT */}
        <div className="chat-area">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">💬</div>
              <div>Talk to Convo — ask anything or say what you want!</div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                Try: "I'm hungry" or "need new shoes" or just chat
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                <div className="msg-avatar">
                  {m.role === "user" ? "👤" : "🎙️"}
                </div>
                <div className="msg-bubble">{m.content}</div>
              </div>
            ))
          )}
          {loading && (
            <div className="msg assistant">
              <div className="msg-avatar">🎙️</div>
              <div className="typing">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* INPUT */}
        <div className="input-area">
          <div className="input-row">
            <button
              className={`btn-mic ${voiceState !== "idle" ? voiceState : ""}`}
              onClick={handleMicClick}
              title={voiceStatusText}
            >
              {voiceState === "recording" ? "⏹" : voiceState === "speaking" ? "🔊" : voiceState === "processing" ? "⏳" : "🎤"}
            </button>
            <input
              className="text-input"
              placeholder="Type or use mic to talk to Convo..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) sendMessage(input); }}
            />
            <button className="btn-send" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
          <div className="voice-status">
            <div className={`voice-dot ${voiceState !== "idle" ? voiceState : ""}`} />
            <span>{voiceStatusText}</span>
          </div>
          {transcript && <div className="transcript-preview">"{transcript}"</div>}
        </div>

        {/* CONTEXT PILLS */}
        {(mood || intents.length > 0) && (
          <div className="context-bar">
            {mood && <span className="pill pill-mood">😊 {mood}</span>}
            {intents.map((intent, i) => (
              <span key={i} className="pill pill-intent">
                {intent.category === "food" ? "🍽️" : intent.category === "shopping" ? "🛒" : "🎬"} {intent.item}
              </span>
            ))}
          </div>
        )}

        {/* RECOMMENDATIONS */}
        {Object.entries(groupedRecs).map(([platform, items]) => {
          const config = PLATFORM_CONFIG[platform] || {};
          return (
            <div key={platform} className="platform-section">
              <div className="platform-header">
                <div className="platform-dot" style={{ background: config.color }} />
                <span className="platform-name" style={{ color: config.color }}>
                  {config.emoji} {config.label}
                </span>
                <span className="platform-count">{items.length} results</span>
              </div>
              <div className="cards-grid">
                {items.map((item, i) => <Card key={i} item={item} />)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
