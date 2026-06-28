import { useTheme, hexA } from "../ThemeContext.jsx";
import ColorPicker from "./ColorPicker.jsx";

export default function TopBar({ dstate, mode, setMode, mouseEffect, setMouseEffect, backendOk }) {
  const { C } = useTheme();
  const isDormant = dstate === "dormant";

  const backendColor  = backendOk === true ? "#4ade80" : backendOk === false ? "#f87171" : C.inkDim;
  const backendTitle  = backendOk === true ? "backend online" : backendOk === false ? "backend offline — using fallback" : "checking backend…";

  return (
    <div style={{
      position:"absolute",top:0,left:0,right:0,zIndex:5,
      display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"18px 22px",
    }}>
      {/* left: dot + name + backend status */}
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{
          width:9,height:9,borderRadius:999,
          background:  isDormant ? C.inkDim : C.tealBright,
          boxShadow:   isDormant ? "none" : `0 0 12px ${C.tealBright}`,
          animation:   isDormant ? "none" : "daisyBreathe 2.4s ease-in-out infinite",
        }}/>
        <span style={{fontFamily:"'Instrument Serif',serif",fontSize:22,letterSpacing:0.5}}>Daisy</span>
        {/* backend health dot */}
        <div title={backendTitle} style={{
          width:6,height:6,borderRadius:999,
          background:backendColor,
          boxShadow: backendOk === true ? `0 0 8px ${backendColor}` : "none",
          transition:"background .4s, box-shadow .4s",
        }}/>
      </div>

      {/* right: mouse toggle + color picker + fluid/normal */}
      <div style={{display:"flex",alignItems:"center",gap:10}}>

        {/* mouse fluid toggle — only in fluid mode */}
        {mode === "fluid" && (
          <button
            onClick={() => setMouseEffect(m => !m)}
            title={mouseEffect ? "mouse effect on — click to turn off" : "mouse effect off — click to turn on"}
            style={{
              height:32, padding:"0 12px", borderRadius:8, cursor:"pointer",
              border:`1px solid ${mouseEffect ? hexA(C.tealBright,0.5) : hexA(C.teal,0.2)}`,
              background: mouseEffect ? hexA(C.teal,0.18) : hexA(C.teal,0.06),
              color: mouseEffect ? C.tealBright : C.inkDim,
              fontSize:11.5, fontFamily:"inherit",
              display:"flex", alignItems:"center", gap:6,
              transition:"all .25s",
              boxShadow: mouseEffect ? `0 0 10px ${hexA(C.teal,0.2)}` : "none",
            }}
          >
            {/* cursor wave icon */}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 6.5s-2 2-2 5 2 5 2 5"/>
              <path d="M17.5 6.5s2 2 2 5-2 5-2 5"/>
              <path d="M10.5 3.5s-4 3.5-4 8 4 8 4 8"/>
              <path d="M13.5 3.5s4 3.5 4 8-4 8-4 8"/>
              <line x1="12" y1="12" x2="12" y2="12.01"/>
            </svg>
            <span>cursor flow</span>
            <span style={{
              width:6,height:6,borderRadius:"50%",flexShrink:0,
              background: mouseEffect ? C.tealBright : hexA(C.inkDim,0.4),
              boxShadow: mouseEffect ? `0 0 6px ${C.tealBright}` : "none",
              transition:"all .25s",
            }}/>
          </button>
        )}

        {/* color picker */}
        <ColorPicker />

        {/* fluid / normal toggle */}
        <div style={{
          display:"flex",padding:3,borderRadius:999,
          background:hexA(C.teal,0.06),
          border:`1px solid ${hexA(C.teal,0.2)}`,
          fontSize:12.5,
        }}>
          {["fluid","normal"].map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{
              border:"none",cursor:"pointer",padding:"6px 14px",borderRadius:999,
              color:      mode===m ? C.base   : C.inkDim,
              background: mode===m ? C.tealBright : "transparent",
              fontWeight: mode===m ? 600 : 400,
              transition:"all .25s",textTransform:"capitalize",fontFamily:"inherit",
            }}>{m}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
