import { useState, useEffect, useRef, useCallback } from "react";

const CLIENT_ID    = import.meta.env.VITE_SPOTIFY_CLIENT_ID   || "";
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || "http://127.0.0.1:3000/callback";
const API_BASE     = import.meta.env.VITE_API_URL              || "http://localhost:8000";

const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-modify-playback-state",
  "user-read-playback-state",
].join(" ");

const STORE_KEY = "krisk_spotify";

// ── PKCE helpers ──────────────────────────────────────────────────────────────
function randomB64Url(len) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function sha256B64Url(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// ── Storage ───────────────────────────────────────────────────────────────────
function load()  { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch { return null; } }
function save(d) { localStorage.setItem(STORE_KEY, JSON.stringify(d)); }
function clear() { localStorage.removeItem(STORE_KEY); localStorage.removeItem("sp_verifier"); }

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useSpotify() {
  const [status,   setStatus]   = useState("idle"); // idle | authenticated | error
  const [track,    setTrack]    = useState(null);   // { name, artist, album, album_art, uri, duration_ms }
  const [paused,   setPaused]   = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const tokenRef    = useRef(null);
  const playerRef   = useRef(null);
  const deviceIdRef = useRef(null);
  const previewRef  = useRef(null); // <Audio> for 30s preview fallback

  // ── position ticker ────────────────────────────────────────────────────────
  useEffect(() => {
    if (paused || !duration) return;
    const t = setInterval(() => setPosition(p => Math.min(p + 1000, duration)), 1000);
    return () => clearInterval(t);
  }, [paused, duration]);

  // ── init Web Playback SDK ─────────────────────────────────────────────────
  const initSDK = useCallback((token) => {
    tokenRef.current = token;

    const boot = () => {
      const player = new window.Spotify.Player({
        name: "Krisk",
        getOAuthToken: cb => cb(tokenRef.current),
        volume: 0.7,
      });
      playerRef.current = player;

      player.addListener("ready", ({ device_id }) => { deviceIdRef.current = device_id; });
      player.addListener("not_ready", () => { deviceIdRef.current = null; });
      player.addListener("player_state_changed", state => {
        if (!state) return;
        const t = state.track_window?.current_track;
        if (t) {
          setTrack({
            uri:       t.uri,
            name:      t.name,
            artist:    t.artists?.map(a => a.name).join(", ") || "",
            album:     t.album?.name || "",
            album_art: t.album?.images?.[0]?.url || "",
            duration_ms: state.duration,
            preview_url: "",
          });
          setDuration(state.duration);
          setPosition(state.position);
          setPaused(state.paused);
        }
      });

      player.connect();
    };

    if (window.Spotify) {
      boot();
    } else {
      window.onSpotifyWebPlaybackSDKReady = boot;
      if (!document.getElementById("sp-sdk")) {
        const s = document.createElement("script");
        s.id  = "sp-sdk";
        s.src = "https://sdk.scdn.co/spotify-player.js";
        document.head.appendChild(s);
      }
    }
  }, []);

  // ── handle OAuth callback ─────────────────────────────────────────────────
  const handleCallback = useCallback(async (code) => {
    const verifier = localStorage.getItem("sp_verifier");
    if (!verifier) return;
    try {
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id:     CLIENT_ID,
          grant_type:    "authorization_code",
          code,
          redirect_uri:  REDIRECT_URI,
          code_verifier: verifier,
        }),
      });
      if (!res.ok) throw new Error("token exchange failed");
      const data = await res.json();
      save({
        access_token:  data.access_token,
        refresh_token: data.refresh_token,
        expires_at:    Date.now() + data.expires_in * 1000 - 60_000,
      });
      tokenRef.current = data.access_token;
      setStatus("authenticated");
      initSDK(data.access_token);
    } catch (e) {
      console.error("[Spotify] auth error:", e);
      setStatus("error");
    }
  }, [initSDK]);

  // ── refresh token ─────────────────────────────────────────────────────────
  const doRefresh = useCallback(async (refreshToken) => {
    try {
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id:     CLIENT_ID,
          grant_type:    "refresh_token",
          refresh_token: refreshToken,
        }),
      });
      if (!res.ok) throw new Error("refresh failed");
      const data = await res.json();
      const stored = load() || {};
      save({ ...stored, access_token: data.access_token, expires_at: Date.now() + data.expires_in * 1000 - 60_000 });
      tokenRef.current = data.access_token;
      setStatus("authenticated");
      initSDK(data.access_token);
    } catch {
      clear(); setStatus("idle");
    }
  }, [initSDK]);

  // ── on mount: check URL for callback code, then check stored tokens ───────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get("code");
    if (code) {
      window.history.replaceState({}, "", window.location.pathname);
      handleCallback(code);
      return;
    }
    const stored = load();
    if (stored?.access_token) {
      if (Date.now() < stored.expires_at) {
        tokenRef.current = stored.access_token;
        setStatus("authenticated");
        initSDK(stored.access_token);
      } else if (stored.refresh_token) {
        doRefresh(stored.refresh_token);
      }
    }
  }, [handleCallback, initSDK, doRefresh]);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async () => {
    const verifier  = randomB64Url(64);
    const challenge = await sha256B64Url(verifier);
    localStorage.setItem("sp_verifier", verifier);
    window.location.href = "https://accounts.spotify.com/authorize?" + new URLSearchParams({
      client_id:             CLIENT_ID,
      response_type:         "code",
      redirect_uri:          REDIRECT_URI,
      code_challenge_method: "S256",
      code_challenge:        challenge,
      scope:                 SCOPES,
    });
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    playerRef.current?.disconnect();
    playerRef.current  = null;
    deviceIdRef.current = null;
    tokenRef.current   = null;
    if (previewRef.current) { previewRef.current.pause(); previewRef.current = null; }
    clear();
    setStatus("idle"); setTrack(null); setPaused(true); setPosition(0); setDuration(0);
  }, []);

  // ── play a track (Premium SDK, fallback to 30s preview) ──────────────────
  const playTrack = useCallback(async (trackInfo) => {
    // stop any preview
    if (previewRef.current) { previewRef.current.pause(); previewRef.current = null; }

    // try Web Playback SDK (requires Premium)
    if (deviceIdRef.current && tokenRef.current && trackInfo.uri) {
      try {
        const r = await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${tokenRef.current}`, "Content-Type": "application/json" },
            body: JSON.stringify({ uris: [trackInfo.uri] }),
          }
        );
        if (r.ok || r.status === 204) {
          setTrack({ ...trackInfo });
          setDuration(trackInfo.duration_ms || 0);
          setPosition(0); setPaused(false);
          return;
        }
      } catch {}
    }

    // fallback: 30s preview URL
    if (trackInfo.preview_url) {
      const audio = new Audio(trackInfo.preview_url);
      previewRef.current = audio;
      audio.play().catch(() => {});
      audio.onended = () => setPaused(true);
      setTrack({ ...trackInfo, duration_ms: 30_000 });
      setDuration(30_000); setPosition(0); setPaused(false);
    }
  }, []);

  // ── controls ──────────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.togglePlay();
    } else if (previewRef.current) {
      if (paused) { previewRef.current.play(); setPaused(false); }
      else         { previewRef.current.pause(); setPaused(true); }
    }
  }, [paused]);

  const nextTrack = useCallback(() => playerRef.current?.nextTrack(),     []);
  const prevTrack = useCallback(() => playerRef.current?.previousTrack(), []);

  // ── search Spotify via backend, then play ─────────────────────────────────
  const searchAndPlay = useCallback(async (query) => {
    try {
      const res  = await fetch(`${API_BASE}/spotify/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.tracks?.length) playTrack(data.tracks[0]);
    } catch (e) {
      console.error("[Spotify] search error:", e);
    }
  }, [playTrack]);

  return {
    status, track, paused, position, duration,
    login, logout,
    playTrack, togglePlay, nextTrack, prevTrack,
    searchAndPlay,
  };
}
