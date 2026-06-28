import { useTheme, hexA } from "../ThemeContext.jsx";

export default function SendOrb({ voiceMode, micReady, amp, onClick }) {
  const { C } = useTheme();
  const scale = voiceMode ? 1 + amp * 0.28 : 1;
  const glow  = voiceMode ? 8 + amp * 28 : 0;

  if (!voiceMode) {
    return (
      <button onClick={onClick} title="send" style={{
        width:40, height:40, borderRadius:999, flexShrink:0, cursor:"pointer",
        border:"none", background:C.tealBright, color:C.base,
        fontSize:17, fontWeight:600, fontFamily:"inherit",
        display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s",
      }}
        onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.08)";e.currentTarget.style.boxShadow=`0 0 14px ${hexA(C.tealBright,0.5)}`;}}
        onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="none";}}
      >↑</button>
    );
  }

  return (
    <button onClick={onClick} title="tap to send" style={{
      position:"relative", width:44, height:44, borderRadius:999, flexShrink:0, cursor:"pointer",
      border:"none", background:"transparent", padding:0,
      transform:`scale(${scale})`, transition:"transform .1s ease",
      filter:`drop-shadow(0 0 ${glow}px ${hexA(C.teal,0.7)})`,
    }}>
      {micReady && <div style={{position:"absolute",inset:-8,borderRadius:"50%",border:`1px solid ${hexA(C.tealBright,0.3)}`,animation:"daisyRipple 1.8s ease-out infinite",pointerEvents:"none"}}/>}
      <div style={{position:"absolute",inset:0,borderRadius:"50%",background:`radial-gradient(circle at 35% 28%,#eafffd 0%,${C.tealBright} 20%,${C.teal} 52%,${C.tealDeep} 90%)`,boxShadow:`inset 0 0 14px ${hexA(C.tealBright,0.45)}`}}/>
      <div style={{position:"absolute",inset:4,borderRadius:"50%",mixBlendMode:"screen",opacity:0.5,background:`conic-gradient(from 0deg,transparent,${hexA(C.tealBright,0.6)},transparent 45%)`,animation:`daisySpin ${micReady?2.5:5}s linear infinite`}}/>
      <div style={{position:"absolute",top:"14%",left:"16%",width:"34%",height:"26%",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,255,255,0.7),transparent 70%)",filter:"blur(1.5px)",pointerEvents:"none"}}/>
    </button>
  );
}
