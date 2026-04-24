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
.auth-field:focus-within .auth-field-icon {
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
.auth-field:focus-within .auth-field-line { transform: scaleX(1); }

/* ══════════════════════════════
   SHOW / HIDE PASSWORD
══════════════════════════════ */
.auth-pw-toggle {
  position: absolute; right: 14px; top: 50%;
  transform: translateY(-50%);
  border: none; background: transparent;
  cursor: pointer; z-index: 2;
  padding: 4px 6px;
  border-radius: 6px;
  font-family: 'Open Sans', sans-serif;
  font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
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
.auth-input.has-toggle { padding-right: 68px; }

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
}
.auth-strength-seg {
  flex: 1; height: 3px; border-radius: 999px;
  background: rgba(255,255,255,0.1);
  transition: background 0.3s ease;
}
.auth-root.light .auth-strength-seg { background: rgba(0,0,0,0.08); }
.auth-strength-seg.s-weak   { background: #ef4444; }
.auth-strength-seg.s-fair   { background: #f59e0b; }
.auth-strength-seg.s-good   { background: #10b981; }
.auth-strength-seg.s-strong { background: #00d4ff; }
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
    padding: 92px 18px 34px;
  }
  .auth-back-btn { top: 16px; left: 16px; padding: 9px 14px; font-size: 12px; }
  .auth-theme-btn { top: 16px; right: 16px; width: 42px; height: 42px; font-size: 18px; }
  .auth-card-wrap { width: min(100%, 460px); }
  .auth-card { width: 100%; padding: 38px 28px; }
  .auth-logo-row { margin-bottom: 28px; }
}
@media (max-width: 420px) {
  .auth-root { padding: 84px 14px 28px; }
  .auth-card { padding: 30px 20px; border-radius: 21px; }
  .auth-card-wrap { border-radius: 24px; }
  .auth-logo-row { gap: 10px; }
  .auth-logo-icon { width: 44px; height: 44px; border-radius: 13px; font-size: 22px; }
  .auth-logo-name { font-size: 20px; }
  .auth-logo-sub { font-size: 9px; letter-spacing: 1.3px; }
  .auth-tabs { margin-bottom: 22px; }
  .auth-tab, .auth-input, .auth-btn { font-size: 13px; }
  .auth-input { padding: 13px 44px 13px 44px; }
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

/* ══════════════════════════════════════════════
   PASSWORD STRENGTH HELPER
══════════════════════════════════════════════ */
function getStrength(pw) {
  if (!pw) return { level: 0, label: "" };
  let score = 0;
  if (pw.length >= 6)  score++;
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

/* ══════════════════════════════════════════════
   LOGIN COMPONENT
══════════════════════════════════════════════ */
export default function Login({ setUser, onBack }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [mode,     setMode]     = useState("login");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [dark,     setDark]     = useState(() => {
    try { return localStorage.getItem("tg-dark") !== "false"; } catch { return true; }
  });

  // Inject CSS once
  useEffect(() => {
    if (!document.getElementById("tg-auth-css")) {
      const s = document.createElement("style");
      s.id = "tg-auth-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => { try { localStorage.setItem("tg-dark", dark); } catch {} }, [dark]);

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
      setError(err.message.replace("Firebase: ", "").replace(/\(auth\/.*?\)\.?/g, "").trim());
    } finally {
      setLoading(false);
    }
  };

  const sw = (m) => { setMode(m); setError(""); setShowPw(false); };
  const onKey = e => { if (e.key === "Enter") handleAuth(); };

  const strength = mode === "signup" ? getStrength(password) : null;

  return (
    <div className={`auth-root ${dark ? "dark" : "light"}`}>
      {/* ── Layered background ── */}
      <div className="auth-grid" />
      <AuthCanvas dark={dark} />
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      {/* ── Floating shapes ── */}
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

      {/* ── Back button ── */}
      {onBack && (
        <button className="auth-back-btn" onClick={onBack}>
          ← Back
        </button>
      )}

      {/* ── Theme toggle ── */}
      <button className="auth-theme-btn" onClick={() => setDark(d => !d)}>
        {dark ? "☀️" : "🌙"}
      </button>

      {/* ══ CARD ══ */}
      <div className="auth-card-wrap">
        <div className={`auth-card ${dark ? "dark" : "light"}`}>

          {/* Logo */}
          <div className="auth-logo-row">
            <div className="auth-logo-icon">⬡</div>
            <div>
              <div className="auth-logo-name">TaskGraph</div>
              <div className="auth-logo-sub">Dependency Visualizer</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === "login"  ? "active" : ""}`} onClick={() => sw("login")}>
              Sign In
            </button>
            <button className={`auth-tab ${mode === "signup" ? "active" : ""}`} onClick={() => sw("signup")}>
              Create Account
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-err">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Fields */}
          <div className="auth-fields">
            {/* Email */}
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

            {/* Password */}
            <div className="auth-field">
              <span className="auth-field-icon">🔑</span>
              <input
                className={`auth-input has-toggle`}
                type={showPw ? "text" : "password"}
                placeholder={mode === "signup" ? "Password (min. 6 chars)" : "Password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={onKey}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              {/* Show / Hide toggle */}
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

            {/* Strength bar — signup only */}
            {mode === "signup" && password.length > 0 && strength && (
              <div className="auth-strength">
                <div className="auth-strength-bar">
                  {[1,2,3,4].map(n => (
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

          {/* Submit */}
          <button
            className={`auth-btn m-${mode}`}
            onClick={handleAuth}
            disabled={!email || !password || loading}
          >
            {loading && <span className="auth-spinner" />}
            {loading
              ? "Please wait…"
              : mode === "login"
              ? "Sign In  →"
              : "Create Account  →"}
          </button>

          {/* Footer */}
          <p className="auth-footer">
            {mode === "login"
              ? <>Don't have an account?{" "}
                  <button type="button" className="auth-link" onClick={() => sw("signup")}>
                    Sign up free
                  </button>
                </>
              : <>Already registered?{" "}
                  <button type="button" className="auth-link" onClick={() => sw("login")}>
                    Sign in
                  </button>
                </>}
          </p>
        </div>
      </div>
    </div>
  );
}