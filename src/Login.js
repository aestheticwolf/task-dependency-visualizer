import React, { useState, useEffect, useRef } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";

/* ─────────────────────────────────────────────
   Global CSS (injected once)
───────────────────────────────────────────── */
const LOGIN_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --c-cyan:   #00d4ff;
  --c-violet: #7c3aed;
  --c-green:  #10b981;
  --c-red:    #ef4444;
}

.lp-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Outfit', sans-serif;
  overflow: hidden;
  position: relative;
  transition: background 0.5s ease, color 0.5s ease;
}
.lp-root.dark  { background: #04091a; color: #e2e8f0; }
.lp-root.light { background: #eef2ff; color: #1e293b; }

/* canvas */
#lp-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

/* ── Theme toggle ── */
.lp-theme-btn {
  position: fixed;
  top: 20px; right: 20px;
  z-index: 200;
  width: 46px; height: 46px;
  border-radius: 50%;
  border: 1.5px solid rgba(0,212,255,0.3);
  background: rgba(0,212,255,0.07);
  backdrop-filter: blur(14px);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 19px;
  transition: all 0.3s ease;
}
.lp-theme-btn:hover {
  background: rgba(0,212,255,0.18);
  border-color: var(--c-cyan);
  transform: rotate(18deg) scale(1.1);
  box-shadow: 0 0 22px rgba(0,212,255,0.35);
}

/* ── Card ── */
.lp-card-wrap {
  position: relative;
  z-index: 10;
  padding: 3px;
  border-radius: 26px;
  background: conic-gradient(
    from var(--lp-angle, 0deg),
    var(--c-cyan),
    var(--c-violet),
    var(--c-cyan)
  );
  animation: lp-border-spin 4s linear infinite, lp-card-up 0.7s cubic-bezier(0.16,1,0.3,1) both;
}
@property --lp-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes lp-border-spin { to { --lp-angle: 360deg; } }
@keyframes lp-card-up {
  from { opacity: 0; transform: translateY(36px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}

.lp-card {
  width: 440px;
  border-radius: 23px;
  padding: 44px 40px;
  transition: background 0.4s ease;
}
.lp-root.dark  .lp-card {
  background: rgba(7,15,36,0.92);
  backdrop-filter: blur(28px);
}
.lp-root.light .lp-card {
  background: rgba(255,255,255,0.94);
  backdrop-filter: blur(28px);
}

/* ── Logo ── */
.lp-logo-row {
  display: flex; align-items: center; gap: 14px;
  margin-bottom: 34px;
}
.lp-logo-icon {
  width: 50px; height: 50px;
  border-radius: 15px;
  background: linear-gradient(135deg, var(--c-cyan), var(--c-violet));
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  animation: lp-icon-glow 3s ease-in-out infinite;
}
@keyframes lp-icon-glow {
  0%,100% { box-shadow: 0 0 20px rgba(0,212,255,0.4); }
  50%      { box-shadow: 0 0 42px rgba(124,58,237,0.55); }
}
.lp-logo-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 21px; font-weight: 600;
  letter-spacing: -0.5px;
  transition: color 0.3s;
}
.lp-root.dark  .lp-logo-name { color: #f1f5f9; }
.lp-root.light .lp-logo-name { color: #0f172a; }
.lp-logo-sub {
  font-size: 10px; font-weight: 600;
  letter-spacing: 1.8px; text-transform: uppercase;
  color: var(--c-cyan);
  margin-top: 3px;
}
.lp-root.light .lp-logo-sub { color: var(--c-violet); }

/* ── Tabs ── */
.lp-tabs {
  display: flex; gap: 4px;
  border-radius: 14px; padding: 4px;
  margin-bottom: 26px;
  transition: background 0.3s, border 0.3s;
}
.lp-root.dark  .lp-tabs { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); }
.lp-root.light .lp-tabs { background: rgba(0,0,0,0.04);      border: 1px solid rgba(0,0,0,0.08); }
.lp-tab {
  flex: 1; padding: 11px;
  border: none; border-radius: 11px;
  font-family: 'Outfit', sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: all 0.22s ease;
  background: transparent;
}
.lp-root.dark  .lp-tab { color: #64748b; }
.lp-root.light .lp-tab { color: #94a3b8; }
.lp-tab.active {
  background: linear-gradient(135deg, var(--c-cyan), var(--c-violet));
  color: #fff !important;
  box-shadow: 0 4px 16px rgba(0,212,255,0.28);
}
.lp-root.light .lp-tab.active { box-shadow: 0 4px 16px rgba(124,58,237,0.3); }
.lp-tab:not(.active):hover { color: #cbd5e1 !important; }
.lp-root.light .lp-tab:not(.active):hover { color: #475569 !important; }

/* ── Error ── */
.lp-err {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 13px 14px;
  border-radius: 11px;
  margin-bottom: 18px;
  font-size: 13px; font-weight: 500;
  line-height: 1.5;
  animation: lp-slide-down 0.25s ease;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.25);
  color: #fca5a5;
}
.lp-root.light .lp-err { color: #b91c1c; background: rgba(239,68,68,0.07); }
@keyframes lp-slide-down {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Fields ── */
.lp-fields { display: flex; flex-direction: column; gap: 14px; margin-bottom: 22px; }
.lp-field  { position: relative; }
.lp-field-icon {
  position: absolute; left: 15px; top: 50%;
  transform: translateY(-50%);
  font-size: 16px; pointer-events: none;
  transition: filter 0.2s;
  z-index: 1;
}
.lp-input {
  width: 100%;
  padding: 14px 14px 14px 46px;
  border-radius: 12px;
  font-family: 'Outfit', sans-serif;
  font-size: 14px; font-weight: 400;
  outline: none;
  transition: all 0.22s ease;
}
.lp-root.dark .lp-input {
  background: rgba(255,255,255,0.05);
  border: 1.5px solid rgba(255,255,255,0.09);
  color: #f1f5f9;
}
.lp-root.light .lp-input {
  background: #f8fafc;
  border: 1.5px solid #dde5f0;
  color: #1e293b;
}
.lp-input::placeholder { color: #475569; }
.lp-root.light .lp-input::placeholder { color: #94a3b8; }
.lp-input:focus {
  border-color: var(--c-cyan);
  box-shadow: 0 0 0 4px rgba(0,212,255,0.1);
  background: rgba(0,212,255,0.04);
}
.lp-root.light .lp-input:focus {
  border-color: var(--c-violet);
  box-shadow: 0 0 0 4px rgba(124,58,237,0.1);
  background: rgba(124,58,237,0.03);
}

/* ── Button ── */
.lp-btn {
  width: 100%; padding: 14px;
  border: none; border-radius: 13px;
  font-family: 'Outfit', sans-serif;
  font-size: 15px; font-weight: 700;
  cursor: pointer; letter-spacing: 0.3px;
  position: relative; overflow: hidden;
  transition: all 0.2s ease;
}
.lp-btn::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(rgba(255,255,255,0.12), transparent);
  opacity: 0; transition: opacity 0.2s;
}
.lp-btn:hover:not(:disabled)::after { opacity: 1; }
.lp-btn:hover:not(:disabled)  { transform: translateY(-2px); }
.lp-btn:active:not(:disabled) { transform: translateY(0); }
.lp-btn:disabled { opacity: 0.38; cursor: not-allowed; transform: none !important; }

.lp-btn.m-login {
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 6px 28px rgba(0,212,255,0.35);
}
.lp-btn.m-login:hover:not(:disabled)  { box-shadow: 0 10px 36px rgba(0,212,255,0.5); }
.lp-btn.m-signup {
  background: linear-gradient(135deg, #10b981 0%, #0d9488 100%);
  color: white;
  box-shadow: 0 6px 28px rgba(16,185,129,0.32);
}
.lp-btn.m-signup:hover:not(:disabled) { box-shadow: 0 10px 36px rgba(16,185,129,0.48); }

@keyframes lp-spin { to { transform: rotate(360deg); } }
.lp-spinner {
  display: inline-block;
  width: 15px; height: 15px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: lp-spin 0.65s linear infinite;
  margin-right: 9px;
  vertical-align: middle;
}

/* ── Footer ── */
.lp-footer {
  text-align: center;
  font-size: 13px;
  margin-top: 20px;
  font-weight: 400;
  transition: color 0.3s;
}
.lp-root.dark  .lp-footer { color: #475569; }
.lp-root.light .lp-footer { color: #94a3b8; }
.lp-footer a {
  color: var(--c-cyan);
  cursor: pointer;
  font-weight: 700;
  text-decoration: none;
  transition: opacity 0.2s;
}
.lp-root.light .lp-footer a { color: var(--c-violet); }
.lp-footer a:hover { opacity: 0.7; }
`;

/* ─── Canvas particle animation ─── */
function ParticleCanvas({ dark }) {
  const canvasRef = useRef(null);
  const raf       = useRef(null);
  const pts       = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W = (canvas.width  = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const onResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    if (!pts.current.length) {
      pts.current = Array.from({ length: 60 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        a: Math.random() * 0.6 + 0.1,
      }));
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const rgb = dark ? "0,212,255" : "124,58,237";

      pts.current.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${p.a})`;
        ctx.fill();
      });

      for (let i = 0; i < pts.current.length; i++) {
        for (let j = i + 1; j < pts.current.length; j++) {
          const dx = pts.current[i].x - pts.current[j].x;
          const dy = pts.current[i].y - pts.current[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            ctx.beginPath();
            ctx.moveTo(pts.current[i].x, pts.current[i].y);
            ctx.lineTo(pts.current[j].x, pts.current[j].y);
            ctx.strokeStyle = `rgba(${rgb},${(1 - d / 140) * 0.12})`;
            ctx.lineWidth   = 0.7;
            ctx.stroke();
          }
        }
      }

      raf.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", onResize);
    };
  }, [dark]);

  return (
    <canvas
      id="lp-canvas"
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
    />
  );
}

/* ─── Login component ─── */
export default function Login({ setUser }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [mode,     setMode]     = useState("login");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [dark,     setDark]     = useState(() => {
    try { return localStorage.getItem("tg-dark") !== "false"; } catch { return true; }
  });

  useEffect(() => {
    try { localStorage.setItem("tg-dark", dark); } catch {}
  }, [dark]);

  // Inject CSS once
  useEffect(() => {
    if (!document.getElementById("tg-login-css")) {
      const s = document.createElement("style");
      s.id = "tg-login-css";
      s.textContent = LOGIN_CSS;
      document.head.appendChild(s);
    }
  }, []);

  const handleAuth = async () => {
    if (!email || !password) return;
    setLoading(true); setError("");
    try {
      const fn = mode === "login"
        ? signInWithEmailAndPassword
        : createUserWithEmailAndPassword;
      const res = await fn(auth, email, password);
      setUser(res.user);
    } catch (err) {
      setError(
        err.message.replace("Firebase: ", "").replace(/\(auth\/.*?\)\.?/g, "").trim()
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); setError(""); };
  const onKey = e => { if (e.key === "Enter") handleAuth(); };

  return (
    <div className={`lp-root ${dark ? "dark" : "light"}`}>
      <ParticleCanvas dark={dark} />

      {/* Theme toggle */}
      <button className="lp-theme-btn" onClick={() => setDark(d => !d)} title="Toggle theme">
        {dark ? "☀️" : "🌙"}
      </button>

      {/* Card with spinning gradient border */}
      <div className="lp-card-wrap">
        <div className="lp-card">

          {/* Logo */}
          <div className="lp-logo-row">
            <div className="lp-logo-icon">⬡</div>
            <div>
              <div className="lp-logo-name">TaskGraph</div>
              <div className="lp-logo-sub">Dependency Visualizer</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="lp-tabs">
            <button className={`lp-tab ${mode === "login"  ? "active" : ""}`} onClick={() => switchMode("login")}>Sign In</button>
            <button className={`lp-tab ${mode === "signup" ? "active" : ""}`} onClick={() => switchMode("signup")}>Create Account</button>
          </div>

          {/* Error */}
          {error && (
            <div className="lp-err">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Fields */}
          <div className="lp-fields">
            <div className="lp-field">
              <span className="lp-field-icon">✉️</span>
              <input
                className="lp-input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={onKey}
                autoComplete="email"
              />
            </div>
            <div className="lp-field">
              <span className="lp-field-icon">🔑</span>
              <input
                className="lp-input"
                type="password"
                placeholder={mode === "signup" ? "Password (min. 6 chars)" : "Password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={onKey}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            className={`lp-btn m-${mode}`}
            onClick={handleAuth}
            disabled={!email || !password || loading}
          >
            {loading && <span className="lp-spinner" />}
            {loading ? "Please wait…" : mode === "login" ? "Sign In  →" : "Create Account  →"}
          </button>

          {/* Footer */}
          <p className="lp-footer">
            {mode === "login"
              ? <>New here? <a onClick={() => switchMode("signup")}>Create an account</a></>
              : <>Already registered? <a onClick={() => switchMode("login")}>Sign in</a></>}
          </p>
        </div>
      </div>
    </div>
  );
}