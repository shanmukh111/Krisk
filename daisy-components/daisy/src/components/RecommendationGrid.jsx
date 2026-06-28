import { useTheme, hexA } from "../ThemeContext.jsx";
import RecommendationCard from "./RecommendationCard.jsx";

const PLATFORM_ICONS = { youtube: "▶", zomato: "🍽", amazon: "🛒" };

export default function RecommendationGrid({ recommendations }) {
  const { C } = useTheme();
  if (!recommendations?.length) return null;

  const platforms = [...new Set(recommendations.map(r => r.platform || "youtube"))];

  return (
    <div style={{ marginTop: 10, animation: "daisyRise .5s cubic-bezier(.22,1,.36,1) both" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ height: 1, flex: 1, background: hexA(C.teal, 0.18) }} />
        <span style={{ fontSize: 10, color: hexA(C.inkDim, 0.55), letterSpacing: 0.8 }}>
          {recommendations.length} result{recommendations.length !== 1 ? "s" : ""} ·{" "}
          {platforms.map(p => PLATFORM_ICONS[p] || p).join("  ")}
        </span>
        <div style={{ height: 1, flex: 1, background: hexA(C.teal, 0.18) }} />
      </div>

      {/* horizontal scroll row */}
      <div style={{
        display: "flex", gap: 10,
        overflowX: "auto", overflowY: "visible",
        paddingBottom: 10, paddingRight: 4,
        scrollbarWidth: "thin",
        scrollbarColor: `${hexA(C.teal, 0.25)} transparent`,
      }}>
        {recommendations.map((rec, i) => (
          <RecommendationCard key={`${rec.platform}-${i}`} rec={rec} />
        ))}
      </div>
    </div>
  );
}
