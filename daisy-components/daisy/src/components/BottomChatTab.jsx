import { useState, useRef } from "react";
import { C, hexA } from "../constants.js";

export default function BottomChatTab({ messages, onDragToSide }) {
  const [open,     setOpen]     = useState(false);
  const [dragHint, setDragHint] = useState(null);
  const isDragging = useRef(false);
  const startX     = useRef(0);
  const userMsgs   = messages.filter(m => m.who === "me");

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    startX.current = e.clientX;
    const onMove = (ev) => {
      const dx = ev.clientX - startX.current;
      setDragHint(Math.abs(dx) > 40 ? (dx < 0 ? "left" : "right") : null);
    };
    const onUp = (ev) => {
      const dx = ev.clientX - startX.current;
      if (Math.abs(dx) > 80) onDragToSide(dx < 0 ? "left" : "right");
      isDragging.current = false;
      setDragHint(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  };

  return (
    <div style={{width:"100%",display:"flex",flexDirection:"column",alignItems:"center",marginBottom:8}}>

      {dragHint && (
        <div style={{
          position:"fixed",top:"50%",[dragHint==="left"?"left":"right"]:24,
          transform:"translateY(-50%)",zIndex:99,
          padding:"10px 18px",borderRadius:12,
          background:hexA(C.teal,0.22),border:`1px solid ${hexA(C.teal,0.45)}`,
          color:C.tealBright,fontSize:13,backdropFilter:"blur(10px)",pointerEvents:"none",
        }}>
          {dragHint==="left"?"← snap to left":"snap to right →"}
        </div>
      )}

      <div
        onMouseDown={onMouseDown}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => { if (!isDragging.current) setOpen(false); }}
        style={{width:"min(580px,92vw)",cursor:"grab",userSelect:"none"}}
      >
        {/* label */}
        <div style={{
          display:"flex",alignItems:"center",gap:8,padding:"5px 0 4px",
          color:open?C.tealBright:C.inkDim,fontSize:11.5,letterSpacing:1.5,
          transition:"color .2s",textShadow:open?`0 0 12px ${C.tealBright}`:"none",
        }}>
          <div style={{flex:1,height:1,background:open?`linear-gradient(to right,transparent,${hexA(C.tealBright,0.3)})`:`linear-gradient(to right,transparent,${hexA(C.teal,0.12)})`,transition:"background .2s"}}/>
          <span>chats</span>
          <span style={{fontSize:9.5,color:hexA(C.inkDim,0.35)}}>drag to move</span>
          <div style={{flex:1,height:1,background:open?`linear-gradient(to left,transparent,${hexA(C.tealBright,0.3)})`:`linear-gradient(to left,transparent,${hexA(C.teal,0.12)})`,transition:"background .2s"}}/>
        </div>

        {/* expandable */}
        <div style={{
          overflow:"hidden",
          transition:"max-height .35s cubic-bezier(.22,1,.36,1),opacity .25s",
          maxHeight:open?280:0,opacity:open?1:0,
        }}>
          <div style={{
            borderRadius:14,overflow:"hidden",marginBottom:6,
            background:hexA("#06181a",0.88),
            border:`1px solid ${hexA(C.teal,0.2)}`,
            backdropFilter:"blur(14px)",
          }}>
            {userMsgs.length === 0 ? (
              <div style={{fontSize:13,color:C.inkDim,padding:"14px",textAlign:"center"}}>
                no chats yet — say something
              </div>
            ) : (
              userMsgs.slice(-6).reverse().map((m, i, arr) => (
                <div key={i}>
                  <div
                    className="chat-item"
                    style={{
                      display:"flex",alignItems:"center",gap:10,
                      padding:"11px 14px",
                      cursor:"default",
                    }}
                  >
                    {/* number badge */}
                    <div style={{
                      width:24,height:24,borderRadius:"50%",flexShrink:0,
                      background:hexA(C.teal,0.15),
                      border:`1px solid ${hexA(C.tealBright,0.25)}`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:10,fontWeight:600,color:hexA(C.tealBright,0.7),
                    }}>
                      {userMsgs.length - i}
                    </div>

                    {/* text */}
                    <div style={{
                      flex:1,fontSize:13,color:C.ink,
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
                      lineHeight:1.4,
                    }}>
                      {m.text}
                    </div>

                    {/* tag */}
                    <div style={{
                      fontSize:10,color:hexA(C.inkDim,0.4),
                      flexShrink:0,
                    }}>
                      you
                    </div>
                  </div>

                  {/* separator between items */}
                  {i < arr.length - 1 && (
                    <div style={{
                      margin:"0 14px",height:1,
                      background:`linear-gradient(to right,transparent,${hexA(C.teal,0.18)},transparent)`,
                    }}/>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
