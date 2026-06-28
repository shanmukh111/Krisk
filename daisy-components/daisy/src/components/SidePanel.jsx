import { useState, useRef } from "react";
import { C, hexA } from "../constants.js";

export default function SidePanel({ side, messages, onReset }) {
  const [open,     setOpen]     = useState(true);
  const [width,    setWidth]    = useState(260);
  const [dragHint, setDragHint] = useState(false);

  const draggingResize = useRef(false);
  const startX         = useRef(0);
  const startW         = useRef(0);
  const isLeft         = side === "left";
  const userMsgs       = messages.filter(m => m.who === "me");

  const onResizeDown = (e) => {
    e.preventDefault(); e.stopPropagation();
    draggingResize.current = true;
    startX.current = e.clientX; startW.current = width;
    const onMove = (ev) => {
      const dx = isLeft ? ev.clientX - startX.current : startX.current - ev.clientX;
      setWidth(Math.max(200, Math.min(420, startW.current + dx)));
    };
    const onUp = () => {
      draggingResize.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  };

  const onTabDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    startX.current = e.clientX;
    const onMove = (ev) => {
      const dx = isLeft ? ev.clientX - startX.current : startX.current - ev.clientX;
      setDragHint(dx > 60);
    };
    const onUp = (ev) => {
      const dx = isLeft ? ev.clientX - startX.current : startX.current - ev.clientX;
      if (dx > 80) onReset();
      setDragHint(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  };

  return (
    <div style={{
      position: "fixed", top: 64, bottom: 120,
      [isLeft ? "left" : "right"]: 0,
      width: open ? width : 32, zIndex: 20,
      transition: draggingResize.current ? "none" : "width .3s cubic-bezier(.22,1,.36,1)",
      display: "flex",
      flexDirection: isLeft ? "row" : "row-reverse",
      userSelect: "none",
    }}>

      {dragHint && (
        <div style={{
          position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:99,
          padding:"10px 20px",borderRadius:12,
          background:hexA(C.teal,0.25),border:`1px solid ${hexA(C.teal,0.5)}`,
          color:C.tealBright,fontSize:13,backdropFilter:"blur(10px)",pointerEvents:"none",
        }}>release to move back to bottom</div>
      )}

      {/* tab */}
      <div onMouseDown={onTabDown} onClick={() => setOpen(o=>!o)}
        style={{
          width:32,flexShrink:0,cursor:"grab",
          display:"flex",alignItems:"center",justifyContent:"center",
          background:hexA(C.teal,0.08),
          borderRadius:isLeft?"0 10px 10px 0":"10px 0 0 10px",
          border:`1px solid ${hexA(C.teal,0.2)}`,
          writingMode:"vertical-rl",backdropFilter:"blur(8px)",transition:"background .2s",
        }}
        onMouseEnter={e=>e.currentTarget.style.background=hexA(C.teal,0.16)}
        onMouseLeave={e=>e.currentTarget.style.background=hexA(C.teal,0.08)}
      >
        <span style={{fontSize:10.5,color:C.inkDim,letterSpacing:1.5,transform:isLeft?"rotate(180deg)":"none"}}>chats</span>
      </div>

      {/* panel */}
      <div style={{
        flex:1,overflow:"hidden",
        background:hexA("#06181a",0.94),
        border:`1px solid ${hexA(C.teal,0.18)}`,
        backdropFilter:"blur(16px)",
        borderRadius:isLeft?"0 14px 14px 0":"14px 0 0 14px",
        padding:open?"14px 0":0,
        display:"flex",flexDirection:"column",
        opacity:open?1:0,transition:"opacity .25s",
        pointerEvents:open?"auto":"none",
      }}>

        {/* header */}
        <div style={{
          display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"0 14px 12px",
          borderBottom:`1px solid ${hexA(C.teal,0.12)}`,
          flexShrink:0,
        }}>
          <span style={{fontSize:11,color:C.inkDim,letterSpacing:1}}>
            {userMsgs.length} message{userMsgs.length!==1?"s":""}
          </span>
          <span onClick={onReset}
            style={{fontSize:10,color:hexA(C.tealBright,0.45),cursor:"pointer",letterSpacing:0.3}}>
            ↓ to bottom
          </span>
        </div>

        {/* chat items */}
        <div style={{flex:1,overflowY:"auto",padding:"10px 0"}}>
          {userMsgs.length === 0 ? (
            <div style={{fontSize:12,color:hexA(C.inkDim,0.4),padding:"12px 14px",textAlign:"center"}}>
              nothing yet
            </div>
          ) : (
            userMsgs.slice().reverse().map((m, i) => (
              <div key={i}>
                {/* each message as a clearly separate card */}
                <div
                  className="chat-item"
                  style={{
                    margin: "0 10px 2px",
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: hexA(C.teal, 0.06),
                    border: `1px solid ${hexA(C.teal, 0.12)}`,
                    borderLeft: `3px solid ${hexA(C.tealBright, 0.5)}`,
                    cursor: "default",
                  }}
                >
                  {/* top row: number + label */}
                  <div style={{
                    display:"flex",justifyContent:"space-between",
                    alignItems:"center",marginBottom:6,
                  }}>
                    <div style={{
                      fontSize:10,fontWeight:600,
                      color:hexA(C.tealBright,0.7),
                      background:hexA(C.teal,0.15),
                      padding:"1px 8px",borderRadius:999,
                      letterSpacing:0.5,
                    }}>
                      #{userMsgs.length - i}
                    </div>
                    <div style={{fontSize:10,color:hexA(C.inkDim,0.4)}}>you</div>
                  </div>

                  {/* message text */}
                  <div style={{
                    fontSize:13,color:C.ink,lineHeight:1.45,
                    wordBreak:"break-word",
                  }}>
                    {m.text}
                  </div>
                </div>

                {/* separator between items — NOT after the last one */}
                {i < userMsgs.length - 1 && (
                  <div style={{
                    margin:"8px 14px",
                    height:1,
                    background:`linear-gradient(to right, transparent, ${hexA(C.teal,0.15)}, transparent)`,
                  }}/>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* resize handle */}
      {open && (
        <div onMouseDown={onResizeDown}
          style={{
            position:"absolute",[isLeft?"right":"left"]:0,
            top:0,bottom:0,width:8,cursor:"ew-resize",zIndex:5,
            display:"flex",alignItems:"center",justifyContent:"center",
          }}
          onMouseEnter={e=>{if(e.currentTarget.children[0])e.currentTarget.children[0].style.opacity="1";}}
          onMouseLeave={e=>{if(e.currentTarget.children[0]&&!draggingResize.current)e.currentTarget.children[0].style.opacity="0";}}>
          <div style={{width:3,height:40,borderRadius:4,background:hexA(C.teal,0.5),opacity:0,transition:"opacity .2s"}}/>
        </div>
      )}
    </div>
  );
}
