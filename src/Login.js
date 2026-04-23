import React, { useState, useEffect, useRef } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

/* ═══════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');

.auth-root *, .auth-root *::before, .auth-root *::after {
  box-sizing: border-box; margin: 0; padding: 0;
}

.auth-root {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Plus Jakarta Sans', sans-serif;
  position: relative; overflow: hidden;
  transition: background 0.5s ease;
}
.auth-root.dark  { background: #050d1f; color: #e2e8f0; }
.auth-root.light { background: #eef2ff; color: #1e293b; }

/* Canvas */
.auth-canvas {
  position: absolute; inset: 0;
  pointer-events: none; z-index: 0;
  width: 100%; height: 100%;
}

/* Orbs */
.auth-orb {
  position: absolute; border-radius: 50%;
  pointer-events: none; z-index: 0;
}
.auth-orb-1 {
  width: 500px; height: 500px;
  filter: blur(90px);
  top: -150px; left: -120px;
  animation: auth-orb-drift 12s ease-in-out infinite;
}
.dark  .auth-orb-1 { background: radial-gradient(circle, rgba(0,212,255,0.12), transparent 70%); }
.light .auth-orb-1 { background: radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%); }
.auth-orb-2 {
  width: 400px; height: 400px;
  filter: blur(80px);
  bottom: -100px; right: -80px;
  animation: auth-orb-drift 15s ease-in-out infinite reverse 3s;
}
.dark  .auth-orb-2 { background: radial-gradient(circle, rgba(124,58,237,0.1), transparent 70%); }
.light .auth-orb-2 { background: radial-gradient(circle, rgba(0,212,255,0.1), transparent 70%); }
.auth-orb-3 {
  width: 280px; height: 280px;
  filter: blur(70px);
  top: 55%; left: 55%;
  animation: auth-orb-drift 9s ease-in-out infinite 6s;
}
.dark  .auth-orb-3 { background: radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%); }
.light .auth-orb-3 { background: radial-gradient(circle, rgba(16,185,129,0.09), transparent 70%); }
@keyframes auth-orb-drift {
  0%,100% { transform: translate(0,0) scale(1); }
  33%      { transform: translate(20px,-25px) scale(1.05); }
  66%      { transform: translate(-15px,15px) scale(0.97); }
}

/* ── Theme btn ── */
.auth-theme-btn {
  position: fixed; top: 22px; right: 22px; z-index: 200;
  width: 46px; height: 46px; border-radius: 50%;
  border: 1.5px solid rgba(0,212,255,0.2);
  background: rgba(0,0,0,0.15);
  backdrop-filter: blur(16px);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; cursor: pointer;
  transition: all 0.3s ease;
}
.auth-theme-btn:hover {
  border-color: rgba(0,212,255,0.5);
  transform: rotate(20deg) scale(1.1);
  box-shadow: 0 0 24px rgba(0,212,255,0.3);
}

/* ── Back btn ── */
.auth-back-btn {
  position: fixed; top: 22px; left: 22px; z-index: 200;
  display: flex; align-items: center; gap: 7px;
  padding: 10px 18px;
  border-radius: 12px;
  border: 1.5px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.15);
  backdrop-filter: blur(16px);
  color: #94a3b8;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.auth-back-btn:hover { color: #f1f5f9; border-color: rgba(0,212,255,0.35); }

/* ── Card wrapper with spinning border ── */
.auth-card-wrap {
  position: relative; z-index: 10;
  border-radius: 28px;
  padding: 3px;
  animation: auth-card-rise 0.75s cubic-bezier(0.16,1,0.3,1) both;
  background: conic-gradient(
    from var(--auth-angle, 0deg),
    rgba(0,212,255,0.7),
    rgba(124,58,237,0.7),
    rgba(16,185,129,0.5),
    rgba(0,212,255,0.7)
  );
}
@property --auth-angle {
  syntax: '<angle>'; initial-value: 0deg; inherits: false;
}
@keyframes auth-spin { to { --auth-angle: 360deg; } }
.auth-card-wrap { animation: auth-card-rise 0.75s cubic-bezier(0.16,1,0.3,1) both, auth-spin 5s linear infinite; }
@keyframes auth-card-rise {
  from { opacity: 0; transform: translateY(40px) scale(0.94); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Card ── */
.auth-card {
  width: 460px;
  border-radius: 25px;
  padding: 50px 44px;
  transition: background 0.4s;
}
.dark  .auth-card { background: #070f26; }
.light .auth-card { background: rgba(255,255,255,0.97); }

/* ── Logo ── */
.auth-logo-row {
  display: flex; align-items: center; gap: 14px;
  margin-bottom: 36px;
}
.auth-logo-icon {
  width: 52px; height: 52px; border-radius: 15px;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; flex-shrink: 0;
  animation: auth-icon-pulse 3s ease-in-out infinite;
}
@keyframes auth-icon-pulse {
  0%,100% { box-shadow: 0 0 22px rgba(0,212,255,0.4); }
  50%      { box-shadow: 0 0 44px rgba(124,58,237,0.55); }
}
.auth-logo-name {
  font-family: 'Syne', sans-serif;
  font-size: 24px; font-weight: 800; letter-spacing: -0.8px;
  transition: color 0.3s;
}
.dark  .auth-logo-name { color: #f8fafc; }
.light .auth-logo-name { color: #0f172a; }
.auth-logo-sub {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1.8px;
  margin-top: 3px; transition: color 0.3s;
}
.dark  .auth-logo-sub { color: #00d4ff; }
.light .auth-logo-sub { color: #7c3aed; }

/* ── Tabs ── */
.auth-tabs {
  display: flex; gap: 5px;
  padding: 5px; border-radius: 14px;
  margin-bottom: 28px; transition: background 0.3s, border 0.3s;
}
.dark  .auth-tabs { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); }
.light .auth-tabs { background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.08); }
.auth-tab {
  flex: 1; padding: 11px 6px;
  border: none; border-radius: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px; font-weight: 700;
  cursor: pointer; transition: all 0.22s ease; background: transparent;
}
.dark  .auth-tab { color: #475569; }
.light .auth-tab { color: #94a3b8; }
.auth-tab.active {
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  color: white !important;
  box-shadow: 0 4px 18px rgba(0,212,255,0.28);
}
.dark  .auth-tab:not(.active):hover { color: #94a3b8; background: rgba(255,255,255,0.04); }
.light .auth-tab:not(.active):hover { color: #475569; background: rgba(0,0,0,0.04); }

/* ── Error ── */
.auth-err {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 14px 16px; border-radius: 12px;
  margin-bottom: 20px;
  font-size: 13.5px; font-weight: 500; line-height: 1.5;
  animation: auth-slide-down 0.25s ease;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.22);
  color: #fca5a5;
}
.light .auth-err { color: #b91c1c; background: rgba(239,68,68,0.07); }
@keyframes auth-slide-down {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Fields ── */
.auth-fields { display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; }
.auth-field  { position: relative; }
.auth-field-icon {
  position: absolute; left: 15px; top: 50%;
  transform: translateY(-50%); font-size: 17px;
  pointer-events: none; z-index: 1; transition: filter 0.2s;
}
.auth-input {
  width: 100%; padding: 15px 15px 15px 48px;
  border-radius: 12px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px; font-weight: 500; outline: none;
  transition: all 0.22s ease;
}
.dark  .auth-input { background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.09); color: #f1f5f9; }
.light .auth-input { background: #f8fafc; border: 1.5px solid #dde5f0; color: #1e293b; }
.auth-input::placeholder { color: #475569; font-weight: 400; }
.light .auth-input::placeholder { color: #94a3b8; }
.dark  .auth-input:focus { border-color: #00d4ff; box-shadow: 0 0 0 4px rgba(0,212,255,0.1); background: rgba(0,212,255,0.04); }
.light .auth-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 4px rgba(124,58,237,0.1); background: rgba(124,58,237,0.03); }

/* ── Submit btn ── */
.auth-btn {
  width: 100%; padding: 16px;
  border: none; border-radius: 13px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px; font-weight: 800;
  cursor: pointer; letter-spacing: -0.2px;
  position: relative; overflow: hidden;
  transition: all 0.22s ease;
}
.auth-btn::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(rgba(255,255,255,0.13), transparent);
  opacity: 0; transition: opacity 0.2s;
}
.auth-btn:hover:not(:disabled)::after { opacity: 1; }
.auth-btn:hover:not(:disabled)  { transform: translateY(-2px); }
.auth-btn:active:not(:disabled) { transform: translateY(0); }
.auth-btn:disabled { opacity: 0.38; cursor: not-allowed; transform: none !important; }
.auth-btn.m-login {
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  color: white; box-shadow: 0 8px 30px rgba(0,212,255,0.35);
}
.auth-btn.m-login:hover:not(:disabled) { box-shadow: 0 12px 40px rgba(0,212,255,0.5); }
.auth-btn.m-signup {
  background: linear-gradient(135deg, #10b981 0%, #0d9488 100%);
  color: white; box-shadow: 0 8px 30px rgba(16,185,129,0.32);
}
.auth-btn.m-signup:hover:not(:disabled) { box-shadow: 0 12px 40px rgba(16,185,129,0.48); }

@keyframes auth-spin-anim { to { transform: rotate(360deg); } }
.auth-spinner {
  display: inline-block; width: 16px; height: 16px;
  border: 2.5px solid rgba(255,255,255,0.3); border-top-color: white;
  border-radius: 50%; animation: auth-spin-anim 0.65s linear infinite;
  margin-right: 10px; vertical-align: middle;
}

/* ── Footer ── */
.auth-footer {
  text-align: center; font-size: 13px;
  margin-top: 20px; font-weight: 500; transition: color 0.3s;
}
.dark  .auth-footer { color: #475569; }
.light .auth-footer { color: #94a3b8; }
.auth-footer a {
  font-weight: 800; text-decoration: none; transition: opacity 0.2s; cursor: pointer;
}
.dark  .auth-footer a { color: #00d4ff; }
.light .auth-footer a { color: #7c3aed; }
.auth-footer a:hover { opacity: 0.7; }
`;

/* ── Particle canvas ── */
function AuthCanvas({ dark }) {
  const ref = useRef(null);
  const raf = useRef(null);
  const pts = useRef(null);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    let W = c.width = window.innerWidth;
    let H = c.height = window.innerHeight;
    const onResize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; };
    window.addEventListener("resize", onResize);

    if (!pts.current) {
      pts.current = Array.from({ length: 65 }, () => ({
        x: Math.random()*W, y: Math.random()*H,
        vx: (Math.random()-0.5)*0.38, vy: (Math.random()-0.5)*0.38,
        r: Math.random()*1.6+0.3, a: Math.random()*0.55+0.05,
      }));
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const rgb = dark ? "0,212,255" : "124,58,237";
      pts.current.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${rgb},${p.a})`; ctx.fill();
      });
      for (let i = 0; i < pts.current.length; i++) {
        for (let j = i+1; j < pts.current.length; j++) {
          const dx = pts.current[i].x - pts.current[j].x;
          const dy = pts.current[i].y - pts.current[j].y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          if (d < 145) {
            ctx.beginPath();
            ctx.moveTo(pts.current[i].x, pts.current[i].y);
            ctx.lineTo(pts.current[j].x, pts.current[j].y);
            ctx.strokeStyle = `rgba(${rgb},${(1-d/145)*0.11})`;
            ctx.lineWidth = 0.65; ctx.stroke();
          }
        }
      }
      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("resize", onResize); };
  }, [dark]);

  return <canvas ref={ref} className="auth-canvas" />;
}

/* ═══════════════════════════════════════════════════════
   LOGIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function Login({ setUser, onBack }) {
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
    if (!document.getElementById("tg-auth-css")) {
      const s = document.createElement("style"); s.id = "tg-auth-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => { try { localStorage.setItem("tg-dark", dark); } catch {} }, [dark]);

  const handleAuth = async () => {
    if (!email || !password) return;
    setLoading(true); setError("");
    try {
      const fn = mode === "login" ? signInWithEmailAndPassword : createUserWithEmailAndPassword;
      const res = await fn(auth, email, password);
      setUser(res.user);
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace(/\(auth\/.*?\)\.?/g, "").trim());
    } finally {
      setLoading(false);
    }
  };

  const sw = (m) => { setMode(m); setError(""); };

  return (
    <div className={`auth-root ${dark ? "dark" : "light"}`}>
      <AuthCanvas dark={dark} />
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      {/* Back to landing */}
      {onBack && (
        <button className="auth-back-btn" onClick={onBack}>
          ← Back
        </button>
      )}

      {/* Theme toggle */}
      <button className="auth-theme-btn" onClick={() => setDark(d => !d)}>
        {dark ? "☀️" : "🌙"}
      </button>

      {/* Card with spinning gradient border */}
      <div className="auth-card-wrap">
        <div className={`auth-card ${dark ? "dark" : "light"}`}>

          <div className="auth-logo-row">
            <div className="auth-logo-icon">⬡</div>
            <div>
              <div className="auth-logo-name">TaskGraph</div>
              <div className="auth-logo-sub">Dependency Visualizer</div>
            </div>
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab ${mode === "login"  ? "active" : ""}`} onClick={() => sw("login")}>Sign In</button>
            <button className={`auth-tab ${mode === "signup" ? "active" : ""}`} onClick={() => sw("signup")}>Create Account</button>
          </div>

          {error && (
            <div className="auth-err">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <div className="auth-fields">
            <div className="auth-field">
              <span className="auth-field-icon">✉️</span>
              <input className="auth-input" type="email" placeholder="Email address"
                value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleAuth()} autoComplete="email" />
            </div>
            <div className="auth-field">
              <span className="auth-field-icon">🔑</span>
              <input className="auth-input" type="password"
                placeholder={mode === "signup" ? "Password (min. 6 chars)" : "Password"}
                value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleAuth()}
                autoComplete={mode === "login" ? "current-password" : "new-password"} />
            </div>
          </div>

          <button className={`auth-btn m-${mode}`} onClick={handleAuth}
            disabled={!email || !password || loading}>
            {loading && <span className="auth-spinner" />}
            {loading ? "Please wait…" : mode === "login" ? "Sign In  →" : "Create Account  →"}
          </button>

          <p className="auth-footer">
            {mode === "login"
              ? <>Don't have an account? <a onClick={() => sw("signup")}>Sign up free</a></>
              : <>Already registered? <a onClick={() => sw("login")}>Sign in</a></>}
          </p>
        </div>
      </div>
    </div>
  );
}