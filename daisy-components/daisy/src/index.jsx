import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { C, hexA } from "./constants.js";

// ─── Global styles ────────────────────────────────────────────────────────────
const style = document.createElement("style");
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { width: 100%; height: 100%; background: ${C.base}; }

  /* scrollbar */
  ::-webkit-scrollbar       { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${hexA(C.teal, 0.3)}; border-radius: 4px; }

  /* animations */
  @keyframes daisySpin    { to { transform: rotate(360deg); } }
  @keyframes daisyRipple  { 0%  { transform: scale(.6);  opacity: .7 } 100% { transform: scale(1.9); opacity: 0 } }
  @keyframes daisyRise    { from{ opacity: 0; transform: translateY(14px) } to{ opacity: 1; transform: none } }
  @keyframes daisyBreathe { 0%,100%{ opacity: .5 } 50%{ opacity: 1 } }

  /* message entrance */
  .daisy-msg { animation: daisyRise .55s cubic-bezier(.22,1,.36,1) both; }

  /* chat item hover glow */
  .chat-item { transition: background .2s, box-shadow .2s, color .2s; }
  .chat-item:hover {
    background:  ${hexA(C.teal, 0.14)} !important;
    box-shadow:  0 0 12px ${hexA(C.tealBright, 0.2)};
    color: ${C.ink} !important;
  }

  /* text selection */
  ::selection { background: ${hexA(C.teal, 0.35)}; }

  /* font import */
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Hanken+Grotesk:wght@400;500;600&display=swap');
`;
document.head.appendChild(style);

// ─── Mount ────────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
