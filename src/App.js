import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactFlow from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { db, auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Login from "./Login";
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, onSnapshot, updateDoc,
} from "firebase/firestore";
import { MiniMap, Controls, Background } from "reactflow";

/* ══════════════════════════════════════════════
   GLOBAL CSS
══════════════════════════════════════════════ */
const APP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --cyan:   #00d4ff;
  --violet: #7c3aed;
  --green:  #10b981;
  --red:    #ef4444;
  --amber:  #f59e0b;
}

/* ── Theme vars ── */
.tg-dark {
  --bg-base:      #04091a;
  --bg-panel:     rgba(7,15,40,0.95);
  --bg-section:   rgba(255,255,255,0.04);
  --bg-input:     rgba(255,255,255,0.05);
  --border:       rgba(255,255,255,0.08);
  --border-hover: rgba(0,212,255,0.3);
  --text-primary: #f1f5f9;
  --text-sec:     #94a3b8;
  --text-muted:   #475569;
  --bg-graph:     #020c1a;
}
.tg-light {
  --bg-base:      #f0f4ff;
  --bg-panel:     rgba(255,255,255,0.97);
  --bg-section:   rgba(0,0,0,0.03);
  --bg-input:     #f8fafc;
  --border:       rgba(0,0,0,0.09);
  --border-hover: rgba(124,58,237,0.4);
  --text-primary: #0f172a;
  --text-sec:     #475569;
  --text-muted:   #94a3b8;
  --bg-graph:     #e8eeff;
}

/* ── App shell ── */
.tg-app {
  display: flex;
  height: 100vh;
  overflow: hidden;
  font-family: 'Outfit', sans-serif;
  transition: background 0.4s ease;
  background: var(--bg-graph);
}

/* ── Sidebar panel ── */
.tg-panel {
  width: 274px;
  flex-shrink: 0;
  background: var(--bg-panel);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  overflow-x: hidden;
  transition: background 0.4s, border-color 0.4s;
  animation: tg-panel-in 0.45s cubic-bezier(0.16,1,0.3,1) both;
  backdrop-filter: blur(20px);
}
@keyframes tg-panel-in {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ── Panel header ── */
.tg-header {
  padding: 18px 16px 14px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.tg-logo-row {
  display: flex; align-items: center; gap: 10px;
}
.tg-logo-icon {
  width: 34px; height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--cyan), var(--violet));
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  animation: tg-glow 3s ease-in-out infinite;
}
@keyframes tg-glow {
  0%,100% { box-shadow: 0 0 14px rgba(0,212,255,0.35); }
  50%      { box-shadow: 0 0 28px rgba(124,58,237,0.5); }
}
.tg-logo-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px; font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.3px;
  transition: color 0.3s;
}
.tg-logo-sub {
  font-size: 9px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 1.5px;
  color: var(--cyan);
  margin-top: 1px;
  transition: color 0.3s;
}
.tg-dark  .tg-logo-sub { color: var(--cyan); }
.tg-light .tg-logo-sub { color: var(--violet); }

/* ── Header buttons ── */
.tg-hdr-btns { display: flex; align-items: center; gap: 6px; }
.tg-icon-btn {
  width: 32px; height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-section);
  color: var(--text-sec);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px;
  transition: all 0.2s;
}
.tg-icon-btn:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
  background: rgba(0,212,255,0.08);
}
.tg-logout-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 11px;
  border-radius: 8px;
  border: 1px solid rgba(239,68,68,0.25);
  background: rgba(239,68,68,0.07);
  color: #f87171;
  font-family: 'Outfit', sans-serif;
  font-size: 12px; font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.tg-logout-btn:hover {
  background: rgba(239,68,68,0.16);
  border-color: rgba(239,68,68,0.4);
  transform: translateY(-1px);
}

/* ── Panel body ── */
.tg-panel-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 14px 12px;
  overflow-y: auto;
}

/* ── Stats grid ── */
.tg-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}
.tg-stat {
  background: var(--bg-section);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 14px;
  transition: all 0.2s;
  cursor: default;
  animation: tg-stat-in 0.5s ease both;
}
.tg-stat:nth-child(1) { animation-delay: 0.05s; }
.tg-stat:nth-child(2) { animation-delay: 0.1s; }
.tg-stat:nth-child(3) { animation-delay: 0.15s; }
.tg-stat:nth-child(4) { animation-delay: 0.2s; }
@keyframes tg-stat-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.tg-stat:hover {
  border-color: var(--border-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,212,255,0.1);
}
.tg-stat-label {
  font-size: 9px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1px;
  color: var(--text-muted);
  margin-bottom: 4px;
}
.tg-stat-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 24px; font-weight: 600;
  line-height: 1;
  transition: color 0.3s;
}

/* ── Progress ── */
.tg-progress-section {
  background: var(--bg-section);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
  transition: all 0.2s;
}
.tg-progress-section:hover { border-color: var(--border-hover); }
.tg-progress-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8px;
}
.tg-section-label {
  font-size: 9px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1.2px;
  color: var(--text-muted);
}
.tg-pct {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; font-weight: 600;
  color: var(--cyan);
}
.tg-dark  .tg-pct { color: var(--cyan); }
.tg-light .tg-pct { color: var(--violet); }
.tg-track {
  height: 6px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
}
.tg-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--cyan), var(--violet));
  transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
}
.tg-blocked-warn {
  margin-top: 8px;
  font-size: 11px; font-weight: 500;
  color: #fbbf24;
  display: flex; align-items: center; gap: 5px;
}

/* ── Section card ── */
.tg-section {
  background: var(--bg-section);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  transition: all 0.2s;
}
.tg-section:hover { border-color: var(--border-hover); }
.tg-section-title {
  font-size: 9px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1.3px;
  color: var(--text-muted);
  margin-bottom: 10px;
}

/* ── Legend ── */
.tg-legend-item {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 500;
  color: var(--text-sec);
  margin-bottom: 7px;
  transition: color 0.3s;
}
.tg-legend-item:last-child { margin-bottom: 0; }
.tg-dot {
  width: 9px; height: 9px;
  border-radius: 50%; flex-shrink: 0;
}

/* ── Inputs ── */
.tg-input, .tg-select {
  width: 100%; padding: 10px 13px;
  border-radius: 9px;
  border: 1.5px solid var(--border);
  background: var(--bg-input);
  color: var(--text-primary);
  font-family: 'Outfit', sans-serif;
  font-size: 13px; font-weight: 400;
  outline: none;
  transition: all 0.2s;
  -webkit-appearance: none;
  appearance: none;
}
.tg-input::placeholder { color: var(--text-muted); }
.tg-input:focus, .tg-select:focus {
  border-color: var(--cyan);
  box-shadow: 0 0 0 3px rgba(0,212,255,0.1);
  background: rgba(0,212,255,0.04);
}
.tg-dark  .tg-select option { background: #0d1a35; color: #f1f5f9; }
.tg-light .tg-select option { background: #fff;    color: #1e293b; }
.tg-light .tg-input:focus, .tg-light .tg-select:focus {
  border-color: var(--violet);
  box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
  background: rgba(124,58,237,0.03);
}

/* ── Buttons ── */
.tg-btn {
  width: 100%; padding: 10px 14px;
  border: none; border-radius: 9px;
  font-family: 'Outfit', sans-serif;
  font-size: 13px; font-weight: 700;
  cursor: pointer; letter-spacing: 0.2px;
  position: relative; overflow: hidden;
  transition: all 0.2s ease;
}
.tg-btn::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(rgba(255,255,255,0.1), transparent);
  opacity: 0; transition: opacity 0.2s;
}
.tg-btn:hover:not(:disabled)::after { opacity: 1; }
.tg-btn:hover:not(:disabled)  { transform: translateY(-1px); }
.tg-btn:active:not(:disabled) { transform: translateY(0); }
.tg-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none !important; }

.tg-btn-primary {
  background: linear-gradient(135deg, var(--cyan) 0%, var(--violet) 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(0,212,255,0.22);
}
.tg-btn-primary:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(0,212,255,0.38); }

.tg-btn-danger {
  background: rgba(239,68,68,0.1);
  color: #f87171;
  border: 1px solid rgba(239,68,68,0.22);
}
.tg-btn-danger:hover:not(:disabled) {
  background: rgba(239,68,68,0.2);
  border-color: rgba(239,68,68,0.4);
}

/* ── Hint text ── */
.tg-hints {
  padding: 10px 13px;
  border-radius: 10px;
  background: rgba(0,212,255,0.05);
  border: 1px solid rgba(0,212,255,0.1);
  font-size: 11px; line-height: 1.85;
  color: var(--text-muted);
  margin-bottom: 10px;
  transition: background 0.3s, border 0.3s;
}
.tg-light .tg-hints {
  background: rgba(124,58,237,0.05);
  border-color: rgba(124,58,237,0.12);
}
.tg-hints strong { color: var(--cyan); font-weight: 600; }
.tg-light .tg-hints strong { color: var(--violet); }

/* ── Graph area ── */
.tg-graph {
  flex: 1; position: relative;
  background: var(--bg-graph);
  transition: background 0.4s;
}
.tg-graph-grid {
  position: absolute; inset: 0;
  pointer-events: none; z-index: 0;
  transition: all 0.4s;
}
.tg-dark  .tg-graph-grid {
  background-image:
    linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px);
  background-size: 44px 44px;
  animation: tg-grid-drift 24s linear infinite;
}
.tg-light .tg-graph-grid {
  background-image:
    linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px);
  background-size: 44px 44px;
  animation: tg-grid-drift 24s linear infinite;
}
@keyframes tg-grid-drift {
  0%   { background-position: 0 0; }
  100% { background-position: 44px 44px; }
}

/* ── Empty state ── */
.tg-empty {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  text-align: center; pointer-events: none;
  animation: tg-fade-up 0.5s ease both;
}
@keyframes tg-fade-up {
  from { opacity: 0; transform: translate(-50%, calc(-50% + 14px)); }
  to   { opacity: 1; transform: translate(-50%, -50%); }
}
.tg-empty-icon {
  font-size: 52px; opacity: 0.22;
  margin-bottom: 14px;
  animation: tg-empty-pulse 3s ease-in-out infinite;
}
@keyframes tg-empty-pulse {
  0%,100% { opacity: 0.22; transform: scale(1); }
  50%     { opacity: 0.38; transform: scale(1.08); }
}
.tg-empty-title { font-size: 16px; font-weight: 600; color: var(--text-muted); }
.tg-empty-sub   { font-size: 12px; color: var(--text-muted); opacity: 0.6; margin-top: 6px; }

/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */
.tg-toasts {
  position: fixed;
  bottom: 24px; right: 24px;
  display: flex; flex-direction: column; gap: 10px;
  z-index: 9999;
}
.tg-toast {
  display: flex; align-items: center; gap: 10px;
  padding: 13px 18px;
  border-radius: 12px;
  font-size: 13px; font-weight: 600;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
  animation: tg-toast-in 0.32s cubic-bezier(0.16,1,0.3,1) both;
  min-width: 230px; max-width: 320px;
  cursor: pointer;
  user-select: none;
}
@keyframes tg-toast-in {
  from { opacity: 0; transform: translateX(24px) scale(0.95); }
  to   { opacity: 1; transform: translateX(0)   scale(1); }
}
.tg-toast.exit {
  animation: tg-toast-out 0.25s ease forwards;
}
@keyframes tg-toast-out {
  to { opacity: 0; transform: translateX(24px); }
}
.tg-toast-success { background: rgba(16,185,129,0.14); border-color: rgba(16,185,129,0.28); color: #6ee7b7; }
.tg-toast-error   { background: rgba(239,68,68,0.14);  border-color: rgba(239,68,68,0.28);  color: #fca5a5; }
.tg-toast-info    { background: rgba(0,212,255,0.1);   border-color: rgba(0,212,255,0.22);  color: #7dd3fc; }
.tg-toast-warn    { background: rgba(245,158,11,0.12); border-color: rgba(245,158,11,0.25); color: #fcd34d; }

/* light mode toast */
.tg-light .tg-toast { border-color: rgba(0,0,0,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.12); }

/* ══════════════════════════════════════════
   MODAL
══════════════════════════════════════════ */
.tg-modal-backdrop {
  position: fixed; inset: 0; z-index: 8000;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  animation: tg-backdrop-in 0.2s ease;
}
@keyframes tg-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
.tg-modal {
  width: 380px;
  border-radius: 20px;
  padding: 30px 28px;
  animation: tg-modal-in 0.28s cubic-bezier(0.16,1,0.3,1) both;
  transition: background 0.3s, border 0.3s;
}
.tg-dark  .tg-modal {
  background: #0d1a35;
  border: 1px solid rgba(0,212,255,0.15);
  box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,255,0.06);
}
.tg-light .tg-modal {
  background: #fff;
  border: 1px solid rgba(124,58,237,0.15);
  box-shadow: 0 30px 80px rgba(100,60,200,0.15);
}
@keyframes tg-modal-in {
  from { opacity: 0; transform: scale(0.93) translateY(10px); }
  to   { opacity: 1; transform: scale(1)    translateY(0); }
}
.tg-modal-icon  { font-size: 36px; margin-bottom: 14px; }
.tg-modal-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.tg-modal-msg   { font-size: 13px; color: var(--text-sec); line-height: 1.65; margin-bottom: 24px; }
.tg-modal-btns  { display: flex; gap: 10px; }
.tg-modal-btn {
  flex: 1; padding: 12px;
  border: none; border-radius: 10px;
  font-family: 'Outfit', sans-serif;
  font-size: 13px; font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}
.tg-modal-btn:hover { transform: translateY(-1px); }
.tg-modal-cancel {
  background: var(--bg-section);
  border: 1px solid var(--border);
  color: var(--text-sec);
}
.tg-modal-cancel:hover { border-color: var(--border-hover); color: var(--text-primary); }
.tg-modal-confirm-red {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 4px 16px rgba(239,68,68,0.3);
}
.tg-modal-confirm-red:hover { box-shadow: 0 6px 22px rgba(239,68,68,0.5); }
.tg-modal-confirm-blue {
  background: linear-gradient(135deg, var(--cyan), var(--violet));
  color: white;
  box-shadow: 0 4px 16px rgba(0,212,255,0.25);
}
.tg-modal-confirm-blue:hover { box-shadow: 0 6px 22px rgba(0,212,255,0.42); }

/* ── ReactFlow overrides ── */
.react-flow__node { font-family: 'Outfit', sans-serif !important; }
.react-flow__controls { border-radius: 12px !important; overflow: hidden; }
.tg-dark  .react-flow__controls { background: rgba(7,15,40,0.9)  !important; border: 1px solid rgba(0,212,255,0.12) !important; }
.tg-light .react-flow__controls { background: rgba(255,255,255,0.9) !important; border: 1px solid rgba(124,58,237,0.15) !important; }
.tg-dark  .react-flow__controls button { background: transparent !important; border-bottom: 1px solid rgba(0,212,255,0.1) !important; color: #94a3b8 !important; fill: #94a3b8 !important; }
.tg-light .react-flow__controls button { background: transparent !important; border-bottom: 1px solid rgba(0,0,0,0.06) !important; fill: #64748b !important; }
.tg-dark  .react-flow__controls button:hover { background: rgba(0,212,255,0.08) !important; }
.tg-light .react-flow__controls button:hover { background: rgba(124,58,237,0.06) !important; }
.tg-dark  .react-flow__minimap { background: rgba(4,9,26,0.9)  !important; border: 1px solid rgba(0,212,255,0.1) !important; border-radius: 12px !important; }
.tg-light .react-flow__minimap { background: rgba(255,255,255,0.9) !important; border: 1px solid rgba(124,58,237,0.12) !important; border-radius: 12px !important; }

/* ── Scrollbar ── */
.tg-panel-body::-webkit-scrollbar { width: 3px; }
.tg-panel-body::-webkit-scrollbar-track { background: transparent; }
.tg-panel-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 999px; }
`;

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
function buildGraph(edges) {
  const g = {};
  edges.forEach(e => { if (!g[e.source]) g[e.source] = []; g[e.source].push(e.target); });
  return g;
}
function hasCycle(graph) {
  const visited = new Set(), stack = new Set();
  function dfs(n) {
    if (stack.has(n)) return true;
    if (visited.has(n)) return false;
    visited.add(n); stack.add(n);
    for (const c of (graph[n] || [])) if (dfs(c)) return true;
    stack.delete(n); return false;
  }
  return Object.keys(graph).some(dfs);
}
function isBlocked(id, edges, nodes) {
  return edges.filter(e => e.target === id).map(e => e.source).some(p => {
    const node = nodes.find(n => n.id === p);
    return node && !node.data.completed;
  });
}

const NW = 160, NH = 48;
function layoutNodes(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", ranksep: 90, nodesep: 55 });
  nodes.forEach(n => g.setNode(n.id, { width: NW, height: NH }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map(n => {
    const p = g.node(n.id);
    return { ...n, position: { x: p.x - NW / 2, y: p.y - NH / 2 } };
  });
}

/* ══════════════════════════════════════════
   TOAST HOOK
══════════════════════════════════════════ */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  const dismiss = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), []);
  return { toasts, show, dismiss };
}

/* ══════════════════════════════════════════
   MODAL COMPONENT
══════════════════════════════════════════ */
function Modal({ modal, onConfirm, onCancel, dark }) {
  if (!modal) return null;
  return (
    <div className="tg-modal-backdrop" onClick={onCancel}>
      <div className={`tg-modal ${dark ? "tg-dark" : "tg-light"}`} onClick={e => e.stopPropagation()}>
        <div className="tg-modal-icon">{modal.icon || "⚠️"}</div>
        <div className="tg-modal-title">{modal.title}</div>
        <div className="tg-modal-msg">{modal.message}</div>
        <div className="tg-modal-btns">
          <button className="tg-modal-btn tg-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`tg-modal-btn ${modal.danger ? "tg-modal-confirm-red" : "tg-modal-confirm-blue"}`}
            onClick={onConfirm}
          >
            {modal.confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ANIMATED GRAPH BACKGROUND (Canvas)
══════════════════════════════════════════ */
function GraphBgCanvas({ dark }) {
  const ref = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    let W = c.width = c.offsetWidth;
    let H = c.height = c.offsetHeight;
    const ro = new ResizeObserver(() => { W = c.width = c.offsetWidth; H = c.height = c.offsetHeight; });
    ro.observe(c);
    const pts = Array.from({ length: 28 }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3,
      r: Math.random()*1.4+0.3, a: Math.random()*0.4+0.1
    }));
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      const rgb = dark ? "0,212,255" : "124,58,237";
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0;
        if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${rgb},${p.a})`; ctx.fill();
      });
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<160){ ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle=`rgba(${rgb},${(1-d/160)*0.08})`; ctx.lineWidth=0.6; ctx.stroke(); }
      }
      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf.current); ro.disconnect(); };
  }, [dark]);
  return (
    <canvas ref={ref} style={{
      position:"absolute", inset:0, width:"100%", height:"100%",
      pointerEvents:"none", zIndex:0
    }} />
  );
}

/* ══════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════ */
export default function App() {
  const [nodes,    setNodes]    = useState([]);
  const [edges,    setEdges]    = useState([]);
  const [search,   setSearch]   = useState("");
  const [taskName, setTaskName] = useState("");
  const [parent,   setParent]   = useState("");
  const [child,    setChild]    = useState("");
  const [user,     setUser]     = useState(null);
  const [modal,    setModal]    = useState(null);       // { title, message, icon, danger, confirmLabel, onConfirm }
  const [dark,     setDark]     = useState(() => {
    try { return localStorage.getItem("tg-dark") !== "false"; } catch { return true; }
  });

  const { toasts, show: toast, dismiss } = useToast();
  const clickTimer = useRef(null);
  const modalResolve = useRef(null);

  // Sync theme to localStorage and Login
  useEffect(() => {
    try { localStorage.setItem("tg-dark", dark); } catch {}
  }, [dark]);

  // Inject CSS once
  useEffect(() => {
    if (!document.getElementById("tg-app-css")) {
      const s = document.createElement("style");
      s.id = "tg-app-css";
      s.textContent = APP_CSS;
      document.head.appendChild(s);
    }
  }, []);

  /* ── Confirm helper (replaces window.confirm) ── */
  const confirm = (opts) =>
    new Promise(resolve => {
      modalResolve.current = resolve;
      setModal({ ...opts, onConfirm: () => { setModal(null); resolve(true);  },
      });
    });
  const onModalCancel = () => { setModal(null); if (modalResolve.current) modalResolve.current(false); };

  /* ── Firestore: delete node ── */
  const deleteNode = async (nodeId, label) => {
    const ok = await confirm({
      icon: "🗑️", title: "Delete Task",
      message: `Delete "${label}"? This will also remove all its dependencies.`,
      danger: true, confirmLabel: "Delete"
    });
    if (!ok) return;
    const [ns, es] = await Promise.all([
      getDocs(collection(db,"users",user.uid,"nodes")),
      getDocs(collection(db,"users",user.uid,"edges")),
    ]);
    await Promise.all([
      ...ns.docs.filter(d=>d.data().id===nodeId).map(d=>deleteDoc(doc(db,"users",user.uid,"nodes",d.id))),
      ...es.docs.filter(d=>d.data().source===nodeId||d.data().target===nodeId).map(d=>deleteDoc(doc(db,"users",user.uid,"edges",d.id))),
    ]);
    toast(`"${label}" deleted`, "error");
  };

  /* ── Add task ── */
  const addTask = async () => {
    if (!taskName.trim()) return;
    await addDoc(collection(db,"users",user.uid,"nodes"), {
      id: Date.now().toString(),
      data: { label: taskName.trim(), completed: false },
      position: { x: 0, y: 0 }
    });
    toast(`"${taskName.trim()}" added`, "success");
    setTaskName("");
  };

  /* ── Add dependency ── */
  const addDependency = async () => {
    if (!parent || !child || parent === child) return;
    if (edges.some(e => e.source===parent && e.target===child)) {
      toast("This dependency already exists", "warn"); return;
    }
    const newEdge = { id:`e${parent}-${child}`, source:parent, target:child, animated:true };
    if (hasCycle(buildGraph([...edges, newEdge]))) {
      toast("⚠ Circular dependency detected!", "error"); return;
    }
    await addDoc(collection(db,"users",user.uid,"edges"), newEdge);
    toast("Dependency linked", "success");
    setParent(""); setChild("");
  };

  /* ── Node click (single=toggle, double=delete) ── */
  const onNodeClick = (_, node) => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current); clickTimer.current = null;
      deleteNode(node.id, node.data.label);
    } else {
      clickTimer.current = setTimeout(async () => {
        const ns = await getDocs(collection(db,"users",user.uid,"nodes"));
        const d = ns.docs.find(x => x.data().id === node.id);
        if (d) {
          const was = d.data().data.completed;
          await updateDoc(doc(db,"users",user.uid,"nodes",d.id), { "data.completed": !was });
          toast(was ? "Marked as pending" : "Task completed ✓", was ? "info" : "success");
        }
        clickTimer.current = null;
      }, 260);
    }
  };

  /* ── Edge click ── */
  const onEdgeClick = async (_, edge) => {
    const ok = await confirm({
      icon: "🔗", title: "Remove Dependency",
      message: "Remove this connection between tasks?",
      danger: true, confirmLabel: "Remove"
    });
    if (!ok) return;
    const es = await getDocs(collection(db,"users",user.uid,"edges"));
    await Promise.all(es.docs.filter(d=>d.data().id===edge.id).map(d=>deleteDoc(doc(db,"users",user.uid,"edges",d.id))));
    toast("Dependency removed", "info");
  };

  /* ── Logout ── */
  const handleLogout = async () => {
    const ok = await confirm({
      icon: "👋", title: "Sign Out",
      message: "Are you sure you want to sign out of TaskGraph?",
      danger: false, confirmLabel: "Sign Out"
    });
    if (ok) { await signOut(auth); toast("Signed out", "info"); }
  };

  /* ── Reset all ── */
  const resetAll = async () => {
    const ok = await confirm({
      icon: "💥", title: "Reset Board",
      message: "This will permanently delete ALL tasks and dependencies. This cannot be undone.",
      danger: true, confirmLabel: "Reset Everything"
    });
    if (!ok) return;
    const [ns, es] = await Promise.all([
      getDocs(collection(db,"users",user.uid,"nodes")),
      getDocs(collection(db,"users",user.uid,"edges")),
    ]);
    await Promise.all([
      ...ns.docs.map(d=>deleteDoc(doc(db,"users",user.uid,"nodes",d.id))),
      ...es.docs.map(d=>deleteDoc(doc(db,"users",user.uid,"edges",d.id))),
    ]);
    toast("Board reset", "error");
  };

  /* ── Stats ── */
  const total     = nodes.length;
  const completed = nodes.filter(n => n.data.completed).length;
  const blocked   = nodes.filter(n => !n.data.completed && isBlocked(n.id, edges, nodes)).length;
  const ready     = nodes.filter(n => !n.data.completed && !isBlocked(n.id, edges, nodes)).length;
  const pct       = total > 0 ? Math.round((completed/total)*100) : 0;

  /* ── Styled nodes ── */
  const styledNodes = nodes
    .filter(n => n.data.label.toLowerCase().includes(search.toLowerCase()))
    .map(n => {
      const done    = n.data.completed;
      const blocked = isBlocked(n.id, edges, nodes);
      const match   = search && n.data.label.toLowerCase().includes(search.toLowerCase());

      const isDark = dark;
      let bg, border, color, shadow;
      if (done) {
        bg="rgba(0,212,255,0.1)"; border="1.5px solid rgba(0,212,255,0.5)"; color=isDark?"#67e8f9":"#0e7490";
        shadow="0 0 16px rgba(0,212,255,0.2)";
      } else if (blocked) {
        bg="rgba(239,68,68,0.1)"; border="1.5px solid rgba(239,68,68,0.45)"; color=isDark?"#fca5a5":"#b91c1c";
        shadow="0 0 14px rgba(239,68,68,0.15)";
      } else {
        bg="rgba(16,185,129,0.1)"; border="1.5px solid rgba(16,185,129,0.45)"; color=isDark?"#6ee7b7":"#065f46";
        shadow="0 0 14px rgba(16,185,129,0.18)";
      }
      if (match) border = "2px solid #facc15";

      return {
        ...n,
        title: done ? "Completed" : blocked ? "Blocked by unfinished dependency" : "Ready to start",
        style: {
          background: bg, border, color,
          borderRadius: "12px",
          padding: "10px 16px",
          fontFamily:"'Outfit',sans-serif",
          fontSize: "13px", fontWeight: "600",
          boxShadow: shadow,
          backdropFilter: "blur(8px)",
          cursor: "pointer",
          transition: "all 0.25s ease",
          minWidth: "120px",
        },
      };
    });

  /* ── Layout on edges change ── */
  useEffect(() => {
    setNodes(prev => layoutNodes(prev, edges));
  }, [edges]);

  /* ── Firestore listeners ── */
  useEffect(() => {
    if (!user) return;
    const u1 = onSnapshot(collection(db,"users",user.uid,"nodes"), snap => setNodes(snap.docs.map(d=>d.data())));
    const u2 = onSnapshot(collection(db,"users",user.uid,"edges"), snap => setEdges(snap.docs.map(d=>d.data())));
    return () => { u1(); u2(); };
  }, [user]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  if (!user) return <Login setUser={setUser} />;

  const themeClass = dark ? "tg-dark" : "tg-light";

  return (
    <div className={`tg-app ${themeClass}`}>
      {/* ── MODAL ── */}
      {modal && (
        <Modal modal={modal} onConfirm={modal.onConfirm} onCancel={onModalCancel} dark={dark} />
      )}

      {/* ════════════ SIDEBAR ════════════ */}
      <div className="tg-panel">
        {/* Header */}
        <div className="tg-header">
          <div className="tg-logo-row">
            <div className="tg-logo-icon">⬡</div>
            <div>
              <div className="tg-logo-name">TaskGraph</div>
              <div className="tg-logo-sub">Dependency Visualizer</div>
            </div>
          </div>

          <div className="tg-hdr-btns">
            <button className="tg-icon-btn" onClick={() => setDark(d=>!d)} title="Toggle theme">
              {dark ? "☀️" : "🌙"}
            </button>
            <button className="tg-logout-btn" onClick={handleLogout}>
              <span>↪</span> Logout
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="tg-panel-body">
          {/* Stats */}
          <div className="tg-stats">
            {[
              { label:"Total",     val:total,     color:"var(--text-primary)" },
              { label:"Links",     val:edges.length, color:"var(--text-sec)" },
              { label:"Completed", val:completed, color:"var(--cyan)" },
              { label:"Ready",     val:ready,     color:"#10b981" },
            ].map(s => (
              <div className="tg-stat" key={s.label}>
                <div className="tg-stat-label">{s.label}</div>
                <div className="tg-stat-val" style={{ color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Progress */}
          {total > 0 && (
            <div className="tg-progress-section">
              <div className="tg-progress-row">
                <span className="tg-section-label">Progress</span>
                <span className="tg-pct">{pct}%</span>
              </div>
              <div className="tg-track">
                <div className="tg-fill" style={{ width:`${pct}%` }} />
              </div>
              {blocked > 0 && (
                <div className="tg-blocked-warn">
                  <span>⚠</span> {blocked} task{blocked>1?"s":""} blocked
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="tg-section">
            <div className="tg-section-title">Status Guide</div>
            <div className="tg-legend-item"><div className="tg-dot" style={{background:"#10b981"}} />Ready to work</div>
            <div className="tg-legend-item"><div className="tg-dot" style={{background:"var(--cyan)"}} />Completed</div>
            <div className="tg-legend-item"><div className="tg-dot" style={{background:"#ef4444"}} />Blocked</div>
          </div>

          {/* Search */}
          <div className="tg-section">
            <div className="tg-section-title">Search</div>
            <input
              className="tg-input"
              type="text"
              placeholder="🔍  Find task..."
              value={search}
              onChange={e=>setSearch(e.target.value)}
            />
          </div>

          {/* Add Task */}
          <div className="tg-section">
            <div className="tg-section-title">Add Task</div>
            <input
              className="tg-input"
              type="text"
              placeholder="Task name..."
              value={taskName}
              onChange={e=>setTaskName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addTask()}
              style={{marginBottom:8}}
            />
            <button className="tg-btn tg-btn-primary" onClick={addTask} disabled={!taskName.trim()}>
              + Add Task
            </button>
          </div>

          {/* Add Dependency */}
          <div className="tg-section">
            <div className="tg-section-title">Link Dependency</div>
            <select
              className="tg-select"
              value={parent}
              onChange={e=>setParent(e.target.value)}
              style={{marginBottom:8}}
            >
              <option value="">↳ Parent (must complete first)</option>
              {nodes.map(n=><option key={n.id} value={n.id}>{n.data.label}</option>)}
            </select>
            <select
              className="tg-select"
              value={child}
              onChange={e=>setChild(e.target.value)}
              style={{marginBottom:8}}
            >
              <option value="">↳ Child (blocked until parent done)</option>
              {nodes.map(n=><option key={n.id} value={n.id}>{n.data.label}</option>)}
            </select>
            <button className="tg-btn tg-btn-primary" onClick={addDependency} disabled={!parent||!child||parent===child}>
              Link Tasks  →
            </button>
          </div>

          {/* Hints */}
          <div className="tg-hints">
            <strong>Click</strong> a node → toggle complete<br/>
            <strong>Double-click</strong> a node → delete task<br/>
            <strong>Click an edge</strong> → remove dependency
          </div>

          {/* Reset */}
          <button className="tg-btn tg-btn-danger" onClick={resetAll} disabled={total===0}>
            🗑 Reset Board
          </button>
        </div>
      </div>

      {/* ════════════ GRAPH AREA ════════════ */}
      <div className="tg-graph">
        <div className="tg-graph-grid" />
        <GraphBgCanvas dark={dark} />

        {nodes.length === 0 && (
          <div className="tg-empty">
            <div className="tg-empty-icon">◈</div>
            <div className="tg-empty-title">No tasks yet</div>
            <div className="tg-empty-sub">Add your first task from the panel →</div>
          </div>
        )}

        <ReactFlow
          nodes={styledNodes}
          edges={edges.map(e => ({
            ...e,
            type: "smoothstep",
            animated: true,
            style: {
              stroke: dark ? "rgba(0,212,255,0.55)" : "rgba(124,58,237,0.55)",
              strokeWidth: 2.5,
            },
            markerEnd: {
              type: "arrowclosed",
              color: dark ? "rgba(0,212,255,0.55)" : "rgba(124,58,237,0.55)"
            },
          }))}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
        >
          <MiniMap
            nodeColor={n =>
              n.data?.completed
                ? "#00d4ff"
                : isBlocked(n.id, edges, nodes)
                ? "#ef4444"
                : "#10b981"
            }
            maskColor={dark ? "rgba(4,9,26,0.65)" : "rgba(238,242,255,0.65)"}
          />
          <Controls />
          <Background
            color={dark ? "rgba(0,212,255,0.06)" : "rgba(124,58,237,0.07)"}
            gap={44}
          />
        </ReactFlow>
      </div>

      {/* ════════════ TOASTS ════════════ */}
      <div className="tg-toasts">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`tg-toast tg-toast-${t.type}`}
            onClick={() => dismiss(t.id)}
            title="Click to dismiss"
          >
            <span>
              {t.type==="success"?"✓" : t.type==="error"?"✕" : t.type==="warn"?"⚠" : "ℹ"}
            </span>
            <span style={{flex:1}}>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}