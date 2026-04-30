import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import ReactFlow from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { db, auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Login from "./Login";
import Signup from "./Signup";
import Landing from "./Landing";
import Profile from "./Profile";
import { buildWelcomeBanner } from "./welcomeGreeting";
import {
  buildBoardExportPayload,
  parseBoardImportFile,
} from "./boardTransfer";
import {
  buildDependencyDocId,
  buildDependencyEdgeId,
  formatBlockedTaskMessage,
  formatBlockedTaskSummary,
  formatUnlinkedTaskMessage,
  getBlockingTasks,
  getTaskStatusSummary,
  getTaskDependencies,
  getTaskWorkflowStatus,
  hasLinkedDependency,
  isBlocked,
  matchesTaskSearch,
  matchesTaskViewFilter,
  validateDependencyLink,
} from "./taskLogic";
import { formatUserDisplayName, getUserInitial } from "./userDisplay";
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, onSnapshot, runTransaction, updateDoc, writeBatch,
} from "firebase/firestore";
import { MiniMap, Controls, Background, Handle, Position, applyNodeChanges, useNodeId, useUpdateNodeInternals } from "reactflow";

const ROUTES = Object.freeze({
  landing: "/landing",
  login: "/login",
  signup: "/signup",
  dashboard: "/dashboard",
  profile: "/profile",
});

const LEGACY_ROUTE_MAP = Object.freeze({
  "/": ROUTES.landing,
  "/auth": ROUTES.login,
});

const VALID_ROUTES = new Set(Object.values(ROUTES));

function toAppUser(user) {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
  };
}

function normalizeRoute(pathname = ROUTES.landing) {
  let nextPath = pathname.trim() || ROUTES.landing;
  if (!nextPath.startsWith("/")) nextPath = `/${nextPath}`;
  nextPath = nextPath.replace(/\/+$/, "") || ROUTES.landing;
  return LEGACY_ROUTE_MAP[nextPath] || (VALID_ROUTES.has(nextPath) ? nextPath : ROUTES.landing);
}

function readStoredPanelCollapsed() {
  try {
    return localStorage.getItem("tg-panel-collapsed")==="true";
  } catch {
    return false;
  }
}

const CANVAS_VIEWPORT = Object.freeze({
  minZoom: 0.45,
  maxZoom: 1.15,
  fitPadding: {
    compact: 0.12,
    desktop: 0.24,
  },
});

const VIEWPORT_BREAKPOINTS = Object.freeze({
  mobile: 920,
  compact: 700,
});

const LAYOUT_OPTIONS = Object.freeze([
  {
    value: "TB",
    label: "Top to Bottom",
    shortLabel: "Vertical",
    icon: "↓",
    hint: "Top-down flow",
  },
  {
    value: "LR",
    label: "Left to Right",
    shortLabel: "Sideways",
    icon: "→",
    hint: "Left-right flow",
  },
  {
    value: "BT",
    label: "Bottom to Top",
    shortLabel: "Upward",
    icon: "↑",
    hint: "Bottom-up flow",
  },
  {
    value: "RL",
    label: "Right to Left",
    shortLabel: "Reverse Sideways",
    icon: "←",
    hint: "Right-left flow",
  },
]);

const VALID_LAYOUT_DIRECTIONS = new Set(LAYOUT_OPTIONS.map(option=>option.value));
const FIRESTORE_BATCH_LIMIT = 400;

function createBoardExportFilename(date = new Date()) {
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

  return `taskgraph-board-${stamp}.json`;
}

function getLayoutConfig(direction = "TB") {
  switch (direction) {
    case "LR":
      return {
        rankdir: "LR",
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        ranksep: 120,
        nodesep: 88,
        marginx: 84,
        marginy: 76,
        gapX: 70,
        gapY: 36,
        horizontal: true,
      };
    case "BT":
      return {
        rankdir: "BT",
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
        ranksep: 110,
        nodesep: 80,
        marginx: 80,
        marginy: 70,
        gapX: 56,
        gapY: 42,
        horizontal: false,
      };
    case "RL":
      return {
        rankdir: "RL",
        sourcePosition: Position.Left,
        targetPosition: Position.Right,
        ranksep: 120,
        nodesep: 88,
        marginx: 84,
        marginy: 76,
        gapX: 70,
        gapY: 36,
        horizontal: true,
      };
    case "TB":
    default:
      return {
        rankdir: "TB",
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        ranksep: 110,
        nodesep: 80,
        marginx: 80,
        marginy: 70,
        gapX: 56,
        gapY: 42,
        horizontal: false,
      };
  }
}

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
  --text-3:     #7b8da6;
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
  --shell-glow-a: rgba(0,212,255,0.16);
  --shell-glow-b: rgba(56,189,248,0.12);
  --shell-glow-c: rgba(124,58,237,0.14);
  --panel-shadow: 0 24px 70px rgba(2,6,23,0.4);
  --surface-shadow: 0 16px 38px rgba(2,6,23,0.16);
  --surface-shadow-hi: 0 24px 52px rgba(2,6,23,0.22);
  --graph-grid-minor: rgba(0,212,255,0.028);
  --graph-grid-major: rgba(0,212,255,0.06);
  --graph-orb-a: rgba(0,212,255,0.22);
  --graph-orb-b: rgba(14,165,233,0.18);
  --graph-orb-c: rgba(124,58,237,0.16);
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
  --shell-glow-a: rgba(56,189,248,0.16);
  --shell-glow-b: rgba(99,102,241,0.1);
  --shell-glow-c: rgba(16,185,129,0.1);
  --panel-shadow: 0 28px 70px rgba(148,163,184,0.24);
  --surface-shadow: 0 14px 34px rgba(148,163,184,0.18);
  --surface-shadow-hi: 0 20px 46px rgba(148,163,184,0.24);
  --graph-grid-minor: rgba(99,102,241,0.05);
  --graph-grid-major: rgba(148,163,184,0.12);
  --graph-orb-a: rgba(56,189,248,0.18);
  --graph-orb-b: rgba(99,102,241,0.14);
  --graph-orb-c: rgba(16,185,129,0.12);
}

/* ══ App shell ══ */
.tg-shell {
  display: flex; height: 100vh; overflow: hidden;
  font-family: 'Open Sans', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  position: relative;
  isolation: isolate;
  background:
    radial-gradient(circle at 8% 12%, var(--shell-glow-a), transparent 22%),
    radial-gradient(circle at 86% 14%, var(--shell-glow-b), transparent 20%),
    radial-gradient(circle at 60% 88%, var(--shell-glow-c), transparent 24%),
    linear-gradient(180deg, color-mix(in srgb, var(--bg) 90%, white 10%), var(--bg));
  transition: background 0.4s;
}
.tg-shell::before,
.tg-shell::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.tg-shell::before {
  background:
    linear-gradient(115deg, rgba(255,255,255,0.05), transparent 26%, transparent 72%, rgba(255,255,255,0.04)),
    radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08), transparent 32%);
  opacity: 0.75;
}
.tg-shell::after {
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 48%, transparent 100%);
  opacity: 0.35;
}

/* ══ Panel ══ */
.tg-panel {
  width: 300px; flex-shrink: 0;
  background: var(--panel-bg);
  border-right: 1px solid var(--border);
  backdrop-filter: blur(22px);
  display: flex; flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 1;
  transition: width 0.28s ease, background 0.4s, border-color 0.4s, box-shadow 0.35s;
  box-shadow: var(--panel-shadow);
  animation: tg-slide-in 0.4s cubic-bezier(0.16,1,0.3,1) both;
}
.tg-panel--collapsed {
  width: 88px;
}
.tg-panel::before,
.tg-panel::after {
  content: "";
  position: absolute;
  pointer-events: none;
}
.tg-panel::before {
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.14), transparent 22%, transparent 72%, rgba(255,255,255,0.05)),
    radial-gradient(circle at top left, rgba(255,255,255,0.08), transparent 34%);
  opacity: 0.9;
}
.tg-panel::after {
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(180deg, transparent, var(--border-hi), transparent);
  opacity: 0.65;
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
  position: relative;
  background:
    radial-gradient(circle at top left, rgba(0,212,255,0.12), transparent 45%),
    linear-gradient(180deg, rgba(255,255,255,0.08), transparent);
}
.tg-brand-row {
  display: flex; align-items: center; gap: 10px;
  min-width: 0;
}
.tg-brand-copy {
  min-width: 0;
  max-width: 180px;
  transition: max-width 0.24s ease, opacity 0.24s ease, transform 0.24s ease;
}
.tg-panel--collapsed .tg-panel-head {
  padding-left: 12px;
  padding-right: 12px;
  padding-bottom: 16px;
  align-items: center;
}
.tg-panel--collapsed .tg-brand-row {
  justify-content: center;
}
.tg-panel--collapsed .tg-brand-copy {
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transform: translateX(-6px);
}
.tg-brand-icon {
  width: 42px; height: 42px; border-radius: 13px;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; flex-shrink: 0;
  position: relative; overflow: hidden;
  animation: tg-glow 3s ease-in-out infinite;
}
.tg-brand-icon::after {
  content: "";
  position: absolute;
  inset: -3px;
  border-radius: 17px;
  border: 1.5px solid rgba(0,212,255,0.35);
  animation: tg-brand-ring 3s ease-in-out infinite;
}
@keyframes tg-glow {
  0%,100% { box-shadow: 0 0 14px rgba(0,212,255,0.35); }
  50%      { box-shadow: 0 0 28px rgba(124,58,237,0.5); }
}
@keyframes tg-brand-ring {
  0%,100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.12); opacity: 0; }
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
.tg-panel--collapsed .tg-head-actions {
  width: auto;
  flex-direction: column;
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
.tg-collapse-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.tg-collapse-label {
  display: none;
  align-items: center;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.03em;
}
.tg-logout-btn {
  position: relative;
  overflow: hidden;
  display: flex; align-items: center; gap: 8px;
  justify-content: center;
  min-width: 0; height: 38px; flex: 1;
  padding: 0 14px 0 10px; border-radius: 12px;
  font-family: 'Open Sans', sans-serif;
  font-size: 12.5px; font-weight: 700;
  line-height: 1; white-space: nowrap;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s, background 0.2s, color 0.2s;
}
.tgd .tg-logout-btn {
  border: 1px solid rgba(248,113,113,0.24);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.08), transparent 56%),
    linear-gradient(135deg, rgba(127,29,29,0.2), rgba(69,10,10,0.32));
  color: #fda4af;
  box-shadow:
    0 12px 28px rgba(69,10,10,0.28),
    inset 0 1px 0 rgba(255,255,255,0.12);
}
.tgl .tg-logout-btn {
  border: 1px solid rgba(239,68,68,0.18);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.6), transparent 56%),
    linear-gradient(135deg, rgba(255,241,242,0.98), rgba(255,228,230,0.92));
  color: #dc2626;
  box-shadow:
    0 10px 24px rgba(248,113,113,0.14),
    inset 0 1px 0 rgba(255,255,255,0.75);
}
.tg-logout-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 10%, rgba(255,255,255,0.22) 46%, transparent 78%);
  transform: translateX(-140%);
  transition: transform 0.45s ease;
}
.tg-logout-btn span {
  display: inline-flex; align-items: center;
  font-size: 14px; line-height: 1;
}
.tg-logout-icon {
  position: relative;
  z-index: 1;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  justify-content: center;
  flex-shrink: 0;
  font-size: 12px !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.22);
}
.tgd .tg-logout-icon {
  background: linear-gradient(135deg, rgba(248,113,113,0.22), rgba(239,68,68,0.1));
  color: #fecdd3;
}
.tgl .tg-logout-icon {
  background: linear-gradient(135deg, rgba(254,226,226,0.98), rgba(255,241,242,0.98));
  color: #dc2626;
}
.tg-logout-btn:hover {
  transform: translateY(-1px);
}
.tg-logout-btn:hover::before {
  transform: translateX(135%);
}
.tgd .tg-logout-btn:hover {
  border-color: rgba(251,113,133,0.4);
  color: #ffe4e6;
  box-shadow:
    0 16px 34px rgba(69,10,10,0.34),
    inset 0 1px 0 rgba(255,255,255,0.16);
}
.tgl .tg-logout-btn:hover {
  border-color: rgba(239,68,68,0.32);
  color: #b91c1c;
  box-shadow:
    0 14px 28px rgba(248,113,113,0.2),
    inset 0 1px 0 rgba(255,255,255,0.88);
}
.tg-logout-btn:active {
  transform: translateY(0);
}
.tg-logout-btn:focus-visible {
  outline: none;
}
.tgd .tg-logout-btn:focus-visible {
  border-color: rgba(251,113,133,0.5);
  box-shadow:
    0 0 0 3px rgba(248,113,113,0.18),
    0 16px 34px rgba(69,10,10,0.34);
}
.tgl .tg-logout-btn:focus-visible {
  border-color: rgba(239,68,68,0.36);
  box-shadow:
    0 0 0 3px rgba(248,113,113,0.16),
    0 14px 28px rgba(248,113,113,0.2);
}
.tg-logout-label {
  display: inline-flex;
  align-items: center;
  position: relative;
  z-index: 1;
  letter-spacing: 0.01em;
}
.tg-panel--collapsed .tg-logout-btn {
  width: 38px;
  flex: 0 0 38px;
  padding: 0;
  gap: 0;
}
.tg-panel--collapsed .tg-logout-label {
  display: none;
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
  position: relative;
  overflow: hidden;
  box-shadow: var(--surface-shadow);
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
  cursor: pointer;
}
.tg-user-pill::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.14), transparent 55%);
  pointer-events: none;
}
.tg-user-pill:hover {
  transform: translateY(-1px);
  border-color: var(--border-hi);
  box-shadow: var(--surface-shadow-hi);
}
.tg-user-pill:focus-visible {
  outline: none;
  border-color: var(--accent);
  box-shadow:
    var(--surface-shadow-hi),
    0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
}
.tg-user-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; color: white;
  flex-shrink: 0;
  box-shadow: 0 10px 24px rgba(56,189,248,0.24);
}
.tg-user-email {
  font-size: 11.5px; font-weight: 600; color: var(--text-2);
  line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  min-width: 0;
  transition: max-width 0.22s ease, opacity 0.22s ease, margin 0.22s ease;
}
.tg-panel--collapsed .tg-user-pill {
  margin: 10px 12px 14px;
  padding: 10px;
  justify-content: center;
}
.tg-panel--collapsed .tg-user-email {
  max-width: 0;
  opacity: 0;
  margin: 0;
}

.tg-welcome-banner-shell {
  position: fixed;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  width: min(calc(100vw - 24px), 500px);
  z-index: 9200;
  pointer-events: none;
}
.tg-welcome-banner {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: stretch;
  gap: 16px;
  padding: 16px 18px 18px;
  border-radius: 22px;
  backdrop-filter: blur(24px) saturate(1.25);
  box-shadow:
    0 28px 70px rgba(15,23,42,0.24),
    0 0 0 1px rgba(255,255,255,0.08) inset;
  animation: tg-welcome-banner-inout 5s cubic-bezier(0.16,1,0.3,1) forwards;
}
.tg-welcome-banner::before,
.tg-welcome-banner::after {
  content: "";
  position: absolute;
  pointer-events: none;
}
.tg-welcome-banner::before {
  inset: 0;
  background:
    linear-gradient(120deg, rgba(255,255,255,0.18), transparent 36%, transparent 62%, rgba(255,255,255,0.08)),
    linear-gradient(180deg, rgba(255,255,255,0.08), transparent 28%);
}
.tg-welcome-banner::after {
  inset: -30% -10% auto auto;
  width: 220px;
  height: 220px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(0,212,255,0.22), transparent 64%);
  filter: blur(8px);
  animation: tg-welcome-aura-drift 4.6s ease-in-out infinite;
}
.tgd .tg-welcome-banner {
  background:
    linear-gradient(135deg, rgba(7,15,34,0.94), rgba(16,28,58,0.86)),
    linear-gradient(90deg, rgba(0,212,255,0.08), rgba(124,58,237,0.08));
  border: 1px solid rgba(0,212,255,0.22);
}
.tgl .tg-welcome-banner {
  background:
    linear-gradient(135deg, rgba(255,255,255,0.97), rgba(245,249,255,0.92)),
    linear-gradient(90deg, rgba(56,189,248,0.06), rgba(124,58,237,0.06));
  border: 1px solid rgba(124,58,237,0.14);
}
.tg-welcome-banner > * {
  position: relative;
  z-index: 1;
}
.tg-welcome-banner-icon-wrap {
  position: relative;
  flex: 0 0 58px;
  width: 58px;
  height: 58px;
  align-self: center;
}
.tg-welcome-banner-icon-wrap::before,
.tg-welcome-banner-icon-wrap::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 20px;
}
.tg-welcome-banner-icon-wrap::before {
  background: linear-gradient(135deg, rgba(0,212,255,0.22), rgba(124,58,237,0.2));
  filter: blur(16px);
  opacity: 0.9;
  transform: scale(0.88);
}
.tg-welcome-banner-icon-wrap::after {
  border: 1px solid rgba(255,255,255,0.12);
  opacity: 0.8;
  animation: tg-welcome-icon-ring 2.6s ease-in-out infinite;
}
.tg-welcome-banner-icon {
  position: relative;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  color: #ffffff;
  font-size: 26px;
  box-shadow:
    0 16px 30px rgba(0,212,255,0.24),
    inset 0 1px 0 rgba(255,255,255,0.24);
  animation: tg-welcome-icon-float 2.4s ease-in-out infinite;
}
.tg-welcome-banner-text {
  flex: 1;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-right: 8px;
}
.tg-welcome-banner-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}
.tg-welcome-banner-kicker {
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.tgd .tg-welcome-banner-kicker { color: #67e8f9; }
.tgl .tg-welcome-banner-kicker { color: #7c3aed; }
.tg-welcome-banner-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}
.tgd .tg-welcome-banner-badge {
  background: rgba(15,118,110,0.18);
  border: 1px solid rgba(45,212,191,0.2);
  color: #99f6e4;
}
.tgl .tg-welcome-banner-badge {
  background: rgba(236,253,245,0.96);
  border: 1px solid rgba(16,185,129,0.16);
  color: #047857;
}
.tg-welcome-banner-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 0 0 rgba(45,212,191,0.45);
  animation: tg-welcome-badge-pulse 1.9s ease-out infinite;
}
.tg-welcome-banner-title {
  margin-top: 5px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--text-1);
  font-size: 20px;
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: -0.03em;
  text-shadow: 0 1px 0 rgba(255,255,255,0.08);
  width: 100%;
}
.tg-welcome-banner-greeting {
  font-weight: 500;
  opacity: 0.92;
}
.tg-welcome-banner-name {
  font-weight: 800;
  letter-spacing: -0.035em;
}
.tgd .tg-welcome-banner-name {
  color: #f8fbff;
}
.tgl .tg-welcome-banner-name {
  color: #0f172a;
}
.tg-welcome-banner-hand {
  display: inline-block;
  transform-origin: 70% 70%;
  animation: tg-welcome-hand-wave 1.8s ease-in-out infinite;
}
.tg-welcome-banner-copy {
  margin-top: 7px;
  color: var(--text-2);
  font-size: 12.8px;
  font-weight: 500;
  line-height: 1.5;
  max-width: none;
  width: 100%;
}
.tg-welcome-banner-progress {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 8px;
  height: 3px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255,255,255,0.08);
}
.tgl .tg-welcome-banner-progress {
  background: rgba(148,163,184,0.18);
}
.tg-welcome-banner-progress::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #00d4ff, #7c3aed, #10b981);
  transform-origin: left center;
  animation: tg-welcome-progress 5s linear forwards;
}
@keyframes tg-welcome-banner-inout {
  0%   { opacity: 0; transform: translateY(-22px) scale(0.95); }
  10%  { opacity: 1; transform: translateY(0) scale(1); }
  82%  { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-18px) scale(0.97); }
}
@keyframes tg-welcome-hand-wave {
  0%,100% { transform: rotate(0deg); }
  12% { transform: rotate(15deg); }
  24% { transform: rotate(-8deg); }
  36% { transform: rotate(14deg); }
  48% { transform: rotate(-4deg); }
  60% { transform: rotate(0deg); }
}
@keyframes tg-welcome-aura-drift {
  0%,100% { transform: translate3d(0,0,0) scale(1); opacity: 0.82; }
  50% { transform: translate3d(-12px, 10px, 0) scale(1.08); opacity: 1; }
}
@keyframes tg-welcome-icon-float {
  0%,100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
}
@keyframes tg-welcome-icon-ring {
  0%,100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.06); opacity: 1; }
}
@keyframes tg-welcome-badge-pulse {
  0% { box-shadow: 0 0 0 0 rgba(45,212,191,0.48); }
  70% { box-shadow: 0 0 0 8px rgba(45,212,191,0); }
  100% { box-shadow: 0 0 0 0 rgba(45,212,191,0); }
}
@keyframes tg-welcome-progress {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

/* ── Panel body (scrollable) ── */
.tg-panel-body {
  flex: 1; overflow-y: auto; overflow-x: hidden;
  padding: 14px 14px 24px;
  display: flex; flex-direction: column; gap: 12px;
  scrollbar-gutter: stable;
  position: relative;
  z-index: 1;
  scrollbar-color: var(--border-hi) transparent;
}
.tg-panel-body > * {
  flex-shrink: 0;
  min-width: 0;
}
.tg-panel--collapsed .tg-panel-body {
  display: none;
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
  position: relative;
  overflow: hidden;
  box-shadow: var(--surface-shadow);
  transition: transform 0.24s ease, border-color 0.24s ease, background 0.24s ease, box-shadow 0.24s ease;
  cursor: default;
  animation: tg-pop 0.5s ease both;
}
.tg-stat::before,
.tg-stat::after {
  content: "";
  position: absolute;
  pointer-events: none;
}
.tg-stat::before {
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.13), transparent 52%);
  opacity: 0.9;
}
.tg-stat::after {
  left: 16px;
  right: 16px;
  top: 0;
  height: 3px;
  border-radius: 999px;
  opacity: 0.9;
}
.tg-stat:nth-child(1)::after { background: linear-gradient(90deg, rgba(148,163,184,0.15), rgba(148,163,184,0.5), rgba(148,163,184,0.15)); }
.tg-stat:nth-child(2)::after { background: linear-gradient(90deg, rgba(16,185,129,0.15), rgba(16,185,129,0.72), rgba(16,185,129,0.15)); }
.tg-stat:nth-child(3)::after { background: linear-gradient(90deg, rgba(245,158,11,0.15), rgba(245,158,11,0.72), rgba(245,158,11,0.15)); }
.tg-stat:nth-child(4)::after { background: linear-gradient(90deg, rgba(239,68,68,0.15), rgba(239,68,68,0.72), rgba(239,68,68,0.15)); }
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
  transform: translateY(-3px);
  box-shadow: var(--surface-shadow-hi);
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
  position: relative;
  overflow: hidden;
  min-height: fit-content;
  box-shadow: var(--surface-shadow);
  transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
}
.tg-prog-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.12), transparent 58%);
  pointer-events: none;
}
.tg-prog-card:hover {
  border-color: var(--border-hi);
  transform: translateY(-2px);
  box-shadow: var(--surface-shadow-hi);
}
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
  background: linear-gradient(90deg, var(--status-complete), var(--accent), var(--accent2));
  background-size: 140% 100%;
  transition: width 0.65s cubic-bezier(0.4,0,0.2,1);
  animation: tg-progress-flow 4.4s linear infinite;
}
.tg-prog-sub {
  margin-top: 8px; font-size: 11.5px; font-weight: 600;
  color: var(--status-blocked); display: flex; align-items: flex-start; gap: 5px;
  flex-wrap: wrap;
  line-height: 1.45;
}

/* ── Section card ── */
.tg-section {
  background: var(--card); border: 1px solid var(--border);
  border-radius: 13px; padding: 14px 15px;
  display: flex; flex-direction: column; gap: 9px;
  position: relative;
  overflow: hidden;
  min-height: fit-content;
  box-shadow: var(--surface-shadow);
  transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
}
.tg-section::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.12), transparent 56%);
  pointer-events: none;
}
.tg-section:hover {
  border-color: var(--border-hi);
  transform: translateY(-2px);
  box-shadow: var(--surface-shadow-hi);
}
.tg-layout-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}
.tg-layout-btn {
  min-height: 72px;
  padding: 12px 13px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.14), transparent 62%),
    color-mix(in srgb, var(--card) 94%, transparent);
  color: var(--text-2);
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  align-items: center;
  column-gap: 10px;
  width: 100%;
  position: relative;
  overflow: hidden;
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  line-height: 1.2;
  white-space: normal;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
}
.tg-layout-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(120deg, rgba(255,255,255,0.06), transparent 42%, transparent 68%, rgba(255,255,255,0.05)),
    radial-gradient(circle at top right, rgba(255,255,255,0.14), transparent 34%);
  opacity: 0.85;
  pointer-events: none;
}
.tg-layout-btn > * {
  position: relative;
  z-index: 1;
}
.tg-layout-btn:hover {
  transform: translateY(-1px);
  border-color: var(--border-hi);
  box-shadow: var(--surface-shadow);
  color: var(--text-1);
}
.tg-layout-btn:focus-visible {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
}
.tg-layout-btn--active {
  border-color: color-mix(in srgb, var(--accent) 58%, var(--border-hi));
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent) 16%, rgba(255,255,255,0.18)), transparent 68%),
    color-mix(in srgb, var(--accent) 12%, var(--card));
  color: var(--text-1);
  box-shadow: 0 14px 30px rgba(59,130,246,0.14);
}
.tgd .tg-layout-btn--active {
  box-shadow: 0 18px 34px rgba(34,211,238,0.14);
}
.tg-layout-btn--active .tg-layout-btn-icon {
  transform: scale(1.04);
  box-shadow: 0 10px 22px rgba(59,130,246,0.18);
}
.tgd .tg-layout-btn--active .tg-layout-btn-icon {
  box-shadow: 0 10px 22px rgba(34,211,238,0.18);
}
.tg-layout-btn-icon {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);
  font-size: 15px;
  font-weight: 800;
}
.tg-layout-btn-copy {
  min-width: 0;
  width: 100%;
  justify-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 3px;
}
.tg-layout-btn-title {
  display: block;
  width: 100%;
  color: inherit;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
  white-space: nowrap;
}
.tg-layout-btn-hint {
  display: block;
  width: 100%;
  color: var(--text-3);
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.35;
}
.tg-layout-btn--active .tg-layout-btn-hint {
  color: color-mix(in srgb, var(--text-1) 72%, var(--accent) 28%);
}
.tg-layout-note {
  color: var(--text-3);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.45;
  padding-top: 2px;
  border-left: 2px solid color-mix(in srgb, var(--accent) 30%, transparent);
  padding-left: 10px;
}
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
  box-shadow: var(--surface-shadow-hi);
  pointer-events: none;
  overflow: hidden;
}
.tg-graph-legend::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.14), transparent 54%),
    radial-gradient(circle at top right, rgba(255,255,255,0.12), transparent 34%);
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
.tg-search-meta {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--text-3);
  font-size: 10.5px;
  font-weight: 700;
  line-height: 1.45;
}
.tg-search-meta strong {
  color: var(--text-1);
  font-weight: 800;
}
.tg-filter-row {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tg-filter-chip {
  min-height: 34px;
  padding: 0 11px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--input-bg);
  color: var(--text-2);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'Open Sans', sans-serif;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
}
.tg-filter-chip:hover {
  transform: translateY(-1px);
  border-color: var(--border-hi);
  color: var(--text-1);
}
.tg-filter-chip:focus-visible {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
}
.tg-filter-chip--active {
  border-color: color-mix(in srgb, var(--accent) 58%, var(--border-hi));
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent) 16%, rgba(255,255,255,0.16)), transparent 68%),
    color-mix(in srgb, var(--accent) 12%, var(--card));
  color: var(--text-1);
  box-shadow: 0 12px 26px rgba(59,130,246,0.12);
}
.tgd .tg-filter-chip--active {
  box-shadow: 0 16px 28px rgba(34,211,238,0.14);
}
.tg-filter-chip-count {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--text-1);
  font-size: 10px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.tgd .tg-select option { background: #0d1a35; color: #f1f5f9; }
.tgl .tg-select option { background: #fff; color: #1e293b; }
.tg-field-stack {
  display: flex; flex-direction: column; gap: 8px;
}
.tg-field-label {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  flex-wrap: wrap;
  color: var(--text-2);
  font-size: 11px; font-weight: 800;
  letter-spacing: 0.7px; text-transform: uppercase;
}
.tg-field-hint {
  color: var(--text-3);
  font-size: 10.5px; font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
  margin-left: auto;
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
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  line-height: 1.1;
  box-shadow: 0 10px 22px rgba(15,23,42,0.08);
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
.tgd .tg-btn:disabled {
  opacity: 0.46;
  color: rgba(226,232,240,0.58);
}
.tg-btn-primary {
  background: linear-gradient(135deg, #38bdf8 0%, #60a5fa 48%, #a78bfa 100%);
  color: white; box-shadow: 0 12px 28px rgba(96,165,250,0.26);
}
.tg-btn-primary:hover:not(:disabled) { box-shadow: 0 16px 34px rgba(96,165,250,0.34); }
.tg-btn-secondary {
  background: var(--card);
  color: var(--text-1);
  border: 1px solid var(--border);
  box-shadow: var(--surface-shadow);
}
.tg-btn-secondary:hover:not(:disabled) {
  border-color: var(--border-hi);
  background: var(--card-hov);
  box-shadow: var(--surface-shadow-hi);
}
.tg-btn-danger {
  background: rgba(239,68,68,0.09);
  color: #f87171;
  border: 1px solid rgba(239,68,68,0.2);
}
.tg-btn-danger:hover:not(:disabled) { background: rgba(239,68,68,0.17); border-color: rgba(239,68,68,0.38); }
.tg-btn-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.tg-btn-row .tg-btn {
  flex: 1 1 140px;
}
.tg-section-note {
  color: var(--text-3);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.5;
}
.tg-import-file {
  display: none;
}

/* ── Hints ── */
.tg-hints {
  padding: 11px 13px; border-radius: 10px;
  background: rgba(0,212,255,0.04);
  border: 1px solid rgba(0,212,255,0.1);
  font-size: 11.5px; line-height: 1.72;
  color: var(--text-3);
  position: relative;
  overflow: hidden;
  min-height: fit-content;
  box-shadow: var(--surface-shadow);
  transition: transform 0.3s ease, background 0.3s, border 0.3s, box-shadow 0.3s ease;
}
.tg-hints::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.16), transparent 52%);
  pointer-events: none;
}
.tg-hints:hover {
  transform: translateY(-2px);
  box-shadow: var(--surface-shadow-hi);
}
.tgl .tg-hints {
  background: rgba(124,58,237,0.04);
  border-color: rgba(124,58,237,0.1);
}
.tg-hints b { color: var(--accent); font-weight: 700; }

/* ══ Graph area ══ */
.tg-graph {
  flex: 1; min-width: 0; min-height: 0;
  position: relative; overflow: hidden;
  z-index: 1;
  background: linear-gradient(180deg, color-mix(in srgb, var(--graph-bg) 92%, white 8%), var(--graph-bg));
  transition: background 0.4s;
}
.tg-graph--locked .react-flow__pane {
  cursor: default !important;
}
.tg-graph--locked .react-flow__node {
  cursor: pointer !important;
}
.tg-graph-aura {
  position: absolute;
  border-radius: 999px;
  filter: blur(44px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.9;
  animation: tg-aurora 16s ease-in-out infinite alternate;
}
.tg-graph-aura--one {
  top: -10%;
  left: -6%;
  width: min(36vw, 460px);
  height: min(36vw, 460px);
  background: radial-gradient(circle, var(--graph-orb-a), transparent 68%);
}
.tg-graph-aura--two {
  top: 10%;
  right: -9%;
  width: min(34vw, 420px);
  height: min(34vw, 420px);
  background: radial-gradient(circle, var(--graph-orb-b), transparent 70%);
  animation-duration: 18s;
  animation-delay: -5s;
}
.tg-graph-aura--three {
  bottom: -16%;
  left: 28%;
  width: min(42vw, 520px);
  height: min(42vw, 520px);
  background: radial-gradient(circle, var(--graph-orb-c), transparent 72%);
  animation-duration: 20s;
  animation-delay: -9s;
}
.tg-graph-grid {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
}
.tgd .tg-graph-grid {
  background-image:
    linear-gradient(var(--graph-grid-minor) 1px, transparent 1px),
    linear-gradient(90deg, var(--graph-grid-minor) 1px, transparent 1px),
    linear-gradient(var(--graph-grid-major) 1px, transparent 1px),
    linear-gradient(90deg, var(--graph-grid-major) 1px, transparent 1px);
  background-size: 44px 44px, 44px 44px, 176px 176px, 176px 176px;
  animation: tg-grid-move 28s linear infinite;
}
.tgl .tg-graph-grid {
  background-image:
    linear-gradient(var(--graph-grid-minor) 1px, transparent 1px),
    linear-gradient(90deg, var(--graph-grid-minor) 1px, transparent 1px),
    linear-gradient(var(--graph-grid-major) 1px, transparent 1px),
    linear-gradient(90deg, var(--graph-grid-major) 1px, transparent 1px);
  background-size: 44px 44px, 44px 44px, 176px 176px, 176px 176px;
  animation: tg-grid-move 28s linear infinite;
}
@keyframes tg-grid-move {
  0%   { background-position: 0 0; }
  100% { background-position: 44px 44px; }
}
/* canvas bg particles */
.tg-bg-canvas {
  position: absolute; inset: 0; pointer-events: none; z-index: 2;
  width: 100%; height: 100%;
}
.tgd .tg-bg-canvas { opacity: 0.85; }
.tgl .tg-bg-canvas { opacity: 0.72; }

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
  display: flex; align-items: flex-start; gap: 10px;
  padding: 14px 18px; border-radius: 13px;
  font-family: 'Open Sans', sans-serif;
  backdrop-filter: blur(20px);
  box-shadow: 0 12px 36px rgba(0,0,0,0.3);
  animation: tg-toast-in 0.32s cubic-bezier(0.16,1,0.3,1) both;
  cursor: pointer; min-width: 240px; max-width: 330px;
  transition: opacity 0.2s;
}
.tg-toast-icon {
  flex: 0 0 auto;
  margin-top: 1px;
  font-size: 14px;
  line-height: 1;
}
.tg-toast-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.tg-toast-title {
  font-size: 13.5px;
  font-weight: 800;
  line-height: 1.25;
}
.tg-toast-msg {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
}
.tg-toast-msg--solo {
  font-size: 13.5px;
  font-weight: 700;
  line-height: 1.35;
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
.react-flow { z-index: 3; }
.react-flow__node-task {
  overflow: visible !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}
.react-flow__node-task:hover .tg-task-node-shell {
  transform: translateY(-2px) scale(1.012);
}
.react-flow__node-task:hover,
.react-flow__node-task:focus-within {
  z-index: 48 !important;
}
.react-flow__handle {
  width: 12px !important; height: 12px !important;
  opacity: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  pointer-events: none !important;
}
.tg-task-handle {
  width: 15px !important;
  height: 15px !important;
  opacity: 0.58 !important;
  border: 2px solid rgba(255,255,255,0.86) !important;
  pointer-events: all !important;
  transition:
    transform 0.18s ease,
    opacity 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease !important;
}
.tg-task-handle--source {
  background: linear-gradient(135deg, #22d3ee, #38bdf8) !important;
  box-shadow: 0 0 0 3px rgba(34,211,238,0.12), 0 6px 14px rgba(14,165,233,0.26) !important;
}
.tg-task-handle--target {
  background: linear-gradient(135deg, #a78bfa, #7c3aed) !important;
  box-shadow: 0 0 0 3px rgba(167,139,250,0.12), 0 6px 14px rgba(124,58,237,0.22) !important;
}
.react-flow__node-task:hover .tg-task-handle,
.react-flow__node-task:focus-within .tg-task-handle,
.tg-task-handle.connectingfrom,
.tg-task-handle.connectingto,
.tg-task-handle.valid {
  opacity: 1 !important;
  transform: scale(1.08);
}
.tgd .tg-task-handle {
  border-color: rgba(226,232,240,0.94) !important;
}
.tgd .tg-task-handle--source {
  box-shadow: 0 0 0 3px rgba(34,211,238,0.16), 0 8px 18px rgba(14,165,233,0.34) !important;
}
.tgd .tg-task-handle--target {
  box-shadow: 0 0 0 3px rgba(167,139,250,0.16), 0 8px 18px rgba(124,58,237,0.3) !important;
}
.tgl .tg-task-handle {
  border-color: rgba(255,255,255,0.96) !important;
}
.react-flow__connection-path {
  stroke-width: 2.6px !important;
  stroke-dasharray: 6 6;
}
.tgd .react-flow__connection-path {
  stroke: rgba(103,232,249,0.9) !important;
  filter: drop-shadow(0 0 8px rgba(34,211,238,0.22));
}
.tgl .react-flow__connection-path {
  stroke: rgba(59,130,246,0.82) !important;
  filter: drop-shadow(0 0 8px rgba(59,130,246,0.14));
}
.tg-task-node-shell {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-sizing: border-box;
  padding: 14px 22px;
  isolation: isolate;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}
.tg-task-node-label {
  width: 100%;
}
.tg-node-tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 18px);
  transform: translate(-50%, 10px);
  width: min(280px, calc(100vw - 36px));
  padding: 13px 14px;
  border-radius: 15px;
  border: 1px solid var(--border-hi);
  background: color-mix(in srgb, var(--panel-bg) 98%, transparent);
  color: var(--text-2);
  box-shadow: 0 18px 46px rgba(2,6,23,0.22);
  backdrop-filter: blur(18px);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s ease;
  z-index: 64;
}
.tgd .tg-node-tooltip {
  background: rgba(7,15,40,0.98);
  border-color: rgba(34,211,238,0.16);
}
.tgl .tg-node-tooltip {
  background: rgba(255,255,255,0.985);
  border-color: rgba(124,58,237,0.12);
  box-shadow: 0 20px 46px rgba(15,23,42,0.18);
}
.tg-node-tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 8px 7px 0;
  border-style: solid;
  border-color: color-mix(in srgb, var(--panel-bg) 94%, transparent) transparent transparent;
}
.tgd .tg-node-tooltip::after {
  border-color: rgba(7,15,40,0.98) transparent transparent;
}
.tgl .tg-node-tooltip::after {
  border-color: rgba(255,255,255,0.985) transparent transparent;
}
.react-flow__node-task:hover .tg-node-tooltip,
.react-flow__node-task:focus-within .tg-node-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, 0);
}
.tg-node-tooltip-head {
  display: grid;
  gap: 4px;
  margin-bottom: 10px;
}
.tg-node-tooltip-title {
  color: var(--text-1);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.35;
}
.tg-node-tooltip-status {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}
.tg-node-tooltip-status--complete { color: var(--status-complete); }
.tg-node-tooltip-status--blocked { color: var(--status-blocked); }
.tg-node-tooltip-status--ready { color: var(--status-pending); }
.tg-node-tooltip-status--unlinked { color: var(--text-3); }
.tg-node-tooltip-callout {
  margin-bottom: 10px;
  padding: 9px 10px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--status-blocked) 16%, transparent);
  background: color-mix(in srgb, var(--status-blocked) 10%, var(--panel-bg));
  color: var(--status-blocked);
  font-size: 11px;
  font-weight: 700;
  line-height: 1.45;
  text-align: left;
}
.tg-node-tooltip-grid {
  display: grid;
  gap: 10px;
}
.tg-node-tooltip-section {
  display: grid;
  gap: 6px;
}
.tg-node-tooltip-label {
  color: var(--text-3);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.7px;
  text-transform: uppercase;
}
.tg-node-tooltip-items {
  display: grid;
  gap: 5px;
}
.tg-node-tooltip-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.tg-node-tooltip-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--status-pending);
  box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 12%, transparent);
}
.tg-node-tooltip-item--complete .tg-node-tooltip-dot {
  color: var(--status-complete);
  background: var(--status-complete);
}
.tg-node-tooltip-item--pending .tg-node-tooltip-dot {
  color: var(--status-pending);
  background: var(--status-pending);
}
.tg-node-tooltip-text {
  color: var(--text-1);
  font-size: 11.5px;
  font-weight: 700;
  line-height: 1.35;
  text-align: left;
  word-break: break-word;
}
.tg-node-tooltip-empty {
  color: var(--text-3);
  font-size: 11px;
  font-weight: 600;
  text-align: left;
}
.react-flow__edge {
  overflow: visible;
}
.react-flow__edge .tg-edge-halo,
.react-flow__edge .tg-edge-main,
.react-flow__edge .tg-edge-flow,
.react-flow__edge .react-flow__edge-interaction {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.react-flow__edge .tg-edge-halo {
  opacity: 0.95;
  transition: opacity 0.24s ease;
}
.react-flow__edge .tg-edge-main {
  filter: drop-shadow(0 8px 18px rgba(15,23,42,0.16));
  transition: stroke-width 0.24s ease, opacity 0.24s ease, filter 0.24s ease;
}
.react-flow__edge .tg-edge-flow {
  stroke-dasharray: 10 12;
  animation: tg-edge-stream 1.2s linear infinite;
  filter: drop-shadow(0 0 9px rgba(255,255,255,0.2));
  opacity: 0.92;
  transition: opacity 0.24s ease, stroke-width 0.24s ease, filter 0.24s ease;
}
.react-flow__edge .tg-edge-arrow {
  pointer-events: none;
  stroke-linejoin: round;
  transition: opacity 0.24s ease, filter 0.24s ease;
}
.react-flow__edge.selected .tg-edge-halo {
  opacity: 1;
}
.react-flow__edge.selected .tg-edge-main {
  filter: drop-shadow(0 10px 22px rgba(15,23,42,0.22));
}
.react-flow__edge.selected .tg-edge-flow {
  animation-duration: 0.9s;
}
.react-flow__edge.selected .tg-edge-arrow {
  filter: drop-shadow(0 10px 16px rgba(15,23,42,0.22));
}
.tgd .react-flow__edge .tg-edge-flow {
  filter: drop-shadow(0 0 8px rgba(125,211,252,0.22));
}
.tgl .react-flow__edge .tg-edge-flow {
  filter: drop-shadow(0 0 8px rgba(59,130,246,0.16));
}
.react-flow__edge .react-flow__edge-interaction {
  pointer-events: stroke;
}
.react-flow__controls {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: var(--surface-shadow) !important;
  backdrop-filter: blur(16px);
}
.tgd .react-flow__controls { background: rgba(7,15,40,0.8) !important; border: 1px solid rgba(0,212,255,0.12) !important; }
.tgl .react-flow__controls { background: rgba(255,255,255,0.84) !important; border: 1px solid rgba(99,102,241,0.12) !important; }
.tgd .react-flow__controls button,
.tgl .react-flow__controls button {
  background: transparent !important;
  fill: #64748b !important;
  transition: background 0.2s ease, transform 0.2s ease, fill 0.2s ease;
}
.tgd .react-flow__controls button { border-bottom: 1px solid rgba(0,212,255,0.08) !important; }
.tgl .react-flow__controls button { border-bottom: 1px solid rgba(0,0,0,0.06) !important; }
.tgd .react-flow__controls button:hover {
  background: rgba(0,212,255,0.08) !important;
  fill: #e2e8f0 !important;
  transform: scale(1.03);
}
.tgl .react-flow__controls button:hover {
  background: rgba(99,102,241,0.06) !important;
  fill: #1e293b !important;
  transform: scale(1.03);
}
.tgd .tg-graph--locked .react-flow__controls-interactive {
  background: rgba(239,68,68,0.14) !important;
  fill: #fca5a5 !important;
}
.tgl .tg-graph--locked .react-flow__controls-interactive {
  background: rgba(239,68,68,0.1) !important;
  fill: #dc2626 !important;
}
.tgd .react-flow__minimap,
.tgl .react-flow__minimap {
  border-radius: 18px !important;
  box-shadow: var(--surface-shadow) !important;
  overflow: hidden;
}
.tgd .react-flow__minimap {
  background:
    linear-gradient(180deg, rgba(13,24,50,0.96), rgba(7,15,40,0.92)) !important;
  border: 1px solid rgba(34,211,238,0.18) !important;
  box-shadow:
    0 18px 42px rgba(2,6,23,0.42),
    0 0 0 1px rgba(103,232,249,0.06) inset !important;
}
.tgl .react-flow__minimap { background: rgba(255,255,255,0.86) !important; border: 1px solid rgba(99,102,241,0.1) !important; }
.tgd .react-flow__minimap .react-flow__minimap-mask {
  filter: drop-shadow(0 0 8px rgba(34,211,238,0.16));
}

@keyframes tg-progress-flow {
  0%   { background-position: 0% 50%; }
  100% { background-position: 140% 50%; }
}
@keyframes tg-edge-stream {
  0%   { stroke-dashoffset: 44; opacity: 0.32; }
  38%  { opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 0.32; }
}
@keyframes tg-aurora {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  50%  { transform: translate3d(12px, -18px, 0) scale(1.05); }
  100% { transform: translate3d(-10px, 16px, 0) scale(0.97); }
}

/* ── Responsive dashboard ── */
@media (max-width: 920px) {
  .tg-shell {
    flex-direction: column;
    height: 100dvh;
    overflow-y: auto;
  }
  .tg-panel {
    width: 100%;
    height: clamp(260px, 40dvh, 380px);
    border-right: none;
    border-bottom: 1px solid var(--border);
    box-shadow: var(--panel-shadow);
    flex: 0 0 auto;
  }
  .tg-panel-head {
    padding: 12px 14px;
    gap: 10px;
  }
  .tg-collapse-btn {
    display: inline-flex;
    width: auto;
    min-width: 84px;
    padding: 0 12px;
    gap: 8px;
    justify-content: center;
  }
  .tg-collapse-label {
    display: inline-flex;
  }
  .tg-panel--collapsed {
    width: 100%;
    height: auto;
  }
  .tg-panel--collapsed .tg-panel-head {
    padding: 12px 14px;
    align-items: stretch;
  }
  .tg-panel--collapsed .tg-brand-row {
    justify-content: flex-start;
  }
  .tg-panel--collapsed .tg-brand-copy {
    max-width: 180px;
    opacity: 1;
    overflow: visible;
    pointer-events: auto;
    transform: none;
  }
  .tg-head-actions {
    gap: 10px;
  }
  .tg-panel--collapsed .tg-head-actions {
    width: 100%;
    flex-direction: row;
  }
  .tg-user-pill {
    margin: 10px 14px;
  }
  .tg-panel--collapsed .tg-user-pill {
    margin: 10px 14px;
    padding: 10px 12px;
    justify-content: flex-start;
  }
  .tg-panel--collapsed .tg-user-email {
    max-width: none;
    opacity: 1;
  }
  .tg-panel--collapsed .tg-logout-btn {
    width: auto;
    flex: 1;
    padding: 0 12px;
  }
  .tg-panel--collapsed .tg-logout-label {
    display: inline-flex;
  }
  .tg-panel-body {
    padding: 10px 14px 18px;
    gap: 10px;
  }
  .tg-panel--collapsed .tg-panel-body {
    display: none;
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
  .tg-layout-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .tg-layout-btn {
    min-height: 68px;
    padding: 10px;
    grid-template-columns: 28px minmax(0, 1fr);
  }
  .tg-graph {
    flex: 1 0 54dvh;
    min-height: 54dvh;
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
    height: auto;
    min-height: 100dvh;
  }
  .tg-welcome-banner-shell {
    top: 12px;
    width: min(calc(100vw - 16px), 460px);
  }
  .tg-welcome-banner {
    gap: 12px;
    padding: 13px 14px 16px;
    border-radius: 18px;
  }
  .tg-welcome-banner-icon-wrap {
    width: 48px;
    height: 48px;
    flex-basis: 48px;
  }
  .tg-welcome-banner-icon {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    font-size: 22px;
  }
  .tg-welcome-banner-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 7px;
  }
  .tg-welcome-banner-title {
    font-size: 17px;
  }
  .tg-welcome-banner-copy {
    font-size: 12px;
  }
  .tg-panel {
    height: min(42dvh, 340px);
  }
  .tg-panel--collapsed {
    height: auto;
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
    padding: 9px 12px 16px;
    gap: 8px;
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
  .tg-layout-grid {
    grid-template-columns: 1fr;
  }
  .tg-layout-btn {
    min-height: 68px;
    padding: 10px;
    grid-template-columns: 28px minmax(0, 1fr);
  }
  .tg-layout-btn-title {
    font-size: 11px;
  }
  .tg-layout-btn-hint {
    font-size: 10px;
  }
  .tg-hints {
    font-size: 10.5px;
  }
  .tg-btn-row {
    flex-direction: column;
  }
  .tg-btn-row .tg-btn {
    width: 100%;
    flex-basis: auto;
  }
  .tg-graph {
    flex-basis: 58dvh;
    min-height: 58dvh;
  }
  .tg-graph-aura {
    filter: blur(32px);
  }
  .tg-graph-legend {
    left: 8px;
    right: 8px;
    top: 8px;
    width: auto;
    padding: 10px 12px;
    border-radius: 13px;
  }
  .tg-graph-legend-head {
    margin-bottom: 6px;
  }
  .tg-graph-legend-items {
    gap: 5px;
  }
  .react-flow__controls {
    left: 8px !important;
    bottom: 8px !important;
    transform: scale(0.9);
    transform-origin: left bottom;
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

/* ── Animated logo SVG ── */
@keyframes tlg-draw {
  0%   { stroke-dashoffset: 28; opacity: 0; }
  18%  { opacity: 1; }
  65%  { stroke-dashoffset: 0; opacity: 1; }
  100% { stroke-dashoffset: -28; opacity: 0; }
}
.tg-brand-icon { overflow: hidden; }

@media (prefers-reduced-motion: reduce) {
  .tg-shell *,
  .tg-shell *::before,
  .tg-shell *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .tg-graph-grid,
  .tg-graph-aura,
  .tg-prog-fill,
  .react-flow__edge .tg-edge-flow {
    animation: none !important;
  }
}


`;

const NW=230, NH=68;
function hasFiniteNodePosition(position) {
  return Number.isFinite(position?.x) && Number.isFinite(position?.y);
}

function isLegacyBoardLayout(nodes) {
  return nodes.length > 1 && nodes.every(node =>
    !hasFiniteNodePosition(node.position) || (node.position.x === 0 && node.position.y === 0)
  );
}

function snapLinearFlowPositions(positionedNodes, edges, layout) {
  if (positionedNodes.length < 2 || !edges.length) return positionedNodes;

  const nodeById = new Map(positionedNodes.map(node => [node.id, node]));
  const validEdges = edges.filter(edge => nodeById.has(edge.source) && nodeById.has(edge.target));
  if (!validEdges.length) return positionedNodes;

  const neighbors = new Map(positionedNodes.map(node => [node.id, new Set()]));
  const incomingCount = new Map();
  const outgoingCount = new Map();

  validEdges.forEach(edge => {
    neighbors.get(edge.source)?.add(edge.target);
    neighbors.get(edge.target)?.add(edge.source);
    outgoingCount.set(edge.source, (outgoingCount.get(edge.source) || 0) + 1);
    incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
  });

  const visited = new Set();
  const alignedAxisById = new Map();
  const axisKey = layout.horizontal ? "y" : "x";

  positionedNodes.forEach(node => {
    if (visited.has(node.id)) return;

    const stack = [node.id];
    const componentIds = [];

    while (stack.length) {
      const currentId = stack.pop();
      if (!currentId || visited.has(currentId)) continue;
      visited.add(currentId);
      componentIds.push(currentId);
      neighbors.get(currentId)?.forEach(nextId => {
        if (!visited.has(nextId)) stack.push(nextId);
      });
    }

    if (componentIds.length < 2) return;

    const componentNodeIds = new Set(componentIds);
    const componentEdges = validEdges.filter(edge =>
      componentNodeIds.has(edge.source) && componentNodeIds.has(edge.target)
    );

    const isLinearFlow =
      componentEdges.length === componentIds.length - 1 &&
      componentIds.every(id =>
        (incomingCount.get(id) || 0) <= 1 &&
        (outgoingCount.get(id) || 0) <= 1
      );

    if (!isLinearFlow) return;

    const alignedAxis = Math.round(
      componentIds.reduce((sum, id) => sum + (nodeById.get(id)?.position?.[axisKey] || 0), 0) /
      componentIds.length
    );

    componentIds.forEach(id => alignedAxisById.set(id, alignedAxis));
  });

  if (!alignedAxisById.size) return positionedNodes;

  return positionedNodes.map(node => (
    alignedAxisById.has(node.id)
      ? {
          ...node,
          position: {
            ...node.position,
            [axisKey]: alignedAxisById.get(node.id),
          },
        }
      : node
  ));
}

function computeAutoLayoutNodes(nodes, edges, direction = "TB") {
  if (!nodes.length) return [];
  const layout = getLayoutConfig(direction);
  const orderedNodes=[...nodes].sort((a,b)=>{
    const na=Number(a.id), nb=Number(b.id);
    if(Number.isFinite(na)&&Number.isFinite(nb)) return na-nb;
    return String(a.id).localeCompare(String(b.id));
  });
  const nodeIds = new Set(orderedNodes.map(n=>n.id));
  const validEdges = edges.filter(e=>nodeIds.has(e.source)&&nodeIds.has(e.target));
  const withHandles = (n, position) => ({
    ...n,
    sourcePosition: layout.sourcePosition,
    targetPosition: layout.targetPosition,
    position,
  });

  if (!validEdges.length) {
    if (layout.horizontal) {
      const rows = Math.max(1, Math.ceil(Math.sqrt(orderedNodes.length)));
      return orderedNodes.map((n,i)=>withHandles(n,{
        x:Math.floor(i/rows)*(NW+layout.gapX),
        y:(i%rows)*(NH+layout.gapY),
      }));
    }
    const cols = Math.max(1, Math.ceil(Math.sqrt(orderedNodes.length)));
    return orderedNodes.map((n,i)=>withHandles(n,{
      x:(i%cols)*(NW+layout.gapX),
      y:Math.floor(i/cols)*(NH+layout.gapY),
    }));
  }

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(()=>({}));
  g.setGraph({
    rankdir:layout.rankdir,
    ranker:"tight-tree",
    ranksep:layout.ranksep,
    nodesep:layout.nodesep,
    marginx:layout.marginx,
    marginy:layout.marginy,
  });
  orderedNodes.forEach(n=>g.setNode(n.id,{width:NW,height:NH}));
  validEdges.forEach(e=>g.setEdge(e.source,e.target));
  dagre.layout(g);
  const laidOutNodes = orderedNodes.map((n,i)=>{
    const p=g.node(n.id);
    const fallback = layout.horizontal
      ? {x:Math.floor(i/4)*(NW+layout.gapX),y:(i%4)*(NH+layout.gapY)}
      : {x:(i%4)*(NW+layout.gapX),y:Math.floor(i/4)*(NH+layout.gapY)};
    return withHandles(n,p ? {x:p.x-NW/2,y:p.y-NH/2} : fallback);
  });
  return snapLinearFlowPositions(laidOutNodes, validEdges, layout);
}

function layoutNodes(nodes, edges, direction = "TB") {
  if (!nodes.length) return [];
  if (isLegacyBoardLayout(nodes)) {
    return computeAutoLayoutNodes(nodes, edges, direction);
  }

  const layout = getLayoutConfig(direction);
  const orderedNodes=[...nodes].sort((a,b)=>{
    const na=Number(a.id), nb=Number(b.id);
    if(Number.isFinite(na)&&Number.isFinite(nb)) return na-nb;
    return String(a.id).localeCompare(String(b.id));
  });

  return orderedNodes.map((node, index)=>({
    ...node,
    sourcePosition: layout.sourcePosition,
    targetPosition: layout.targetPosition,
    position: hasFiniteNodePosition(node.position)
      ? node.position
      : (computeAutoLayoutNodes([node], [], direction)[0]?.position || {
          x:(index%4)*(NW+layout.gapX),
          y:Math.floor(index/4)*(NH+layout.gapY),
        }),
  }));
}

/* ═══════════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════════ */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((content, type="info") => {
    const id = Date.now()+Math.random();
    const toast = typeof content === "string"
      ? {msg: content, type}
      : {type, ...content};
    const duration = Number.isFinite(toast.duration) ? toast.duration : 3500;

    setToasts(t=>[...t,{id,...toast}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)), duration);
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

function TaskTooltipSection({title, items, emptyText}) {
  return (
    <div className="tg-node-tooltip-section">
      <div className="tg-node-tooltip-label">{title}</div>
      {items.length ? (
        <div className="tg-node-tooltip-items">
          {items.map(item=>(
            <div
              key={item.id}
              className={`tg-node-tooltip-item tg-node-tooltip-item--${item.completed ? "complete" : "pending"}`}
            >
              <span className="tg-node-tooltip-dot" />
              <span className="tg-node-tooltip-text">{item.label}</span>
              <span className="tg-node-tooltip-status">
                {item.completed ? "Done" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="tg-node-tooltip-empty">{emptyText}</div>
      )}
    </div>
  );
}

function TaskNode({data}) {
  const nodeId = useNodeId();
  const updateNodeInternals = useUpdateNodeInternals();

  useLayoutEffect(()=>{
    if(!nodeId) return undefined;
    updateNodeInternals(nodeId);
    let frame = requestAnimationFrame(()=>updateNodeInternals(nodeId));
    return ()=>cancelAnimationFrame(frame);
  },[
    data.positionSyncKey,
    data.sourceHandlePosition,
    data.targetHandlePosition,
    nodeId,
    updateNodeInternals,
  ]);

  return (
    <div
      className="tg-task-node-shell"
      style={data.cardStyle}
      aria-label={data.accessibleLabel}
      onDoubleClick={event => {
        event.preventDefault();
        event.stopPropagation();
        data.onRequestDelete?.();
      }}
    >
      <Handle
        key={`target-${data.targetHandlePosition || Position.Top}`}
        type="target"
        position={data.targetHandlePosition || Position.Top}
        className="tg-task-handle tg-task-handle--target"
        aria-label={`Connect a prerequisite into ${data.label}`}
      />
      <div className="tg-task-node-label">{data.label}</div>
      <div className="tg-node-tooltip" role="tooltip" aria-hidden="true">
        <div className="tg-node-tooltip-head">
          <div className="tg-node-tooltip-title">{data.label}</div>
          <div className={`tg-node-tooltip-status tg-node-tooltip-status--${data.status}`}>
            {data.statusText}
          </div>
        </div>
        {data.blockedSummary && (
          <div className="tg-node-tooltip-callout">{data.blockedSummary}</div>
        )}
        <div className="tg-node-tooltip-grid">
          <TaskTooltipSection
            title="Depends on"
            items={data.parents}
            emptyText="No prerequisites"
          />
          <TaskTooltipSection
            title="Required by"
            items={data.children}
            emptyText="No dependent tasks"
          />
        </div>
      </div>
      <Handle
        key={`source-${data.sourceHandlePosition || Position.Bottom}`}
        type="source"
        position={data.sourceHandlePosition || Position.Bottom}
        className="tg-task-handle tg-task-handle--source"
        aria-label={`Connect ${data.label} into another task`}
      />
    </div>
  );
}

function buildDependencyPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}) {
  const horizontalFlow =
    sourcePosition === Position.Left ||
    sourcePosition === Position.Right ||
    targetPosition === Position.Left ||
    targetPosition === Position.Right;

  if (horizontalFlow) {
    const deltaY = Math.abs(targetY - sourceY);
    const midX = sourceX + (targetX - sourceX) / 2;

    if (deltaY <= 2) {
      return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    }

    return [
      `M ${sourceX} ${sourceY}`,
      `L ${midX} ${sourceY}`,
      `L ${midX} ${targetY}`,
      `L ${targetX} ${targetY}`,
    ].join(" ");
  }

  const midY = sourceY + (targetY - sourceY) / 2;
  const deltaX = Math.abs(targetX - sourceX);

  if (deltaX <= 2) {
    return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  }

  return [
    `M ${sourceX} ${sourceY}`,
    `L ${sourceX} ${midY}`,
    `L ${targetX} ${midY}`,
    `L ${targetX} ${targetY}`,
  ].join(" ");
}

function getTrimmedTargetPoint(targetX, targetY, targetPosition, arrowGap = 11.5) {
  switch (targetPosition) {
    case Position.Top:
      return {x: targetX, y: targetY - arrowGap};
    case Position.Bottom:
      return {x: targetX, y: targetY + arrowGap};
    case Position.Left:
      return {x: targetX - arrowGap, y: targetY};
    case Position.Right:
      return {x: targetX + arrowGap, y: targetY};
    default:
      return {x: targetX, y: targetY};
  }
}

function buildArrowPoints(targetX, targetY, targetPosition, arrowWidth = 7.5, arrowDepth = 11.5) {
  switch (targetPosition) {
    case Position.Top:
      return `${targetX},${targetY} ${targetX - arrowWidth},${targetY - arrowDepth} ${targetX + arrowWidth},${targetY - arrowDepth}`;
    case Position.Bottom:
      return `${targetX},${targetY} ${targetX - arrowWidth},${targetY + arrowDepth} ${targetX + arrowWidth},${targetY + arrowDepth}`;
    case Position.Left:
      return `${targetX},${targetY} ${targetX - arrowDepth},${targetY - arrowWidth} ${targetX - arrowDepth},${targetY + arrowWidth}`;
    case Position.Right:
      return `${targetX},${targetY} ${targetX + arrowDepth},${targetY - arrowWidth} ${targetX + arrowDepth},${targetY + arrowWidth}`;
    default:
      return `${targetX},${targetY} ${targetX - arrowWidth},${targetY - arrowDepth} ${targetX + arrowWidth},${targetY - arrowDepth}`;
  }
}

function DependencyEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  data,
  interactionWidth = 26,
  selected,
}) {
  const arrowWidth = 7.5;
  const arrowDepth = 11.5;
  const arrowGap = arrowDepth;
  const trimmedTarget = getTrimmedTargetPoint(targetX, targetY, targetPosition, arrowGap);

  const edgePath = buildDependencyPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const visualPath = buildDependencyPath({
    sourceX,
    sourceY,
    targetX: trimmedTarget.x,
    targetY: trimmedTarget.y,
    sourcePosition,
    targetPosition,
  });

  const lineStroke = data?.lineStroke || style?.stroke || "rgba(71,85,105,0.48)";
  const flowStroke = data?.flowStroke || lineStroke;
  const haloStroke = data?.haloStroke || lineStroke;
  const arrowStroke = data?.arrowStroke || lineStroke;
  const lineWidth = Number(style?.strokeWidth) || 2.6;
  const arrowPoints = buildArrowPoints(targetX, targetY, targetPosition, arrowWidth, arrowDepth);

  return (
    <>
      <path
        d={visualPath}
        className="tg-edge-halo"
        style={{
          fill: "none",
          stroke: haloStroke,
          strokeWidth: lineWidth + 7,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
      />
      <path
        d={visualPath}
        className="tg-edge-main"
        style={{
          fill: "none",
          stroke: lineStroke,
          strokeWidth: selected ? lineWidth + 0.2 : lineWidth,
          opacity: selected ? 1 : 0.96,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
      />
      <path
        d={visualPath}
        className="tg-edge-flow"
        style={{
          fill: "none",
          stroke: flowStroke,
          strokeWidth: Math.max(1.45, lineWidth - 0.45),
          opacity: selected ? 0.96 : 0.82,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
      />
      <polygon
        points={arrowPoints}
        className="tg-edge-arrow"
        style={{
          fill: arrowStroke,
          opacity: selected ? 1 : 0.96,
        }}
      />
      <path
        d={edgePath}
        className="react-flow__edge-interaction"
        style={{
          fill: "none",
          stroke: "transparent",
          strokeWidth: interactionWidth,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
      />
    </>
  );
}

function DependencyConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
  connectionStatus,
}) {
  const previewTargetPosition =
    toPosition ||
    (fromPosition === Position.Left
      ? Position.Right
      : fromPosition === Position.Right
        ? Position.Left
        : fromPosition === Position.Top
          ? Position.Bottom
          : Position.Top);
  const trimmedTarget = getTrimmedTargetPoint(toX, toY, previewTargetPosition);
  const previewPath = buildDependencyPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: trimmedTarget.x,
    targetY: trimmedTarget.y,
    sourcePosition: fromPosition,
    targetPosition: previewTargetPosition,
  });
  const previewArrow = buildArrowPoints(toX, toY, previewTargetPosition);
  const strokeColor = connectionStatus === "invalid"
    ? "var(--status-blocked)"
    : "var(--accent)";
  const glowFilter = connectionStatus === "invalid"
    ? "drop-shadow(0 0 8px rgba(239,68,68,0.22))"
    : "drop-shadow(0 0 8px rgba(0,212,255,0.22))";

  return (
    <>
      <path
        d={previewPath}
        style={{
          fill: "none",
          stroke: strokeColor,
          strokeWidth: 2.6,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeDasharray: "6 6",
          filter: glowFilter,
        }}
      />
      <polygon
        points={previewArrow}
        style={{
          fill: strokeColor,
          opacity: 0.92,
        }}
      />
    </>
  );
}

const nodeTypes = {task: TaskNode};
const edgeTypes = {dependency: DependencyEdge};

/* ═══════════════════════════════════════════════════════
   BG CANVAS
═══════════════════════════════════════════════════════ */
function BgCanvas({dark}) {
  const ref=useRef(null), raf=useRef(null);
  useEffect(()=>{
    const c=ref.current; if(!c) return;
    const ctx=c.getContext("2d"); if(!ctx) return;
    let W=0, H=0, dpr=1;

    const setSize=()=>{
      dpr=Math.min(typeof window!=="undefined" ? window.devicePixelRatio || 1 : 1, 2);
      W=c.offsetWidth;
      H=c.offsetHeight;
      c.width=Math.max(1, Math.round(W*dpr));
      c.height=Math.max(1, Math.round(H*dpr));
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    setSize();

    const pts=Array.from({length:32},(_,i)=>({
      x:Math.random()*Math.max(W,1),
      y:Math.random()*Math.max(H,1),
      vx:(Math.random()-0.5)*0.18,
      vy:(Math.random()-0.5)*0.18,
      r:Math.random()*1.8+0.5,
      a:Math.random()*0.22+0.06,
      phase:Math.random()*Math.PI*2,
      drift:Math.random()*0.18+0.04,
      depth:(i%5)+1,
    }));
    const glowColors=dark
      ? ["0,212,255","56,189,248","124,58,237"]
      : ["56,189,248","99,102,241","16,185,129"];
    const linkColor=dark ? "71,85,105" : "148,163,184";

    let ro;
    let cleanupResize=()=>{};
    if(typeof ResizeObserver!=="undefined"){
      ro=new ResizeObserver(setSize);
      ro.observe(c);
    } else if(typeof window!=="undefined"){
      window.addEventListener("resize", setSize);
      cleanupResize=()=>window.removeEventListener("resize", setSize);
    }

    const drawOrb=(x,y,r,color,alpha)=>{
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,`rgba(${color},${alpha})`);
      g.addColorStop(0.45,`rgba(${color},${alpha*0.36})`);
      g.addColorStop(1,"rgba(255,255,255,0)");
      ctx.fillStyle=g;
      ctx.beginPath();
      ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fill();
    };

    const draw=()=>{
      const t=performance.now()*0.001;
      ctx.clearRect(0,0,W,H);

      drawOrb(W*0.14 + Math.sin(t*0.28)*36, H*0.18 + Math.cos(t*0.23)*24, Math.min(W,H)*0.16, glowColors[0], dark?0.18:0.12);
      drawOrb(W*0.82 + Math.cos(t*0.24)*34, H*0.24 + Math.sin(t*0.31)*28, Math.min(W,H)*0.14, glowColors[1], dark?0.14:0.11);
      drawOrb(W*0.52 + Math.sin(t*0.18 + 1.7)*44, H*0.84 + Math.cos(t*0.2 + 1.7)*30, Math.min(W,H)*0.18, glowColors[2], dark?0.1:0.08);

      pts.forEach((p,idx)=>{
        p.x += p.vx + Math.sin(t*p.drift + p.phase) * 0.08 * p.depth;
        p.y += p.vy + Math.cos(t*(p.drift+0.04) + p.phase) * 0.06 * p.depth;
        if(p.x < -12) p.x = W + 12;
        if(p.x > W + 12) p.x = -12;
        if(p.y < -12) p.y = H + 12;
        if(p.y > H + 12) p.y = -12;

        const pulse=(Math.sin(t*(0.9+p.drift)+p.phase)+1)/2;
        const color=glowColors[idx % glowColors.length];
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r + pulse*0.7,0,Math.PI*2);
        ctx.fillStyle=`rgba(${color},${p.a + pulse*0.08})`;
        ctx.fill();
      });

      for(let i=0;i<pts.length;i++){
        for(let j=i+1;j<pts.length;j++){
          const dx=pts[i].x-pts[j].x;
          const dy=pts[i].y-pts[j].y;
          const d=Math.sqrt(dx*dx+dy*dy);
          if(d<150){
            const alpha=(1-d/150)*(dark?0.1:0.08);
            ctx.beginPath();
            ctx.moveTo(pts[i].x,pts[i].y);
            ctx.lineTo(pts[j].x,pts[j].y);
            ctx.strokeStyle=`rgba(${linkColor},${alpha})`;
            ctx.lineWidth=d<70?0.9:0.6;
            ctx.stroke();
          }
        }
      }

      raf.current=requestAnimationFrame(draw);
    };
    draw();
    return()=>{
      cancelAnimationFrame(raf.current);
      if(ro) ro.disconnect();
      cleanupResize();
    };
  },[dark]);
  return <canvas ref={ref} className="tg-bg-canvas"/>;
}

function RouteBootScreen({dark}) {
  const bg = dark ? "#050d1f" : "#eef4ff";
  const panel = dark ? "rgba(7,15,40,0.92)" : "rgba(255,255,255,0.92)";
  const text = dark ? "#e2e8f0" : "#0f172a";
  const sub = dark ? "#94a3b8" : "#64748b";
  const ring = dark ? "rgba(0,212,255,0.24)" : "rgba(124,58,237,0.18)";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        padding: "24px",
      }}
    >
      <div
        style={{
          minWidth: "220px",
          padding: "22px 24px",
          borderRadius: "18px",
          border: `1px solid ${ring}`,
          background: panel,
          color: text,
          boxShadow: dark
            ? "0 24px 60px rgba(2,6,23,0.42)"
            : "0 24px 60px rgba(148,163,184,0.22)",
          textAlign: "center",
          fontFamily: "'Open Sans', sans-serif",
        }}
      >
        <div
          style={{
            width: "34px",
            height: "34px",
            margin: "0 auto 12px",
            borderRadius: "999px",
            border: `3px solid ${ring}`,
            borderTopColor: dark ? "#00d4ff" : "#7c3aed",
          }}
        />
        <div style={{fontSize: "15px", fontWeight: 800}}>Loading TaskGraph</div>
        <div style={{marginTop: "6px", fontSize: "12px", fontWeight: 600, color: sub}}>
          Restoring your session...
        </div>
      </div>
    </div>
  );
}

function WelcomeBanner({banner}) {
  if (!banner) return null;

  return (
    <div className="tg-welcome-banner-shell" role="status" aria-live="polite">
      <div className="tg-welcome-banner" key={banner.id}>
        <div className="tg-welcome-banner-icon-wrap" aria-hidden="true">
          <div className="tg-welcome-banner-icon">
            {banner.icon}
          </div>
        </div>
        <div className="tg-welcome-banner-text">
          <div className="tg-welcome-banner-meta">
            <div className="tg-welcome-banner-kicker">{banner.kicker}</div>
            <div className="tg-welcome-banner-badge">
              <span className="tg-welcome-banner-badge-dot" />
              Workspace synced
            </div>
          </div>
          <div className="tg-welcome-banner-title">
            <span className="tg-welcome-banner-greeting">{banner.greeting}</span>
            <span className="tg-welcome-banner-name">{banner.name}</span>
            <span className="tg-welcome-banner-hand" aria-hidden="true">👋</span>
          </div>
          <div className="tg-welcome-banner-copy">{banner.detail}</div>
        </div>
        <div className="tg-welcome-banner-progress" aria-hidden="true" />
      </div>
    </div>
  );
}

function buildTaskFilterEmptyMessage(searchTerm, filterLabel, hasStatusFilter) {
  const trimmedSearch = searchTerm.trim();

  if (trimmedSearch && hasStatusFilter) {
    return `No tasks match "${trimmedSearch}" in ${filterLabel}. Try a different keyword or status filter.`;
  }

  if (trimmedSearch) {
    return `No tasks match "${trimmedSearch}". Try a different keyword.`;
  }

  return `No tasks currently match ${filterLabel}. Try another status filter.`;
}

/* ═══════════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════════ */
export default function App() {
  const initialMobileViewport =
    typeof window !== "undefined" && window.innerWidth <= VIEWPORT_BREAKPOINTS.mobile;
  const initialCompactViewport =
    typeof window !== "undefined" && window.innerWidth < VIEWPORT_BREAKPOINTS.compact;
  const [user,     setUser]     = useState(null);
  const [authReady,setAuthReady]= useState(false);
  const [route,    setRoute]    = useState(()=>normalizeRoute(
    typeof window !== "undefined" ? window.location.pathname : ROUTES.landing
  ));
  const [canvasInteractive, setCanvasInteractive] = useState(true);
  const [nodes,    setNodes]    = useState([]);
  const [edges,    setEdges]    = useState([]);
  const [search,   setSearch]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [taskName, setTaskName] = useState("");
  const [parent,   setParent]   = useState("");
  const [child,    setChild]    = useState("");
  const [editTaskId, setEditTaskId] = useState("");
  const [editTaskName, setEditTaskName] = useState("");
  const [modal,    setModal]    = useState(null);
  const [welcomeBanner, setWelcomeBanner] = useState(null);
  const [boardReady, setBoardReady] = useState(false);
  const [boardError, setBoardError] = useState("");
  const [isMobileViewport, setIsMobileViewport] = useState(initialMobileViewport);
  const [isCompactViewport, setIsCompactViewport] = useState(initialCompactViewport);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("tg-dark") !== "false";
    } catch {
      return true;
    }
  });
  const [panelCollapsed, setPanelCollapsed] = useState(()=>{
    if (typeof window !== "undefined" && window.innerWidth <= VIEWPORT_BREAKPOINTS.mobile) {
      return true;
    }
    return readStoredPanelCollapsed();
  });
  const [layoutDirection, setLayoutDirection] = useState(()=>{
    try{
      const stored = localStorage.getItem("tg-layout-direction") || "TB";
      return VALID_LAYOUT_DIRECTIONS.has(stored) ? stored : "TB";
    }catch{
      return "TB";
    }
  });

  const {toasts,show:toast,dismiss} = useToast();
  const clickTimer = useRef(null);
  const mResolve   = useRef(null);
  const flowRef    = useRef(null);
  const graphRef   = useRef(null);
  const importFileRef = useRef(null);
  const pendingDashboardWelcome = useRef(false);
  const hasShownDashboardWelcome = useRef(false);
  const previousMobileViewport = useRef(initialMobileViewport);
  const suppressNodeClickRef = useRef(false);
  const interactionSuppressTimerRef = useRef(null);
  const legacyLayoutHydratingRef = useRef(false);

  const navigate = useCallback((nextRoute, {replace=false} = {}) => {
    const normalizedRoute = normalizeRoute(nextRoute);
    if (typeof window !== "undefined") {
      const currentRoute = normalizeRoute(window.location.pathname);
      if (replace || currentRoute !== normalizedRoute) {
        window.history[replace ? "replaceState" : "pushState"]({}, "", normalizedRoute);
      }
    }
    setRoute(normalizedRoute);
  }, []);

  const suppressNodeClicksTemporarily = useCallback((duration = 220) => {
    suppressNodeClickRef.current = true;
    if (interactionSuppressTimerRef.current) {
      clearTimeout(interactionSuppressTimerRef.current);
    }
    interactionSuppressTimerRef.current = setTimeout(() => {
      suppressNodeClickRef.current = false;
      interactionSuppressTimerRef.current = null;
    }, duration);
  }, []);

  const fitGraph = useCallback((duration=450)=>{
    if(!flowRef.current) return;
    flowRef.current.fitView({
      padding: isCompactViewport ? CANVAS_VIEWPORT.fitPadding.compact : CANVAS_VIEWPORT.fitPadding.desktop,
      duration,
    });
  },[isCompactViewport]);

  useEffect(() => () => {
    if (interactionSuppressTimerRef.current) {
      clearTimeout(interactionSuppressTimerRef.current);
    }
  }, []);

  const ensureBoardReady = useCallback(() => {
    if (!user) {
      return false;
    }

    if (!boardReady) {
      toast("Your task board is still syncing. Please wait a moment.", "info");
      return false;
    }

    if (boardError) {
      toast("Cloud sync is unavailable right now. Refresh and try again.", "error");
      return false;
    }

    return true;
  }, [boardError, boardReady, toast, user]);

  // Inject CSS
  useEffect(()=>{
    const existing = document.getElementById("tg-app-css");
    if (existing) {
      existing.textContent = APP_CSS;
      return;
    }
    const s=document.createElement("style");s.id="tg-app-css";s.textContent=APP_CSS;
    document.head.appendChild(s);
  },[]);

  useEffect(()=>{
    if (isMobileViewport) return;
    try {
      localStorage.setItem("tg-panel-collapsed", String(panelCollapsed));
    } catch {}
  },[isMobileViewport, panelCollapsed]);
  useEffect(()=>{ try{localStorage.setItem("tg-layout-direction",layoutDirection);}catch{} },[layoutDirection]);
  useEffect(() => {
    try {
      localStorage.setItem("tg-dark", String(dark));
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.dataset.tgTheme = dark ? "dark" : "light";
      document.body?.setAttribute("data-tg-theme", dark ? "dark" : "light");
    }
  }, [dark]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncViewport = () => {
      const nextMobile = window.innerWidth <= VIEWPORT_BREAKPOINTS.mobile;
      const nextCompact = window.innerWidth < VIEWPORT_BREAKPOINTS.compact;

      setIsMobileViewport(nextMobile);
      setIsCompactViewport(nextCompact);

      if (previousMobileViewport.current !== nextMobile) {
        previousMobileViewport.current = nextMobile;
        setPanelCollapsed(nextMobile ? true : readStoredPanelCollapsed());
      }
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncRoute = () => {
      const normalizedRoute = normalizeRoute(window.location.pathname);
      if (window.location.pathname !== normalizedRoute) {
        window.history.replaceState({}, "", normalizedRoute);
      }
      setRoute(normalizedRoute);
    };

    syncRoute();
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);


    // Sync edit input when a task is selected for editing
  useEffect(() => {
    if (editTaskId) {
      const node = nodes.find(n => n.id === editTaskId);
      if (node) setEditTaskName(node.data.label);
    }
  }, [editTaskId, nodes]);

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
      setUser(toAppUser(u));
      setAuthReady(true);
    });
  },[]);

  useEffect(() => {
    if (!authReady) return;

    if (!user && (route === ROUTES.dashboard || route === ROUTES.profile)) {
      navigate(ROUTES.login, {replace: true});
      return;
    }

    if (user && (route === ROUTES.login || route === ROUTES.signup)) {
      navigate(ROUTES.dashboard, {replace: true});
    }
  }, [authReady, navigate, route, user]);

  useEffect(() => {
    if (route !== ROUTES.dashboard) return undefined;
    if (!authReady || !user) return undefined;

    const shouldShowWelcome =
      pendingDashboardWelcome.current || !hasShownDashboardWelcome.current;

    if (!shouldShowWelcome) return undefined;

    pendingDashboardWelcome.current = false;
    hasShownDashboardWelcome.current = true;
    setWelcomeBanner({
      id: Date.now(),
      ...buildWelcomeBanner(formatUserDisplayName(user)),
    });
    return undefined;
  }, [authReady, route, user]);

  useEffect(() => {
    if (!welcomeBanner) return undefined;

    const timer = setTimeout(() => setWelcomeBanner(null), 5000);
    return () => clearTimeout(timer);
  }, [welcomeBanner]);

  useEffect(() => {
    if (route === ROUTES.dashboard && user) return;
    setWelcomeBanner(null);
  }, [route, user]);

  useEffect(() => {
    if (user) return;
    hasShownDashboardWelcome.current = false;
  }, [user]);

  // Firestore
  useEffect(()=>{
    if(!user){
      setNodes([]);
      setEdges([]);
      setBoardReady(false);
      setBoardError("");
      return undefined;
    }

    setBoardReady(false);
    setBoardError("");

    let active = true;
    let nodesLoaded = false;
    let edgesLoaded = false;
    let syncErrorShown = false;

    const markLoaded = () => {
      if (active && nodesLoaded && edgesLoaded) {
        setBoardReady(true);
        setBoardError("");
      }
    };

    const handleSyncError = () => {
      if (!active) return;

      const message = "We couldn't load your saved board from Firestore. Refresh and check your Firebase access.";
      setBoardError(message);
      setBoardReady(true);

      if (!syncErrorShown) {
        syncErrorShown = true;
        toast(message, "error");
      }
    };

    const unsubscribeNodes = onSnapshot(
      collection(db,"users",user.uid,"nodes"),
      snapshot => {
        if (!active) return;
        setNodes(snapshot.docs.map(docSnapshot => docSnapshot.data()));
        nodesLoaded = true;
        markLoaded();
      },
      handleSyncError
    );
    const unsubscribeEdges = onSnapshot(
      collection(db,"users",user.uid,"edges"),
      snapshot => {
        if (!active) return;
        setEdges(snapshot.docs.map(docSnapshot => docSnapshot.data()));
        edgesLoaded = true;
        markLoaded();
      },
      handleSyncError
    );

    return()=>{
      active = false;
      unsubscribeNodes();
      unsubscribeEdges();
    };
  },[toast, user]);

  useEffect(()=>{
    if(!flowRef.current||nodes.length===0) return;
    const id=setTimeout(()=>fitGraph(), 80);
    return()=>clearTimeout(id);
  },[nodes.length,edges.length,layoutDirection,search,statusFilter,fitGraph]);

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

  const buildNextTaskPosition = useCallback(() => {
    const positionedNodes = layoutNodes(nodes, edges, layoutDirection);
    if (!positionedNodes.length) {
      return { x: 0, y: 0 };
    }

    const layout = getLayoutConfig(layoutDirection);
    if (layout.horizontal) {
      const maxX = Math.max(...positionedNodes.map(node => node.position?.x ?? 0));
      const anchorY = positionedNodes[0]?.position?.y ?? 0;
      return {
        x: maxX + NW + layout.gapX,
        y: anchorY,
      };
    }

    const maxY = Math.max(...positionedNodes.map(node => node.position?.y ?? 0));
    const anchorX = positionedNodes[0]?.position?.x ?? 0;
    return {
      x: anchorX,
      y: maxY + NH + layout.gapY,
    };
  }, [edges, layoutDirection, nodes]);

  // CRUD
  const deleteNode=async(nodeId,label)=>{
    if(!ensureBoardReady()) return;
    const ok=await confirm({icon:"🗑️",title:"Delete Task",
      message:`Permanently delete "${label}" and all its dependency links?`,
      danger:true,confirmLabel:"Delete Task"
    });
    if(!ok) return;
    try {
      const[ns,es]=await Promise.all([
        getDocs(collection(db,"users",user.uid,"nodes")),
        getDocs(collection(db,"users",user.uid,"edges")),
      ]);
      await Promise.all([
        ...ns.docs.filter(d=>d.data().id===nodeId).map(d=>deleteDoc(doc(db,"users",user.uid,"nodes",d.id))),
        ...es.docs.filter(d=>d.data().source===nodeId||d.data().target===nodeId).map(d=>deleteDoc(doc(db,"users",user.uid,"edges",d.id))),
      ]);
      toast(`"${label}" deleted`,"error");
    } catch (error) {
      toast("Could not delete this task right now. Please try again.", "error");
    }
  };

  const addTask=async()=>{
    if(!ensureBoardReady()) return;
    if(!taskName.trim()) return;
    const nextTaskName = taskName.trim();
    const nextPosition = buildNextTaskPosition();
    try {
      await addDoc(collection(db,"users",user.uid,"nodes"),{
        id:Date.now().toString(),
        data:{label:nextTaskName,completed:false},
        position:nextPosition
      });
      toast(`"${nextTaskName}" added`,"success");
      setTaskName("");
    } catch (error) {
      toast("Could not save this task right now. Please try again.", "error");
    }
  };


    const editTask = async () => {
    if(!ensureBoardReady()) return;
    if (!editTaskId || !editTaskName.trim()) return;
    
    // Check if name actually changed
    const originalNode = nodes.find(n => n.id === editTaskId);
    if (originalNode && editTaskName.trim() === originalNode.data.label) {
      setEditTaskId("");
      setEditTaskName("");
      return;
    }
    
    try {
      const ns = await getDocs(collection(db, "users", user.uid, "nodes"));
      const d = ns.docs.find(x => x.data().id === editTaskId);
      if (d) {
        await updateDoc(doc(db, "users", user.uid, "nodes", d.id), {
          "data.label": editTaskName.trim()
        });
        toast(`"${editTaskName.trim()}" updated`, "success");
      }
    } catch (err) {
      console.error("Edit error:", err);
      toast("Failed to update task", "error");
    }
    setEditTaskId("");
    setEditTaskName("");
  };

  const createDependency = async ({
    sourceId,
    targetId,
    resetSelectors = false,
  }) => {
    if(!ensureBoardReady()) return false;

    let nextLayoutNodes = null;
    let nextLayoutEdges = null;

    const localValidation = validateDependencyLink({
      sourceId,
      targetId,
      nodes,
      edges,
    });
    if(localValidation){
      toast(localValidation.message, localValidation.type);
      return false;
    }

    try {
      const [nodeSnapshot, edgeSnapshot] = await Promise.all([
        getDocs(collection(db,"users",user.uid,"nodes")),
        getDocs(collection(db,"users",user.uid,"edges")),
      ]);
      const currentNodes = nodeSnapshot.docs
        .map(snapshot => snapshot.data())
        .filter(item => item?.id);
      const currentEdges = edgeSnapshot.docs
        .map(snapshot => snapshot.data())
        .filter(item => item?.source && item?.target);

      const serverValidation = validateDependencyLink({
        sourceId,
        targetId,
        nodes: currentNodes,
        edges: currentEdges,
      });
      if(serverValidation){
        if(serverValidation.code === "missing-task"){
          const currentNodeIds = new Set(currentNodes.map(node => node.id));
          if(!currentNodeIds.has(parent)) setParent("");
          if(!currentNodeIds.has(child)) setChild("");
        }
        toast(serverValidation.message, serverValidation.type);
        return false;
      }

      const nextEdge = {
        id: buildDependencyEdgeId(sourceId, targetId),
        source: sourceId,
        target: targetId,
        animated: true,
      };
      const edgeRef = doc(db, "users", user.uid, "edges", buildDependencyDocId(sourceId, targetId));

      await runTransaction(db, async transaction => {
        const existingEdge = await transaction.get(edgeRef);
        if (existingEdge.exists()) {
          const err = new Error("Dependency already exists.");
          err.code = "dependency/duplicate";
          throw err;
        }

        transaction.set(edgeRef, nextEdge);
      });

      nextLayoutEdges = [...currentEdges, nextEdge];
      nextLayoutNodes = computeAutoLayoutNodes(currentNodes, nextLayoutEdges, layoutDirection);

      setNodes(currentNodesForView => mergeNodePositions(currentNodesForView, nextLayoutNodes));
      setEdges(currentEdgesForView => (
        currentEdgesForView.some(edge => edge.id === nextEdge.id)
          ? currentEdgesForView
          : nextLayoutEdges
      ));
    } catch (error) {
      if (error?.code === "dependency/duplicate") {
        toast("Dependency already exists", "warn");
        return false;
      }

      toast("Could not link tasks right now. Please try again.", "error");
      return false;
    }

    if (resetSelectors) {
      setParent("");
      setChild("");
    }

    if (nextLayoutNodes?.length && nextLayoutEdges?.length) {
      await persistNodePositions(nextLayoutNodes, { silent: true });
    }

    toast("Tasks linked","success");
    return true;
  };

  const addDep=async()=>{
    await createDependency({
      sourceId: parent,
      targetId: child,
      resetSelectors: true,
    });
  };

  const onConnect = async connection => {
    if (!connection?.source || !connection?.target) return;
    await createDependency({
      sourceId: connection.source,
      targetId: connection.target,
      resetSelectors: false,
    });
  };

  const onNodesChange = useCallback(changes => {
    setNodes(currentNodes => applyNodeChanges(changes, currentNodes));
  }, []);

  const onNodeDragStart = useCallback(() => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    suppressNodeClicksTemporarily(260);
  }, [suppressNodeClicksTemporarily]);

  const onNodeDragStop = useCallback(async (_, node) => {
    suppressNodeClicksTemporarily(260);

    if (!ensureBoardReady()) return;

    try {
      const nodeSnapshot = await getDocs(collection(db,"users",user.uid,"nodes"));
      const matchingNode = nodeSnapshot.docs.find(snapshot => snapshot.data().id === node.id);
      if (matchingNode && hasFiniteNodePosition(node.position)) {
        await updateDoc(matchingNode.ref, {
          position: {
            x: node.position.x,
            y: node.position.y,
          },
        });
      }
    } catch (error) {
      toast("Could not save this task position right now. Please try again.", "error");
    }
  }, [ensureBoardReady, suppressNodeClicksTemporarily, toast, user]);

  const onConnectStart = useCallback(() => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    suppressNodeClicksTemporarily(260);
  }, [suppressNodeClicksTemporarily]);

  const onConnectEnd = useCallback(() => {
    suppressNodeClicksTemporarily(260);
  }, [suppressNodeClicksTemporarily]);

  const onNodeClick=(event,node)=>{
    if (suppressNodeClickRef.current) {
      return;
    }
    if (event?.target?.closest?.(".react-flow__handle")) {
      return;
    }
    if(!ensureBoardReady()) return;
    if(clickTimer.current){
      clearTimeout(clickTimer.current);
      clickTimer.current=null;
    }
    clickTimer.current=setTimeout(async()=>{
      try {
        const ns=await getDocs(collection(db,"users",user.uid,"nodes"));
        const d=ns.docs.find(x=>x.data().id===node.id);
        if(d){
          const was=d.data().data.completed;
          const linked=hasLinkedDependency(node.id,edges);
          if(!was&&!linked){
            toast(formatUnlinkedTaskMessage(node.data.label),"warn");
            clickTimer.current=null;
            return;
          }
          const blockers=getBlockingTasks(node.id,edges,nodes);
          if(!was&&blockers.length){
            toast(formatBlockedTaskMessage(blockers),"warn");
            clickTimer.current=null;
            return;
          }
          await updateDoc(doc(db,"users",user.uid,"nodes",d.id),{"data.completed":!was});
          toast(was?"Marked as pending":"Completed",was?"info":"success");
        }
      } catch (error) {
        toast("Could not update this task right now. Please try again.", "error");
      }
      clickTimer.current=null;
    },260);
  };

  const onEdgeClick=async(_,edge)=>{
    if(!ensureBoardReady()) return;
    const ok=await confirm({icon:"🔗",title:"Remove Dependency",
      message:"Remove this dependency link between the two tasks?",
      danger:true,confirmLabel:"Remove"
    });
    if(!ok) return;
    try {
      const es=await getDocs(collection(db,"users",user.uid,"edges"));
      await Promise.all(es.docs.filter(d=>d.data().id===edge.id).map(d=>deleteDoc(doc(db,"users",user.uid,"edges",d.id))));
      toast("Dependency removed","info");
    } catch (error) {
      toast("Could not remove this dependency right now. Please try again.", "error");
    }
  };

  const handleLogout=async()=>{
    const ok=await confirm({icon:"👋",title:"Sign Out",
      message:"Sign out of TaskGraph? Your data is safely stored in the cloud.",
      danger:false,confirmLabel:"Sign Out"
    });
    if(ok){
      pendingDashboardWelcome.current = false;
      hasShownDashboardWelcome.current = false;
      setWelcomeBanner(null);
      await signOut(auth);
      setUser(null);
      navigate(ROUTES.landing, {replace: true});
      toast("Signed out","info");
    }
  };

  const resetAll=async()=>{
    if(!ensureBoardReady()) return;
    const ok=await confirm({icon:"💥",title:"Reset Board",
      message:"This will permanently delete ALL tasks and dependencies. This action cannot be undone.",
      danger:true,confirmLabel:"Reset Everything"
    });
    if(!ok) return;
    try {
      const[ns,es]=await Promise.all([
        getDocs(collection(db,"users",user.uid,"nodes")),
        getDocs(collection(db,"users",user.uid,"edges")),
      ]);
      await Promise.all([
        ...ns.docs.map(d=>deleteDoc(doc(db,"users",user.uid,"nodes",d.id))),
        ...es.docs.map(d=>deleteDoc(doc(db,"users",user.uid,"edges",d.id))),
      ]);
      toast("Board reset","error");
    } catch (error) {
      toast("Could not reset the board right now. Please try again.", "error");
    }
  };

  const commitBatchOperations = async operations => {
    for (let start = 0; start < operations.length; start += FIRESTORE_BATCH_LIMIT) {
      const batch = writeBatch(db);
      operations
        .slice(start, start + FIRESTORE_BATCH_LIMIT)
        .forEach(applyOperation => applyOperation(batch));
      await batch.commit();
    }
  };

  const mergeNodePositions = useCallback((currentNodes, positionedNodes) => {
    const positionById = new Map(
      positionedNodes.map(node => [
        node.id,
        {
          x: node.position?.x ?? 0,
          y: node.position?.y ?? 0,
        },
      ])
    );

    return currentNodes.map(node => (
      positionById.has(node.id)
        ? { ...node, position: positionById.get(node.id) }
        : node
    ));
  }, []);

  const persistNodePositions = useCallback(async (positionedNodes, { silent = false } = {}) => {
    if (!user || !positionedNodes.length) return false;

    try {
      const nodeSnapshot = await getDocs(collection(db,"users",user.uid,"nodes"));
      const nodeRefById = new Map(
        nodeSnapshot.docs
          .map(snapshot => [snapshot.data()?.id, snapshot.ref])
          .filter(([id]) => Boolean(id))
      );

      const operations = positionedNodes
        .filter(node => nodeRefById.has(node.id) && hasFiniteNodePosition(node.position))
        .map(node => batch => batch.update(nodeRefById.get(node.id), {
          position: {
            x: node.position.x,
            y: node.position.y,
          },
        }));

      if (!operations.length) return true;

      await commitBatchOperations(operations);
      return true;
    } catch (error) {
      if (!silent) {
        toast("Could not save node positions right now. Please try again.", "error");
      }
      return false;
    }
  }, [toast, user]);

  const applyLayoutDirection = useCallback(async nextDirection => {
    const normalizedDirection = VALID_LAYOUT_DIRECTIONS.has(nextDirection) ? nextDirection : "TB";
    setLayoutDirection(normalizedDirection);

    if (!user || !boardReady || boardError || !nodes.length) {
      return;
    }

    const nextLayoutNodes = computeAutoLayoutNodes(nodes, edges, normalizedDirection);
    setNodes(currentNodes => mergeNodePositions(currentNodes, nextLayoutNodes));
    await persistNodePositions(nextLayoutNodes, { silent: false });
  }, [boardError, boardReady, edges, mergeNodePositions, nodes, persistNodePositions, user]);

  useEffect(() => {
    if (!user || !boardReady || boardError || !nodes.length || !isLegacyBoardLayout(nodes)) {
      legacyLayoutHydratingRef.current = false;
      return;
    }

    if (legacyLayoutHydratingRef.current) return;
    legacyLayoutHydratingRef.current = true;

    const hydratedNodes = computeAutoLayoutNodes(nodes, edges, layoutDirection);
    setNodes(currentNodes => mergeNodePositions(currentNodes, hydratedNodes));
    persistNodePositions(hydratedNodes, { silent: true })
      .finally(() => {
        legacyLayoutHydratingRef.current = false;
      });
  }, [boardError, boardReady, edges, layoutDirection, mergeNodePositions, nodes, persistNodePositions, user]);

  const exportBoard = () => {
    if(!ensureBoardReady()) return;

    try {
      const payload = buildBoardExportPayload({
        nodes,
        edges,
        layoutDirection,
        exportedBy: formatUserDisplayName(user),
      });
      const fileBlob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const downloadApi = window.URL || window.webkitURL;

      if (!downloadApi?.createObjectURL) {
        toast("Board export is not supported in this browser.", "error");
        return;
      }

      const downloadUrl = downloadApi.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = createBoardExportFilename();
      document.body.appendChild(link);
      link.click();
      link.remove();
      downloadApi.revokeObjectURL(downloadUrl);
      toast(`Exported ${payload.nodes.length} task${payload.nodes.length===1?"":"s"} and ${payload.edges.length} dependenc${payload.edges.length===1?"y":"ies"}.`, "success");
    } catch (error) {
      toast("Could not export this board right now. Please try again.", "error");
    }
  };

  const promptBoardImport = () => {
    if(!ensureBoardReady()) return;
    importFileRef.current?.click();
  };

  const importBoard = async event => {
    const input = event.target;
    const file = input?.files?.[0];

    if (!file) return;
    if (!ensureBoardReady()) {
      input.value = "";
      return;
    }

    try {
      const importedBoard = parseBoardImportFile(await file.text());
      const nextTaskCount = importedBoard.nodes.length;
      const nextDependencyCount = importedBoard.edges.length;
      const layoutMessage = importedBoard.layoutDirection
        ? " The saved canvas layout from this file will also be applied."
        : "";
      const ok = await confirm({
        icon: "📥",
        title: "Import Board",
        message: `Import "${file.name}" with ${nextTaskCount} task${nextTaskCount===1?"":"s"} and ${nextDependencyCount} dependenc${nextDependencyCount===1?"y":"ies"}? This will replace your current board.${layoutMessage}`,
        danger: nodes.length > 0 || edges.length > 0,
        confirmLabel: "Import and Replace",
      });

      if (!ok) return;

      const [nodeSnapshot, edgeSnapshot] = await Promise.all([
        getDocs(collection(db,"users",user.uid,"nodes")),
        getDocs(collection(db,"users",user.uid,"edges")),
      ]);

      const operations = [
        ...edgeSnapshot.docs.map(snapshot => batch => batch.delete(snapshot.ref)),
        ...nodeSnapshot.docs.map(snapshot => batch => batch.delete(snapshot.ref)),
        ...importedBoard.nodes.map(node => {
          const nodeRef = doc(collection(db,"users",user.uid,"nodes"));
          return batch => batch.set(nodeRef, node);
        }),
        ...importedBoard.edges.map(edge => {
          const edgeRef = doc(db,"users",user.uid,"edges",buildDependencyDocId(edge.source, edge.target));
          return batch => batch.set(edgeRef, edge);
        }),
      ];

      await commitBatchOperations(operations);

      if (importedBoard.layoutDirection) {
        setLayoutDirection(importedBoard.layoutDirection);
      }

      setParent("");
      setChild("");
      setEditTaskId("");
      setEditTaskName("");
      setSearch("");
      setStatusFilter("all");

      toast(`Imported ${nextTaskCount} task${nextTaskCount===1?"":"s"} and ${nextDependencyCount} dependenc${nextDependencyCount===1?"y":"ies"} from "${file.name}".`, "success");
    } catch (error) {
      toast(error?.message || "Could not import that board file. Please try again.", "error");
    } finally {
      input.value = "";
    }
  };

  // Stats
  const statusSummary = getTaskStatusSummary(nodes, edges);
  const total=statusSummary.total;
  const done=statusSummary.completed;
  const pending=statusSummary.pending;
  const blocked=statusSummary.blocked;
  const ready=statusSummary.ready;
  const unlinked=statusSummary.unlinked;
  const boardSyncActive = !!user && boardReady && !boardError;
  const taskFilterOptions = [
    { value: "all", label: "All tasks", count: total },
    { value: "open", label: "Open / Ready", count: ready },
    { value: "blocked", label: "Blocked", count: blocked },
    { value: "complete", label: "Completed", count: done },
    { value: "unlinked", label: "Needs dependency", count: unlinked },
  ];
  const activeTaskFilterLabel =
    taskFilterOptions.find(option => option.value === statusFilter)?.label || "All tasks";
  const filteredNodes = nodes.filter(node =>
    matchesTaskSearch(node, search) && matchesTaskViewFilter(node, edges, nodes, statusFilter)
  );
  const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
  const filteredEdges = edges.filter(edge =>
    filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
  );
  const visibleTaskCount = filteredNodes.length;
  const hasActiveTaskFilters = Boolean(search.trim()) || statusFilter !== "all";
  const showFilteredEmptyState = boardReady && total > 0 && visibleTaskCount === 0;
  const showEmptyState = !boardReady || total===0 || showFilteredEmptyState;
  const emptyStateIcon = boardError ? "!" : !boardReady ? "..." : "◈";
  const emptyStateTitle = boardError
    ? "Cloud sync unavailable"
    : !boardReady
      ? "Syncing your workspace"
      : showFilteredEmptyState
        ? "No matching tasks"
      : "No tasks yet";
  const emptyStateSubtitle = boardError
    ? "We couldn't load your saved tasks from Firestore. Refresh and check your Firebase access."
    : !boardReady
      ? "Loading your saved tasks and dependencies from Firestore..."
      : showFilteredEmptyState
        ? buildTaskFilterEmptyMessage(search, activeTaskFilterLabel, statusFilter !== "all")
      : "Add your first task from the panel on the left";
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
      label:"Open / Ready",
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
  const canvasLocked=!canvasInteractive;
  const currentLayout = getLayoutConfig(layoutDirection);
  const dependencyEdgeTheme=dark
    ? {
        lineStroke:"rgba(125,211,252,0.56)",
        flowStroke:"rgba(255,255,255,0.88)",
        haloStroke:"rgba(34,211,238,0.18)",
        arrowStroke:"rgba(186,230,253,0.94)",
      }
    : {
        lineStroke:"rgba(71,85,105,0.46)",
        flowStroke:"rgba(59,130,246,0.86)",
        haloStroke:"rgba(99,102,241,0.12)",
        arrowStroke:"rgba(51,65,85,0.72)",
      };
  const miniMapMaskColor = dark ? "rgba(2,6,23,0.48)" : "rgba(238,242,255,0.65)";
  const miniMapMaskStrokeColor = dark ? "rgba(103,232,249,0.68)" : "rgba(99,102,241,0.18)";
  const miniMapMaskStrokeWidth = dark ? 2 : 1.4;

  // Styled nodes
  const styledNodes=layoutNodes(filteredNodes,filteredEdges,layoutDirection)
    .map(n=>{
      const blockers=getBlockingTasks(n.id,edges,nodes);
      const status = getTaskWorkflowStatus(n, edges, nodes);
      const d=status==="complete", b=status==="blocked", linked=status!=="unlinked"&&status!=="unknown";
      const match=Boolean(search.trim())&&matchesTaskSearch(n, search);
      const {parents, children} = getTaskDependencies(n.id, edges, nodes);
      const blockedSummary = !d && b ? formatBlockedTaskSummary(blockers) : null;
      const mapDependency = item => ({
        id: item.id,
        label: item.data.label,
        completed: item.data.completed,
      });
      const statusText = d ? "Completed" : !linked ? "Needs dependency" : b ? "Blocked" : "Ready";
      const dependencyList = (items, emptyText) =>
        items.length ? items.map(item=>item.data.label).join(", ") : emptyText;
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
        type:"task",
        data:{
          ...n.data,
          status,
          statusText,
          blockedSummary,
          parents: parents.map(mapDependency),
          children: children.map(mapDependency),
          onRequestDelete: () => {
            if (clickTimer.current) {
              clearTimeout(clickTimer.current);
              clickTimer.current = null;
            }
            deleteNode(n.id, n.data.label);
          },
          positionSyncKey: `${Math.round(n.position?.x ?? 0)}:${Math.round(n.position?.y ?? 0)}`,
          sourceHandlePosition: n.sourcePosition || currentLayout.sourcePosition,
          targetHandlePosition: n.targetPosition || currentLayout.targetPosition,
          cardStyle:{
            background:bg,
            border,
            color,
            borderRadius:"12px",
            fontFamily:"'Open Sans',sans-serif",
            fontSize:"15px",
            fontWeight:"800",
            lineHeight:"1.3",
            boxShadow:shadow,
            backdropFilter:"blur(6px)",
            letterSpacing:"-0.2px",
          },
          accessibleLabel: [
            n.data.label,
            statusText,
            blockedSummary,
            `Depends on: ${dependencyList(parents, "none")}`,
            `Required by: ${dependencyList(children, "none")}`,
          ].filter(Boolean).join(". "),
        },
        style:{
          cursor:"pointer",
          transition:"all 0.25s ease",
          width:`${NW}px`,
          height:`${NH}px`,
          background:"transparent",
          border:"none",
          boxShadow:"none",
        }
      };
    });

  const tc=dark?"tgd":"tgl";
  const userDisplayName = formatUserDisplayName(user);
  const userInitial = getUserInitial(user);
  const panelToggleLabel = isMobileViewport
    ? (panelCollapsed ? "Show tools" : "Hide tools")
    : (panelCollapsed ? "Expand sidebar" : "Collapse sidebar");
  const panelToggleIcon = isMobileViewport
    ? (panelCollapsed ? "☰" : "✕")
    : (panelCollapsed ? "❯" : "❮");
  const panelToggleText = isMobileViewport ? (panelCollapsed ? "Tools" : "Close") : null;
  const graphFitPadding = isCompactViewport
    ? CANVAS_VIEWPORT.fitPadding.compact
    : CANVAS_VIEWPORT.fitPadding.desktop;

  /* ══ ROUTING ══ */
  if(route===ROUTES.landing) {
    return (
      <Landing
        onSignIn={()=>navigate(ROUTES.login)}
        onGetStarted={()=>navigate(user ? ROUTES.dashboard : ROUTES.signup)}
        darkTheme={dark}
        setDarkTheme={setDark}
      />
    );
  }

  if(!authReady) {
    return <RouteBootScreen dark={dark} />;
  }

  if(route===ROUTES.login) {
    if(user) return <RouteBootScreen dark={dark} />;
    return (
      <Login
        onModeChange={mode=>navigate(mode==="signup" ? ROUTES.signup : ROUTES.login)}
        onAuthSuccess={u=>{
          pendingDashboardWelcome.current = true;
          setUser(toAppUser(u));
          navigate(ROUTES.dashboard, {replace: true});
        }}
        onBack={()=>navigate(ROUTES.landing)}
        darkTheme={dark}
        setDarkTheme={setDark}
      />
    );
  }

  if(route===ROUTES.signup) {
    if(user) return <RouteBootScreen dark={dark} />;
    return (
      <Signup
        onModeChange={mode=>navigate(mode==="signup" ? ROUTES.signup : ROUTES.login)}
        onAuthSuccess={u=>{
          pendingDashboardWelcome.current = true;
          setUser(toAppUser(u));
          navigate(ROUTES.dashboard, {replace: true});
        }}
        onBack={()=>navigate(ROUTES.landing)}
        darkTheme={dark}
        setDarkTheme={setDark}
      />
    );
  }

  if(!user) return <RouteBootScreen dark={dark} />;

  if(route===ROUTES.profile) {
    return (
      <Profile
        user={user}
        onBack={()=>navigate(ROUTES.dashboard)}
        onProfileUpdated={u=>setUser(toAppUser(u))}
        darkTheme={dark}
        setDarkTheme={setDark}
      />
    );
  }

  /* ══ DASHBOARD ══ */
  return (
    <>
      <WelcomeBanner banner={welcomeBanner} />
      <div className={`tg-shell ${tc}`}>
        <Modal modal={modal} dark={dark} />

        {/* ══ PANEL ══ */}
        <div className={`tg-panel ${panelCollapsed ? "tg-panel--collapsed" : ""}`}>
        {/* Header */}
        <div className="tg-panel-head">
          <div className="tg-brand-row">
            <div className="tg-brand-icon">
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
      <circle
        key={i}
        cx={c.cx}
        cy={c.cy}
        r={c.r}
        fill="white"
        style={{
          opacity: 0.9,
          animation: `tlg-draw 2.8s ease-in-out ${i * 0.5}s infinite`,
        }}
      />
    ))}
  </svg>
</div>
            <div className="tg-brand-copy">
              <div className="tg-brand-name">TaskGraph</div>
              <div className="tg-brand-tag">Dependency Visualizer</div>
            </div>
          </div>
          <div className="tg-head-actions">
            <button
              className="tg-icon-btn tg-collapse-btn"
              onClick={()=>setPanelCollapsed(v=>!v)}
              title={panelToggleLabel}
              aria-label={panelToggleLabel}
              aria-expanded={!panelCollapsed}
              aria-controls="tg-panel-body"
            >
              <span className="tg-collapse-icon">{panelToggleIcon}</span>
              {panelToggleText && <span className="tg-collapse-label">{panelToggleText}</span>}
            </button>
            <button className="tg-icon-btn" onClick={()=>setDark(d=>!d)} title="Toggle theme">
              {dark?"☀️":"🌙"}
            </button>
            <button
              className="tg-logout-btn"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
            >
              <span className="tg-logout-icon">↪</span>
              <span className="tg-logout-label">Logout</span>
            </button>
          </div>
        </div>

        {/* User pill */}
        {user && (
          <div
            className="tg-user-pill"
            title={`Open profile for ${userDisplayName}`}
            role="button"
            tabIndex={0}
            onClick={()=>navigate(ROUTES.profile)}
            onKeyDown={event=>{
              if(event.key==="Enter"||event.key===" "){
                event.preventDefault();
                navigate(ROUTES.profile);
              }
            }}
          >
            <div className="tg-user-avatar">
              {userInitial}
            </div>
            <div className="tg-user-email">{userDisplayName}</div>
          </div>
        )}

        {/* Body */}
        <div className="tg-panel-body" id="tg-panel-body">

          {/* Stats */}
          <div className="tg-stats">
            {[
              {label:"Total",     val:total,   color:"var(--text-1)"},
              {label:"Completed", val:done,    color:"var(--status-complete)"},
              {label:"Pending",   val:pending, color:"var(--status-pending)"},
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
            <div className="tg-sec-label">Search & Filter</div>
            <input className="tg-input" type="text" placeholder="🔍  Find task…"
              value={search} onChange={e=>setSearch(e.target.value)}/>
            <div className="tg-search-meta">
              <span>
                {hasActiveTaskFilters
                  ? `Showing ${visibleTaskCount} of ${total} tasks`
                  : `${total} tasks available`}
              </span>
              <strong>{activeTaskFilterLabel}</strong>
            </div>
            <div className="tg-filter-row" role="group" aria-label="Task status filter">
              {taskFilterOptions.map(option=>(
                <button
                  key={option.value}
                  type="button"
                  className={`tg-filter-chip ${statusFilter===option.value ? "tg-filter-chip--active" : ""}`}
                  onClick={()=>setStatusFilter(option.value)}
                  aria-pressed={statusFilter===option.value}
                >
                  <span>{option.label}</span>
                  <span className="tg-filter-chip-count">{option.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="tg-section">
            <div className="tg-sec-label">Canvas Layout</div>
            <div className="tg-layout-grid" aria-label="Canvas layout direction">
              {LAYOUT_OPTIONS.map(option=>(
                <button
                  key={option.value}
                  type="button"
                  className={`tg-layout-btn ${layoutDirection===option.value ? "tg-layout-btn--active" : ""}`}
                  onClick={()=>applyLayoutDirection(option.value)}
                  aria-pressed={layoutDirection===option.value}
                  title={option.label}
                >
                  <span className="tg-layout-btn-icon">{option.icon}</span>
                  <span className="tg-layout-btn-copy">
                    <span className="tg-layout-btn-title">{option.shortLabel}</span>
                    <span className="tg-layout-btn-hint">{option.hint}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="tg-layout-note">
              Switch between vertical and sideways task flow without changing your actual dependencies.
            </div>
          </div>

          {/* Add Task */}
          <div className="tg-section">
            <div className="tg-sec-label">New Task</div>
            <input className="tg-input" type="text" placeholder="Task name…"
              value={taskName} onChange={e=>setTaskName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addTask()}/>
            <button className="tg-btn tg-btn-primary" onClick={addTask} disabled={!taskName.trim() || !boardSyncActive}>
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
              disabled={!parent||!child||parent===child||!boardSyncActive}>
              Link Tasks →
            </button>
            <div className="tg-section-note">
              You can also drag from a task handle directly onto another task on the graph to create the same dependency instantly.
            </div>
          </div>


                    {/* Edit Task */}
          <div className="tg-section">
            <div className="tg-sec-label">Edit Task</div>
            <div className="tg-field-stack">
              <label className="tg-field-label" htmlFor="tg-edit-select">
                Select task
                <span className="tg-field-hint">Choose to rename</span>
              </label>
              <div className="tg-select-wrap">
                <select 
                  id="tg-edit-select" 
                  className="tg-select" 
                  value={editTaskId} 
                  onChange={e => setEditTaskId(e.target.value)}
                >
                  <option value="">Select a task to edit...</option>
                  {taskOptions.map(n => (
                    <option key={n.id} value={n.id}>{n.data.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {editTaskId && (
              <>
                <input 
                  className="tg-input" 
                  type="text" 
                  placeholder="New task name…"
                  value={editTaskName}
                  onChange={e => setEditTaskName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && editTask()}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    className="tg-btn tg-btn-primary" 
                    onClick={editTask}
                    disabled={!editTaskName.trim() || !boardSyncActive}
                    style={{ flex: 1 }}
                  >
                    💾 Save
                  </button>
                  <button 
                    className="tg-btn" 
                    style={{ 
                      background: "var(--card)", 
                      border: "1px solid var(--border)",
                      color: "var(--text-2)",
                      flex: "0 0 40px",
                      padding: "11px"
                    }}
                    onClick={() => { setEditTaskId(""); setEditTaskName(""); }}
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="tg-section">
            <div className="tg-sec-label">Board Data</div>
            <div className="tg-btn-row">
              <button
                className="tg-btn tg-btn-secondary"
                onClick={exportBoard}
                disabled={!boardSyncActive}
                type="button"
              >
                ⤓ Export JSON
              </button>
              <button
                className="tg-btn tg-btn-primary"
                onClick={promptBoardImport}
                disabled={!boardSyncActive}
                type="button"
              >
                ⤒ Import JSON
              </button>
            </div>
            <div className="tg-section-note">
              Export saves your current tasks, dependencies, and canvas layout. Import replaces the current board with a validated TaskGraph JSON file.
            </div>
            <input
              ref={importFileRef}
              className="tg-import-file"
              type="file"
              accept=".json,application/json"
              onChange={importBoard}
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>

                  {/* Hints */}
          <div className="tg-hints">
            <b>Hover</b> node → see dependencies<br/>
            <b>Click</b> node → toggle complete<br/>
            <b>Double-click</b> node → delete task<br/>
            <b>Click edge</b> → remove link<br/>
            <b>Drag handle</b> → connect tasks directly on the graph<br/>
            <b>Use panel</b> → edit task name, change flow direction, and move board data
          </div>

          {/* Reset */}
          <button className="tg-btn tg-btn-danger" onClick={resetAll} disabled={total===0 || !boardSyncActive}>
            🗑 Reset Board
          </button>

        </div>
      </div>

      {/* ══ GRAPH ══ */}
      <div className={`tg-graph ${canvasLocked ? "tg-graph--locked" : ""}`} ref={graphRef}>
        <div className="tg-graph-aura tg-graph-aura--one"/>
        <div className="tg-graph-aura tg-graph-aura--two"/>
        <div className="tg-graph-aura tg-graph-aura--three"/>
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
        {showEmptyState&&(
          <div className="tg-empty">
            <div className="tg-empty-icon">{emptyStateIcon}</div>
            <div className="tg-empty-t">{emptyStateTitle}</div>
            <div className="tg-empty-s">{emptyStateSubtitle}</div>
          </div>
        )}
        <ReactFlow
          key={`flow-${layoutDirection}`}
          nodes={styledNodes}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          edges={filteredEdges.map(e=>({...e,
            type:"dependency",
            animated:true,
            className:"tg-dependency-edge",
            interactionWidth:26,
            data:dependencyEdgeTheme,
            style:{
              stroke:dependencyEdgeTheme.lineStroke,
              strokeWidth:2.6,
            },
          }))}
          onNodeClick={onNodeClick}
          onNodesChange={onNodesChange}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          onEdgeClick={onEdgeClick}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onInit={instance=>{flowRef.current=instance;setTimeout(()=>fitGraph(350),0);}}
          fitView
          fitViewOptions={{padding:graphFitPadding}}
          connectionLineComponent={DependencyConnectionLine}
          minZoom={CANVAS_VIEWPORT.minZoom}
          maxZoom={CANVAS_VIEWPORT.maxZoom}
          nodesDraggable={canvasInteractive}
          nodesConnectable={canvasInteractive}
          elementsSelectable={canvasInteractive}
          panOnDrag={canvasInteractive}
          zoomOnScroll={canvasInteractive}
          zoomOnPinch={canvasInteractive}
          zoomOnDoubleClick={false}
          connectOnClick={false}
          onlyRenderVisibleElements
          proOptions={{hideAttribution:true}}
        >
          <MiniMap
            nodeColor={n=>n.data?.completed?statusColors.complete:isBlocked(n.id,edges,nodes)?statusColors.blocked:statusColors.pending}
            maskColor={miniMapMaskColor}
            maskStrokeColor={miniMapMaskStrokeColor}
            maskStrokeWidth={miniMapMaskStrokeWidth}
          />
          <Controls onInteractiveChange={setCanvasInteractive}/>
          <Background color={dark?"rgba(0,212,255,0.08)":"rgba(148,163,184,0.18)"} gap={176} size={1.15}/>
        </ReactFlow>
      </div>

        {/* ══ TOASTS ══ */}
        <div className="tg-toasts">
          {toasts.map(t=>(
            <div
              key={t.id}
              className={`tg-toast tg-t-${t.type}`}
              onClick={()=>dismiss(t.id)}
              role="status"
              aria-live="polite"
            >
              <span className="tg-toast-icon">
                {t.type==="success"?"✓":t.type==="error"?"✕":t.type==="warn"?"⚠":"ℹ"}
              </span>
              <div className="tg-toast-body">
                {t.title && <div className="tg-toast-title">{t.title}</div>}
                <div className={`tg-toast-msg ${t.title ? "" : "tg-toast-msg--solo"}`.trim()}>
                  {t.msg}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
