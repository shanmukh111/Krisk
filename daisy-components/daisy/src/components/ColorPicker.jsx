import { useState, useRef, useEffect } from "react";
import { useTheme, hexA } from "../ThemeContext.jsx";

// Preset accent colors — all look great on a dark background
const PRESETS = [
  { name:"Teal",    hex:"#34a0a4" },
  { name:"Purple",  hex:"#9d4edd" },
  { name:"Rose",    hex:"#f43f5e" },
  { name:"Amber",   hex:"#f59e0b" },
  { name:"Emerald", hex:"#10b981" },
  { name:"Blue",    hex:"#60a5fa" },
  { name:"Indigo",  hex:"#818cf8" },
  { name:"Orange",  hex:"#fb923c" },
  { name:"Pink",    hex:"#e879f9" },
  { name:"Lime",    hex:"#a3e635" },
];

// ─── ColorPicker ──────────────────────────────────────────────────────────────
// Small palette button. Click → popup with swatches + custom picker.
// Lives in the TopBar next to Fluid/Normal toggle.
export default function ColorPicker() {
  const { C, setAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn, true);
    return () => document.removeEventListener("mousedown", fn, true);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>

      {/* trigger button — palette icon */}
      <button
        onClick={() => setOpen(o => !o)}
        title="change accent color"
        style={{
          width: 32, height: 32, borderRadius: 8, cursor: "pointer",
          border: `1px solid ${hexA(C.teal, 0.3)}`,
          background: hexA(C.teal, 0.08),
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .2s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = hexA(C.teal, 0.2)}
        onMouseLeave={e => e.currentTarget.style.background = hexA(C.teal, 0.08)}
      >
        {/* palette SVG */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.tealBright} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r=".5" fill={C.tealBright}/>
          <circle cx="17.5" cy="10.5" r=".5" fill={C.tealBright}/>
          <circle cx="8.5"  cy="7.5"  r=".5" fill={C.tealBright}/>
          <circle cx="6.5"  cy="12.5" r=".5" fill={C.tealBright}/>
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
        </svg>
      </button>

      {/* popup */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: hexA("#040c0e", 0.97),
          border: `1px solid ${hexA(C.teal, 0.25)}`,
          borderRadius: 14, padding: 14,
          backdropFilter: "blur(16px)",
          zIndex: 100,
          boxShadow: `0 8px 32px ${hexA("#000", 0.5)}`,
          width: 220,
          animation: "daisyRise .2s ease both",
        }}>

          <div style={{ fontSize: 11, color: hexA(C.inkDim, 0.6), letterSpacing: 1, marginBottom: 10 }}>
            ACCENT COLOR
          </div>

          {/* preset swatches grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 12 }}>
            {PRESETS.map(p => (
              <button
                key={p.hex}
                onClick={() => { setAccent(p.hex); }}
                title={p.name}
                style={{
                  width: "100%", aspectRatio: "1", borderRadius: 8, cursor: "pointer",
                  background: p.hex,
                  border: C.accent === p.hex
                    ? `2px solid #fff`
                    : `2px solid transparent`,
                  boxShadow: C.accent === p.hex
                    ? `0 0 10px ${p.hex}aa`
                    : "none",
                  transition: "all .15s",
                  padding: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform="scale(1.12)"; e.currentTarget.style.boxShadow=`0 0 10px ${p.hex}88`; }}
                onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.boxShadow=C.accent===p.hex?`0 0 10px ${p.hex}aa`:"none"; }}
              />
            ))}
          </div>

          {/* divider */}
          <div style={{ height:1, background: hexA(C.teal, 0.12), marginBottom: 12 }}/>

          {/* custom color input */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, color: hexA(C.inkDim, 0.6), flex:1 }}>Custom</span>
            <input
              type="color"
              value={C.accent}
              onChange={e => setAccent(e.target.value)}
              style={{
                width: 36, height: 28, borderRadius: 6, cursor: "pointer",
                border: `1px solid ${hexA(C.teal, 0.3)}`,
                background: "transparent", padding: 2,
              }}
            />
            <span style={{ fontSize: 11, color: hexA(C.inkDim, 0.5), fontFamily:"monospace" }}>
              {C.accent}
            </span>
          </div>

          {/* preview bar */}
          <div style={{
            marginTop: 12, height: 4, borderRadius: 4,
            background: `linear-gradient(to right, ${C.tealDeep}, ${C.teal}, ${C.tealBright})`,
          }}/>
        </div>
      )}
    </div>
  );
}
