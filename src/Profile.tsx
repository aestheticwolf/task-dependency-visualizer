// @ts-nocheck
import React, { useEffect, useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebase";
import { getPasswordStrength, PASSWORD_MIN_LENGTH } from "./authValidation";
import { AuthLogo, AuthShell, useAuthStyles } from "./Login";
import { formatUserDisplayName, getUserInitial } from "./userDisplay";

const STRENGTH_CLS = ["", "s-weak", "s-fair", "s-good", "s-strong"];
const STRENGTH_LABEL_CLS = ["", "s-label-weak", "s-label-fair", "s-label-good", "s-label-strong"];

const PROFILE_CSS = `
.profile-auth-wrap {
  width: 100%;
  min-height: 100dvh;
  height: 100dvh;
  padding: 0 !important;
  border-radius: 0 !important;
  background: none !important;
  box-shadow: none !important;
  animation: none !important;
}
.profile-root .auth-back-btn,
.profile-root .auth-theme-btn {
  display: none !important;
}
.profile-auth-card {
  width: 100%;
  max-width: none;
  min-height: 100dvh;
  height: 100dvh;
  border-radius: 0 !important;
  padding: 26px 34px 30px;
  overflow-y: auto;
}
.dark .profile-auth-card {
  background:
    radial-gradient(circle at 88% 10%, rgba(124,58,237,0.16), transparent 28%),
    radial-gradient(circle at 80% 78%, rgba(0,212,255,0.12), transparent 26%),
    rgba(5,13,31,0.94) !important;
}
.light .profile-auth-card {
  background:
    radial-gradient(circle at 88% 10%, rgba(124,58,237,0.12), transparent 28%),
    radial-gradient(circle at 80% 78%, rgba(14,165,233,0.14), transparent 26%),
    rgba(255,255,255,0.9) !important;
}
.profile-shell {
  width: 100%;
  min-height: calc(100dvh - 56px);
  display: flex;
  flex-direction: column;
  gap: 26px;
}
.profile-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding-bottom: 18px;
}
.profile-topbar .auth-logo-row {
  margin-bottom: 0;
}
.profile-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.profile-toolbar-btn {
  height: 42px;
  border-radius: 13px;
  border: 1px solid transparent;
  padding: 0 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
}
.profile-toolbar-btn:hover {
  transform: translateY(-1px);
}
.profile-toolbar-btn--back {
  min-width: 116px;
}
.dark .profile-toolbar-btn--back {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.08);
  color: #cbd5e1;
}
.light .profile-toolbar-btn--back {
  background: rgba(255,255,255,0.82);
  border-color: rgba(15,23,42,0.08);
  color: #475569;
}
.dark .profile-toolbar-btn--back:hover {
  background: rgba(255,255,255,0.09);
  border-color: rgba(0,212,255,0.24);
  color: #f8fafc;
}
.light .profile-toolbar-btn--back:hover {
  background: rgba(255,255,255,0.95);
  border-color: rgba(14,165,233,0.22);
  color: #0f172a;
}
.profile-toolbar-btn--theme {
  width: 42px;
  padding: 0;
  border-radius: 50%;
}
.dark .profile-toolbar-btn--theme {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.12);
  color: #f8fafc;
  box-shadow: 0 10px 24px rgba(2,6,23,0.28);
}
.light .profile-toolbar-btn--theme {
  background: rgba(255,255,255,0.9);
  border-color: rgba(15,23,42,0.1);
  color: #0f172a;
  box-shadow: 0 10px 24px rgba(15,23,42,0.08);
}
.dark .profile-toolbar-btn--theme:hover {
  border-color: rgba(0,212,255,0.28);
}
.light .profile-toolbar-btn--theme:hover {
  border-color: rgba(14,165,233,0.22);
}
.profile-top {
  display: grid;
  gap: 26px;
  align-items: start;
}
.profile-head {
  display: grid;
  gap: 8px;
  margin-bottom: 2px;
  max-width: 720px;
  align-content: start;
}
.profile-kicker {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: #00d4ff;
}
.light .profile-kicker {
  color: #7c3aed;
}
.profile-title {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.6px;
}
.dark .profile-title {
  color: #f8fafc;
}
.light .profile-title {
  color: #0f172a;
}
.profile-sub {
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.65;
}
.dark .profile-sub {
  color: #94a3b8;
}
.light .profile-sub {
  color: #64748b;
}
.profile-summary {
  width: min(100%, 460px);
  justify-self: end;
  align-self: start;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  padding: 22px 24px;
}
.dark .profile-summary {
  background:
    radial-gradient(circle at top right, rgba(0,212,255,0.12), transparent 36%),
    rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 18px 48px rgba(2,6,23,0.34);
}
.light .profile-summary {
  background:
    radial-gradient(circle at top right, rgba(14,165,233,0.12), transparent 34%),
    rgba(255,255,255,0.88);
  border: 1px solid rgba(15,23,42,0.08);
  box-shadow: 0 18px 48px rgba(15,23,42,0.08);
}
.profile-summary::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.14), transparent 58%);
  pointer-events: none;
}
.profile-summary > * {
  position: relative;
  z-index: 1;
}
.profile-summary-top {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}
.profile-summary-avatar {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 800;
  color: white;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  box-shadow: 0 18px 34px rgba(59,130,246,0.2);
  flex-shrink: 0;
}
.profile-summary-copy {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 5px;
}
.profile-summary-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: #7c3aed;
}
.dark .profile-summary-label {
  color: #67e8f9;
}
.profile-summary-name {
  font-size: 21px;
  font-weight: 800;
  line-height: 1.15;
}
.dark .profile-summary-name {
  color: #f8fafc;
}
.light .profile-summary-name {
  color: #0f172a;
}
.profile-summary-email {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
  word-break: break-word;
}
.dark .profile-summary-email {
  color: #cbd5e1;
}
.light .profile-summary-email {
  color: #475569;
}
.profile-msg {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 13px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.55;
}
.profile-msg--success {
  background: rgba(16,185,129,0.12);
  border: 1px solid rgba(16,185,129,0.24);
  color: #6ee7b7;
}
.light .profile-msg--success {
  background: rgba(16,185,129,0.08);
  color: #047857;
}
.profile-msg--error {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.24);
  color: #fca5a5;
}
.light .profile-msg--error {
  background: rgba(239,68,68,0.08);
  color: #b91c1c;
}
.profile-grid {
  display: grid;
  gap: 18px;
}
.profile-card {
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  padding: 22px;
  position: relative;
  overflow: hidden;
}
.dark .profile-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 18px 48px rgba(2,6,23,0.34);
}
.light .profile-card {
  background: rgba(255,255,255,0.88);
  border: 1px solid rgba(15,23,42,0.08);
  box-shadow: 0 18px 48px rgba(15,23,42,0.08);
}
.profile-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.12), transparent 58%);
  pointer-events: none;
}
.profile-card > * {
  position: relative;
  z-index: 1;
}
.profile-card-head {
  display: grid;
  gap: 6px;
  margin-bottom: 16px;
}
.profile-card-title {
  font-size: 18px;
  font-weight: 800;
}
.profile-card-sub {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.55;
}
.dark .profile-card-sub {
  color: #94a3b8;
}
.light .profile-card-sub {
  color: #64748b;
}
.profile-readonly {
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
}
.dark .profile-readonly {
  background: rgba(15,23,42,0.5);
  border: 1px solid rgba(255,255,255,0.06);
  color: #cbd5e1;
}
.light .profile-readonly {
  background: rgba(248,250,252,0.92);
  border: 1px solid rgba(15,23,42,0.08);
  color: #334155;
}
.profile-readonly strong {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}
.profile-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 8px;
}
.profile-actions .auth-btn {
  animation: none;
  margin-top: 2px;
}
.profile-actions .auth-btn,
.profile-actions .auth-btn.m-login,
.profile-actions .auth-btn.m-signup {
  flex: 1 1 180px;
}
.profile-note {
  margin-top: 10px;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.55;
}
.profile-password-field .auth-field-msg {
  margin-top: 8px;
}
.profile-password-strength {
  margin-top: 6px;
}
.dark .profile-note {
  color: #64748b;
}
.light .profile-note {
  color: #64748b;
}
@media (min-width: 900px) {
  .profile-top {
    grid-template-columns: minmax(0, 1.1fr) minmax(360px, 460px);
  }
  .profile-grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
  }
  .profile-card {
    min-height: 100%;
  }
}
@media (max-width: 900px) {
  .profile-auth-wrap {
    height: auto;
  }
  .profile-auth-card {
    min-height: 100dvh;
    height: auto;
    padding: 24px 24px 28px;
  }
  .profile-summary {
    width: 100%;
    justify-self: stretch;
  }
}
@media (max-width: 720px) {
  .profile-auth-card {
    min-height: 100dvh;
    height: auto;
    padding: 18px 16px 22px;
  }
  .profile-shell {
    gap: 18px;
  }
  .profile-topbar {
    align-items: stretch;
    flex-direction: column;
    padding-bottom: 14px;
  }
  .profile-toolbar {
    justify-content: space-between;
  }
  .profile-toolbar-btn--back {
    min-width: 0;
    flex: 1;
  }
  .profile-head {
    max-width: none;
  }
  .profile-top {
    gap: 18px;
  }
  .profile-summary {
    padding: 18px 20px;
    border-radius: 18px;
  }
  .profile-card {
    padding: 18px;
    border-radius: 18px;
  }
}
@media (max-width: 420px) {
  .profile-auth-card {
    padding: 16px 12px 20px;
  }
  .profile-toolbar {
    gap: 8px;
  }
  .profile-summary {
    padding: 16px 14px;
  }
  .profile-title {
    font-size: 24px;
  }
  .profile-card {
    padding: 16px;
    border-radius: 16px;
  }
  .profile-actions {
    flex-direction: column;
  }
  .profile-actions .auth-btn,
  .profile-actions .auth-btn.m-login,
  .profile-actions .auth-btn.m-signup {
    flex-basis: auto;
    width: 100%;
  }
}
`;

function formatAuthMessage(error) {
  const code = error?.code || "";
  if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
    return "Your current password is incorrect.";
  }
  if (code === "auth/weak-password") {
    return "Choose a stronger password with at least 6 characters.";
  }
  if (code === "auth/requires-recent-login") {
    return "For security, please sign in again before changing your password.";
  }
  return (error?.message || "Something went wrong.")
    .replace("Firebase: ", "")
    .replace(/\(auth\/.*?\)\.?/g, "")
    .trim();
}

export default function Profile({ user, onBack, onProfileUpdated, darkTheme, setDarkTheme }) {
  useAuthStyles();
  const dark = Boolean(darkTheme);
  const setDark = setDarkTheme;
  const formattedUserName = formatUserDisplayName(user);
  const profileInitial = getUserInitial(user);
  const [displayName, setDisplayName] = useState(() => user?.displayName?.trim() || formattedUserName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const passwordStrength = newPassword ? getPasswordStrength(newPassword) : null;
  const confirmPasswordMismatch = Boolean(confirmPassword) && newPassword !== confirmPassword;

  useEffect(() => {
    const existing = document.getElementById("tg-profile-css");
    if (existing) {
      existing.textContent = PROFILE_CSS;
      return;
    }
    const style = document.createElement("style");
    style.id = "tg-profile-css";
    style.textContent = PROFILE_CSS;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    setDisplayName(user?.displayName?.trim() || formattedUserName);
  }, [formattedUserName, user?.displayName]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleNameSave = async () => {
    const nextName = displayName.trim();
    const currentUser = auth.currentUser;

    if (!nextName) {
      setSuccess("");
      setError("Name cannot be empty.");
      return;
    }
    if (!currentUser) {
      setSuccess("");
      setError("Your session has expired. Please sign in again.");
      return;
    }

    const existingName = currentUser.displayName?.trim() || "";
    if (nextName === existingName) {
      setError("");
      setSuccess("Your display name is already up to date.");
      return;
    }

    setSavingName(true);
    clearMessages();
    try {
      await updateProfile(currentUser, { displayName: nextName });
      onProfileUpdated?.(currentUser);
      setSuccess("Display name updated successfully.");
    } catch (err) {
      setError(formatAuthMessage(err));
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordSave = async () => {
    const currentUser = auth.currentUser;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setSuccess("");
      setError("Fill in your current password and new password first.");
      return;
    }
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setSuccess("");
      setError(`New password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setSuccess("");
      setError("New password and confirmation do not match.");
      return;
    }
    if (!currentUser?.email) {
      setSuccess("");
      setError("Your session has expired. Please sign in again.");
      return;
    }

    setSavingPassword(true);
    clearMessages();
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password updated successfully.");
      onProfileUpdated?.(currentUser);
    } catch (err) {
      setError(formatAuthMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  const onPasswordKeyDown = event => {
    if (event.key === "Enter") handlePasswordSave();
  };

  return (
    <AuthShell
      dark={dark}
      setDark={setDark}
      onBack={onBack}
      wrapClassName="profile-auth-wrap"
      cardClassName="profile-auth-card"
      rootClassName="profile-root"
      showBackButton={false}
      showThemeButton={false}
    >
      <div className="profile-shell">
        <div className="profile-topbar">
          <AuthLogo />
          <div className="profile-toolbar">
            <button
              className="profile-toolbar-btn profile-toolbar-btn--back"
              onClick={onBack}
              type="button"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <button
              className="profile-toolbar-btn profile-toolbar-btn--theme"
              onClick={() => setDark(value => !value)}
              type="button"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        <div className="profile-top">
          <div className="profile-head">
            <div className="profile-kicker">Profile</div>
            <div className="profile-title">Account Control</div>
            <div className="profile-sub">
              Update how your name appears in TaskGraph and change your password securely.
            </div>
          </div>

          <div className="profile-summary">
            <div className="profile-summary-top">
              <div className="profile-summary-avatar">{profileInitial}</div>
              <div className="profile-summary-copy">
                <div className="profile-summary-label">Account Identity</div>
                <div className="profile-summary-name">{formattedUserName}</div>
                <div className="profile-summary-email">{user?.email || "No email found"}</div>
              </div>
            </div>
          </div>
        </div>

        {success && (
          <div className="profile-msg profile-msg--success">
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="profile-msg profile-msg--error">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div className="profile-grid">
          <div className="profile-card">
            <div className="profile-card-head">
              <div className="profile-card-title">Display Name</div>
              <div className="profile-card-sub">
                This is the name shown in the dashboard sidebar and future account surfaces.
              </div>
            </div>

            <div className="profile-readonly">
              <strong>Email</strong>
              <span>{user?.email || "No email found"}</span>
            </div>

            <div className="auth-fields">
              <div className="auth-field">
                <div className="auth-input-row">
                  <span className="auth-field-icon">👤</span>
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="Display name"
                    value={displayName}
                    onChange={event => {
                      setDisplayName(event.target.value);
                      clearMessages();
                    }}
                    onKeyDown={event => {
                      if (event.key === "Enter") handleNameSave();
                    }}
                    autoComplete="name"
                  />
                  <div className="auth-field-line" />
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button
                className="auth-btn m-login"
                onClick={handleNameSave}
                disabled={!displayName.trim() || savingName}
              >
                {savingName ? "Saving name…" : "Save Name  →"}
              </button>
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-card-head">
              <div className="profile-card-title">Password</div>
              <div className="profile-card-sub">
                Confirm your current password before setting a new one.
              </div>
            </div>

            <div className="auth-fields">
              <div className="auth-field profile-password-field">
                <div className="auth-input-row">
                  <span className="auth-field-icon">🔒</span>
                  <input
                    className="auth-input"
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={event => {
                      setCurrentPassword(event.target.value);
                      clearMessages();
                    }}
                    onKeyDown={onPasswordKeyDown}
                    autoComplete="current-password"
                  />
                  <div className="auth-field-line" />
                </div>
                <div className="auth-field-msg">
                  Enter your current password to authorize this change.
                </div>
              </div>

              <div className="auth-field profile-password-field">
                <div className="auth-input-row">
                  <span className="auth-field-icon">✨</span>
                  <input
                    className="auth-input has-toggle"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New password"
                    value={newPassword}
                    onChange={event => {
                      setNewPassword(event.target.value);
                      clearMessages();
                    }}
                    onKeyDown={onPasswordKeyDown}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowNewPassword(value => !value)}
                    tabIndex={-1}
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                  <div className="auth-field-line" />
                </div>
                <div className="auth-field-msg">
                  {`Use at least ${PASSWORD_MIN_LENGTH} characters. A mix of letters, numbers, and symbols is recommended.`}
                </div>
                {passwordStrength && (
                  <div className="auth-strength profile-password-strength">
                    <div className="auth-strength-bar">
                      {[1, 2, 3, 4].map(index => (
                        <div
                          key={index}
                          className={`auth-strength-seg ${index <= passwordStrength.level ? STRENGTH_CLS[passwordStrength.level] : ""}`}
                        />
                      ))}
                    </div>
                    <span className={`auth-strength-label ${STRENGTH_LABEL_CLS[passwordStrength.level]}`}>
                      {passwordStrength.label} password
                    </span>
                  </div>
                )}
              </div>

              <div className="auth-field profile-password-field">
                <div className="auth-input-row">
                  <span className="auth-field-icon">✅</span>
                  <input
                    className="auth-input has-toggle"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={event => {
                      setConfirmPassword(event.target.value);
                      clearMessages();
                    }}
                    onKeyDown={onPasswordKeyDown}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowConfirmPassword(value => !value)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                  <div className="auth-field-line" />
                </div>
                {confirmPassword && (
                  <div className={`auth-field-msg ${confirmPasswordMismatch ? "is-error" : ""}`.trim()}>
                    {confirmPasswordMismatch
                      ? "This confirmation does not match your new password yet."
                      : "New password confirmed."}
                  </div>
                )}
              </div>
            </div>

            <div className="profile-actions">
              <button
                className="auth-btn m-signup"
                onClick={handlePasswordSave}
                disabled={!currentPassword || !newPassword || !confirmPassword || savingPassword}
              >
                {savingPassword ? "Updating password…" : "Change Password  →"}
              </button>
            </div>

            <div className="profile-note">
              {`Use at least ${PASSWORD_MIN_LENGTH} characters. If Firebase asks for a recent sign-in, simply log in again and retry.`}
            </div>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
