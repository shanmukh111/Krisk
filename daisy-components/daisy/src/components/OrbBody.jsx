import { useTheme, hexA } from "../ThemeContext.jsx";

function Halo({ color, spread=70, alpha=0.45 }){
  return <div style={{position:"absolute",inset:-spread,borderRadius:"50%",background:`radial-gradient(circle,${hexA(color,alpha)} 0%,${hexA(color,0)} 62%)`,filter:"blur(6px)",pointerEvents:"none"}}/>;
}
function Spec({ top="15%", left="22%", size="32%", o=0.7 }){
  return <div style={{position:"absolute",top,left,width:size,height:`calc(${size}*0.78)`,borderRadius:"50%",filter:"blur(3px)",pointerEvents:"none",background:`radial-gradient(circle,rgba(255,255,255,${o}),transparent 70%)`}}/>;
}

export default function OrbBody({ variant, state }) {
  const { C } = useTheme();
  const spin = state==="thinking"?3:11;
  const sphere = { position:"absolute", inset:0, borderRadius:"50%" };

  if (variant==="plasma") return (
    <div style={sphere}>
      <Halo color={C.teal} spread={80} alpha={0.6}/>
      <div style={{...sphere,background:`radial-gradient(circle at 42% 36%,#eafffd 0%,${C.tealBright} 20%,${C.teal} 48%,${C.tealDeep} 80%,${hexA(C.base,0)} 100%)`,boxShadow:`0 0 70px ${hexA(C.teal,0.6)},inset 0 0 50px ${hexA(C.tealBright,0.5)}`}}/>
      <div style={{...sphere,inset:6,mixBlendMode:"screen",background:`conic-gradient(from 0deg,transparent,${hexA(C.tealBright,0.65)},transparent 40%,${hexA(C.whisper,0.3)},transparent 70%)`,animation:`daisySpin ${spin}s linear infinite`}}/>
      <Spec o={0.85}/>
    </div>
  );
  if (variant==="halo") return (
    <div style={sphere}>
      <Halo color={C.tealBright} spread={50} alpha={0.35}/>
      <div style={{...sphere,background:`radial-gradient(circle,${hexA(C.tealDeep,0.55)} 30%,${hexA(C.teal,0.12)} 58%,transparent 66%)`,boxShadow:`inset 0 0 50px ${hexA(C.tealBright,0.25)}`}}/>
      <div style={{...sphere,inset:4,border:`2px solid ${hexA(C.tealBright,0.9)}`,boxShadow:`0 0 24px ${hexA(C.tealBright,0.7)},inset 0 0 24px ${hexA(C.tealBright,0.5)}`,animation:`daisySpin ${spin*1.6}s linear infinite`}}/>
      <div style={{position:"absolute",inset:"38%",borderRadius:"50%",background:`radial-gradient(circle,${hexA(C.tealBright,0.6)},transparent 70%)`,filter:"blur(4px)"}}/>
    </div>
  );
  if (variant==="pearl") return (
    <div style={sphere}>
      <Halo color={C.whisper} spread={64} alpha={0.4}/>
      <div style={{...sphere,background:`radial-gradient(circle at 36% 28%,#e8fffb 0%,${C.tealBright} 16%,${C.teal} 44%,${C.whisper} 78%,${C.tealDeep} 100%)`,boxShadow:`0 18px 50px ${hexA(C.base,0.6)},inset -10px -12px 40px ${hexA(C.base,0.5)}`}}/>
      <div style={{...sphere,inset:3,mixBlendMode:"screen",opacity:0.5,background:`conic-gradient(from 120deg,${hexA(C.tealBright,0.4)},${hexA(C.whisper,0.4)},${hexA(C.tealBright,0.4)})`,animation:`daisySpin ${spin*1.4}s linear infinite`}}/>
      <Spec o={0.8} top="14%" left="20%" size="36%"/>
    </div>
  );
  // glass (default)
  return (
    <div style={sphere}>
      <Halo color={C.teal} spread={58} alpha={0.42}/>
      <div style={{...sphere,background:`radial-gradient(circle at 35% 30%,${hexA("#ffffff",0.18)} 0%,${hexA(C.teal,0.12)} 38%,${hexA(C.tealDeep,0.32)} 70%,${hexA(C.base,0)} 100%)`,boxShadow:`inset 0 0 44px ${hexA(C.tealBright,0.28)},inset 10px 12px 34px ${hexA("#ffffff",0.12)},inset -8px -10px 30px ${hexA(C.base,0.5)},0 22px 60px ${hexA(C.base,0.5)}`,border:`1px solid ${hexA(C.tealBright,0.3)}`}}/>
      <div style={{...sphere,inset:14,mixBlendMode:"screen",opacity:0.6,background:`conic-gradient(from 0deg,transparent,${hexA(C.tealBright,0.4)},transparent 50%,${hexA(C.whisper,0.22)},transparent)`,animation:`daisySpin ${spin*1.3}s linear infinite`,filter:"blur(2px)"}}/>
      <div style={{...sphere,background:`radial-gradient(circle at 70% 78%,${hexA(C.tealBright,0.55)} 0%,transparent 30%)`,mixBlendMode:"screen"}}/>
      <Spec o={0.65}/>
    </div>
  );
}
