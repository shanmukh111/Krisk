import { useState, useRef, useEffect } from "react";
import { C, hexA } from "../constants.js";

// ─── ChatSidebar ──────────────────────────────────────────────────────────────
// Full session manager — always visible on left side.
// Shows all conversations, active highlighted.
// New chat button at top. Click name to rename inline.
//
// Props:
//   sessions   — array of session objects
//   activeId   — currently active session id
//   onNew      — create new chat
//   onSwitch   — switch to session(id)
//   onRename   — rename session(id, newName)
//   onDelete   — delete session(id)
//
export default function ChatSidebar({ sessions, activeId, onNew, onSwitch, onRename, onDelete }) {
  const [editingId,   setEditingId]   = useState(null);  // session being renamed
  const [editValue,   setEditValue]   = useState("");
  const [hoveredId,   setHoveredId]   = useState(null);
  const [collapsed,   setCollapsed]   = useState(false);
  const inputRef = useRef(null);

  // focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) inputRef.current.focus();
  }, [editingId]);

  const startEdit = (e, session) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditValue(session.name);
  };

  const commitEdit = () => {
    if (editingId) onRename(editingId, editValue);
    setEditingId(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  // format date label
  const dateLabel = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day:"numeric", month:"short" });
  };

  const sidebarW = collapsed ? 42 : 240;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, bottom: 0,
      width: sidebarW, zIndex: 10,
      background: hexA("#040c0e", 0.97),
      borderRight: `1px solid ${hexA(C.teal, 0.12)}`,
      backdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column",
      transition: "width .3s cubic-bezier(.22,1,.36,1)",
      overflow: "hidden",
      userSelect: "none",
    }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: "16px 12px 12px",
        borderBottom: `1px solid ${hexA(C.teal, 0.08)}`,
        display: "flex", alignItems: "center", gap: 8,
        flexShrink: 0,
      }}>
        {/* collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? "expand sidebar" : "collapse sidebar"}
          style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            border: `1px solid ${hexA(C.teal, 0.18)}`,
            background: "transparent", color: C.inkDim, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, transition: "all .2s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = hexA(C.teal, 0.12)}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          {collapsed ? "»" : "«"}
        </button>

        {/* New Chat button */}
        {!collapsed && (
          <button
            onClick={onNew}
            style={{
              flex: 1, height: 32, borderRadius: 8, cursor: "pointer",
              background: hexA(C.teal, 0.1),
              border: `1px solid ${hexA(C.teal, 0.25)}`,
              color: C.tealBright, fontSize: 12, fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all .2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = hexA(C.teal, 0.2); e.currentTarget.style.borderColor = hexA(C.tealBright, 0.4); }}
            onMouseLeave={e => { e.currentTarget.style.background = hexA(C.teal, 0.1); e.currentTarget.style.borderColor = hexA(C.teal, 0.25); }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            <span>New Chat</span>
          </button>
        )}

        {/* collapsed: just the + */}
        {collapsed && (
          <button onClick={onNew} title="New chat" style={{
            width: 28, height: 28, borderRadius: 8, cursor: "pointer",
            background: hexA(C.teal, 0.1), border: `1px solid ${hexA(C.teal, 0.25)}`,
            color: C.tealBright, fontSize: 16, display: "flex",
            alignItems: "center", justifyContent: "center", transition: "all .2s",
          }}>+</button>
        )}
      </div>

      {/* ── Session list ────────────────────────────────────────────────── */}
      {!collapsed && (
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
          {sessions.length === 0 && (
            <div style={{ fontSize: 12, color: hexA(C.inkDim, 0.4), padding: "12px 8px", textAlign: "center" }}>
              no chats yet
            </div>
          )}

          {sessions.map((s, i) => {
            const isActive  = s.id === activeId;
            const isEditing = s.id === editingId;
            const isHovered = s.id === hoveredId;
            const preview   = s.messages.find(m => m.who === "daisy")?.text || "No messages yet";

            return (
              <div key={s.id}>
                {/* date separator */}
                {i === 0 || dateLabel(s.createdAt) !== dateLabel(sessions[i-1].createdAt) ? (
                  <div style={{
                    fontSize: 10, color: hexA(C.inkDim, 0.35),
                    padding: "10px 8px 4px", letterSpacing: 0.8, textTransform: "uppercase",
                  }}>
                    {dateLabel(s.createdAt)}
                  </div>
                ) : null}

                {/* session card */}
                <div
                  onClick={() => !isEditing && onSwitch(s.id)}
                  onMouseEnter={() => setHoveredId(s.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    padding: "9px 10px",
                    borderRadius: 10,
                    marginBottom: 2,
                    cursor: "pointer",
                    background: isActive
                      ? hexA(C.teal, 0.14)
                      : isHovered ? hexA(C.teal, 0.07) : "transparent",
                    border: isActive
                      ? `1px solid ${hexA(C.teal, 0.3)}`
                      : "1px solid transparent",
                    transition: "all .15s",
                    position: "relative",
                  }}
                >
                  {/* active indicator dot */}
                  {isActive && (
                    <div style={{
                      position: "absolute", left: -1, top: "50%", transform: "translateY(-50%)",
                      width: 3, height: "60%", borderRadius: "0 2px 2px 0",
                      background: C.tealBright,
                    }}/>
                  )}

                  {/* name row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter")  { e.stopPropagation(); commitEdit(); }
                          if (e.key === "Escape") { e.stopPropagation(); cancelEdit(); }
                        }}
                        onBlur={commitEdit}
                        onClick={e => e.stopPropagation()}
                        style={{
                          flex: 1, background: hexA(C.teal, 0.12),
                          border: `1px solid ${hexA(C.tealBright, 0.4)}`,
                          borderRadius: 5, padding: "2px 6px",
                          color: C.ink, fontSize: 12.5, fontFamily: "inherit",
                          outline: "none",
                        }}
                      />
                    ) : (
                      <span style={{
                        flex: 1, fontSize: 12.5, fontWeight: isActive ? 500 : 400,
                        color: isActive ? C.ink : hexA(C.ink, 0.75),
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {s.name}
                      </span>
                    )}

                    {/* action icons — show on hover */}
                    {isHovered && !isEditing && (
                      <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                        {/* rename */}
                        <button
                          onClick={e => startEdit(e, s)}
                          title="rename"
                          style={{
                            width: 20, height: 20, borderRadius: 4, border: "none",
                            background: hexA(C.teal, 0.15), color: C.inkDim,
                            cursor: "pointer", fontSize: 10,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >✎</button>
                        {/* delete */}
                        <button
                          onClick={e => { e.stopPropagation(); onDelete(s.id); }}
                          title="delete"
                          style={{
                            width: 20, height: 20, borderRadius: 4, border: "none",
                            background: hexA("#ff4444", 0.12), color: "#ff7777",
                            cursor: "pointer", fontSize: 11,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >×</button>
                      </div>
                    )}
                  </div>

                  {/* preview */}
                  {!isEditing && (
                    <div style={{
                      fontSize: 11, color: hexA(C.inkDim, 0.55),
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      paddingLeft: 2,
                    }}>
                      {preview.length > 48 ? preview.slice(0,48)+"…" : preview}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* collapsed: just dots for each session */}
      {collapsed && (
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 7px", display: "flex", flexDirection: "column", gap: 4 }}>
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => onSwitch(s.id)}
              title={s.name}
              style={{
                width: 28, height: 28, borderRadius: 8, border: "none",
                background: s.id === activeId ? hexA(C.teal, 0.2) : "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .15s",
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: s.id === activeId ? C.tealBright : hexA(C.inkDim, 0.4),
              }}/>
            </button>
          ))}
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      {!collapsed && (
        <div style={{
          padding: "10px 12px",
          borderTop: `1px solid ${hexA(C.teal, 0.08)}`,
          fontSize: 10, color: hexA(C.inkDim, 0.35),
          display: "flex", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span>{sessions.length} conversation{sessions.length !== 1 ? "s" : ""}</span>
          <span>click name to rename</span>
        </div>
      )}
    </div>
  );
}
