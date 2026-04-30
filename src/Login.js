import React, { useState, useEffect, useRef } from "react";
import { auth } from "./firebase";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import {
  formatAuthMessage,
  hasValidationErrors,
  validateEmailAddress,
  validateLoginForm,
} from "./authValidation";

/* ═══════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&display=swap');

.auth-root *, .auth-root *::before, .auth-root *::after {
  box-sizing: border-box; margin: 0; padding: 0;
}

.auth-root button,
.auth-root input {
  font: inherit;
}

.auth-root {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Open Sans', sans-serif;
  line-height: 1.5;
  position: relative; overflow: hidden;
  transition: background 0.5s ease;
}
.auth-root.dark  { background: #050d1f; color: #e2e8f0; }
.auth-root.light { background: #eef2ff; color: #1e293b; }

/* ══════════════════════════════
   ANIMATED BACKGROUND GRID
══════════════════════════════ */
.auth-grid {
  position: absolute; inset: 0;
  pointer-events: none; z-index: 0;
  overflow: hidden;
}

/* Scrolling grid lines */
.auth-grid::before {
  content: '';
  position: absolute; inset: -100%;
  background-image:
    linear-gradient(rgba(0,212,255,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,212,255,0.06) 1px, transparent 1px);
  background-size: 48px 48px;
  animation: auth-grid-scroll 18s linear infinite;
}
.light .auth-grid::before {
  background-image:
    linear-gradient(rgba(124,58,237,0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(124,58,237,0.07) 1px, transparent 1px);
}
@keyframes auth-grid-scroll {
  0%   { transform: translate(0, 0); }
  100% { transform: translate(48px, 48px); }
}

/* Radial fade over grid so edges vanish */
.auth-grid::after {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center,
    transparent 30%,
    rgba(5,13,31,0.85) 100%
  );
  pointer-events: none;
}
.auth-root.light .auth-grid::after {
  background: radial-gradient(ellipse at center,
    transparent 30%,
    rgba(238,242,255,0.88) 100%
  );
}

/* Canvas */
.auth-canvas {
  position: absolute; inset: 0;
  pointer-events: none; z-index: 1;
  width: 100%; height: 100%;
}

/* ══════════════════════════════
   FLOATING ORBS
══════════════════════════════ */
.auth-orb {
  position: absolute; border-radius: 50%;
  pointer-events: none; z-index: 1;
}
.auth-orb-1 {
  width: 520px; height: 520px;
  filter: blur(100px);
  top: -160px; left: -130px;
  animation: auth-orb-drift 13s ease-in-out infinite;
}
.dark  .auth-orb-1 { background: radial-gradient(circle, rgba(0,212,255,0.14), transparent 70%); }
.light .auth-orb-1 { background: radial-gradient(circle, rgba(124,58,237,0.13), transparent 70%); }

.auth-orb-2 {
  width: 420px; height: 420px;
  filter: blur(90px);
  bottom: -110px; right: -90px;
  animation: auth-orb-drift 16s ease-in-out infinite reverse;
  animation-delay: -3s;
}
.dark  .auth-orb-2 { background: radial-gradient(circle, rgba(124,58,237,0.11), transparent 70%); }
.light .auth-orb-2 { background: radial-gradient(circle, rgba(0,212,255,0.10), transparent 70%); }

.auth-orb-3 {
  width: 300px; height: 300px;
  filter: blur(80px);
  top: 50%; left: 58%;
  animation: auth-orb-drift 10s ease-in-out infinite;
  animation-delay: -6s;
}
.dark  .auth-orb-3 { background: radial-gradient(circle, rgba(16,185,129,0.09), transparent 70%); }
.light .auth-orb-3 { background: radial-gradient(circle, rgba(16,185,129,0.10), transparent 70%); }

@keyframes auth-orb-drift {
  0%,100% { transform: translate(0, 0) scale(1); }
  33%      { transform: translate(22px, -28px) scale(1.06); }
  66%      { transform: translate(-16px, 16px) scale(0.96); }
}

/* ══════════════════════════════
   FLOATING SHAPES (decorative)
══════════════════════════════ */
.auth-shapes {
  position: absolute; inset: 0;
  pointer-events: none; z-index: 1; overflow: hidden;
}
.auth-shape {
  position: absolute;
  border-radius: 4px;
  opacity: 0;
  animation: auth-shape-float linear infinite;
}
@keyframes auth-shape-float {
  0%   { opacity: 0; transform: translateY(0) rotate(0deg); }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(-100vh) rotate(720deg); }
}

/* ══════════════════════════════
   TOP BUTTONS
══════════════════════════════ */
.auth-theme-btn {
  position: fixed; top: 22px; right: 22px; z-index: 200;
  width: 46px; height: 46px; border-radius: 50%;
  border: 1.5px solid rgba(0,212,255,0.25);
  background: rgba(0,0,0,0.18);
  backdrop-filter: blur(18px);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 14px rgba(0,0,0,0.2);
}
.auth-theme-btn:hover {
  border-color: rgba(0,212,255,0.6);
  transform: rotate(22deg) scale(1.12);
  box-shadow: 0 0 28px rgba(0,212,255,0.35);
  background: rgba(0,212,255,0.1);
}

.auth-back-btn {
  position: fixed; top: 22px; left: 22px; z-index: 200;
  display: flex; align-items: center; gap: 7px;
  padding: 10px 18px;
  border-radius: 12px;
  border: 1.5px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.18);
  backdrop-filter: blur(18px);
  color: #94a3b8;
  font-family: 'Open Sans', sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: all 0.22s;
  box-shadow: 0 4px 14px rgba(0,0,0,0.15);
}
.auth-back-btn:hover {
  color: #f1f5f9;
  border-color: rgba(0,212,255,0.4);
  background: rgba(0,212,255,0.07);
  transform: translateX(-2px);
}

/* ══════════════════════════════
   CARD WITH SPINNING BORDER
══════════════════════════════ */
.auth-card-wrap {
  position: relative; z-index: 10;
  border-radius: 28px;
  padding: 3px;
  animation: auth-card-rise 0.8s cubic-bezier(0.16,1,0.3,1) both,
             auth-spin 5s linear infinite;
  background: conic-gradient(
    from var(--auth-angle, 0deg),
    rgba(0,212,255,0.8),
    rgba(124,58,237,0.8),
    rgba(16,185,129,0.5),
    rgba(0,212,255,0.8)
  );
  /* Soft outer glow that pulses */
  box-shadow: 0 0 40px rgba(0,212,255,0.12), 0 30px 80px rgba(0,0,0,0.4);
  animation: auth-card-rise 0.8s cubic-bezier(0.16,1,0.3,1) both,
             auth-spin 5s linear infinite,
             auth-wrap-glow 4s ease-in-out infinite;
}
@property --auth-angle {
  syntax: '<angle>'; initial-value: 0deg; inherits: false;
}
@keyframes auth-spin      { to { --auth-angle: 360deg; } }
@keyframes auth-card-rise {
  from { opacity: 0; transform: translateY(44px) scale(0.93); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes auth-wrap-glow {
  0%,100% { box-shadow: 0 0 40px rgba(0,212,255,0.12), 0 30px 80px rgba(0,0,0,0.4); }
  50%     { box-shadow: 0 0 60px rgba(124,58,237,0.18), 0 30px 80px rgba(0,0,0,0.4); }
}

/* ── Inner card ── */
.auth-card {
  width: 460px;
  border-radius: 25px;
  padding: 50px 44px;
  transition: background 0.4s;
  position: relative;
  overflow: hidden;
}
/* Subtle inner shimmer */
.auth-card::before {
  content: '';
  position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
  background: linear-gradient(105deg, transparent, rgba(255,255,255,0.04), transparent);
  animation: auth-card-shimmer 6s ease-in-out infinite;
}
@keyframes auth-card-shimmer {
  0%   { left: -60%; opacity: 0; }
  30%  { opacity: 1; }
  60%  { left: 130%; opacity: 0; }
  100% { left: 130%; opacity: 0; }
}

.dark  .auth-card { background: #070f26; }
.light .auth-card { background: rgba(255,255,255,0.97); }

/* ══════════════════════════════
   LOGO ROW
══════════════════════════════ */
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
  position: relative;
}
/* Ring ping on icon */
.auth-logo-icon::after {
  content: '';
  position: absolute; inset: -4px;
  border-radius: 19px;
  border: 1.5px solid rgba(0,212,255,0.35);
  animation: auth-icon-ring 3s ease-in-out infinite;
}
@keyframes auth-icon-pulse {
  0%,100% { box-shadow: 0 0 22px rgba(0,212,255,0.4); }
  50%      { box-shadow: 0 0 44px rgba(124,58,237,0.6); }
}
@keyframes auth-icon-ring {
  0%,100% { transform: scale(1); opacity: 0.7; }
  50%      { transform: scale(1.12); opacity: 0; }
}

.auth-logo-name {
  font-family: 'Open Sans', sans-serif;
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

/* ══════════════════════════════
   MODE TABS
══════════════════════════════ */
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
  font-family: 'Open Sans', sans-serif;
  font-size: 14px; font-weight: 700;
  cursor: pointer; transition: all 0.22s ease; background: transparent;
  position: relative; overflow: hidden;
}
.dark  .auth-tab { color: #475569; }
.light .auth-tab { color: #94a3b8; }

.auth-tab.active {
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  color: white !important;
  box-shadow: 0 4px 18px rgba(0,212,255,0.28);
}
.auth-tab.active::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(rgba(255,255,255,0.12), transparent);
  pointer-events: none;
}
.dark  .auth-tab:not(.active):hover { color: #94a3b8; background: rgba(255,255,255,0.05); }
.light .auth-tab:not(.active):hover { color: #475569; background: rgba(0,0,0,0.05); }

/* ══════════════════════════════
   ERROR BANNER
══════════════════════════════ */
.auth-err {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 14px 16px; border-radius: 12px;
  margin-bottom: 20px;
  font-size: 13.5px; font-weight: 500; line-height: 1.5;
  animation: auth-err-in 0.28s cubic-bezier(0.16,1,0.3,1);
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.25);
  color: #fca5a5;
}
.light .auth-err { color: #b91c1c; background: rgba(239,68,68,0.07); border-color: rgba(239,68,68,0.2); }
.auth-err.is-success {
  background: rgba(16,185,129,0.11);
  border-color: rgba(16,185,129,0.28);
  color: #86efac;
}
.light .auth-err.is-success {
  color: #047857;
  background: rgba(16,185,129,0.09);
  border-color: rgba(16,185,129,0.22);
}
@keyframes auth-err-in {
  from { opacity: 0; transform: translateY(-12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ══════════════════════════════
   FIELDS
══════════════════════════════ */
.auth-fields { display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; }
.auth-field  {
  position: relative;
  animation: auth-field-in 0.5s cubic-bezier(0.16,1,0.3,1) both;
}
.auth-input-row {
  position: relative;
}
.auth-field:nth-child(1) { animation-delay: 0.1s; }
.auth-field:nth-child(2) { animation-delay: 0.18s; }
@keyframes auth-field-in {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
}

.auth-field-icon {
  position: absolute; left: 15px; top: 50%;
  transform: translateY(-50%); font-size: 17px;
  pointer-events: none; z-index: 1;
  transition: transform 0.2s;
}
/* Icon floats up slightly on focus */
.auth-input-row:focus-within .auth-field-icon {
  transform: translateY(-55%);
}

.auth-input {
  width: 100%; padding: 15px 48px 15px 48px;
  border-radius: 12px;
  font-family: 'Open Sans', sans-serif;
  font-size: 14px; font-weight: 500; outline: none;
  transition: all 0.22s ease;
}
.dark  .auth-input {
  background: rgba(255,255,255,0.05);
  border: 1.5px solid rgba(255,255,255,0.09);
  color: #f1f5f9;
}
.light .auth-input {
  background: #f8fafc;
  border: 1.5px solid #dde5f0;
  color: #1e293b;
}
.auth-input::placeholder { color: #475569; font-weight: 400; }
.light .auth-input::placeholder { color: #94a3b8; }

.dark  .auth-input:focus {
  border-color: #00d4ff;
  box-shadow: 0 0 0 4px rgba(0,212,255,0.1), 0 2px 8px rgba(0,212,255,0.1);
  background: rgba(0,212,255,0.04);
}
.light .auth-input:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 4px rgba(124,58,237,0.1), 0 2px 8px rgba(124,58,237,0.08);
  background: rgba(124,58,237,0.03);
}

/* Animated focus underline */
.auth-field-line {
  position: absolute; bottom: 0; left: 12px; right: 12px;
  height: 2px; border-radius: 999px;
  background: linear-gradient(90deg, #00d4ff, #7c3aed);
  transform: scaleX(0); transform-origin: left;
  transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
  pointer-events: none;
}
.auth-input-row:focus-within .auth-field-line { transform: scaleX(1); }
.auth-field-msg {
  margin-top: 8px;
  padding: 0 2px;
  font-size: 12px;
  line-height: 1.45;
}
.dark .auth-field-msg { color: #64748b; }
.light .auth-field-msg { color: #94a3b8; }
.auth-field-msg.is-error { color: #fca5a5; }
.light .auth-field-msg.is-error { color: #b91c1c; }
.auth-field-meta {
  flex: 1;
  min-height: 20px;
}
.auth-inline-actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
}
.auth-inline-actions .auth-field-msg {
  margin-top: 0;
}
.auth-text-btn {
  border: none;
  background: transparent;
  padding: 0;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s ease;
}
.dark .auth-text-btn { color: #00d4ff; }
.light .auth-text-btn { color: #7c3aed; }
.auth-text-btn:hover:not(:disabled) { opacity: 0.8; }
.auth-text-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ══════════════════════════════
   SHOW / HIDE PASSWORD
══════════════════════════════ */
.auth-pw-toggle {
  position: absolute; right: 10px; top: 50%;
  transform: translateY(-50%);
  border: none; background: transparent;
  cursor: pointer; z-index: 2;
  min-width: 58px;
  height: calc(100% - 10px);
  padding: 0 10px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Open Sans', sans-serif;
  font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
  line-height: 1;
  text-align: center;
  text-transform: uppercase;
  transition: all 0.18s ease;
}
.dark  .auth-pw-toggle { color: #475569; }
.light .auth-pw-toggle { color: #94a3b8; }
.dark  .auth-pw-toggle:hover {
  color: #00d4ff;
  background: rgba(0,212,255,0.08);
}
.light .auth-pw-toggle:hover {
  color: #7c3aed;
  background: rgba(124,58,237,0.07);
}
/* Input with toggle needs right padding increased */
.auth-input.has-toggle { padding-right: 88px; }

/* ══════════════════════════════
   STRENGTH BAR (signup only)
══════════════════════════════ */
.auth-strength {
  margin-top: -6px;
  display: flex; flex-direction: column; gap: 5px;
  animation: auth-field-in 0.3s ease both;
}
.auth-strength-bar {
  display: flex; gap: 4px;
  padding: 2px 0;
}
.auth-strength-seg {
  flex: 1; height: 4px; border-radius: 999px;
  background: rgba(255,255,255,0.1);
  transition: background 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
}
.auth-root.light .auth-strength-seg { background: rgba(0,0,0,0.08); }
.auth-root .auth-strength-seg.s-weak {
  background: linear-gradient(90deg, #f87171, #ef4444);
  box-shadow: 0 0 0 1px rgba(239,68,68,0.12), 0 0 10px rgba(239,68,68,0.22);
}
.auth-root .auth-strength-seg.s-fair {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  box-shadow: 0 0 0 1px rgba(245,158,11,0.12), 0 0 10px rgba(245,158,11,0.2);
}
.auth-root .auth-strength-seg.s-good {
  background: linear-gradient(90deg, #34d399, #10b981);
  box-shadow: 0 0 0 1px rgba(16,185,129,0.12), 0 0 10px rgba(16,185,129,0.2);
}
.auth-root .auth-strength-seg.s-strong {
  background: linear-gradient(90deg, #22d3ee, #00d4ff);
  box-shadow: 0 0 0 1px rgba(0,212,255,0.12), 0 0 10px rgba(0,212,255,0.2);
}
.auth-strength-label {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.5px;
  transition: color 0.3s;
}
.s-label-weak   { color: #ef4444; }
.s-label-fair   { color: #f59e0b; }
.s-label-good   { color: #10b981; }
.s-label-strong { color: #00d4ff; }

/* ══════════════════════════════
   SUBMIT BUTTON
══════════════════════════════ */
.auth-btn {
  width: 100%; padding: 16px;
  border: none; border-radius: 13px;
  font-family: 'Open Sans', sans-serif;
  font-size: 15px; font-weight: 800;
  cursor: pointer; letter-spacing: -0.2px;
  position: relative; overflow: hidden;
  transition: all 0.22s ease;
  animation: auth-field-in 0.5s ease 0.28s both;
}
/* Shimmer sweep on hover */
.auth-btn::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 60%; height: 100%;
  background: linear-gradient(105deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.4s ease;
  pointer-events: none;
}
.auth-btn:hover:not(:disabled)::before { left: 150%; }

.auth-btn::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(rgba(255,255,255,0.13), transparent);
  opacity: 0; transition: opacity 0.2s;
}
.auth-btn:hover:not(:disabled)::after { opacity: 1; }
.auth-btn:hover:not(:disabled)  { transform: translateY(-2px); }
.auth-btn:active:not(:disabled) { transform: translateY(0); }
.auth-btn:disabled { opacity: 0.38; cursor: not-allowed; transform: none !important; }

.auth-btn.m-login {
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 8px 30px rgba(0,212,255,0.35);
}
.auth-btn.m-login:hover:not(:disabled) { box-shadow: 0 12px 40px rgba(0,212,255,0.52); }

.auth-btn.m-signup {
  background: linear-gradient(135deg, #10b981 0%, #0d9488 100%);
  color: white;
  box-shadow: 0 8px 30px rgba(16,185,129,0.32);
}
.auth-btn.m-signup:hover:not(:disabled) { box-shadow: 0 12px 40px rgba(16,185,129,0.5); }

@keyframes auth-spin-anim { to { transform: rotate(360deg); } }
.auth-spinner {
  display: inline-block; width: 16px; height: 16px;
  border: 2.5px solid rgba(255,255,255,0.3); border-top-color: white;
  border-radius: 50%; animation: auth-spin-anim 0.65s linear infinite;
  margin-right: 10px; vertical-align: middle;
}

/* ══════════════════════════════
   FOOTER LINK
══════════════════════════════ */
.auth-footer {
  text-align: center; font-size: 13px;
  margin-top: 20px; font-weight: 500; transition: color 0.3s;
  animation: auth-field-in 0.5s ease 0.35s both;
}
.dark  .auth-footer { color: #475569; }
.light .auth-footer { color: #94a3b8; }

.auth-footer .auth-link {
  border: none; background: transparent; padding: 0;
  font: inherit; font-weight: 800;
  text-decoration: none; transition: opacity 0.2s; cursor: pointer;
  position: relative;
}
.auth-footer .auth-link::after {
  content: '';
  position: absolute; bottom: -1px; left: 0; right: 0;
  height: 1.5px; border-radius: 999px;
  background: currentColor;
  transform: scaleX(0); transform-origin: left;
  transition: transform 0.22s ease;
}
.auth-footer .auth-link:hover::after { transform: scaleX(1); }

.dark  .auth-footer .auth-link { color: #00d4ff; }
.light .auth-footer .auth-link { color: #7c3aed; }
.auth-footer .auth-link:hover { opacity: 0.8; }

/* ══════════════════════════════
   DIVIDER
══════════════════════════════ */
.auth-divider {
  display: flex; align-items: center; gap: 12px;
  margin: 4px 0 20px;
}
.auth-divider-line {
  flex: 1; height: 1px;
  background: linear-gradient(90deg, transparent, var(--dl-c), transparent);
}
.dark  .auth-divider-line { --dl-c: rgba(255,255,255,0.08); }
.light .auth-divider-line { --dl-c: rgba(0,0,0,0.08); }
.auth-divider-text {
  font-size: 11px; font-weight: 700; letter-spacing: 0.8px;
  text-transform: uppercase;
}
.dark  .auth-divider-text { color: #334155; }
.light .auth-divider-text { color: #cbd5e1; }

/* ══════════════════════════════
   RESPONSIVE
══════════════════════════════ */
@media (max-width: 720px) {
  .auth-root {
    align-items: flex-start; justify-content: center;
    min-height: 100dvh; overflow-y: auto;
    padding: 78px 14px 24px;
  }
  .auth-back-btn { top: 14px; left: 14px; padding: 8px 12px; font-size: 12px; border-radius: 10px; }
  .auth-theme-btn { top: 14px; right: 14px; width: 40px; height: 40px; font-size: 17px; }
  .auth-card-wrap { width: min(100%, 392px); border-radius: 24px; }
  .auth-card { width: 100%; padding: 30px 20px; border-radius: 21px; }
  .auth-logo-row { margin-bottom: 22px; gap: 12px; }
  .auth-tabs { margin-bottom: 20px; }
  .auth-tab { padding: 10px 6px; font-size: 13px; }
  .auth-fields { gap: 12px; margin-bottom: 20px; }
  .auth-err { padding: 12px 14px; font-size: 12.5px; margin-bottom: 16px; }
  .auth-footer { font-size: 12px; text-align: center; }
  .auth-orb-1 { width: 360px; height: 360px; filter: blur(76px); }
  .auth-orb-2 { width: 280px; height: 280px; filter: blur(64px); }
  .auth-orb-3 { width: 220px; height: 220px; filter: blur(56px); left: 50%; }
}
@media (max-width: 420px) {
  .auth-root { padding: 72px 12px 20px; }
  .auth-card { padding: 24px 16px; border-radius: 18px; }
  .auth-card-wrap { border-radius: 21px; width: 100%; }
  .auth-logo-row { gap: 10px; }
  .auth-logo-icon { width: 44px; height: 44px; border-radius: 13px; font-size: 22px; }
  .auth-logo-name { font-size: 18px; }
  .auth-logo-sub { font-size: 8px; letter-spacing: 1.1px; }
  .auth-tabs { margin-bottom: 18px; }
  .auth-tab, .auth-input, .auth-btn { font-size: 12.5px; }
  .auth-input { padding: 12px 40px 12px 40px; }
  .auth-pw-toggle { right: 12px; font-size: 11px; }
  .auth-field-icon { left: 14px; font-size: 13px; }
  .auth-inline-actions { flex-direction: column; gap: 8px; }
  .auth-field-meta { min-height: 0; }
}
/* ── Animated logo SVG ── */
@keyframes tlg-draw {
  0%   { stroke-dashoffset: 28; opacity: 0; }
  18%  { opacity: 1; }
  65%  { stroke-dashoffset: 0; opacity: 1; }
  100% { stroke-dashoffset: -28; opacity: 0; }
}

`;

/* ══════════════════════════════════════════════
   FLOATING SHAPES (rendered in JSX)
══════════════════════════════════════════════ */
const SHAPES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  size:  6 + Math.random() * 10,
  left:  Math.random() * 100,
  delay: Math.random() * 18,
  dur:   12 + Math.random() * 14,
  rotate: Math.random() * 360,
  opacity: 0.12 + Math.random() * 0.18,
}));

/* ══════════════════════════════════════════════
   PARTICLE CANVAS
══════════════════════════════════════════════ */
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
        x:  Math.random() * window.innerWidth,
        y:  Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.38,
        vy: (Math.random() - 0.5) * 0.38,
        r:  Math.random() * 1.6 + 0.3,
        a:  Math.random() * 0.55 + 0.05,
      }));
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const rgb = dark ? "0,212,255" : "124,58,237";
      pts.current.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${p.a})`; ctx.fill();
      });
      for (let i = 0; i < pts.current.length; i++) {
        for (let j = i + 1; j < pts.current.length; j++) {
          const dx = pts.current[i].x - pts.current[j].x;
          const dy = pts.current[i].y - pts.current[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 145) {
            ctx.beginPath();
            ctx.moveTo(pts.current[i].x, pts.current[i].y);
            ctx.lineTo(pts.current[j].x, pts.current[j].y);
            ctx.strokeStyle = `rgba(${rgb},${(1 - d / 145) * 0.11})`;
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

export function useAuthStyles() {
  useEffect(() => {
    const existing = document.getElementById("tg-auth-css");
    if (existing) {
      existing.textContent = CSS;
      return;
    }
    const s = document.createElement("style");
    s.id = "tg-auth-css"; s.textContent = CSS;
    document.head.appendChild(s);
  }, []);
}

export function AuthLogo() {
  return (
    <div className="auth-logo-row">
      <div className="auth-logo-icon" style={{overflow:'hidden'}}>
        <svg width="100%" height="100%" viewBox="0 0 52 52" fill="none" style={{position:'absolute',inset:0}}>
          {[
            {x1:13,y1:17,x2:26,y2:12,d:0},
            {x1:26,y1:12,x2:39,y2:21,d:0.7},
            {x1:39,y1:21,x2:26,y2:40,d:1.4},
            {x1:13,y1:17,x2:26,y2:40,d:2.1},
          ].map((l,i)=>(
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round"
              style={{strokeDasharray:28,strokeDashoffset:28,
                animation:`tlg-draw 2.8s ease-in-out ${l.d}s infinite`}}/>
          ))}
          {[{cx:13,cy:17,r:3},{cx:26,cy:12,r:3},{cx:39,cy:21,r:3},{cx:26,cy:40,r:3.8}].map((c,i)=>(
            <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="white"
              style={{animation:`tlg-draw 2.8s ease-in-out ${i*0.5}s infinite`,
                strokeDasharray:'none',strokeDashoffset:0,opacity:0.9}}/>
          ))}
        </svg>
      </div>
      <div>
        <div className="auth-logo-name">TaskGraph</div>
        <div className="auth-logo-sub">Dependency Visualizer</div>
      </div>
    </div>
  );
}

export function AuthTabs({activeMode, onSelectLogin, onSelectSignup}) {
  return (
    <div className="auth-tabs">
      <button className={`auth-tab ${activeMode === "login" ? "active" : ""}`} onClick={onSelectLogin}>
        Sign In
      </button>
      <button className={`auth-tab ${activeMode === "signup" ? "active" : ""}`} onClick={onSelectSignup}>
        Create Account
      </button>
    </div>
  );
}

export function AuthShell({
  dark,
  setDark,
  onBack,
  children,
  wrapClassName = "",
  cardClassName = "",
  rootClassName = "",
  showBackButton = true,
  showThemeButton = true,
}) {
  return (
    <div className={`auth-root ${dark ? "dark" : "light"} ${rootClassName}`.trim()}>
      <div className="auth-grid" />
      <AuthCanvas dark={dark} />
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className="auth-shapes" aria-hidden="true">
        {SHAPES.map(sh => (
          <div
            key={sh.id}
            className="auth-shape"
            style={{
              left:           `${sh.left}%`,
              bottom:         `-${sh.size * 2}px`,
              width:          `${sh.size}px`,
              height:         `${sh.size}px`,
              borderRadius:   sh.id % 3 === 0 ? "50%" : sh.id % 3 === 1 ? "3px" : "0",
              background:     dark
                ? `rgba(0,212,255,${sh.opacity})`
                : `rgba(124,58,237,${sh.opacity})`,
              animationDuration:  `${sh.dur}s`,
              animationDelay:     `${sh.delay}s`,
              transform:          `rotate(${sh.rotate}deg)`,
            }}
          />
        ))}
      </div>

      {showBackButton && onBack && (
        <button className="auth-back-btn" onClick={onBack}>
          ← Back
        </button>
      )}

      {showThemeButton && (
        <button className="auth-theme-btn" onClick={() => setDark(d => !d)}>
          {dark ? "☀️" : "🌙"}
        </button>
      )}

      <div className={`auth-card-wrap ${wrapClassName}`.trim()}>
        <div className={`auth-card ${dark ? "dark" : "light"} ${cardClassName}`.trim()}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   LOGIN COMPONENT
══════════════════════════════════════════════ */
export default function Login({ onModeChange, onAuthSuccess, onBack, darkTheme, setDarkTheme }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  useAuthStyles();
  const dark = Boolean(darkTheme);
  const setDark = setDarkTheme;
  const busy = loading || resetting;

  const handleAuth = async () => {
    const trimmedEmail = email.trim();
    const nextErrors = validateLoginForm({ email: trimmedEmail, password });

    setFieldErrors(nextErrors);
    setFeedback(null);

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    setLoading(true);
    setEmail(trimmedEmail);
    try {
      const res = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      onAuthSuccess?.(res.user);
    } catch (err) {
      setFeedback({ type: "error", message: formatAuthMessage(err, "login") });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const trimmedEmail = email.trim();
    const emailError = validateEmailAddress(trimmedEmail);

    setFeedback(null);
    setFieldErrors(prev => ({ ...prev, email: emailError }));

    if (emailError) {
      return;
    }

    setResetting(true);
    setEmail(trimmedEmail);

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setFeedback({
        type: "success",
        message: "If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder.",
      });
    } catch (err) {
      setFeedback({ type: "error", message: formatAuthMessage(err, "passwordReset") });
    } finally {
      setResetting(false);
    }
  };

  const goToSignup = () => {
    setFeedback(null);
    setFieldErrors({ email: "", password: "" });
    setShowPw(false);
    onModeChange?.("signup");
  };
  const onKey = e => { if (e.key === "Enter") handleAuth(); };

  return (
    <AuthShell dark={dark} setDark={setDark} onBack={onBack}>
      <AuthLogo />
      <AuthTabs
        activeMode="login"
        onSelectLogin={() => {}}
        onSelectSignup={goToSignup}
      />

      {feedback?.message && (
        <div
          className={`auth-err ${feedback.type === "success" ? "is-success" : ""}`.trim()}
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          <span>{feedback.type === "success" ? "OK" : "!"}</span>
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="auth-fields">
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
              aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
            />
            <div className="auth-field-line" />
          </div>
          {fieldErrors.email && (
            <div id="login-email-error" className="auth-field-msg is-error">
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
              placeholder="Password"
              value={password}
              onChange={e => {
                const nextPassword = e.target.value;
                setPassword(nextPassword);
                setFeedback(null);
                setFieldErrors(prev =>
                  prev.password
                    ? { ...prev, password: validateLoginForm({ email: email.trim(), password: nextPassword }).password }
                    : prev
                );
              }}
              onBlur={() =>
                setFieldErrors(prev => ({
                  ...prev,
                  password: validateLoginForm({ email: email.trim(), password }).password,
                }))
              }
              onKeyDown={onKey}
              autoComplete="current-password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
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
          <div className="auth-inline-actions">
            <div className="auth-field-meta">
              {fieldErrors.password && (
                <div id="login-password-error" className="auth-field-msg is-error">
                  {fieldErrors.password}
                </div>
              )}
            </div>
            <button
              type="button"
              className="auth-text-btn"
              onClick={handlePasswordReset}
              disabled={busy}
            >
              {resetting ? "Sending reset link..." : "Forgot password?"}
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="auth-btn m-login"
        onClick={handleAuth}
        disabled={busy}
      >
        {loading && <span className="auth-spinner" />}
        {loading ? "Please wait..." : "Sign In  →"}
      </button>

      <p className="auth-footer">
        Don't have an account?{" "}
        <button type="button" className="auth-link" onClick={goToSignup}>
          Sign up free
        </button>
      </p>
    </AuthShell>
  );
}
