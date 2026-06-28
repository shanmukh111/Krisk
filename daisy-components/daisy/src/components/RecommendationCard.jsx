import { useTheme, hexA } from "../ThemeContext.jsx";

function PlatformBadge({ platform }) {
  const meta = {
    youtube: { label: "YouTube", color: "#ff4444" },
    zomato:  { label: "Zomato",  color: "#e23744" },
    amazon:  { label: "Amazon",  color: "#ff9900" },
  };
  const m = meta[platform] || { label: platform, color: "#34a0a4" };
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 0.8,
      padding: "2px 7px", borderRadius: 999,
      background: `${m.color}22`, color: m.color,
      border: `1px solid ${m.color}44`, flexShrink: 0,
    }}>{m.label.toUpperCase()}</span>
  );
}

function ScoreBadge({ score, C }) {
  if (score == null) return null;
  const s = typeof score === "number" ? score.toFixed(1) : score;
  return (
    <span style={{
      fontSize: 10, padding: "2px 8px", borderRadius: 999,
      background: hexA(C.tealBright, 0.12),
      border: `1px solid ${hexA(C.tealBright, 0.3)}`,
      color: C.tealBright, fontWeight: 600, flexShrink: 0,
    }}>{s}/10</span>
  );
}

function YouTubeCard({ rec, C }) {
  return (
    <a href={rec.url} target="_blank" rel="noopener noreferrer" style={{
      display: "flex", flexDirection: "column",
      width: 200, flexShrink: 0, textDecoration: "none",
      borderRadius: 14, overflow: "hidden",
      background: hexA("#0a1e20", 0.95),
      border: `1px solid ${hexA(C.teal, 0.22)}`,
      backdropFilter: "blur(8px)",
      transition: "border-color .2s, transform .2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = hexA("#ff4444", 0.5); e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = hexA(C.teal, 0.22); e.currentTarget.style.transform = "none"; }}
    >
      {/* thumbnail */}
      <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", background: hexA(C.teal, 0.06), flexShrink: 0 }}>
        {rec.thumbnail ? (
          <img src={rec.thumbnail} alt={rec.title}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 28, opacity: 0.25, color: "#ff4444" }}>▶</span>
          </div>
        )}
        {/* play hover overlay */}
        <div className="yt-overlay" style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.3)", opacity: 0, transition: "opacity .2s",
        }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,50,50,0.88)",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 13, paddingLeft: 2 }}>▶</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "8px 10px 10px", display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
          <PlatformBadge platform="youtube" />
          {(rec.final_score != null) && <ScoreBadge score={rec.final_score} C={C} />}
        </div>
        <div style={{
          fontSize: 12.5, color: C.ink, fontWeight: 500, lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{rec.title}</div>
        {(rec.channel || rec.channel_title) && (
          <div style={{ fontSize: 11, color: C.inkDim }}>{rec.channel || rec.channel_title}</div>
        )}
      </div>
    </a>
  );
}

function ZomatoCard({ rec, C }) {
  return (
    <a href={rec.url || "#"} target="_blank" rel="noopener noreferrer" style={{
      display: "flex", flexDirection: "column", gap: 10,
      width: 176, flexShrink: 0, textDecoration: "none",
      borderRadius: 14, padding: "12px 14px",
      background: hexA("#0a1e20", 0.95),
      border: `1px solid ${hexA(C.teal, 0.22)}`,
      backdropFilter: "blur(8px)",
      transition: "border-color .2s, transform .2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = hexA("#e23744", 0.5); e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = hexA(C.teal, 0.22); e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <PlatformBadge platform="zomato" />
        {rec.rating && (
          <span style={{ fontSize: 11, color: "#f5a623", fontWeight: 600 }}>★ {rec.rating}</span>
        )}
      </div>

      <div>
        <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 600, lineHeight: 1.3 }}>{rec.name}</div>
        {rec.restaurant && (
          <div style={{ fontSize: 11.5, color: C.inkDim, marginTop: 3 }}>{rec.restaurant}</div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
        {rec.price && (
          <span style={{ fontSize: 13.5, color: C.tealBright, fontWeight: 700 }}>{rec.price}</span>
        )}
        {rec.delivery_time && (
          <span style={{ fontSize: 10.5, color: C.inkDim }}>⏱ {rec.delivery_time}</span>
        )}
      </div>
    </a>
  );
}

function AmazonCard({ rec, C }) {
  const name = rec.name || rec.title || "Product";
  return (
    <a href={rec.url || "#"} target="_blank" rel="noopener noreferrer" style={{
      display: "flex", flexDirection: "column",
      width: 176, flexShrink: 0, textDecoration: "none",
      borderRadius: 14, overflow: "hidden",
      background: hexA("#0a1e20", 0.95),
      border: `1px solid ${hexA(C.teal, 0.22)}`,
      backdropFilter: "blur(8px)",
      transition: "border-color .2s, transform .2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = hexA("#ff9900", 0.5); e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = hexA(C.teal, 0.22); e.currentTarget.style.transform = "none"; }}
    >
      {rec.thumbnail && (
        <div style={{ width: "100%", paddingBottom: "70%", position: "relative", background: "#f8f8f8" }}>
          <img src={rec.thumbnail} alt={name}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", padding: 6 }}
          />
        </div>
      )}

      <div style={{ padding: rec.thumbnail ? "8px 10px 10px" : "12px 14px", display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
        <PlatformBadge platform="amazon" />
        <div style={{
          fontSize: 12, color: C.ink, lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{name}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: "auto", flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, color: C.tealBright, fontWeight: 700 }}>{rec.price}</span>
          {rec.discount && rec.discount !== rec.price && (
            <span style={{ fontSize: 10.5, color: C.inkDim, textDecoration: "line-through" }}>{rec.discount}</span>
          )}
        </div>
        {rec.rating && rec.rating !== "N/A" && (
          <span style={{ fontSize: 11, color: "#f5a623" }}>★ {rec.rating}</span>
        )}
      </div>
    </a>
  );
}

export default function RecommendationCard({ rec }) {
  const { C } = useTheme();
  const platform = rec.platform || "youtube";
  if (platform === "youtube") return <YouTubeCard rec={rec} C={C} />;
  if (platform === "zomato")  return <ZomatoCard  rec={rec} C={C} />;
  if (platform === "amazon")  return <AmazonCard  rec={rec} C={C} />;
  return null;
}
