import { createContext, useContext, useState, useCallback } from "react";

// ─── Color math ───────────────────────────────────────────────────────────────
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255;
  let g = parseInt(hex.slice(3,5),16)/255;
  let b = parseInt(hex.slice(5,7),16)/255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h,s,l=(max+min)/2;
  if (max===min) { h=s=0; }
  else {
    const d=max-min;
    s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){
      case r: h=((g-b)/d+(g<b?6:0))/6; break;
      case g: h=((b-r)/d+2)/6; break;
      case b: h=((r-g)/d+4)/6; break;
    }
  }
  return { h:h*360, s:s*100, l:l*100 };
}

function hslToHex(h,s,l) {
  h=((h%360)+360)%360; s=Math.max(0,Math.min(100,s)); l=Math.max(0,Math.min(100,l));
  h/=360; s/=100; l/=100;
  let r,g,b;
  if (s===0) { r=g=b=l; }
  else {
    const q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q;
    const hue2rgb=(p,q,t)=>{ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
    r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
  }
  return '#'+[r,g,b].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');
}

// ─── Derive full palette from one accent hex ──────────────────────────────────
export function makeTheme(accent) {
  const { h, s, l } = hexToHsl(accent);
  return {
    accent,                                                         // raw accent for picker
    base:       "#04090b",                                          // always near-black
    base2:      hslToHex(h, Math.max(s*0.25, 6), 5),              // very dark tinted black
    ink:        hslToHex(h, Math.min(s*0.28, 22), 88),            // soft light text
    inkDim:     hslToHex(h, Math.min(s*0.32, 26), 60),            // dimmer text
    teal:       accent,                                             // primary accent
    tealBright: hslToHex(h, Math.min(s+10, 95), Math.min(l+24,88)), // brighter accent
    tealDeep:   hslToHex(h, Math.min(s+14, 95), Math.max(l-24, 6)), // darker accent
    whisper:    hslToHex((h+200)%360, 32, 30),                     // subtle complementary
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeCtx = createContext(null);

const DEFAULT_ACCENT = "#34a0a4";

const loadAccent = () => {
  try { return localStorage.getItem("daisy-accent") || DEFAULT_ACCENT; }
  catch { return DEFAULT_ACCENT; }
};

export function ThemeProvider({ children }) {
  const [C, setC] = useState(() => makeTheme(loadAccent()));

  const setAccent = useCallback((hex) => {
    const theme = makeTheme(hex);
    setC(theme);
    try { localStorage.setItem("daisy-accent", hex); } catch {}
  }, []);

  return (
    <ThemeCtx.Provider value={{ C, setAccent }}>
      {children}
    </ThemeCtx.Provider>
  );
}

// ─── Hook used by every component ─────────────────────────────────────────────
export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx; // { C, setAccent }
}

// ─── hexA stays a pure utility ────────────────────────────────────────────────
export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}
