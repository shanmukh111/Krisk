import { useState, useRef } from "react";
import { useTheme, hexA } from "../ThemeContext.jsx";
import ActionCard from "./ActionCard.jsx";
import RecommendationGrid from "./RecommendationGrid.jsx";

export default function ChatContainer({ messages, busy, scrollRef, voiceActive }) {
  const { C } = useTheme();
  const [opacity,    setOpacity]    = useState(0.55);
  const [showSlider, setShowSlider] = useState(false);
  const [winW,       setWinW]       = useState(560);
  const [extraH,     setExtraH]     = useState(0);

  const hoverTimer = useRef(null);
  const resizeRef  = useRef(null);

  const startResize = (e, edge) => {
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY;
    const sw = winW, sh = extraH;
    const onMove = (ev) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (edge === "right")  setWinW(Math.max(320, Math.min(860, sw + dx * 2)));
      if (edge === "left")   setWinW(Math.max(320, Math.min(860, sw - dx * 2)));
      if (edge === "bottom") setExtraH(Math.max(0, Math.min(200, sh + dy)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  };

  const edgeStyle = (edge) => ({
    position: "absolute", zIndex: 10,
    ...(edge === "right"  ? { right: -5, top: "15%", width: 10, height: "70%", cursor: "ew-resize" } : {}),
    ...(edge === "left"   ? { left:  -5, top: "15%", width: 10, height: "70%", cursor: "ew-resize" } : {}),
    ...(edge === "bottom" ? { bottom: -5, left: "15%", width: "70%", height: 10, cursor: "ns-resize" } : {}),
    display: "flex", alignItems: "center", justifyContent: "center",
  });

  return (
    <div
      ref={resizeRef}
      onMouseEnter={() => { clearTimeout(hoverTimer.current); setShowSlider(true); }}
      onMouseLeave={() => { hoverTimer.current = setTimeout(() => setShowSlider(false), 700); }}
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        top: 90,
        bottom: 200 + extraH * -1,
        maxHeight: "calc(100vh - 310px)",
        minHeight: 200,
        width: Math.min(winW, window.innerWidth - 48),
        maxWidth: "92vw",
        zIndex: 4,
        borderRadius: 20,
        background: hexA("#061a1c", opacity),
        border: `1px solid ${hexA(C.teal, opacity * 0.5)}`,
        backdropFilter: `blur(${Math.round(opacity * 14)}px)`,
        boxShadow: `0 8px 40px ${hexA("#000", 0.3)}`,
        transition: "background .3s, border .3s",
        overflow: "hidden",
      }}
    >
      {/* opacity slider */}
      <div style={{
        position: "absolute", top: 10, right: 14, zIndex: 10,
        display: "flex", alignItems: "center", gap: 8,
        opacity: showSlider ? 1 : 0,
        transform: showSlider ? "translateY(0)" : "translateY(-4px)",
        transition: "opacity .25s, transform .25s",
        pointerEvents: showSlider ? "auto" : "none",
      }}>
        <span style={{ fontSize: 10, color: hexA(C.inkDim, 0.6) }}>opacity</span>
        <input type="range" min="0" max="100" value={Math.round(opacity * 100)}
          onChange={e => setOpacity(e.target.value / 100)}
          style={{ width: 72, cursor: "pointer", accentColor: C.tealBright }}
        />
        <span style={{ fontSize: 10, color: hexA(C.inkDim, 0.5), minWidth: 26 }}>{Math.round(opacity * 100)}%</span>
      </div>

      {/* resize handles */}
      {["right", "left", "bottom"].map(edge => (
        <div key={edge} style={edgeStyle(edge)} onMouseDown={e => startResize(e, edge)}
          onMouseEnter={e => { if (e.currentTarget.children[0]) e.currentTarget.children[0].style.opacity = "1"; }}
          onMouseLeave={e => { if (e.currentTarget.children[0]) e.currentTarget.children[0].style.opacity = "0"; }}
        >
          <div style={{
            background: hexA(C.teal, 0.5), borderRadius: 4, opacity: 0, transition: "opacity .2s",
            ...(edge === "bottom" ? { width: "30%", height: 3 } : { width: 3, height: "30%" }),
          }} />
        </div>
      ))}

      {/* messages */}
      <div ref={scrollRef} style={{
        position: "absolute", inset: 0,
        overflowY: "auto", padding: "44px 18px 20px",
        maskImage: "linear-gradient(180deg,transparent,#000 44px,#000 calc(100% - 16px),transparent)",
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: C.inkDim, marginTop: 40, fontFamily: "'Instrument Serif',serif", fontStyle: "italic", fontSize: 22, opacity: 0.6 }}>
            I'm listening…
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="daisy-msg" style={{
            display: "flex", flexDirection: "column",
            alignItems: m.who === "me" ? "flex-end" : "flex-start",
            margin: "8px 0",
          }}>
            {/* bubble + action card */}
            <div style={{ maxWidth: "78%" }}>
              <div style={{
                padding: "10px 15px", borderRadius: 18, fontSize: 14.5, lineHeight: 1.5,
                color:      m.who === "me" ? C.base : C.ink,
                background: m.who === "me" ? C.tealBright : hexA("#0c2326", 0.78),
                border:     m.who === "me" ? "none" : `1px solid ${hexA(C.teal, 0.25)}`,
                borderBottomRightRadius: m.who === "me" ? 5 : 18,
                borderBottomLeftRadius:  m.who === "me" ? 18 : 5,
                backdropFilter: "blur(6px)",
              }}>{m.text}</div>
              {m.action && <ActionCard a={m.action} />}
            </div>

            {/* recommendations below Daisy messages — full container width */}
            {m.who === "daisy" && m.recommendations?.length > 0 && (
              <div style={{ width: "100%", maxWidth: "100%" }}>
                <RecommendationGrid recommendations={m.recommendations} />
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className="daisy-msg" style={{ display: "flex", margin: "8px 0" }}>
            <div style={{ padding: "12px 16px", borderRadius: 18, borderBottomLeftRadius: 5, background: hexA("#0c2326", 0.78), border: `1px solid ${hexA(C.teal, 0.22)}`, display: "flex", gap: 5 }}>
              {[0, 1, 2].map(d => (
                <span key={d} style={{ width: 6, height: 6, borderRadius: 999, background: C.tealBright, animation: `daisyBreathe 1s ease-in-out ${d * 0.18}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
