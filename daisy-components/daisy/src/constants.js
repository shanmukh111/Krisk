// ─── Daisy Design Tokens ───────────────────────────────────────────────────
export const C = {
  base:       "#04090b",
  base2:      "#061417",
  ink:        "#dbeeec",   // soft teal-white — primary text (never pure white)
  inkDim:     "#7fa8a6",   // muted teal-grey — secondary text
  teal:       "#34a0a4",   // primary accent (locked)
  tealBright: "#62e8e0",   // highlights, active states
  tealDeep:   "#0c4044",   // dark teal — backgrounds, shadows
  whisper:    "#5a3f7a",   // purple — used at very low opacity only
};

// Convert hex color to rgba with alpha
export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
