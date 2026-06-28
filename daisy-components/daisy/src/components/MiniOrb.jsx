import { C, hexA } from "../constants.js";

// ─── MiniOrb ─────────────────────────────────────────────────────────────────
// Floats between the chat window and the input bar when voice is active.
// Self-contained — no dependency on OrbBody (avoids overflow/clip issues).
//
// Props:
//   amp      — 0–1 amplitude
//   orbStyle — style hint (affects colors slightly)
//   error    — mic error string or null
//
export default function MiniOrb({ amp = 0, orbStyle, error }) {
  const scale = 1 + amp * 0.25;
  const glow  = 20 + amp * 35;

  return (
    <div style={{
      position: "absolute",
      bottom: 178,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 7,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      pointerEvents: "none",
      animation: "daisyRise .4s cubic-bezier(.22,1,.36,1) both",
    }}>

      {/* orb */}
      <div style={{
        position: "relative",
        width: 80, height: 80,
        transform: `scale(${scale})`,
        transition: "transform .1s ease",
      }}>
        {/* outer ripple rings */}
        <div style={{
          position: "absolute", inset: -14, borderRadius: "50%",
          border: `1px solid ${hexA(C.tealBright, 0.25)}`,
          animation: "daisyRipple 2s ease-out infinite",
        }}/>
        <div style={{
          position: "absolute", inset: -14, borderRadius: "50%",
          border: `1px solid ${hexA(C.tealBright, 0.15)}`,
          animation: "daisyRipple 2s ease-out .7s infinite",
        }}/>

        {/* main sphere */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 28%,
            #eafffd 0%,
            ${C.tealBright} 18%,
            ${C.teal} 50%,
            ${C.tealDeep} 88%)`,
          boxShadow: `
            0 0 ${glow}px ${hexA(C.teal, 0.65)},
            0 0 ${glow * 2}px ${hexA(C.teal, 0.25)},
            inset 0 0 18px ${hexA(C.tealBright, 0.45)}`,
        }}/>

        {/* rotating inner swirl */}
        <div style={{
          position: "absolute", inset: 5, borderRadius: "50%",
          mixBlendMode: "screen", opacity: 0.55,
          background: `conic-gradient(from 0deg,
            transparent,
            ${hexA(C.tealBright, 0.6)},
            transparent 45%,
            ${hexA(C.whisper, 0.2)},
            transparent 70%)`,
          animation: "daisySpin 3s linear infinite",
        }}/>

        {/* specular highlight */}
        <div style={{
          position: "absolute", top: "14%", left: "18%",
          width: "34%", height: "26%", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.75), transparent 70%)",
          filter: "blur(2px)", pointerEvents: "none",
        }}/>
      </div>

      {/* status label */}
      <div style={{
        fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase",
        color: error ? "#ff6b6b" : hexA(C.tealBright, 0.65),
        textAlign: "center", maxWidth: 200,
      }}>
        {error || "listening"}
      </div>
    </div>
  );
}
