import { useState, useRef, useEffect } from "react";
import { useTheme, hexA } from "../ThemeContext.jsx";

// ─── ChatPanel ────────────────────────────────────────────────────────────────
// The draggable chat session panel.
//
// position: "bottom" (default) | "left" | "right"
//
// Bottom mode:
//   • Hover to expand upward showing session list
//   • Left-click drag left/right → snaps to side
//   • "+ New" button inside panel
//
// Side mode (left or right):
//   • Full vertical panel with session list
//   • Resizable by dragging edge
//   • Left-click drag tab toward center → back to bottom
//   • "+ New" button at top
//
// Props:
//   sessions   — array of session objects
//   activeId   — current session id
//   onNew      — create new chat
//   onSwitch   — switch to session(id)
//   onRename   — rename(id, name)
//   onDelete   — delete(id)
//
export default function ChatPanel({ sessions, activeId, onNew, onSwitch, onRename, onDelete }) {
  const { C } = useTheme();
  const [position,  setPosition]  = useState("bottom"); // "bottom"|"left"|"right"
  const [open,      setOpen]      = useState(false);     // bottom panel expanded
  const [panelOpen, setPanelOpen] = useState(true);      // side panel expanded
  const [width,     setWidth]     = useState(260);       // side panel width
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [dragHint,  setDragHint]  = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const isDragging    = useRef(false);
  const startX        = useRef(0);
  const resizingPanel = useRef(false);
  const startW        = useRef(0);
  const editRef       = useRef(null);

  useEffect(() => { if (editingId && editRef.current) editRef.current.focus(); }, [editingId]);

  const startEdit = (e, s) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditValue(s.name);
  };
  const commitEdit = () => { if (editingId) onRename(editingId, editValue); setEditingId(null); };
  const cancelEdit = () => setEditingId(null);

  // ── Bottom mode: drag to side ──────────────────────────────────────────────
  const onBottomDrag = (e) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    startX.current = e.clientX;
    const onMove = (ev) => {
      const dx = ev.clientX - startX.current;
      setDragHint(Math.abs(dx) > 40 ? (dx < 0 ? "left" : "right") : null);
    };
    const onUp = (ev) => {
      const dx = ev.clientX - startX.current;
      if (Math.abs(dx) > 80) { setPosition(dx < 0 ? "left" : "right"); setOpen(false); }
      isDragging.current = false;
      setDragHint(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  };

  // ── Side mode: drag tab to center → back to bottom ────────────────────────
  const onSideDrag = (e, isLeft) => {
    if (e.button !== 0) return;
    e.preventDefault();
    startX.current = e.clientX;
    const onMove = (ev) => {
      const dx = isLeft ? ev.clientX - startX.current : startX.current - ev.clientX;
      setDragHint(dx > 60 ? "bottom" : null);
    };
    const onUp = (ev) => {
      const dx = isLeft ? ev.clientX - startX.current : startX.current - ev.clientX;
      if (dx > 80) setPosition("bottom");
      setDragHint(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  };

  // ── Side mode: resize ──────────────────────────────────────────────────────
  const onResizeStart = (e, isLeft) => {
    e.preventDefault(); e.stopPropagation();
    resizingPanel.current = true;
    startX.current = e.clientX;
    startW.current = width;
    const onMove = (ev) => {
      const dx = isLeft ? ev.clientX - startX.current : startX.current - ev.clientX;
      setWidth(Math.max(200, Math.min(400, startW.current + dx)));
    };
    const onUp = () => {
      resizingPanel.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  };

  // ── Session list (shared between bottom and side) ─────────────────────────
  const SessionList = ({ compact = false }) => (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: compact ? 4 : 3 }}>
      {sessions.length === 0 && (
        <div style={{ fontSize: 12, color: hexA(C.inkDim, 0.4), padding: "10px", textAlign: "center" }}>
          no chats yet
        </div>
      )}
      {sessions.map((s, i) => {
        const isActive  = s.id === activeId;
        const isEditing = s.id === editingId;
        const isHovered = s.id === hoveredId;
        return (
          <div
            key={s.id}
            onClick={() => !isEditing && onSwitch(s.id)}
            onMouseEnter={() => setHoveredId(s.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              padding: compact ? "8px 10px" : "9px 12px",
              borderRadius: 9,
              cursor: "pointer",
              background: isActive ? hexA(C.teal, 0.16) : isHovered ? hexA(C.teal, 0.07) : "transparent",
              border: isActive ? `1px solid ${hexA(C.teal, 0.3)}` : "1px solid transparent",
              borderLeft: isActive ? `3px solid ${C.tealBright}` : "3px solid transparent",
              transition: "all .15s",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {isEditing ? (
                <input
                  ref={editRef}
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => { if (e.key==="Enter") { e.stopPropagation(); commitEdit(); } if (e.key==="Escape") cancelEdit(); }}
                  onBlur={commitEdit}
                  onClick={e => e.stopPropagation()}
                  style={{
                    flex: 1, background: hexA(C.teal, 0.1),
                    border: `1px solid ${hexA(C.tealBright, 0.4)}`,
                    borderRadius: 5, padding: "2px 6px",
                    color: C.ink, fontSize: 12, fontFamily: "inherit", outline: "none",
                  }}
                />
              ) : (
                <span style={{
                  flex: 1, fontSize: 12.5,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? C.ink : hexA(C.ink, 0.7),
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {s.name}
                </span>
              )}

              {/* action buttons on hover */}
              {isHovered && !isEditing && (
                <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                  <button onClick={e => startEdit(e, s)} style={actionBtn("#7fa8a6")}>✎</button>
                  <button onClick={e => { e.stopPropagation(); onDelete(s.id); }} style={actionBtn("#ff7777")}>×</button>
                </div>
              )}
            </div>

            {/* message preview — only in non-compact */}
            {!compact && !isEditing && (
              <div style={{ fontSize: 11, color: hexA(C.inkDim, 0.45), marginTop: 3, paddingLeft: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.messages.find(m => m.who==="daisy")?.text?.slice(0, 45) || "No messages yet"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // SIDE MODE
  // ════════════════════════════════════════════════════════════════════════════
  if (position === "left" || position === "right") {
    const isLeft = position === "left";

    return (
      <>
        {/* drag-to-bottom hint */}
        {dragHint === "bottom" && (
          <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:99,padding:"10px 20px",borderRadius:12,background:hexA(C.teal,0.25),border:`1px solid ${hexA(C.teal,0.5)}`,color:C.tealBright,fontSize:13,backdropFilter:"blur(10px)",pointerEvents:"none" }}>
            release → back to bottom
          </div>
        )}

        <div style={{
          position: "fixed", top: 64, bottom: 130,
          [isLeft?"left":"right"]: 0,
          width: panelOpen ? width : 32,
          zIndex: 20,
          display: "flex",
          flexDirection: isLeft ? "row" : "row-reverse",
          transition: resizingPanel.current ? "none" : "width .3s cubic-bezier(.22,1,.36,1)",
          userSelect: "none",
        }}>

          {/* tab strip — drag to move back, click to collapse */}
          <div
            onMouseDown={e => onSideDrag(e, isLeft)}
            onClick={() => setPanelOpen(o => !o)}
            title="drag toward center → bottom  ·  click to collapse"
            style={{
              width: 32, flexShrink: 0, cursor: "grab",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: hexA(C.teal, 0.08),
              borderRadius: isLeft ? "0 10px 10px 0" : "10px 0 0 10px",
              border: `1px solid ${hexA(C.teal, 0.2)}`,
              writingMode: "vertical-rl",
              backdropFilter: "blur(8px)", transition: "background .2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = hexA(C.teal, 0.16)}
            onMouseLeave={e => e.currentTarget.style.background = hexA(C.teal, 0.08)}
          >
            <span style={{ fontSize: 10.5, color: C.inkDim, letterSpacing: 1.5, transform: isLeft?"rotate(180deg)":"none" }}>chats</span>
          </div>

          {/* panel body */}
          <div style={{
            flex: 1, overflow: "hidden",
            background: hexA("#040c0e", 0.96),
            border: `1px solid ${hexA(C.teal, 0.15)}`,
            backdropFilter: "blur(18px)",
            borderRadius: isLeft ? "0 14px 14px 0" : "14px 0 0 14px",
            padding: panelOpen ? "12px 0" : 0,
            display: "flex", flexDirection: "column",
            opacity: panelOpen ? 1 : 0,
            transition: "opacity .25s",
            pointerEvents: panelOpen ? "auto" : "none",
          }}>

            {/* header */}
            <div style={{ padding: "0 12px 10px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, borderBottom: `1px solid ${hexA(C.teal, 0.1)}` }}>
              <button onClick={onNew} style={{
                flex: 1, height: 30, borderRadius: 8, cursor: "pointer",
                background: hexA(C.teal, 0.1), border: `1px solid ${hexA(C.teal, 0.25)}`,
                color: C.tealBright, fontSize: 12, fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                transition: "all .2s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = hexA(C.teal, 0.2)}
                onMouseLeave={e => e.currentTarget.style.background = hexA(C.teal, 0.1)}
              >
                <span style={{ fontSize: 15 }}>+</span> New Chat
              </button>
            </div>

            {/* session list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
              <SessionList compact={false} />
            </div>

            {/* footer */}
            <div style={{ padding: "8px 12px 0", borderTop: `1px solid ${hexA(C.teal, 0.08)}`, fontSize: 10, color: hexA(C.inkDim, 0.3), flexShrink: 0 }}>
              {sessions.length} conversation{sessions.length!==1?"s":""} · click ✎ to rename
            </div>
          </div>

          {/* resize handle */}
          {panelOpen && (
            <div onMouseDown={e => onResizeStart(e, isLeft)}
              style={{ position:"absolute",[isLeft?"right":"left"]:0,top:0,bottom:0,width:8,cursor:"ew-resize",zIndex:5,display:"flex",alignItems:"center",justifyContent:"center" }}
              onMouseEnter={e => { if(e.currentTarget.children[0]) e.currentTarget.children[0].style.opacity="1"; }}
              onMouseLeave={e => { if(e.currentTarget.children[0] && !resizingPanel.current) e.currentTarget.children[0].style.opacity="0"; }}
            >
              <div style={{ width:3,height:40,borderRadius:4,background:hexA(C.teal,0.5),opacity:0,transition:"opacity .2s" }}/>
            </div>
          )}
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // BOTTOM MODE (default)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ width:"100%", display:"flex", flexDirection:"column", alignItems:"center", marginBottom:8 }}>

      {/* drag hint */}
      {dragHint && dragHint !== "bottom" && (
        <div style={{ position:"fixed",top:"50%",[dragHint==="left"?"left":"right"]:24,transform:"translateY(-50%)",zIndex:99,padding:"10px 18px",borderRadius:12,background:hexA(C.teal,0.22),border:`1px solid ${hexA(C.teal,0.45)}`,color:C.tealBright,fontSize:13,backdropFilter:"blur(10px)",pointerEvents:"none" }}>
          {dragHint==="left"?"← snap to left":"snap to right →"}
        </div>
      )}

      <div
        onMouseDown={onBottomDrag}
        onMouseEnter={() => { if(!isDragging.current) setOpen(true); }}
        onMouseLeave={() => { if(!isDragging.current) setOpen(false); }}
        style={{ width:"min(580px,92vw)", cursor:"grab", userSelect:"none" }}
      >
        {/* label */}
        <div style={{
          display:"flex", alignItems:"center", gap:8, padding:"5px 0 4px",
          color: open ? C.tealBright : C.inkDim, fontSize:11.5, letterSpacing:1.5,
          transition:"color .2s", textShadow: open ? `0 0 12px ${C.tealBright}` : "none",
        }}>
          <div style={{ flex:1,height:1,background:open?`linear-gradient(to right,transparent,${hexA(C.tealBright,0.3)})`:`linear-gradient(to right,transparent,${hexA(C.teal,0.12)})`,transition:"background .2s" }}/>
          <span>chats</span>
          <span style={{ fontSize:9.5,color:hexA(C.inkDim,0.35) }}>drag to move</span>
          <div style={{ flex:1,height:1,background:open?`linear-gradient(to left,transparent,${hexA(C.tealBright,0.3)})`:`linear-gradient(to left,transparent,${hexA(C.teal,0.12)})`,transition:"background .2s" }}/>
        </div>

        {/* expandable */}
        <div style={{ overflow:"hidden", transition:"max-height .35s cubic-bezier(.22,1,.36,1),opacity .25s", maxHeight:open?300:0, opacity:open?1:0 }}>
          <div style={{
            borderRadius:14, overflow:"hidden", marginBottom:6,
            background:hexA("#06181a",0.92),
            border:`1px solid ${hexA(C.teal,0.2)}`,
            backdropFilter:"blur(14px)",
          }}>
            {/* new chat row */}
            <div style={{ padding:"10px 12px 8px", borderBottom:`1px solid ${hexA(C.teal,0.1)}` }}>
              <button onClick={e => { e.stopPropagation(); onNew(); setOpen(false); }} style={{
                width:"100%", height:30, borderRadius:8, cursor:"pointer",
                background:hexA(C.teal,0.1), border:`1px solid ${hexA(C.teal,0.25)}`,
                color:C.tealBright, fontSize:12, fontFamily:"inherit",
                display:"flex", alignItems:"center", justifyContent:"center", gap:5,
                transition:"all .2s",
              }}
                onMouseEnter={e=>e.currentTarget.style.background=hexA(C.teal,0.2)}
                onMouseLeave={e=>e.currentTarget.style.background=hexA(C.teal,0.1)}
              >
                <span style={{ fontSize:15 }}>+</span> New Chat
              </button>
            </div>

            {/* sessions */}
            <div style={{ padding:"6px 8px", maxHeight:200, overflowY:"auto" }}>
              <SessionList compact={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function actionBtn(color) {
  return {
    width:20, height:20, borderRadius:4, border:"none",
    background:hexA(color,0.12), color,
    cursor:"pointer", fontSize:11,
    display:"flex", alignItems:"center", justifyContent:"center",
    transition:"all .15s",
  };
}
