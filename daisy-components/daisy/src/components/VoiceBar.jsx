import { C, hexA } from "../constants.js";

// ─── VoiceBar ─────────────────────────────────────────────────────────────────
// Replaces the text input when voice is active.
// Shows animated waveform + live transcript + stop button.
export default function VoiceBar({ transcript, amp, error, onStop }) {
  const bars = 22;

  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px", borderRadius: 999,
      background: hexA("#06181a", 0.9),
      border: `1px solid ${error ? "#ff6b6b55" : hexA(C.tealBright, 0.4)}`,
      backdropFilter: "blur(14px)",
      boxShadow: `0 0 20px ${error ? "rgba(255,100,100,0.15)" : hexA(C.teal, 0.2)}, 0 8px 40px ${hexA("#000",0.5)}`,
      animation: "daisyRise .25s ease both",
    }}>
      {/* waveform */}
      <div style={{display:"flex",alignItems:"center",gap:2,flexShrink:0}}>
        {Array.from({length:bars}).map((_,i)=>{
          const h = error ? 4 : 4 + (amp * 18 * Math.abs(Math.sin((i/bars)*Math.PI)));
          return (
            <div key={i} style={{
              width:2.5, borderRadius:2, minHeight:4,
              height:`${h}px`,
              background: error
                ? "rgba(255,100,100,0.4)"
                : `linear-gradient(to top,${hexA(C.teal,0.5)},${C.tealBright})`,
              animation: error ? "none" : `daisyBreathe ${0.6+(i%4)*0.15}s ease-in-out ${i*0.04}s infinite`,
              transition:"height .08s ease",
            }}/>
          );
        })}
      </div>

      {/* transcript or error */}
      <div style={{
        flex:1, fontSize:13.5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", minWidth:0,
        color: error ? "#ff9999" : (transcript ? C.ink : hexA(C.inkDim,0.5)),
        fontStyle: transcript ? "normal" : "italic",
      }}>
        {error || transcript || "listening — speak now…"}
      </div>

      {/* stop */}
      <button onClick={onStop} title="stop" style={{
        width:36,height:36,borderRadius:999,flexShrink:0,cursor:"pointer",
        border:`1px solid ${hexA(C.tealBright,0.4)}`,
        background:hexA(C.tealBright,0.1),
        color:C.tealBright,fontSize:12,fontFamily:"inherit",
        display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",
      }}
        onMouseEnter={e=>e.currentTarget.style.background=hexA(C.tealBright,0.25)}
        onMouseLeave={e=>e.currentTarget.style.background=hexA(C.tealBright,0.1)}
      >■</button>
    </div>
  );
}
