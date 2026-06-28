import { useState, useEffect, useRef } from "react";
import { C, hexA } from "../constants.js";

const ORB_VARIANTS = ["glass", "plasma", "halo", "pearl"];
const PREVIEW = {
  glass:  C.teal,
  plasma: C.tealBright,
  halo:   "#eafffd",
  pearl:  C.whisper,
};

// ─── OrbPicker ───────────────────────────────────────────────────────────────
// Click to open popup. Closes when clicking ANYWHERE outside it.
export default function OrbPicker({ orbStyle, setOrbStyle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    // use capture so it fires before anything else
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          cursor: "pointer", padding: "5px 14px 5px 10px", borderRadius: 999,
          fontFamily: "inherit", fontSize: 12,
          display: "flex", alignItems: "center", gap: 6,
          color: C.inkDim,
          background: hexA(C.teal, 0.07),
          border: `1px solid ${hexA(C.teal, 0.2)}`,
          transition: "all .2s", whiteSpace: "nowrap",
        }}
      >
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: PREVIEW[orbStyle],
          boxShadow: `0 0 6px ${PREVIEW[orbStyle]}`,
          flexShrink: 0,
        }}/>
        <span>orb: {orbStyle}</span>
        <span style={{ fontSize: 9, opacity: 0.5 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: 0,
          background: hexA("#06181a", 0.97),
          border: `1px solid ${hexA(C.teal, 0.25)}`,
          borderRadius: 14, padding: 8,
          display: "flex", flexDirection: "column", gap: 4,
          backdropFilter: "blur(14px)", zIndex: 50, minWidth: 150,
          boxShadow: `0 8px 32px ${hexA("#000", 0.5)}`,
          animation: "daisyRise .2s ease both",
        }}>
          {ORB_VARIANTS.map(v => (
            <button
              key={v}
              onClick={() => { setOrbStyle(v); setOpen(false); }}
              style={{
                cursor: "pointer", padding: "8px 12px", borderRadius: 8,
                fontFamily: "inherit", fontSize: 12.5, textTransform: "capitalize",
                display: "flex", alignItems: "center", gap: 8,
                color:      orbStyle === v ? C.tealBright : C.inkDim,
                background: orbStyle === v ? hexA(C.teal, 0.15) : "transparent",
                border:     orbStyle === v ? `1px solid ${hexA(C.teal, 0.3)}` : "1px solid transparent",
                transition: "all .15s", textAlign: "left",
              }}
            >
              <div style={{
                width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                background: PREVIEW[v],
                boxShadow: orbStyle === v ? `0 0 6px ${PREVIEW[v]}` : "none",
              }}/>
              {v}
              {orbStyle === v && <span style={{ marginLeft: "auto", fontSize: 10 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
