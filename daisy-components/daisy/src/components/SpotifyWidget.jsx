import { useState, useRef } from "react";
import { hexA } from "../ThemeContext.jsx";

const GREEN = "#1DB954";
const BG    = "#04090b";

function fmt(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function SpotifyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={GREEN}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

function DragHandle({ onMouseDown, children, style }) {
  return <div onMouseDown={onMouseDown} style={{ cursor: "grab", ...style }}>{children}</div>;
}

export default function SpotifyWidget({ spotify }) {
  const { status, track, paused, position, duration, login, logout, togglePlay, nextTrack, prevTrack } = spotify;

  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState({ x: 20, y: Math.max(window.innerHeight - 200, 80) });
  const drag = useRef(null);

  const startDrag = (e) => {
    if (e.button !== 0) return;
    drag.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    const onMove = ev => {
      if (!drag.current) return;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth  - 280, drag.current.px + ev.clientX - drag.current.mx)),
        y: Math.max(0, Math.min(window.innerHeight - 60,  drag.current.py + ev.clientY - drag.current.my)),
      });
    };
    const onUp = () => { drag.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  const shell = (content, extraStyle = {}) => (
    <div style={{
      position: "fixed", left: pos.x, top: pos.y, zIndex: 50,
      backdropFilter: "blur(20px)",
      background: hexA(BG, 0.94),
      border: `1px solid ${hexA(GREEN, 0.22)}`,
      boxShadow: `0 8px 40px ${hexA("#000", 0.55)}, 0 0 0 1px ${hexA(GREEN, 0.06)}`,
      borderRadius: 18, overflow: "hidden",
      userSelect: "none",
      animation: "daisyRise .3s cubic-bezier(.22,1,.36,1) both",
      ...extraStyle,
    }}>
      {content}
    </div>
  );

  // ── idle: login pill ──────────────────────────────────────────────────────
  if (status === "idle" || status === "error") {
    return shell(
      <DragHandle onMouseDown={startDrag} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px" }}>
        <SpotifyIcon />
        <span style={{ fontSize: 12, color: hexA("#fff", 0.45) }}>Spotify</span>
        <button onClick={login} style={{
          padding: "4px 12px", borderRadius: 999, border: "none",
          background: GREEN, color: "#000", fontSize: 11, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}>Connect</button>
      </DragHandle>,
      { borderRadius: 999 }
    );
  }

  // ── minimized pill ────────────────────────────────────────────────────────
  if (minimized) {
    return shell(
      <DragHandle onMouseDown={startDrag} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px" }}>
        {track?.album_art
          ? <img src={track.album_art} style={{ width: 22, height: 22, borderRadius: 4, objectFit: "cover" }} />
          : <SpotifyIcon />
        }
        <span style={{ fontSize: 12, color: hexA("#fff", 0.7), maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {track?.name || "Spotify"}
        </span>
        {track && (
          <button onClick={e => { e.stopPropagation(); togglePlay(); }} style={iconBtn()}>
            {paused ? "▶" : "⏸"}
          </button>
        )}
        <button onClick={e => { e.stopPropagation(); setMinimized(false); }} style={iconBtn()}>⬆</button>
      </DragHandle>,
      { borderRadius: 999 }
    );
  }

  // ── full widget ───────────────────────────────────────────────────────────
  return shell(
    <div style={{ width: 268 }}>
      {/* header */}
      <DragHandle onMouseDown={startDrag} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 12px 9px",
        borderBottom: `1px solid ${hexA(GREEN, 0.1)}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SpotifyIcon />
          <span style={{ fontSize: 10.5, color: hexA(GREEN, 0.75), fontWeight: 700, letterSpacing: 0.8 }}>SPOTIFY</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setMinimized(true)} style={iconBtn()} title="minimize">—</button>
          <button onClick={logout}                   style={iconBtn()} title="disconnect">✕</button>
        </div>
      </DragHandle>

      {/* body */}
      {!track ? (
        <div style={{ padding: "22px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 6, opacity: 0.25 }}>♪</div>
          <div style={{ fontSize: 12.5, color: hexA("#fff", 0.35) }}>Ready</div>
          <div style={{ fontSize: 11, color: hexA("#fff", 0.2), marginTop: 4 }}>Say "play [song name]"</div>
        </div>
      ) : (
        <div style={{ padding: "12px 14px 14px" }}>
          {/* album art + info */}
          <div style={{ display: "flex", gap: 11, alignItems: "center", marginBottom: 12 }}>
            {track.album_art ? (
              <img src={track.album_art} style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", boxShadow: `0 4px 16px ${hexA("#000", 0.5)}`, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: 10, background: hexA(GREEN, 0.12), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 20, opacity: 0.4 }}>♪</span>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: hexA("#fff", 0.9), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
                {track.name}
              </div>
              <div style={{ fontSize: 11.5, color: hexA("#fff", 0.4), marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {track.artist}
              </div>
              {track.album && (
                <div style={{ fontSize: 10.5, color: hexA("#fff", 0.22), marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.album}
                </div>
              )}
            </div>
          </div>

          {/* progress bar */}
          <div style={{ marginBottom: 12 }}>
            <div
              style={{ height: 3, background: hexA(GREEN, 0.14), borderRadius: 2, position: "relative", cursor: "pointer" }}
            >
              <div style={{
                height: "100%", width: `${progress}%`, background: GREEN,
                borderRadius: 2, transition: "width .9s linear", position: "relative",
              }}>
                <div style={{ position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)", width: 9, height: 9, borderRadius: "50%", background: GREEN }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
              <span style={{ fontSize: 9.5, color: hexA("#fff", 0.3) }}>{fmt(position)}</span>
              <span style={{ fontSize: 9.5, color: hexA("#fff", 0.3) }}>{fmt(duration)}</span>
            </div>
          </div>

          {/* controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
            <button onClick={prevTrack} style={navBtn()} title="previous">⏮</button>
            <button onClick={togglePlay} style={{
              width: 38, height: 38, borderRadius: "50%", border: "none",
              background: GREEN, color: "#000", fontSize: 15, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "transform .15s",
              paddingLeft: paused ? 2 : 0,
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              {paused ? "▶" : "⏸"}
            </button>
            <button onClick={nextTrack} style={navBtn()} title="next">⏭</button>
          </div>
        </div>
      )}
    </div>
  );
}

function iconBtn() {
  return {
    background: "none", border: "none", color: hexA("#fff", 0.3),
    fontSize: 12, cursor: "pointer", padding: "2px 5px",
    fontFamily: "inherit", lineHeight: 1, transition: "color .15s",
  };
}

function navBtn() {
  return {
    background: "none", border: "none",
    color: hexA("#fff", 0.4), fontSize: 17,
    cursor: "pointer", padding: 4, lineHeight: 1,
    transition: "color .15s",
  };
}
