import { useState, useCallback, useRef, useEffect } from "react";
import { ThemeProvider, useTheme, hexA } from "./ThemeContext.jsx";
import { useSessions } from "./hooks/useSessions.js";
import { guessAction, cannedReply, detectMusicQuery } from "./utils.js";
import { chatWithBackend, speakText, transcribeAudio, checkHealth } from "./api.js";
import { useSpotify } from "./hooks/useSpotify.js";

import FluidGL        from "./components/FluidGL.jsx";
import ChatContainer  from "./components/ChatContainer.jsx";
import TopBar         from "./components/TopBar.jsx";
import SendOrb        from "./components/SendOrb.jsx";
import ChatPanel      from "./components/ChatPanel.jsx";
import SpotifyWidget  from "./components/SpotifyWidget.jsx";

// ─── Inner app (has access to ThemeProvider) ──────────────────────────────────
function DaisyApp() {
  const { C } = useTheme();
  const [mode,        setMode]        = useState("fluid");
  const [mouseEffect, setMouseEffect] = useState(false);
  const [backendOk,   setBackendOk]   = useState(null); // null=checking, true=ok, false=offline

  const { sessions, activeId, activeSession, messages, newChat, switchChat, renameChat, deleteChat, addMessage } = useSessions();
  const spotify = useSpotify();
  // Keep a ref so music detection inside handleSend always uses latest spotify
  const spotifyRef = useRef(spotify);
  useEffect(() => { spotifyRef.current = spotify; });

  const [input,  setInput]  = useState("");
  const [busy,   setBusy]   = useState(false);
  const [dstate, setDstate] = useState("dormant");
  const [amp,    setAmp]    = useState(0);

  const energy        = useRef(0);
  const ampTimer      = useRef(null);
  const scrollRef     = useRef(null);
  const audioRef      = useRef(null);       // TTS audio element
  const mediaRec      = useRef(null);       // { recorder, stream }
  const audioChunks   = useRef([]);

  // ── Check backend health on mount ─────────────────────────────────────────
  useEffect(() => {
    checkHealth()
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false));
  }, []);

  // ── Reset on session switch ────────────────────────────────────────────────
  useEffect(() => { setDstate("dormant"); setBusy(false); setInput(""); }, [activeId]);

  // ── Amplitude driver ───────────────────────────────────────────────────────
  useEffect(() => {
    const live = dstate === "listening" || dstate === "speaking" || dstate === "thinking";
    if (live) {
      ampTimer.current = setInterval(() => {
        const t = dstate === "speaking"  ? 0.4 + Math.random() * 0.6
                : dstate === "thinking"  ? 0.3 + Math.random() * 0.2
                :                         0.15 + Math.random() * 0.35;
        setAmp(p => p + (t - p) * 0.4);
        energy.current += (t - energy.current) * 0.3;
      }, 90);
    } else {
      setAmp(0);
      energy.current *= 0.9;
    }
    return () => clearInterval(ampTimer.current);
  }, [dstate]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => { scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }); }, [messages, busy]);

  // ── Voice state ────────────────────────────────────────────────────────────
  const [voiceMode, setVoiceMode] = useState(false);
  const [micReady,  setMicReady]  = useState(false);
  const recognitionRef = useRef(null);
  const autoStopTimer  = useRef(null);

  // ── Core respond — calls backend /chat, then plays TTS ───────────────────
  const respond = useCallback(async (text) => {
    setDstate("thinking");

    // Stop any ongoing TTS
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    let reply = "";
    let recommendations = null;

    // Convert current messages to backend conversation history format
    const history = messages.slice(-8).map(m => ({
      role:    m.who === "me" ? "user" : "assistant",
      content: m.text,
    }));

    try {
      const data = await chatWithBackend({
        transcript:          text,
        conversationHistory: history,
        sessionId:           activeId,
      });
      reply = data.reply || "";
      // Only keep recs if backend returned them (null on followup questions)
      if (data.recommendations?.length) {
        recommendations = data.recommendations;
      }
    } catch (err) {
      console.warn("[Krisk] Backend error:", err.message);
      reply = cannedReply(text);
    }

    if (!reply) reply = cannedReply(text);

    addMessage({ who: "daisy", text: reply, action: guessAction(text), recommendations });
    setBusy(false);

    // TTS via backend /speak
    setDstate("speaking");
    try {
      const audioUrl = await speakText(reply);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        if (audioRef.current === audio) audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
        setDstate("idleActive");
      };
      audio.onerror = () => {
        if (audioRef.current === audio) audioRef.current = null;
        setDstate("idleActive");
      };
      audio.play().catch(() => setDstate("idleActive"));
    } catch {
      // TTS unavailable — animate for 2.6s then go idle
      setTimeout(() => setDstate("idleActive"), 2600);
    }
  }, [messages, addMessage, activeId]);

  // ── Voice: stop (optionally auto-send) ───────────────────────────────────
  const stopVoice = useCallback(async (autoSend = false) => {
    clearTimeout(autoStopTimer.current);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setVoiceMode(false);
    setMicReady(false);

    const webText = input.trim();
    const mr = mediaRec.current;

    if (mr) {
      mediaRec.current = null;
      if (autoSend) {
        // Collect last chunks, then send to Whisper
        mr.recorder.stop();
        mr.stream.getTracks().forEach(t => t.stop());
        const chunks = [...audioChunks.current];
        audioChunks.current = [];

        if (chunks.length > 0) {
          setBusy(true); setInput("");
          try {
            const blob = new Blob(chunks, { type: "audio/webm" });
            const { transcript } = await transcribeAudio(blob);
            if (transcript.trim()) {
              addMessage({ who: "me", text: transcript });
              respond(transcript);
              return;
            }
          } catch {
            // fall through to Web Speech text
          }
        }
      } else {
        mr.recorder.stop();
        mr.stream.getTracks().forEach(t => t.stop());
        audioChunks.current = [];
      }
    }

    // Fallback: use Web Speech API transcript
    if (autoSend && webText) {
      addMessage({ who: "me", text: webText });
      setInput(""); setBusy(true);
      respond(webText);
    }
  }, [input, addMessage, respond]);

  // ── Voice: start ──────────────────────────────────────────────────────────
  const startVoice = useCallback(async () => {
    if (dstate === "dormant") setDstate("listening");
    setInput(""); setVoiceMode(true);

    // 1. Web Speech API for live transcript display
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      try {
        const rec = new SR();
        rec.continuous = true; rec.interimResults = true; rec.lang = "en-IN";
        rec.onstart  = () => setMicReady(true);
        rec.onresult = (e) => {
          clearTimeout(autoStopTimer.current);
          setInput(Array.from(e.results).map(r => r[0].transcript).join(" "));
          autoStopTimer.current = setTimeout(() => stopVoice(true), 2000);
        };
        rec.onerror = () => setMicReady(false);
        rec.onend   = () => setMicReady(false);
        rec.start();
        recognitionRef.current = rec;
      } catch {}
    }

    // 2. MediaRecorder for Whisper-quality transcription
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunks.current.push(e.data); };
      mr.start(250);
      mediaRec.current = { recorder: mr, stream };
      if (!SR) setMicReady(true);
    } catch {
      // MediaRecorder unavailable — rely on Web Speech API only
    }
  }, [dstate, stopVoice]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => {
    clearTimeout(autoStopTimer.current);
    recognitionRef.current?.stop();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (mediaRec.current) { mediaRec.current.recorder.stop(); mediaRec.current.stream.getTracks().forEach(t => t.stop()); }
  }, []);

  // ── Send text message ──────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (voiceMode) { stopVoice(true); return; }
    const text = input.trim();
    if (!text || busy) return;

    // Music intent → trigger Spotify in background
    const musicQuery = detectMusicQuery(text);
    if (musicQuery && spotifyRef.current.status === "authenticated") {
      spotifyRef.current.searchAndPlay(musicQuery);
    }

    if (dstate === "dormant") setDstate("listening");
    addMessage({ who: "me", text }); setInput(""); setBusy(true); respond(text);
  }, [voiceMode, input, busy, dstate, addMessage, respond, stopVoice]);

  // ── Rest / dismiss ─────────────────────────────────────────────────────────
  const handleRest = useCallback(() => {
    stopVoice(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setDstate("dormant");
  }, [stopVoice]);

  const fluid = mode === "fluid";

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", background: C.base, color: C.ink, overflow: "hidden", fontFamily: "'Hanken Grotesk',system-ui,sans-serif" }}>

      {fluid
        ? <FluidGL active={dstate !== "dormant"} energy={energy} mouseEffect={mouseEffect} />
        : <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 90% at 50% -10%,${C.base2},${C.base})` }} />
      }
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(120% 120% at 50% 50%,transparent 55%,${hexA("#000", 0.55)} 100%)` }} />

      <TopBar
        dstate={dstate} mode={mode} setMode={setMode}
        mouseEffect={mouseEffect} setMouseEffect={setMouseEffect}
        backendOk={backendOk}
      />

      {/* dormant greeting */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 20px", textAlign: "center", pointerEvents: dstate === "dormant" ? "auto" : "none" }}>
        {dstate === "dormant" && (
          <div style={{ animation: "daisyRise .8s ease both" }}>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontStyle: "italic", fontSize: "clamp(30px,5vw,58px)", color: C.ink, opacity: 0.92, lineHeight: 1.1 }}>
              Hey&nbsp;Daisy
            </div>
            <p style={{ marginTop: 12, fontSize: 13, color: C.inkDim }}>type below or use mic to speak</p>
          </div>
        )}
      </div>

      {dstate !== "dormant" && (
        <ChatContainer messages={messages} busy={busy} scrollRef={scrollRef} voiceActive={voiceMode} />
      )}

      <SpotifyWidget spotify={spotify} />

      {/* bottom dock */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 6, padding: "0 0 22px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <ChatPanel
          sessions={sessions} activeId={activeId}
          onNew={newChat}
          onSwitch={id => { switchChat(id); const s = sessions.find(x => x.id === id); if (s?.messages.length > 0) setDstate("idleActive"); }}
          onRename={renameChat} onDelete={deleteChat}
        />

        {dstate !== "dormant" && (
          <div style={{ fontSize: 11, color: hexA(C.inkDim, 0.35), marginBottom: 6, letterSpacing: 0.3 }}>
            {activeSession?.name}
          </div>
        )}

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          width: "min(560px,88vw)", padding: "8px 8px 8px 20px",
          borderRadius: 999,
          background: voiceMode ? hexA("#06181a", 0.92) : hexA("#06181a", 0.82),
          border: voiceMode ? `1px solid ${hexA(C.tealBright, 0.35)}` : `1px solid ${hexA(C.teal, 0.28)}`,
          backdropFilter: "blur(14px)",
          boxShadow: `0 8px 40px ${hexA("#000", 0.5)}`,
          transition: "border .3s",
        }}>
          <input
            value={input}
            onChange={e => !voiceMode && setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !voiceMode && handleSend()}
            placeholder={voiceMode ? "listening…" : "tell Daisy what to do…"}
            readOnly={voiceMode}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: voiceMode ? hexA(C.tealBright, 0.9) : C.ink,
              fontSize: 14.5, fontFamily: "inherit",
              fontStyle: (voiceMode && !input) ? "italic" : "normal",
              caretColor: voiceMode ? "transparent" : C.tealBright,
            }}
          />
          {dstate !== "dormant" && !voiceMode && (
            <button onClick={handleRest} style={iconBtn(C)}>✕</button>
          )}
          {!voiceMode && (
            <button onClick={startVoice} title="speak to Daisy" style={iconBtn(C)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
              </svg>
            </button>
          )}
          <SendOrb voiceMode={voiceMode} micReady={micReady} amp={amp} onClick={voiceMode ? () => stopVoice(true) : handleSend} />
        </div>
        <div style={{ marginTop: 7, fontSize: 10.5, color: hexA(C.inkDim, 0.28) }}>
          {voiceMode ? "tap orb to send" : "enter to send · mic for voice"}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DaisyApp />
    </ThemeProvider>
  );
}

function iconBtn(C) {
  return {
    width: 38, height: 38, borderRadius: 999, flexShrink: 0, cursor: "pointer",
    border: `1px solid ${hexA(C.teal, 0.28)}`, background: "transparent",
    color: C.inkDim, fontSize: 16, fontWeight: 600, fontFamily: "inherit",
    display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s",
  };
}
