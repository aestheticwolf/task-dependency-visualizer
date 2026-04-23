import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Sora:wght@300;400;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .login-root {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #020817;
    font-family: 'Sora', sans-serif;
    overflow: hidden;
    position: relative;
  }

  /* Animated grid background */
  .login-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(56, 189, 248, 0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    animation: gridMove 20s linear infinite;
  }

  @keyframes gridMove {
    0% { transform: translateY(0); }
    100% { transform: translateY(40px); }
  }

  /* Glowing orbs */
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    animation: orbFloat 8s ease-in-out infinite;
  }
  .orb-1 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.12), transparent 70%);
    top: -100px; left: -100px;
    animation-delay: 0s;
  }
  .orb-2 {
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.1), transparent 70%);
    bottom: -80px; right: -80px;
    animation-delay: 3s;
  }
  .orb-3 {
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(34, 197, 94, 0.07), transparent 70%);
    top: 50%; left: 60%;
    animation-delay: 6s;
  }

  @keyframes orbFloat {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-20px) scale(1.05); }
  }

  /* Card */
  .login-card {
    position: relative;
    z-index: 10;
    width: 380px;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(56, 189, 248, 0.15);
    border-radius: 20px;
    padding: 40px 36px;
    box-shadow:
      0 0 0 1px rgba(56, 189, 248, 0.05),
      0 25px 50px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    animation: cardReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
    transform: translateY(24px);
  }

  @keyframes cardReveal {
    to { opacity: 1; transform: translateY(0); }
  }

  /* Logo area */
  .login-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 28px;
  }

  .logo-icon {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, #38bdf8, #6366f1);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.3);
    animation: iconPulse 3s ease-in-out infinite;
  }

  @keyframes iconPulse {
    0%, 100% { box-shadow: 0 0 20px rgba(56, 189, 248, 0.3); }
    50% { box-shadow: 0 0 35px rgba(56, 189, 248, 0.5); }
  }

  .login-title {
    font-family: 'Space Mono', monospace;
    font-size: 16px;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: -0.3px;
  }

  .login-subtitle {
    font-size: 11px;
    color: #64748b;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  /* Divider */
  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.2), transparent);
    margin-bottom: 28px;
  }

  /* Tabs */
  .tab-row {
    display: flex;
    background: rgba(255,255,255,0.03);
    border-radius: 10px;
    padding: 4px;
    margin-bottom: 24px;
    border: 1px solid rgba(255,255,255,0.05);
  }

  .tab-btn {
    flex: 1;
    padding: 8px;
    border: none;
    border-radius: 7px;
    background: transparent;
    color: #64748b;
    font-family: 'Sora', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tab-btn.active {
    background: rgba(56, 189, 248, 0.12);
    color: #38bdf8;
    box-shadow: 0 0 12px rgba(56, 189, 248, 0.1);
  }

  .tab-btn:hover:not(.active) {
    color: #94a3b8;
    background: rgba(255,255,255,0.03);
  }

  /* Input group */
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .input-wrapper {
    position: relative;
  }

  .input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #475569;
    font-size: 14px;
    pointer-events: none;
    transition: color 0.2s;
  }

  .login-input {
    width: 100%;
    padding: 12px 14px 12px 40px;
    border-radius: 10px;
    border: 1px solid rgba(71, 85, 105, 0.4);
    background: rgba(15, 23, 42, 0.6);
    color: #f1f5f9;
    font-family: 'Sora', sans-serif;
    font-size: 13px;
    outline: none;
    transition: all 0.2s ease;
  }

  .login-input::placeholder { color: #475569; }

  .login-input:focus {
    border-color: rgba(56, 189, 248, 0.5);
    background: rgba(56, 189, 248, 0.04);
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.08);
  }

  .login-input:focus + .input-focus-line {
    transform: scaleX(1);
  }

  /* Primary button */
  .login-btn {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 10px;
    font-family: 'Sora', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }

  .login-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(rgba(255,255,255,0.1), transparent);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .login-btn:hover::after { opacity: 1; }

  .btn-login {
    background: linear-gradient(135deg, #38bdf8, #6366f1);
    color: white;
    box-shadow: 0 4px 15px rgba(56, 189, 248, 0.25);
    letter-spacing: 0.3px;
  }

  .btn-login:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 25px rgba(56, 189, 248, 0.4);
  }

  .btn-login:active:not(:disabled) { transform: translateY(0); }

  .btn-signup {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    box-shadow: 0 4px 15px rgba(34, 197, 94, 0.2);
    letter-spacing: 0.3px;
  }

  .btn-signup:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 25px rgba(34, 197, 94, 0.35);
  }

  .login-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: none !important;
  }

  .login-hint {
    text-align: center;
    font-size: 11px;
    color: #475569;
    margin-top: 16px;
    line-height: 1.6;
  }

  .login-hint span {
    color: #38bdf8;
  }

  /* Loading spinner */
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .spinner {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    margin-right: 8px;
    vertical-align: middle;
  }

  /* Error message */
  .error-msg {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #fca5a5;
    font-size: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    animation: slideIn 0.2s ease;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");

    try {
      let res;
      if (mode === "login") {
        res = await signInWithEmailAndPassword(auth, email, password);
      } else {
        res = await createUserWithEmailAndPassword(auth, email, password);
      }
      setUser(res.user);
    } catch (err) {
      const msg = err.message
        .replace("Firebase: ", "")
        .replace(/\(auth\/.*?\)\.?/, "")
        .trim();
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAuth();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="login-root">
        <div className="login-grid" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="login-card">
          {/* Logo */}
          <div className="login-logo">
            <div className="logo-icon">⬡</div>
            <div>
              <div className="login-title">TaskGraph</div>
              <div className="login-subtitle">Dependency Visualizer</div>
            </div>
          </div>

          <div className="divider" />

          {/* Tabs */}
          <div className="tab-row">
            <button
              className={`tab-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => { setMode("login"); setError(""); }}
            >
              Sign In
            </button>
            <button
              className={`tab-btn ${mode === "signup" ? "active" : ""}`}
              onClick={() => { setMode("signup"); setError(""); }}
            >
              Create Account
            </button>
          </div>

          {/* Error */}
          {error && <div className="error-msg">⚠ {error}</div>}

          {/* Inputs */}
          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon">✉</span>
              <input
                className="login-input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                autoComplete="email"
              />
            </div>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                className="login-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
          </div>

          {/* Button */}
          <button
            className={`login-btn ${mode === "login" ? "btn-login" : "btn-signup"}`}
            onClick={handleAuth}
            disabled={!email || !password || loading}
          >
            {loading && <span className="spinner" />}
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In →"
              : "Create Account →"}
          </button>

          <p className="login-hint">
            {mode === "login"
              ? <>Don't have an account? <span style={{cursor:"pointer"}} onClick={() => setMode("signup")}>Sign up</span></>
              : <>Already have an account? <span style={{cursor:"pointer"}} onClick={() => setMode("login")}>Sign in</span></>
            }
          </p>
        </div>
      </div>
    </>
  );
}

export default Login;