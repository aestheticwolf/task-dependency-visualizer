import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import {
  AuthLogo,
  AuthShell,
  AuthTabs,
  useAuthStyles,
} from "./Login";

function getStrength(pw) {
  if (!pw) return { level: 0, label: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: "Weak" };
  if (score === 2) return { level: 2, label: "Fair" };
  if (score === 3) return { level: 3, label: "Good" };
  return { level: 4, label: "Strong" };
}

const STRENGTH_CLS = ["", "s-weak", "s-fair", "s-good", "s-strong"];
const STRENGTH_LABEL_CLS = ["", "s-label-weak", "s-label-fair", "s-label-good", "s-label-strong"];

export default function Signup({ onModeChange, onAuthSuccess, onBack, darkTheme, setDarkTheme }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  useAuthStyles();
  const dark = Boolean(darkTheme);
  const setDark = setDarkTheme;

  const handleSignup = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      onAuthSuccess?.(res.user);
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace(/\(auth\/.*?\)\.?/g, "").trim());
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    setError("");
    setShowPw(false);
    onModeChange?.("login");
  };

  const onKey = e => { if (e.key === "Enter") handleSignup(); };
  const strength = password.length > 0 ? getStrength(password) : null;

  return (
    <AuthShell dark={dark} setDark={setDark} onBack={onBack}>
      <AuthLogo />
      <AuthTabs
        activeMode="signup"
        onSelectLogin={goToLogin}
        onSelectSignup={() => {}}
      />

      {error && (
        <div className="auth-err">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="auth-fields">
        <div className="auth-field">
          <span className="auth-field-icon">✉️</span>
          <input
            className="auth-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            onKeyDown={onKey}
            autoComplete="email"
          />
          <div className="auth-field-line" />
        </div>

        <div className="auth-field">
          <span className="auth-field-icon">🔑</span>
          <input
            className="auth-input has-toggle"
            type={showPw ? "text" : "password"}
            placeholder="Password (min. 6 chars)"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={onKey}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="auth-pw-toggle"
            onClick={() => setShowPw(v => !v)}
            tabIndex={-1}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? "Hide" : "Show"}
          </button>
          <div className="auth-field-line" />
        </div>

        {strength && (
          <div className="auth-strength">
            <div className="auth-strength-bar">
              {[1, 2, 3, 4].map(n => (
                <div
                  key={n}
                  className={`auth-strength-seg ${n <= strength.level ? STRENGTH_CLS[strength.level] : ""}`}
                />
              ))}
            </div>
            <span className={`auth-strength-label ${STRENGTH_LABEL_CLS[strength.level]}`}>
              {strength.label} password
            </span>
          </div>
        )}
      </div>

      <button
        className="auth-btn m-signup"
        onClick={handleSignup}
        disabled={!email || !password || loading}
      >
        {loading && <span className="auth-spinner" />}
        {loading ? "Please wait…" : "Create Account  →"}
      </button>

      <p className="auth-footer">
        Already registered?{" "}
        <button type="button" className="auth-link" onClick={goToLogin}>
          Sign in
        </button>
      </p>
    </AuthShell>
  );
}
