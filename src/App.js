import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactFlow from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { db, auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Login from "./Login";
import Landing from "./Landing";
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, onSnapshot, updateDoc,
} from "firebase/firestore";
import { MiniMap, Controls, Background, Position } from "reactflow";

/* ═══════════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════════ */
const APP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

button, input, select, textarea {
  font: inherit;
}

/* ══ Theme tokens ══ */
.tgd { /* dark */
  --bg:         #050d1f;
  --panel-bg:   rgba(7,15,40,0.97);
  --card:       rgba(255,255,255,0.04);
  --card-hov:   rgba(0,212,255,0.06);
  --border:     rgba(255,255,255,0.08);
  --border-hi:  rgba(0,212,255,0.3);
  --text-1:     #f8fafc;
  --text-2:     #94a3b8;
  --text-3:     #475569;
  --input-bg:   rgba(255,255,255,0.05);
  --graph-bg:   #030b1a;
  --accent:     #00d4ff;
  --accent2:    #7c3aed;
  --status-complete: #10b981;
  --status-pending:  #f59e0b;
  --status-blocked:  #ef4444;
  --status-complete-bg: rgba(16,185,129,0.14);
  --status-pending-bg:  rgba(245,158,11,0.13);
  --status-blocked-bg:  rgba(239,68,68,0.12);
}
.tgl { /* light */
  --bg:         #f0f4ff;
  --panel-bg:   rgba(255,255,255,0.98);
  --card:       rgba(0,0,0,0.03);
  --card-hov:   rgba(124,58,237,0.05);
  --border:     rgba(0,0,0,0.08);
  --border-hi:  rgba(124,58,237,0.35);
  --text-1:     #0f172a;
  --text-2:     #475569;
  --text-3:     #94a3b8;
  --input-bg:   #f8fafc;
  --graph-bg:   #e8eeff;
  --accent:     #7c3aed;
  --accent2:    #00d4ff;
  --status-complete: #059669;
  --status-pending:  #d97706;
  --status-blocked:  #dc2626;
  --status-complete-bg: rgba(209,250,229,0.88);
  --status-pending-bg:  rgba(254,243,199,0.9);
  --status-blocked-bg:  rgba(254,226,226,0.88);
}

/* ══ App shell ══ */
.tg-shell {
  display: flex; height: 100vh; overflow: hidden;
  font-family: 'Open Sans', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  background: var(--bg);
  transition: background 0.4s;
}

/* ══ Panel ══ */
.tg-panel {
  width: 300px; flex-shrink: 0;
  background: var(--panel-bg);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  overflow: hidden;
  transition: background 0.4s, border-color 0.4s;
  box-shadow: 18px 0 50px rgba(15,23,42,0.08);
  animation: tg-slide-in 0.4s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes tg-slide-in {
  from { opacity: 0; transform: translateX(-18px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ── Panel header ── */
.tg-panel-head {
  padding: 16px 16px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0; display: flex; flex-direction: column;
  align-items: stretch; justify-content: flex-start; gap: 12px;
  background:
    radial-gradient(circle at top left, rgba(0,212,255,0.09), transparent 45%),
    linear-gradient(180deg, rgba(255,255,255,0.05), transparent);
}
.tg-brand-row {
  display: flex; align-items: center; gap: 10px;
  min-width: 0;
}
.tg-brand-row > div:last-child {
  min-width: 0;
}
.tg-brand-icon {
  width: 36px; height: 36px; border-radius: 11px;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
  animation: tg-glow 3s ease-in-out infinite;
}
@keyframes tg-glow {
  0%,100% { box-shadow: 0 0 14px rgba(0,212,255,0.35); }
  50%      { box-shadow: 0 0 28px rgba(124,58,237,0.5); }
}
.tg-brand-name {
  font-family: 'Open Sans', sans-serif;
  font-size: 15px; font-weight: 800; letter-spacing: -0.4px;
  color: var(--text-1); line-height: 1;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tg-brand-tag {
  font-size: 9px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1.1px;
  color: var(--accent); margin-top: 3px; line-height: 1.25;
}
.tg-head-actions {
  display: flex; gap: 8px; align-items: center;
  width: 100%;
}
.tg-icon-btn {
  width: 36px; height: 36px; border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--text-2); font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
  flex: 0 0 36px;
}
.tg-icon-btn:hover {
  border-color: var(--border-hi);
  background: var(--card-hov);
  color: var(--text-1);
}
.tg-logout-btn {
  display: flex; align-items: center; gap: 6px;
  justify-content: center;
  min-width: 0; height: 36px; flex: 1;
  padding: 0 12px; border-radius: 10px;
  border: 1px solid rgba(239,68,68,0.2);
  background: rgba(239,68,68,0.06);
  color: #f87171;
  font-family: 'Open Sans', sans-serif;
  font-size: 12.5px; font-weight: 800;
  line-height: 1; white-space: nowrap;
  cursor: pointer; transition: all 0.2s;
}
.tg-logout-btn span {
  display: inline-flex; align-items: center;
  font-size: 14px; line-height: 1;
}
.tg-logout-btn:hover {
  background: rgba(239,68,68,0.14);
  border-color: rgba(239,68,68,0.4);
}

/* ── User pill ── */
.tg-user-pill {
  margin: 12px 16px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  display: flex; align-items: center; gap: 10px;
  flex-shrink: 0;
}
.tg-user-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; color: white;
  flex-shrink: 0;
}
.tg-user-email {
  font-size: 11.5px; font-weight: 600; color: var(--text-2);
  line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  min-width: 0;
}

/* ── Panel body (scrollable) ── */
.tg-panel-body {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  padding: 14px 14px 20px;
  display: flex; flex-direction: column; gap: 10px;
  scrollbar-gutter: stable;
}
.tg-panel-body::-webkit-scrollbar { width: 3px; }
.tg-panel-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 9px; }

/* ── Stats grid ── */
.tg-stats {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.tg-stat {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 13px; padding: 13px 15px;
  min-height: 70px;
  display: flex; flex-direction: column; justify-content: center;
  transition: all 0.22s; cursor: default;
  animation: tg-pop 0.5s ease both;
}
@keyframes tg-pop {
  from { opacity: 0; transform: scale(0.93) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.tg-stat:nth-child(1) { animation-delay:0.05s; }
.tg-stat:nth-child(2) { animation-delay:0.1s; }
.tg-stat:nth-child(3) { animation-delay:0.15s; }
.tg-stat:nth-child(4) { animation-delay:0.2s; }
.tg-stat:hover {
  border-color: var(--border-hi);
  background: var(--card-hov);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.15);
}
.tg-stat-label {
  font-size: 9.5px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.9px;
  color: var(--text-3); margin-bottom: 5px;
}
.tg-stat-val {
  font-family: 'Open Sans', sans-serif;
  font-size: 26px; font-weight: 800; line-height: 1;
  font-variant-numeric: tabular-nums;
}

/* ── Progress ── */
.tg-prog-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 13px; padding: 13px 15px;
  transition: all 0.22s;
}
.tg-prog-card:hover { border-color: var(--border-hi); }
.tg-prog-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 9px;
}
.tg-prog-label {
  font-size: 9.5px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.9px; color: var(--text-3);
}
.tg-prog-pct {
  font-family: 'Open Sans', sans-serif;
  font-size: 13px; font-weight: 800; color: var(--accent);
}
.tg-prog-track {
  height: 6px; background: var(--border);
  border-radius: 999px; overflow: hidden;
}
.tg-prog-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, var(--status-complete), var(--accent));
  transition: width 0.65s cubic-bezier(0.4,0,0.2,1);
}
.tg-prog-sub {
  margin-top: 8px; font-size: 11.5px; font-weight: 600;
  color: var(--status-blocked); display: flex; align-items: center; gap: 5px;
}

/* ── Section card ── */
.tg-section {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 13px; padding: 14px 15px;
  display: flex; flex-direction: column; gap: 9px;
  box-shadow: 0 10px 26px rgba(15,23,42,0.04);
  transition: all 0.22s;
}
.tg-section:hover { border-color: var(--border-hi); }
.tg-sec-label {
  font-size: 9.5px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.9px;
  color: var(--text-3);
}

/* ── Status colors ── */
.tg-dot {
  width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0;
  box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 12%, transparent);
}
.tg-status-complete { color: var(--status-complete); }
.tg-status-pending  { color: var(--status-pending); }
.tg-status-blocked  { color: var(--status-blocked); }
.tg-status-complete .tg-dot { background: var(--status-complete); }
.tg-status-pending .tg-dot  { background: var(--status-pending); }
.tg-status-blocked .tg-dot  { background: var(--status-blocked); }

/* ── Graph legend ── */
.tg-graph-legend {
  position: absolute; top: 18px; right: 18px; z-index: 6;
  width: min(280px, calc(100% - 36px));
  padding: 14px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--panel-bg) 92%, transparent);
  backdrop-filter: blur(16px);
  box-shadow: 0 18px 50px rgba(15,23,42,0.12);
  pointer-events: none;
}
.tg-graph-legend-head {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  margin-bottom: 10px;
}
.tg-graph-legend-title {
  color: var(--text-1);
  font-size: 12px; font-weight: 800;
  letter-spacing: 0.4px; text-transform: uppercase;
}
.tg-graph-legend-total {
  color: var(--text-3);
  font-size: 11px; font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.tg-graph-legend-items {
  display: grid; gap: 8px;
}
.tg-graph-legend-item {
  display: grid; grid-template-columns: auto 1fr auto;
  align-items: center; gap: 9px;
  color: var(--text-2);
  font-size: 12px; font-weight: 700;
}
.tg-graph-legend-item .tg-dot {
  width: 10px; height: 10px;
}
.tg-graph-legend-count {
  color: var(--text-1);
  font-size: 12px; font-weight: 800;
  font-variant-numeric: tabular-nums;
}
@supports not (background: color-mix(in srgb, white, transparent)) {
  .tg-graph-legend {
    background: var(--panel-bg);
  }
  .tg-dot {
    box-shadow: 0 0 0 4px rgba(148,163,184,0.12);
  }
}

/* ── Input / Select ── */
.tg-input, .tg-select {
  width: 100%; min-height: 40px; padding: 10px 13px;
  border-radius: 9px;
  border: 1.5px solid var(--border);
  background: var(--input-bg);
  color: var(--text-1);
  font-family: 'Open Sans', sans-serif;
  font-size: 13px; font-weight: 600;
  line-height: 1.25;
  outline: none; transition: all 0.2s;
  -webkit-appearance: none; appearance: none;
}
.tg-input::placeholder { color: var(--text-3); font-weight: 400; }
.tg-select {
  padding-right: 40px;
  cursor: pointer;
  text-overflow: ellipsis;
}
.tg-input:focus, .tg-select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(0,212,255,0.1);
  background: rgba(0,212,255,0.04);
}
.tgl .tg-input:focus, .tgl .tg-select:focus {
  box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
  background: rgba(124,58,237,0.03);
}
.tgd .tg-select option { background: #0d1a35; color: #f1f5f9; }
.tgl .tg-select option { background: #fff; color: #1e293b; }
.tg-field-stack {
  display: flex; flex-direction: column; gap: 8px;
}
.tg-field-label {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  color: var(--text-2);
  font-size: 11px; font-weight: 800;
  letter-spacing: 0.7px; text-transform: uppercase;
}
.tg-field-hint {
  color: var(--text-3);
  font-size: 10.5px; font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
}
.tg-select-wrap {
  position: relative;
}
.tg-select-wrap::after {
  content: "⌄";
  position: absolute; right: 13px; top: 50%;
  transform: translateY(-54%);
  color: var(--text-3);
  font-size: 18px; font-weight: 800;
  pointer-events: none;
  transition: color 0.2s, transform 0.2s;
}
.tg-select-wrap:focus-within::after {
  color: var(--accent);
  transform: translateY(-48%) rotate(180deg);
}
.tg-select-meta {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px;
  border-radius: 9px;
  background: rgba(0,212,255,0.035);
  border: 1px solid rgba(0,212,255,0.08);
  color: var(--text-3);
  font-size: 11px; font-weight: 600;
  line-height: 1.45;
}
.tgl .tg-select-meta {
  background: rgba(124,58,237,0.035);
  border-color: rgba(124,58,237,0.08);
}
.tg-select-meta strong {
  color: var(--text-2);
  font-weight: 800;
}

/* ── Buttons ── */
.tg-btn {
  width: 100%; min-height: 40px; padding: 11px 14px;
  border: none; border-radius: 10px;
  font-family: 'Open Sans', sans-serif;
  font-size: 13px; font-weight: 800;
  cursor: pointer; letter-spacing: -0.1px;
  position: relative; overflow: hidden;
  transition: all 0.2s ease;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  line-height: 1.1;
}
.tg-btn::after {
  content:''; position: absolute; inset: 0;
  background: linear-gradient(rgba(255,255,255,0.1), transparent);
  opacity: 0; transition: opacity 0.2s;
}
.tg-btn:hover:not(:disabled)::after { opacity: 1; }
.tg-btn:hover:not(:disabled)  { transform: translateY(-1px); }
.tg-btn:active:not(:disabled) { transform: translateY(0); }
.tg-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none !important; }
.tg-btn-primary {
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  color: white; box-shadow: 0 4px 16px rgba(0,212,255,0.22);
}
.tg-btn-primary:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(0,212,255,0.38); }
.tg-btn-danger {
  background: rgba(239,68,68,0.09);
  color: #f87171;
  border: 1px solid rgba(239,68,68,0.2);
}
.tg-btn-danger:hover:not(:disabled) { background: rgba(239,68,68,0.17); border-color: rgba(239,68,68,0.38); }

/* ── Hints ── */
.tg-hints {
  padding: 11px 13px; border-radius: 10px;
  background: rgba(0,212,255,0.04);
  border: 1px solid rgba(0,212,255,0.1);
  font-size: 11.5px; line-height: 1.9;
  color: var(--text-3);
  transition: background 0.3s, border 0.3s;
}
.tgl .tg-hints {
  background: rgba(124,58,237,0.04);
  border-color: rgba(124,58,237,0.1);
}
.tg-hints b { color: var(--accent); font-weight: 700; }

/* ══ Graph area ══ */
.tg-graph {
  flex: 1; min-width: 0; min-height: 0;
  position: relative; background: var(--graph-bg); transition: background 0.4s;
}
.tg-graph-grid {
  position: absolute; inset: 0; pointer-events: none; z-index: 0;
}
.tgd .tg-graph-grid {
  background-image:
    linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px);
  background-size: 44px 44px;
  animation: tg-grid-move 28s linear infinite;
}
.tgl .tg-graph-grid {
  background-image:
    linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px);
  background-size: 44px 44px;
  animation: tg-grid-move 28s linear infinite;
}
@keyframes tg-grid-move {
  0%   { background-position: 0 0; }
  100% { background-position: 44px 44px; }
}
/* canvas bg particles */
.tg-bg-canvas {
  position: absolute; inset: 0; pointer-events: none; z-index: 0;
  width: 100%; height: 100%;
}

/* ── Empty state ── */
.tg-empty {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  text-align: center; pointer-events: none; z-index: 1;
  animation: tg-empty-in 0.6s ease both;
}
@keyframes tg-empty-in {
  from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)); }
  to   { opacity: 1; transform: translate(-50%,-50%); }
}
.tg-empty-icon {
  font-size: 56px; opacity: 0.2; margin-bottom: 16px;
  animation: tg-empty-pulse 3.5s ease-in-out infinite;
}
@keyframes tg-empty-pulse {
  0%,100% { opacity: 0.2; transform: scale(1); }
  50%      { opacity: 0.35; transform: scale(1.06); }
}
.tg-empty-t { font-size: 17px; font-weight: 700; color: var(--text-3); }
.tg-empty-s { font-size: 13px; font-weight: 500; color: var(--text-3); opacity: 0.55; margin-top: 6px; }

/* ══ TOAST ══ */
.tg-toasts {
  position: fixed; bottom: 26px; right: 26px;
  display: flex; flex-direction: column; gap: 10px; z-index: 9999;
}
.tg-toast {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px; border-radius: 13px;
  font-family: 'Open Sans', sans-serif;
  font-size: 13.5px; font-weight: 700;
  backdrop-filter: blur(20px);
  box-shadow: 0 12px 36px rgba(0,0,0,0.3);
  animation: tg-toast-in 0.32s cubic-bezier(0.16,1,0.3,1) both;
  cursor: pointer; min-width: 240px; max-width: 330px;
  transition: opacity 0.2s;
}
.tg-toast:hover { opacity: 0.85; }
@keyframes tg-toast-in {
  from { opacity: 0; transform: translateX(28px) scale(0.94); }
  to   { opacity: 1; transform: translateX(0)   scale(1); }
}
.tg-t-success { background: rgba(16,185,129,0.14); border: 1px solid rgba(16,185,129,0.28); color: #6ee7b7; }
.tg-t-error   { background: rgba(239,68,68,0.14);  border: 1px solid rgba(239,68,68,0.28);  color: #fca5a5; }
.tg-t-info    { background: rgba(0,212,255,0.1);   border: 1px solid rgba(0,212,255,0.22);  color: #67e8f9; }
.tg-t-warn    { background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.25); color: #fcd34d; }
.tgl .tg-toast {
  background: rgba(255,255,255,0.94);
  box-shadow: 0 18px 44px rgba(15,23,42,0.16);
}
.tgl .tg-t-success {
  background: rgba(236,253,245,0.96);
  border-color: rgba(5,150,105,0.24);
  color: #047857;
}
.tgl .tg-t-error {
  background: rgba(254,242,242,0.96);
  border-color: rgba(220,38,38,0.24);
  color: #b91c1c;
}
.tgl .tg-t-info {
  background: rgba(239,246,255,0.96);
  border-color: rgba(37,99,235,0.22);
  color: #1d4ed8;
}
.tgl .tg-t-warn {
  background: rgba(255,251,235,0.98);
  border-color: rgba(217,119,6,0.24);
  color: #b45309;
}

/* ══ MODAL ══ */
.tg-modal-bd {
  position: fixed; inset: 0; z-index: 8000;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  animation: tg-bd-in 0.2s ease;
}
@keyframes tg-bd-in { from {opacity:0;} to {opacity:1;} }
.tg-modal {
  width: 400px; border-radius: 22px;
  padding: 34px 30px;
  animation: tg-modal-in 0.3s cubic-bezier(0.16,1,0.3,1) both;
}
.tgd .tg-modal {
  background: #0d1a35;
  border: 1px solid rgba(0,212,255,0.14);
  box-shadow: 0 40px 100px rgba(0,0,0,0.6);
}
.tgl .tg-modal {
  background: #fff;
  border: 1px solid rgba(124,58,237,0.14);
  box-shadow: 0 40px 100px rgba(100,60,200,0.15);
}
@keyframes tg-modal-in {
  from { opacity:0; transform: scale(0.92) translateY(14px); }
  to   { opacity:1; transform: scale(1) translateY(0); }
}
.tg-modal-icon  { font-size: 38px; margin-bottom: 14px; }
.tg-modal-title {
  font-family: 'Open Sans', sans-serif;
  font-size: 20px; font-weight: 800;
  color: var(--text-1); margin-bottom: 10px; letter-spacing: -0.4px;
}
.tg-modal-msg   { font-size: 14px; font-weight: 400; color: var(--text-2); line-height: 1.65; margin-bottom: 26px; }
.tg-modal-btns  { display: flex; gap: 10px; }
.tg-modal-btn {
  flex: 1; padding: 13px;
  border: none; border-radius: 11px;
  font-family: 'Open Sans', sans-serif;
  font-size: 14px; font-weight: 800;
  cursor: pointer; transition: all 0.2s;
}
.tg-modal-btn:hover { transform: translateY(-1px); }
.tg-m-cancel {
  background: var(--card); border: 1px solid var(--border); color: var(--text-2);
}
.tg-m-cancel:hover { border-color: var(--border-hi); color: var(--text-1); }
.tg-m-red {
  background: linear-gradient(135deg, #ef4444, #dc2626); color: white;
  box-shadow: 0 4px 18px rgba(239,68,68,0.3);
}
.tg-m-red:hover { box-shadow: 0 7px 26px rgba(239,68,68,0.5); }
.tg-m-blue {
  background: linear-gradient(135deg, #00d4ff, #7c3aed); color: white;
  box-shadow: 0 4px 18px rgba(0,212,255,0.28);
}
.tg-m-blue:hover { box-shadow: 0 7px 26px rgba(0,212,255,0.44); }

/* ReactFlow overrides */
.react-flow__node { font-family: 'Open Sans', sans-serif !important; }
.react-flow__handle {
  width: 10px !important; height: 10px !important;
  background: var(--accent) !important;
  border: 2px solid var(--panel-bg) !important;
  box-shadow: 0 0 0 3px rgba(0,212,255,0.12) !important;
}
.tgl .react-flow__handle { box-shadow: 0 0 0 3px rgba(124,58,237,0.12) !important; }
.react-flow__edge-path {
  stroke-linecap: round !important;
  stroke-linejoin: round !important;
}
.react-flow__controls { border-radius: 13px !important; overflow: hidden; }
.tgd .react-flow__controls { background: rgba(7,15,40,0.92) !important; border: 1px solid rgba(0,212,255,0.12) !important; }
.tgl .react-flow__controls { background: rgba(255,255,255,0.92) !important; border: 1px solid rgba(124,58,237,0.14) !important; }
.tgd .react-flow__controls button { background: transparent !important; border-bottom: 1px solid rgba(0,212,255,0.08) !important; fill: #94a3b8 !important; }
.tgl .react-flow__controls button { background: transparent !important; border-bottom: 1px solid rgba(0,0,0,0.06) !important; fill: #64748b !important; }
.tgd .react-flow__controls button:hover { background: rgba(0,212,255,0.08) !important; }
.tgl .react-flow__controls button:hover { background: rgba(124,58,237,0.06) !important; }
.tgd .react-flow__minimap { background: rgba(5,13,31,0.92) !important; border: 1px solid rgba(0,212,255,0.1) !important; border-radius: 13px !important; }
.tgl .react-flow__minimap { background: rgba(255,255,255,0.92) !important; border: 1px solid rgba(124,58,237,0.12) !important; border-radius: 13px !important; }

/* ── Responsive dashboard ── */
@media (max-width: 920px) {
  .tg-shell {
    flex-direction: column;
    height: 100dvh;
  }
  .tg-panel {
    width: 100%;
    height: clamp(300px, 44dvh, 430px);
    border-right: none;
    border-bottom: 1px solid var(--border);
    box-shadow: 0 16px 44px rgba(15,23,42,0.08);
  }
  .tg-panel-head {
    padding: 12px 14px;
    gap: 10px;
  }
  .tg-head-actions {
    gap: 10px;
  }
  .tg-user-pill {
    margin: 10px 14px;
  }
  .tg-panel-body {
    padding: 10px 14px 14px;
    gap: 9px;
  }
  .tg-stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .tg-stat {
    min-height: 58px;
    padding: 10px 12px;
  }
  .tg-stat-val {
    font-size: 21px;
  }
  .tg-section,
  .tg-prog-card {
    padding: 12px;
  }
  .tg-graph {
    flex: 1 1 auto;
    min-height: 0;
  }
  .tg-graph-legend {
    top: 12px;
    right: 12px;
    width: min(250px, calc(100% - 24px));
    padding: 11px;
    border-radius: 14px;
  }
  .tg-graph-legend-title {
    font-size: 11px;
  }
  .tg-graph-legend-item {
    font-size: 11px;
  }
  .react-flow__minimap {
    display: none !important;
  }
  .react-flow__controls {
    left: 12px !important;
    bottom: 12px !important;
  }
  .tg-toasts {
    left: 12px;
    right: 12px;
    bottom: 12px;
  }
  .tg-toast {
    min-width: 0;
    max-width: none;
  }
  .tg-modal {
    width: min(400px, calc(100% - 32px));
  }
}

@media (max-width: 640px) {
  .tg-shell {
    font-size: 13px;
  }
  .tg-panel {
    height: clamp(300px, 48dvh, 430px);
  }
  .tg-panel-head {
    padding: 11px 12px;
  }
  .tg-brand-icon,
  .tg-icon-btn {
    width: 34px;
    height: 34px;
  }
  .tg-icon-btn {
    flex-basis: 34px;
  }
  .tg-logout-btn {
    height: 34px;
  }
  .tg-brand-name {
    font-size: 14px;
  }
  .tg-brand-tag {
    font-size: 8px;
    letter-spacing: 1px;
  }
  .tg-user-pill {
    margin: 9px 12px;
  }
  .tg-panel-body {
    padding: 9px 12px 12px;
  }
  .tg-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .tg-stat-label,
  .tg-sec-label,
  .tg-prog-label {
    font-size: 8.5px;
  }
  .tg-input,
  .tg-select,
  .tg-btn {
    min-height: 38px;
    font-size: 12px;
  }
  .tg-hints {
    font-size: 10.5px;
  }
  .tg-graph {
    min-height: 0;
  }
  .tg-graph-legend {
    left: 10px;
    right: 10px;
    top: 10px;
    width: auto;
  }
  .tg-graph-legend-head {
    margin-bottom: 8px;
  }
  .tg-graph-legend-items {
    gap: 6px;
  }
  .tg-empty {
    width: min(280px, calc(100% - 32px));
  }
  .tg-empty-icon {
    font-size: 42px;
  }
  .tg-empty-t {
    font-size: 15px;
  }
  .tg-empty-s {
    font-size: 12px;
  }
  .tg-modal {
    padding: 26px 22px;
  }
  .tg-modal-btns {
    flex-direction: column;
  }
}

@media (max-width: 380px) {
  .tg-graph-legend-total {
    display: none;
  }
  .tg-graph-legend-item {
    font-size: 10.5px;
  }
}
`;

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
function buildGraph(edges) {
  const g = {};
  edges.forEach(e => { if (!g[e.source]) g[e.source] = []; g[e.source].push(e.target); });
  return g;
}
function hasCycle(graph) {
  const v = new Set(), s = new Set();
  function dfs(n) {
    if (s.has(n)) return true; if (v.has(n)) return false;
    v.add(n); s.add(n);
    for (const c of (graph[n]||[])) if (dfs(c)) return true;
    s.delete(n); return false;
  }
  return Object.keys(graph).some(dfs);
}
function isBlocked(id, edges, nodes) {
  return edges.filter(e=>e.target===id).map(e=>e.source).some(p=>{
    const nd = nodes.find(n=>n.id===p); return nd && !nd.data.completed;
  });
}
const NW=230, NH=68;
function layoutNodes(nodes, edges) {
  if (!nodes.length) return [];

  const orderedNodes=[...nodes].sort((a,b)=>{
    const na=Number(a.id), nb=Number(b.id);
    if(Number.isFinite(na)&&Number.isFinite(nb)) return na-nb;
    return String(a.id).localeCompare(String(b.id));
  });
  const nodeIds = new Set(orderedNodes.map(n=>n.id));
  const validEdges = edges.filter(e=>nodeIds.has(e.source)&&nodeIds.has(e.target));
  const withHandles = (n, position) => ({
    ...n,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    position,
  });

  if (!validEdges.length) {
    const cols = Math.max(1, Math.ceil(Math.sqrt(orderedNodes.length)));
    const gapX = 56, gapY = 42;
    return orderedNodes.map((n,i)=>withHandles(n,{
      x:(i%cols)*(NW+gapX),
      y:Math.floor(i/cols)*(NH+gapY),
    }));
  }

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(()=>({}));
  g.setGraph({
    rankdir:"TB",
    ranker:"tight-tree",
    ranksep:110,
    nodesep:80,
    marginx:80,
    marginy:70,
  });
  orderedNodes.forEach(n=>g.setNode(n.id,{width:NW,height:NH}));
  validEdges.forEach(e=>g.setEdge(e.source,e.target));
  dagre.layout(g);
  return orderedNodes.map((n,i)=>{
    const p=g.node(n.id);
    const fallback={x:(i%4)*(NW+60),y:Math.floor(i/4)*(NH+70)};
    return withHandles(n,p ? {x:p.x-NW/2,y:p.y-NH/2} : fallback);
  });
}

/* ═══════════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════════ */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type="info") => {
    const id = Date.now()+Math.random();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)), 3500);
  },[]);
  const dismiss = useCallback(id=>setToasts(t=>t.filter(x=>x.id!==id)),[]);
  return {toasts,show,dismiss};
}

/* ═══════════════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════════════ */
function Modal({modal, dark}) {
  if (!modal) return null;
  return (
    <div className="tg-modal-bd" onClick={modal.onCancel}>
      <div className={`tg-modal ${dark?"tgd":"tgl"}`} onClick={e=>e.stopPropagation()}>
        <div className="tg-modal-icon">{modal.icon}</div>
        <div className="tg-modal-title">{modal.title}</div>
        <div className="tg-modal-msg">{modal.message}</div>
        <div className="tg-modal-btns">
          <button className="tg-modal-btn tg-m-cancel" onClick={modal.onCancel}>Cancel</button>
          <button className={`tg-modal-btn ${modal.danger?"tg-m-red":"tg-m-blue"}`} onClick={modal.onConfirm}>{modal.confirmLabel||"Confirm"}</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BG CANVAS
═══════════════════════════════════════════════════════ */
function BgCanvas({dark}) {
  const ref=useRef(null), raf=useRef(null);
  useEffect(()=>{
    const c=ref.current; if(!c) return;
    const ctx=c.getContext("2d");
    let W=c.width=c.offsetWidth, H=c.height=c.offsetHeight;
    const ro=new ResizeObserver(()=>{W=c.width=c.offsetWidth;H=c.height=c.offsetHeight;});
    ro.observe(c);
    const pts=Array.from({length:25},()=>({
      x:Math.random()*W,y:Math.random()*H,
      vx:(Math.random()-0.5)*0.28,vy:(Math.random()-0.5)*0.28,
      r:Math.random()*1.3+0.3,a:Math.random()*0.4+0.05
    }));
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      const rgb=dark?"0,212,255":"124,58,237";
      pts.forEach(p=>{
        p.x+=p.vx;p.y+=p.vy;
        if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${rgb},${p.a})`;ctx.fill();
      });
      for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);
        if(d<155){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle=`rgba(${rgb},${(1-d/155)*0.07})`;ctx.lineWidth=0.6;ctx.stroke();}
      }
      raf.current=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(raf.current);ro.disconnect();};
  },[dark]);
  return <canvas ref={ref} className="tg-bg-canvas"/>;
}

/* ═══════════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════════ */
export default function App() {
  const [user,     setUser]     = useState(null);
  const [page,     setPage]     = useState("landing"); // "landing" | "auth" | "dashboard"
  const [nodes,    setNodes]    = useState([]);
  const [edges,    setEdges]    = useState([]);
  const [search,   setSearch]   = useState("");
  const [taskName, setTaskName] = useState("");
  const [parent,   setParent]   = useState("");
  const [child,    setChild]    = useState("");
  const [modal,    setModal]    = useState(null);
  const [dark,     setDark]     = useState(()=>{
    try{return localStorage.getItem("tg-dark")!=="false";}catch{return true;}
  });

  const {toasts,show:toast,dismiss} = useToast();
  const clickTimer = useRef(null);
  const mResolve   = useRef(null);
  const flowRef    = useRef(null);
  const graphRef   = useRef(null);

  const fitGraph = useCallback((duration=450)=>{
    if(!flowRef.current) return;
    const compact = typeof window !== "undefined" && window.innerWidth < 700;
    flowRef.current.fitView({padding:compact?0.16:0.28,duration});
  },[]);

  // Inject CSS
  useEffect(()=>{
    if(!document.getElementById("tg-app-css")){
      const s=document.createElement("style");s.id="tg-app-css";s.textContent=APP_CSS;
      document.head.appendChild(s);
    }
  },[]);

  useEffect(()=>{ try{localStorage.setItem("tg-dark",dark);}catch{} },[dark]);

  // Confirm helper
  const confirm=(opts)=>new Promise(resolve=>{
    mResolve.current=resolve;
    setModal({...opts,
      onConfirm:()=>{setModal(null);resolve(true);},
      onCancel: ()=>{setModal(null);resolve(false);}
    });
  });

  // Auth listener
  useEffect(()=>{
    return onAuthStateChanged(auth, u=>{
      setUser(u);
      if(u) setPage("dashboard");
    });
  },[]);

  // Firestore
  useEffect(()=>{
    if(!user) return;
    const u1=onSnapshot(collection(db,"users",user.uid,"nodes"),s=>setNodes(s.docs.map(d=>d.data())));
    const u2=onSnapshot(collection(db,"users",user.uid,"edges"),s=>setEdges(s.docs.map(d=>d.data())));
    return()=>{u1();u2();};
  },[user]);

  useEffect(()=>{
    if(!flowRef.current||nodes.length===0) return;
    const id=setTimeout(()=>fitGraph(), 80);
    return()=>clearTimeout(id);
  },[nodes.length,edges.length,search,fitGraph]);

  useEffect(()=>{
    if(!graphRef.current) return;
    let frame;
    if(typeof ResizeObserver==="undefined"){
      const onResize=()=>fitGraph(250);
      window.addEventListener("resize",onResize);
      return()=>window.removeEventListener("resize",onResize);
    }
    const ro=new ResizeObserver(()=>{
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>fitGraph(250));
    });
    ro.observe(graphRef.current);
    return()=>{cancelAnimationFrame(frame);ro.disconnect();};
  },[fitGraph]);

  // CRUD
  const deleteNode=async(nodeId,label)=>{
    const ok=await confirm({icon:"🗑️",title:"Delete Task",
      message:`Permanently delete "${label}" and all its dependency links?`,
      danger:true,confirmLabel:"Delete Task"
    });
    if(!ok) return;
    const[ns,es]=await Promise.all([
      getDocs(collection(db,"users",user.uid,"nodes")),
      getDocs(collection(db,"users",user.uid,"edges")),
    ]);
    await Promise.all([
      ...ns.docs.filter(d=>d.data().id===nodeId).map(d=>deleteDoc(doc(db,"users",user.uid,"nodes",d.id))),
      ...es.docs.filter(d=>d.data().source===nodeId||d.data().target===nodeId).map(d=>deleteDoc(doc(db,"users",user.uid,"edges",d.id))),
    ]);
    toast(`"${label}" deleted`,"error");
  };

  const addTask=async()=>{
    if(!taskName.trim()) return;
    await addDoc(collection(db,"users",user.uid,"nodes"),{
      id:Date.now().toString(),
      data:{label:taskName.trim(),completed:false},
      position:{x:0,y:0}
    });
    toast(`"${taskName.trim()}" added`,"success");
    setTaskName("");
  };

  const addDep=async()=>{
    if(!parent||!child||parent===child) return;
    if(edges.some(e=>e.source===parent&&e.target===child)){
      toast("Dependency already exists","warn"); return;
    }
    const ne={id:`e${parent}-${child}`,source:parent,target:child,animated:true};
    if(hasCycle(buildGraph([...edges,ne]))){
      toast("⚠ Circular dependency detected!","error"); return;
    }
    await addDoc(collection(db,"users",user.uid,"edges"),ne);
    toast("Tasks linked","success");
    setParent("");setChild("");
  };

  const onNodeClick=(_,node)=>{
    if(clickTimer.current){
      clearTimeout(clickTimer.current);clickTimer.current=null;
      deleteNode(node.id,node.data.label);
    } else {
      clickTimer.current=setTimeout(async()=>{
        const ns=await getDocs(collection(db,"users",user.uid,"nodes"));
        const d=ns.docs.find(x=>x.data().id===node.id);
        if(d){
          const was=d.data().data.completed;
          await updateDoc(doc(db,"users",user.uid,"nodes",d.id),{"data.completed":!was});
          toast(was?"Marked as pending":"Completed ✓",was?"info":"success");
        }
        clickTimer.current=null;
      },260);
    }
  };

  const onEdgeClick=async(_,edge)=>{
    const ok=await confirm({icon:"🔗",title:"Remove Dependency",
      message:"Remove this dependency link between the two tasks?",
      danger:true,confirmLabel:"Remove"
    });
    if(!ok) return;
    const es=await getDocs(collection(db,"users",user.uid,"edges"));
    await Promise.all(es.docs.filter(d=>d.data().id===edge.id).map(d=>deleteDoc(doc(db,"users",user.uid,"edges",d.id))));
    toast("Dependency removed","info");
  };

  const handleLogout=async()=>{
    const ok=await confirm({icon:"👋",title:"Sign Out",
      message:"Sign out of TaskGraph? Your data is safely stored in the cloud.",
      danger:false,confirmLabel:"Sign Out"
    });
    if(ok){await signOut(auth);setPage("landing");setUser(null);toast("Signed out","info");}
  };

  const resetAll=async()=>{
    const ok=await confirm({icon:"💥",title:"Reset Board",
      message:"This will permanently delete ALL tasks and dependencies. This action cannot be undone.",
      danger:true,confirmLabel:"Reset Everything"
    });
    if(!ok) return;
    const[ns,es]=await Promise.all([
      getDocs(collection(db,"users",user.uid,"nodes")),
      getDocs(collection(db,"users",user.uid,"edges")),
    ]);
    await Promise.all([
      ...ns.docs.map(d=>deleteDoc(doc(db,"users",user.uid,"nodes",d.id))),
      ...es.docs.map(d=>deleteDoc(doc(db,"users",user.uid,"edges",d.id))),
    ]);
    toast("Board reset","error");
  };

  // Stats
  const total=nodes.length;
  const done=nodes.filter(n=>n.data.completed).length;
  const blocked=nodes.filter(n=>!n.data.completed&&isBlocked(n.id,edges,nodes)).length;
  const ready=nodes.filter(n=>!n.data.completed&&!isBlocked(n.id,edges,nodes)).length;
  const pct=total>0?Math.round((done/total)*100):0;
  const statusColors={
    complete: dark?"#10b981":"#059669",
    pending:  dark?"#f59e0b":"#d97706",
    blocked:  dark?"#ef4444":"#dc2626",
  };
  const statusLegend=[
    {
      key:"complete",
      label:"Completed",
      count:done,
      className:"tg-status-complete",
    },
    {
      key:"pending",
      label:"Pending / Ready",
      count:ready,
      className:"tg-status-pending",
    },
    {
      key:"blocked",
      label:"Blocked",
      count:blocked,
      className:"tg-status-blocked",
    },
  ];
  const taskOptions=[...nodes].sort((a,b)=>
    a.data.label.localeCompare(b.data.label, undefined, {sensitivity:"base", numeric:true})
  );
  const selectedParent=nodes.find(n=>n.id===parent);
  const selectedChild=nodes.find(n=>n.id===child);

  // Styled nodes
  const styledNodes=layoutNodes(nodes,edges)
    .filter(n=>n.data.label.toLowerCase().includes(search.toLowerCase()))
    .map(n=>{
      const d=n.data.completed, b=isBlocked(n.id,edges,nodes);
      const match=search&&n.data.label.toLowerCase().includes(search.toLowerCase());
      let bg,border,color,shadow;
      if(d){
        bg="var(--status-complete-bg)";
        border="1.5px solid var(--status-complete)";
        color="var(--status-complete)";shadow="0 16px 40px rgba(16,185,129,0.18)";
      } else if(b){
        bg="var(--status-blocked-bg)";
        border="1.5px solid var(--status-blocked)";
        color="var(--status-blocked)";shadow="0 16px 36px rgba(239,68,68,0.14)";
      } else {
        bg="var(--status-pending-bg)";
        border="1.5px solid var(--status-pending)";
        color="var(--status-pending)";shadow="0 16px 38px rgba(245,158,11,0.16)";
      }
      if(match) border="2px solid #facc15";
      return {...n,
        title:d?"Completed":b?"Blocked — waiting on a dependency":"Pending — ready to work",
        style:{
          background:bg,border,color,borderRadius:"12px",
          padding:"14px 22px",
          fontFamily:"'Open Sans',sans-serif",
          fontSize:"15px",fontWeight:"800",lineHeight:"1.3",
          boxShadow:shadow,backdropFilter:"blur(6px)",
          cursor:"pointer",transition:"all 0.25s ease",width:`${NW}px`,minHeight:`${NH}px`,
          display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",
          letterSpacing:"-0.2px",
        }
      };
    });

  const tc=dark?"tgd":"tgl";

  /* ══ ROUTING ══ */
  if(page==="landing") return <Landing onGetStarted={()=>setPage(user?"dashboard":"auth")} />;
  if(page==="auth"||(!user&&page!=="landing")) {
    return <Login setUser={u=>{setUser(u);setPage("dashboard");}} onBack={()=>setPage("landing")} />;
  }

  /* ══ DASHBOARD ══ */
  return (
    <div className={`tg-shell ${tc}`}>
      <Modal modal={modal} dark={dark} />

      {/* ══ PANEL ══ */}
      <div className="tg-panel">
        {/* Header */}
        <div className="tg-panel-head">
          <div className="tg-brand-row">
            <div className="tg-brand-icon">⬡</div>
            <div>
              <div className="tg-brand-name">TaskGraph</div>
              <div className="tg-brand-tag">Dependency Visualizer</div>
            </div>
          </div>
          <div className="tg-head-actions">
            <button className="tg-icon-btn" onClick={()=>setDark(d=>!d)} title="Toggle theme">
              {dark?"☀️":"🌙"}
            </button>
            <button className="tg-logout-btn" onClick={handleLogout}>
              <span>↪</span> Logout
            </button>
          </div>
        </div>

        {/* User pill */}
        {user && (
          <div className="tg-user-pill">
            <div className="tg-user-avatar">
              {(user.email||"U")[0].toUpperCase()}
            </div>
            <div className="tg-user-email">{user.email}</div>
          </div>
        )}

        {/* Body */}
        <div className="tg-panel-body">

          {/* Stats */}
          <div className="tg-stats">
            {[
              {label:"Total",     val:total,   color:"var(--text-1)"},
              {label:"Complete",  val:done,    color:"var(--status-complete)"},
              {label:"Pending",   val:ready,   color:"var(--status-pending)"},
              {label:"Blocked",   val:blocked, color:"var(--status-blocked)"},
            ].map((s,i)=>(
              <div className="tg-stat" key={s.label} style={{animationDelay:`${i*0.05+0.1}s`}}>
                <div className="tg-stat-label">{s.label}</div>
                <div className="tg-stat-val" style={{color:s.color}}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Progress */}
          {total>0&&(
            <div className="tg-prog-card">
              <div className="tg-prog-row">
                <span className="tg-prog-label">Progress</span>
                <span className="tg-prog-pct">{pct}%</span>
              </div>
              <div className="tg-prog-track">
                <div className="tg-prog-fill" style={{width:`${pct}%`}}/>
              </div>
              {blocked>0&&<div className="tg-prog-sub"><span>⚠</span>{blocked} task{blocked>1?"s":""} currently blocked</div>}
            </div>
          )}

          {/* Search */}
          <div className="tg-section">
            <div className="tg-sec-label">Search</div>
            <input className="tg-input" type="text" placeholder="🔍  Find task…"
              value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>

          {/* Add Task */}
          <div className="tg-section">
            <div className="tg-sec-label">New Task</div>
            <input className="tg-input" type="text" placeholder="Task name…"
              value={taskName} onChange={e=>setTaskName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addTask()}/>
            <button className="tg-btn tg-btn-primary" onClick={addTask} disabled={!taskName.trim()}>
              + Add Task
            </button>
          </div>

          {/* Add Dependency */}
          <div className="tg-section">
            <div className="tg-sec-label">Link Dependency</div>
            <div className="tg-field-stack">
              <label className="tg-field-label" htmlFor="tg-parent-select">
                Parent task
                <span className="tg-field-hint">Finishes first</span>
              </label>
              <div className="tg-select-wrap">
                <select id="tg-parent-select" className="tg-select" value={parent} onChange={e=>setParent(e.target.value)}>
                  <option value="">Select parent task...</option>
                  {taskOptions.map(n=><option key={n.id} value={n.id}>{n.data.label}</option>)}
                </select>
              </div>
            </div>
            <div className="tg-field-stack">
              <label className="tg-field-label" htmlFor="tg-child-select">
                Child task
                <span className="tg-field-hint">Waits for parent</span>
              </label>
              <div className="tg-select-wrap">
                <select id="tg-child-select" className="tg-select" value={child} onChange={e=>setChild(e.target.value)}>
                  <option value="">Select child task...</option>
                  {taskOptions.map(n=><option key={n.id} value={n.id}>{n.data.label}</option>)}
                </select>
              </div>
            </div>
            {(selectedParent||selectedChild)&&(
              <div className="tg-select-meta">
                <span>Flow:</span>
                <strong>{selectedParent?.data.label||"Parent"}</strong>
                <span>→</span>
                <strong>{selectedChild?.data.label||"Child"}</strong>
              </div>
            )}
            {parent&&child&&parent===child&&(
              <div className="tg-select-meta">
                <span>⚠</span>
                <strong>Choose two different tasks to create a dependency.</strong>
              </div>
            )}
            <button className="tg-btn tg-btn-primary" onClick={addDep}
              disabled={!parent||!child||parent===child}>
              Link Tasks →
            </button>
          </div>

          {/* Hints */}
          <div className="tg-hints">
            <b>Click</b> node → toggle complete<br/>
            <b>Double-click</b> node → delete task<br/>
            <b>Click edge</b> → remove link
          </div>

          {/* Reset */}
          <button className="tg-btn tg-btn-danger" onClick={resetAll} disabled={total===0}>
            🗑 Reset Board
          </button>

        </div>
      </div>

      {/* ══ GRAPH ══ */}
      <div className="tg-graph" ref={graphRef}>
        <div className="tg-graph-grid"/>
        <BgCanvas dark={dark}/>
        <div className="tg-graph-legend" aria-label="Task status color key">
          <div className="tg-graph-legend-head">
            <div className="tg-graph-legend-title">Task Status</div>
            <div className="tg-graph-legend-total">{total} total</div>
          </div>
          <div className="tg-graph-legend-items">
            {statusLegend.map(s=>(
              <div className={`tg-graph-legend-item ${s.className}`} key={s.key}>
                <span className="tg-dot"/>
                <span>{s.label}</span>
                <span className="tg-graph-legend-count">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
        {nodes.length===0&&(
          <div className="tg-empty">
            <div className="tg-empty-icon">◈</div>
            <div className="tg-empty-t">No tasks yet</div>
            <div className="tg-empty-s">Add your first task from the panel on the left</div>
          </div>
        )}
        <ReactFlow
          nodes={styledNodes}
          edges={edges.map(e=>({...e,type:"smoothstep",animated:true,
            style:{stroke:dark?"rgba(0,212,255,0.5)":"rgba(124,58,237,0.5)",strokeWidth:2.5},
            markerEnd:{type:"arrowclosed",color:dark?"rgba(0,212,255,0.5)":"rgba(124,58,237,0.5)"}
          }))}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onInit={instance=>{flowRef.current=instance;setTimeout(()=>fitGraph(350),0);}}
          fitView fitViewOptions={{padding:0.28}}
          minZoom={0.2}
          maxZoom={1.5}
          onlyRenderVisibleElements
          proOptions={{hideAttribution:true}}
        >
          <MiniMap
            nodeColor={n=>n.data?.completed?statusColors.complete:isBlocked(n.id,edges,nodes)?statusColors.blocked:statusColors.pending}
            maskColor={dark?"rgba(3,11,26,0.65)":"rgba(238,242,255,0.65)"}
          />
          <Controls/>
          <Background color={dark?"rgba(0,212,255,0.05)":"rgba(124,58,237,0.07)"} gap={44}/>
        </ReactFlow>
      </div>

      {/* ══ TOASTS ══ */}
      <div className="tg-toasts">
        {toasts.map(t=>(
          <div key={t.id} className={`tg-toast tg-t-${t.type}`} onClick={()=>dismiss(t.id)}>
            <span>{t.type==="success"?"✓":t.type==="error"?"✕":t.type==="warn"?"⚠":"ℹ"}</span>
            <span style={{flex:1}}>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
