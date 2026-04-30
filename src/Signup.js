import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "./firebase";
import {
  normalizeDisplayName,
  formatAuthMessage,
  getPasswordStrength,
  hasValidationErrors,
  PASSWORD_MIN_LENGTH,
  validateDisplayName,
  validateEmailAddress,
  validateSignupForm,
} from "./authValidation";
import {
  AuthLogo,
  AuthShell,
  AuthTabs,
  useAuthStyles,
} from "./Login";

const STRENGTH_CLS = ["", "s-weak", "s-fair", "s-good", "s-strong"];
const STRENGTH_LABEL_CLS = ["", "s-label-weak", "s-label-fair", "s-label-good", "s-label-strong"];

export default function Signup({ onModeChange, onAuthSuccess, onBack, darkTheme, setDarkTheme }) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({ name: "", email: "", password: "" });
  useAuthStyles();
  const dark = Boolean(darkTheme);
  const setDark = setDarkTheme;

  const handleSignup = async () => {
    const normalizedName = normalizeDisplayName(name);
    const trimmedEmail = email.trim();
    const nextErrors = validateSignupForm({ name: normalizedName, email: trimmedEmail, password });

    setFieldErrors(nextErrors);
    setFeedback(null);

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    setLoading(true);
    setName(normalizedName);
    setEmail(trimmedEmail);
    try {
      const res = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      await updateProfile(res.user, { displayName: normalizedName });
      onAuthSuccess?.({
        uid: res.user.uid,
        email: res.user.email || trimmedEmail,
        displayName: normalizedName,
      });
    } catch (err) {
      setFeedback({ type: "error", message: formatAuthMessage(err, "signup") });
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    setFeedback(null);
    setFieldErrors({ name: "", email: "", password: "" });
    setShowPw(false);
    onModeChange?.("login");
  };

  const onKey = e => { if (e.key === "Enter") handleSignup(); };
  const strength = password.length > 0 ? getPasswordStrength(password) : null;

  return (
    <AuthShell dark={dark} setDark={setDark} onBack={onBack}>
      <AuthLogo />
      <AuthTabs
        activeMode="signup"
        onSelectLogin={goToLogin}
        onSelectSignup={() => {}}
      />

      {feedback?.message && (
        <div className="auth-err" role="alert" aria-live="polite">
          <span>!</span>
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="auth-fields">
        <div className="auth-field">
          <div className="auth-input-row">
            <span className="auth-field-icon">👤</span>
            <input
              className="auth-input"
              type="text"
              placeholder="Full name"
              value={name}
              onChange={e => {
                const nextName = e.target.value;
                setName(nextName);
                setFeedback(null);
                setFieldErrors(prev =>
                  prev.name ? { ...prev, name: validateDisplayName(nextName) } : prev
                );
              }}
              onBlur={() =>
                setFieldErrors(prev => ({ ...prev, name: validateDisplayName(name) }))
              }
              onKeyDown={onKey}
              autoComplete="name"
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby="signup-name-message"
            />
            <div className="auth-field-line" />
          </div>
          <div
            id="signup-name-message"
            className={`auth-field-msg ${fieldErrors.name ? "is-error" : ""}`.trim()}
          >
            {fieldErrors.name || "This name will appear on your dashboard and profile."}
          </div>
        </div>

        <div className="auth-field">
          <div className="auth-input-row">
            <span className="auth-field-icon">✉️</span>
            <input
              className="auth-input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => {
                const nextEmail = e.target.value;
                setEmail(nextEmail);
                setFeedback(null);
                setFieldErrors(prev =>
                  prev.email ? { ...prev, email: validateEmailAddress(nextEmail.trim()) } : prev
                );
              }}
              onBlur={() =>
                setFieldErrors(prev => ({ ...prev, email: validateEmailAddress(email.trim()) }))
              }
              onKeyDown={onKey}
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "signup-email-error" : undefined}
            />
            <div className="auth-field-line" />
          </div>
          {fieldErrors.email && (
            <div id="signup-email-error" className="auth-field-msg is-error">
              {fieldErrors.email}
            </div>
          )}
        </div>

        <div className="auth-field">
          <div className="auth-input-row">
            <span className="auth-field-icon">🔑</span>
            <input
              className="auth-input has-toggle"
              type={showPw ? "text" : "password"}
              placeholder={`Password (min. ${PASSWORD_MIN_LENGTH} chars)`}
              value={password}
              onChange={e => {
                const nextPassword = e.target.value;
                setPassword(nextPassword);
                setFeedback(null);
                setFieldErrors(prev =>
                  prev.password
                    ? { ...prev, password: validateSignupForm({ name, email: email.trim(), password: nextPassword }).password }
                    : prev
                );
              }}
              onBlur={() =>
                setFieldErrors(prev => ({
                  ...prev,
                  password: validateSignupForm({ name, email: email.trim(), password }).password,
                }))
              }
              onKeyDown={onKey}
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby="signup-password-message"
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
          <div
            id="signup-password-message"
            className={`auth-field-msg ${fieldErrors.password ? "is-error" : ""}`.trim()}
          >
            {fieldErrors.password || `Use at least ${PASSWORD_MIN_LENGTH} characters. Adding letters, numbers, and symbols is recommended.`}
          </div>
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
        type="button"
        className="auth-btn m-signup"
        onClick={handleSignup}
        disabled={loading}
      >
        {loading && <span className="auth-spinner" />}
        {loading ? "Please wait..." : "Create Account  →"}
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
