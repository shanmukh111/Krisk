import { useTheme, hexA } from "../ThemeContext.jsx";
import OrbBody from "./OrbBody.jsx";

function Ring({ delay, amp, C }) {
  return <div style={{position:"absolute",inset:30,borderRadius:"50%",border:`1px solid ${hexA(C.tealBright,0.5)}`,animation:`daisyRipple 1.8s ease-out ${delay}s infinite`,opacity:0.4+amp*0.4}}/>;
}

export default function DaisyOrb({ state, amp, variant }) {
  const { C } = useTheme();
  const visible = state !== "dormant";
  const isDog   = state === "waking";
  const scale   = state==="dormant"?0.2:state==="thinking"?1.04:state==="speaking"?1+amp*0.16:state==="listening"?1+amp*0.1:0.92;

  return (
    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
      <div style={{position:"relative",width:280,height:280,transform:`scale(${scale})`,opacity:visible?1:0,transition:"transform .7s cubic-bezier(.22,1,.36,1),opacity .9s ease"}}>
        <svg viewBox="0 0 200 200" width="280" height="280" style={{position:"absolute",inset:0,opacity:isDog?1:0,filter:isDog?"blur(0)":"blur(14px)",transform:isDog?"scale(1)":"scale(1.12)",transition:"opacity .9s,filter .9s,transform .9s"}}>
          <defs><radialGradient id="dface" cx="50%" cy="45%" r="60%"><stop offset="0%" stopColor={C.tealBright}/><stop offset="60%" stopColor={C.teal}/><stop offset="100%" stopColor={C.tealDeep}/></radialGradient></defs>
          <path d="M52 60 Q34 18 64 36 Q70 52 66 72 Z" fill="url(#dface)" opacity="0.85"/>
          <path d="M148 60 Q166 18 136 36 Q130 52 134 72 Z" fill="url(#dface)" opacity="0.85"/>
          <ellipse cx="100" cy="108" rx="58" ry="56" fill="url(#dface)"/>
          <ellipse cx="100" cy="132" rx="30" ry="26" fill={C.tealDeep} opacity="0.55"/>
          <circle cx="80" cy="98" r="8" fill="#eafffd"/><circle cx="120" cy="98" r="8" fill="#eafffd"/>
          <circle cx="80" cy="98" r="3.2" fill={C.base}/><circle cx="120" cy="98" r="3.2" fill={C.base}/>
          <ellipse cx="100" cy="126" rx="9" ry="7" fill="#06222200" stroke="#cffffb" strokeWidth="2"/>
        </svg>
        {(state==="listening"||state==="speaking")&&<><Ring delay={0} amp={amp} C={C}/><Ring delay={0.9} amp={amp} C={C}/></>}
        <div style={{position:"absolute",inset:isDog?70:36,opacity:isDog?0:1,transition:"opacity .9s,inset .9s cubic-bezier(.22,1,.36,1)"}}>
          <OrbBody variant={variant} state={state}/>
        </div>
      </div>
    </div>
  );
}
