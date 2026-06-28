import { useTheme, hexA } from "../ThemeContext.jsx";

export default function ActionCard({ a }) {
  const { C } = useTheme();
  if (!a) return null;
  return (
    <div style={{marginTop:10,display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:16,background:hexA(C.teal,0.08),border:`1px solid ${hexA(C.teal,0.28)}`,backdropFilter:"blur(8px)",animation:"daisyRise .5s cubic-bezier(.22,1,.36,1) both"}}>
      <div style={{width:38,height:38,borderRadius:12,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:C.tealBright,background:hexA(C.teal,0.16),border:`1px solid ${hexA(C.teal,0.3)}`}}>{a.icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:C.ink,fontSize:14,fontWeight:500}}>{a.title}</div>
        <div style={{color:C.inkDim,fontSize:12.5}}>{a.line}</div>
      </div>
      <div style={{fontSize:11,color:C.tealBright,padding:"4px 10px",borderRadius:999,background:hexA(C.tealBright,0.12),border:`1px solid ${hexA(C.tealBright,0.25)}`}}>working</div>
    </div>
  );
}
