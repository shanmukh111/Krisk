// ─── Intent Detection ──────────────────────────────────────────────────────
export function guessAction(text) {
  const t = text.toLowerCase();
  if (/(eat|food|hungry|order|zomato|pizza|biryani|dinner|lunch|dosa)/.test(t))
    return { kind: "food",   icon: "🍜", title: "Food",     line: "Finding spots near you" };
  if (/(video|youtube|watch|highlights|match|reel)/.test(t))
    return { kind: "video",  icon: "▶",  title: "Watch",    line: "Pulling top picks" };
  if (/(play|listen|song|music|spotify|track|album)/.test(t))
    return { kind: "music",  icon: "♪",  title: "Music",    line: "Playing on Spotify" };
  if (/(message|text|whatsapp|tell|msg|send|ping)/.test(t))
    return { kind: "msg",    icon: "✉",  title: "Message",  line: "Drafting in your tone" };
  if (/(remind|reminder|alarm|wake me|schedule|calendar)/.test(t))
    return { kind: "remind", icon: "◔",  title: "Reminder", line: "Setting it up" };
  if (/(call|dial|phone|ring)/.test(t))
    return { kind: "call",   icon: "☎",  title: "Call",     line: "Opening dialer" };
  return null;
}

// ─── Music Query Extractor ─────────────────────────────────────────────────
// Returns the song/artist query string if text is a music request, else null.
export function detectMusicQuery(text) {
  const t = text.toLowerCase().trim();
  const patterns = [
    /^(?:play|put on|start playing)\s+(.+)/,
    /^(?:i want to (?:hear|listen to)|listen to)\s+(.+)/,
    /^(?:can you play|please play)\s+(.+)/,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) {
      return m[1]
        .replace(/\s+(?:song|track|please|for me|now)$/g, "")
        .trim();
    }
  }
  return null;
}

// ─── Canned Replies (offline fallback) ─────────────────────────────────────
// Used when the Claude API call fails.
export function cannedReply(text) {
  const a = guessAction(text);
  if (a?.kind === "food")   return "on it — pulling a few good places near you. give me a sec.";
  if (a?.kind === "video")  return "say less. lining up the best videos for that.";
  if (a?.kind === "msg")    return "got it, drafting that in your voice. want me to send or show it first?";
  if (a?.kind === "remind") return "done — I'll nudge you when it's time.";
  if (a?.kind === "call")   return "opening the dialer for you now.";
  return "I'm here. tell me what to do and I'll handle it.";
}
