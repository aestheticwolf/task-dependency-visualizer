import React, { useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════
   LANDING PAGE CSS
═══════════════════════════════════════════════════════ */
const LANDING_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&display=swap');

.ld-root *, .ld-root *::before, .ld-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

.ld-root button {
  font: inherit;
}

.ld-root {
  font-family: 'Open Sans', sans-serif;
  line-height: 1.5;
  background:
    radial-gradient(circle at 20% 0%, rgba(0,212,255,0.08), transparent 34%),
    radial-gradient(circle at 85% 12%, rgba(124,58,237,0.09), transparent 32%),
    #050d1f;
  color: #e2e8f0;
  overflow-x: hidden;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  transition: background 0.45s ease, color 0.45s ease;
}

.ld-root.light {
  background:
    radial-gradient(circle at 18% 0%, rgba(14,165,233,0.16), transparent 34%),
    radial-gradient(circle at 84% 10%, rgba(124,58,237,0.14), transparent 32%),
    linear-gradient(180deg, #f8fbff 0%, #edf4ff 48%, #f9fbff 100%);
  color: #0f172a;
}

/* ── NAV ── */
.ld-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 clamp(20px, 4vw, 60px);
  height: 72px;
  background: rgba(5,13,31,0.82);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  animation: ld-nav-in 0.6s ease both;
  transition: background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
}
.ld-root.light .ld-nav {
  background: rgba(255,255,255,0.84);
  border-bottom-color: rgba(15,23,42,0.08);
  box-shadow: 0 14px 38px rgba(15,23,42,0.08);
}
@keyframes ld-nav-in {
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.ld-nav-logo {
  display: flex; align-items: center; gap: 10px;
}
.ld-nav-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  display: flex; align-items: center; justify-content: center;
  font-size: 17px;
  box-shadow: 0 0 18px rgba(0,212,255,0.3);
  position: relative; overflow: hidden;
}
.ld-nav-brand {
  font-family: 'Open Sans', sans-serif;
  font-size: 18px; font-weight: 800;
  color: #f8fafc;
  letter-spacing: -0.2px;
}
.ld-root.light .ld-nav-brand { color: #0f172a; }
.ld-nav-cta {
  display: flex; align-items: center; gap: 12px;
  flex-wrap: wrap;
}
.ld-theme-toggle {
  width: 42px; height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04);
  color: #f8fafc;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
}
.ld-theme-toggle:hover {
  transform: translateY(-2px) rotate(8deg);
  border-color: rgba(0,212,255,0.35);
  background: rgba(0,212,255,0.08);
  box-shadow: 0 10px 26px rgba(0,212,255,0.18);
}
.ld-root.light .ld-theme-toggle {
  background: rgba(15,23,42,0.04);
  border-color: rgba(15,23,42,0.12);
  color: #0f172a;
}
.ld-btn-ghost {
  padding: 10px 20px;
  border: 1px solid rgba(255,255,255,0.12);
  background: transparent;
  color: #94a3b8;
  border-radius: 10px;
  font-family: 'Open Sans', sans-serif;
  font-size: 14px; font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.ld-btn-ghost:hover {
  color: #f1f5f9;
  border-color: rgba(0,212,255,0.35);
  background: rgba(0,212,255,0.06);
}
.ld-root.light .ld-btn-ghost {
  border-color: rgba(15,23,42,0.12);
  color: #334155;
}
.ld-root.light .ld-btn-ghost:hover {
  color: #0f172a;
  border-color: rgba(14,165,233,0.32);
  background: rgba(14,165,233,0.08);
}
.ld-btn-solid {
  padding: 10px 22px;
  border: none;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  color: white;
  border-radius: 10px;
  font-family: 'Open Sans', sans-serif;
  font-size: 14px; font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(0,212,255,0.25);
}
.ld-btn-solid:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,212,255,0.4);
}

/* ── HERO ── */
.ld-hero {
  min-height: auto;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
  padding: 132px clamp(20px, 4vw, 40px) 96px;
  position: relative;
  isolation: isolate;
}
.ld-hero-canvas {
  position: absolute; inset: 0;
  pointer-events: none; z-index: 0;
}

/* Gradient orbs */
.ld-orb {
  position: absolute; border-radius: 50%;
  filter: blur(100px); pointer-events: none; z-index: 0;
}
.ld-orb-1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(0,212,255,0.10) 0%, transparent 70%);
  top: -150px; left: -100px;
  animation: ld-orb-float 10s ease-in-out infinite;
}
.ld-orb-2 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%);
  bottom: -100px; right: -80px;
  animation: ld-orb-float 14s ease-in-out infinite reverse;
}
.ld-orb-3 {
  width: 350px; height: 350px;
  background: radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%);
  top: 40%; left: 50%; transform: translateX(-50%);
  animation: ld-orb-float 8s ease-in-out infinite 3s;
}
.ld-root.light .ld-orb-1 { background: radial-gradient(circle, rgba(14,165,233,0.16) 0%, transparent 70%); }
.ld-root.light .ld-orb-2 { background: radial-gradient(circle, rgba(124,58,237,0.13) 0%, transparent 70%); }
.ld-root.light .ld-orb-3 { background: radial-gradient(circle, rgba(16,185,129,0.11) 0%, transparent 70%); }
@keyframes ld-orb-float {
  0%,100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-30px) scale(1.06); }
}

.ld-hero-inner {
  position: relative; z-index: 1;
  max-width: 880px;
  width: 100%;
  margin: 0 auto;
}

.ld-hero-badge {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 7px 16px;
  border-radius: 999px;
  border: 1px solid rgba(0,212,255,0.2);
  background: rgba(0,212,255,0.07);
  font-size: 12px; font-weight: 700;
  color: #67e8f9;
  letter-spacing: 0.5px; text-transform: uppercase;
  margin-bottom: 22px;
  animation: ld-fade-up 0.8s ease 0.2s both;
}
.ld-root.light .ld-hero-badge {
  background: rgba(14,165,233,0.1);
  border-color: rgba(14,165,233,0.22);
  color: #0369a1;
}
.ld-hero-badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #00d4ff;
  animation: ld-dot-pulse 2s ease-in-out infinite;
}
@keyframes ld-dot-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(0,212,255,0.5); }
  50%      { box-shadow: 0 0 0 5px rgba(0,212,255,0); }
}

.ld-hero-title {
  font-family: 'Open Sans', sans-serif;
  font-size: clamp(42px, 5.4vw, 72px);
  font-weight: 800;
  line-height: 1.07;
  letter-spacing: -1.4px;
  color: #f8fafc;
  margin: 0 auto 22px;
  max-width: 860px;
  animation: ld-fade-up 0.8s ease 0.35s both;
}
.ld-root.light .ld-hero-title { color: #0f172a; }
.ld-hero-title .accent {
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 50%, #10b981 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ld-gradient-shift 4s ease-in-out infinite;
}
@keyframes ld-gradient-shift {
  0%,100% { filter: hue-rotate(0deg); }
  50%      { filter: hue-rotate(30deg); }
}

.ld-hero-sub {
  font-size: clamp(15px, 2vw, 18px);
  color: #94a3b8;
  line-height: 1.75;
  max-width: 680px; margin: 0 auto 34px;
  font-weight: 500;
  animation: ld-fade-up 0.8s ease 0.5s both;
}
.ld-root.light .ld-hero-sub { color: #475569; }

.ld-hero-btns {
  display: flex; gap: 14px; justify-content: center; align-items: center; flex-wrap: wrap;
  animation: ld-fade-up 0.8s ease 0.65s both;
}
.ld-cta-primary {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 16px 34px;
  border: none;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  color: white;
  border-radius: 14px;
  font-family: 'Open Sans', sans-serif;
  font-size: 16px; font-weight: 700;
  cursor: pointer;
  transition: all 0.22s ease;
  box-shadow: 0 8px 28px rgba(0,212,255,0.3);
}
.ld-cta-primary:hover { transform: translateY(-3px); box-shadow: 0 14px 40px rgba(0,212,255,0.45); }
.ld-cta-secondary {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 16px 34px;
  border: 1.5px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04);
  color: #cbd5e1;
  border-radius: 14px;
  font-family: 'Open Sans', sans-serif;
  font-size: 16px; font-weight: 600;
  cursor: pointer;
  transition: all 0.22s ease;
}
.ld-cta-secondary:hover { border-color: rgba(0,212,255,0.35); color: #f1f5f9; background: rgba(0,212,255,0.06); transform: translateY(-2px); }
.ld-root.light .ld-cta-secondary {
  background: rgba(255,255,255,0.72);
  border-color: rgba(15,23,42,0.12);
  color: #334155;
  box-shadow: 0 8px 28px rgba(15,23,42,0.06);
}
.ld-root.light .ld-cta-secondary:hover {
  border-color: rgba(14,165,233,0.34);
  color: #0f172a;
  background: rgba(14,165,233,0.08);
}

/* ── GRAPH PREVIEW ── */
.ld-preview {
  position: relative; z-index: 1;
  margin: 56px auto 0;
  width: min(100%, 860px);
  animation: ld-fade-up 0.9s ease 0.8s both;
}
.ld-preview-frame {
  border-radius: 20px;
  border: 1px solid rgba(0,212,255,0.15);
  background: rgba(7,15,40,0.8);
  backdrop-filter: blur(20px);
  padding: clamp(20px, 3vw, 28px);
  box-shadow: 0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,255,0.05);
  overflow: hidden;
  position: relative;
  transition: background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease, transform 0.35s ease;
}
.ld-preview-frame:hover {
  transform: translateY(-4px);
  border-color: rgba(0,212,255,0.28);
}
.ld-root.light .ld-preview-frame {
  background: rgba(255,255,255,0.82);
  border-color: rgba(14,165,233,0.18);
  box-shadow: 0 28px 80px rgba(15,23,42,0.12), 0 0 0 1px rgba(14,165,233,0.08);
}
.ld-preview-frame::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(0,212,255,0.03) 0%, transparent 60%);
  pointer-events: none;
}
.ld-preview-bar {
  display: flex; align-items: center; gap: 7px;
  margin-bottom: 22px;
}
.ld-dot-r { width: 10px; height: 10px; border-radius: 50%; background: #ef4444; }
.ld-dot-y { width: 10px; height: 10px; border-radius: 50%; background: #f59e0b; }
.ld-dot-g { width: 10px; height: 10px; border-radius: 50%; background: #10b981; }
.ld-preview-title {
  margin-left: 8px;
  font-size: 12px; font-weight: 600;
  color: #475569; letter-spacing: 0.5px;
}
.ld-root.light .ld-preview-title { color: #64748b; }

/* Animated node graph */
.ld-graph-demo {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 26px 10px 24px;
  position: relative; min-height: 150px;
  flex-wrap: wrap;
}
.ld-node {
  min-width: 136px;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 13px; font-weight: 700;
  line-height: 1.25;
  white-space: nowrap;
  text-align: center;
  position: relative; z-index: 2;
  animation: ld-node-in 0.5s cubic-bezier(0.16,1,0.3,1) both;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}
.ld-node:hover { transform: translateY(-3px); }
.ld-root.light .ld-node-green  { background: rgba(209,250,229,0.9); color: #047857; }
.ld-root.light .ld-node-cyan   { background: rgba(207,250,254,0.9); color: #0e7490; }
.ld-root.light .ld-node-violet { background: rgba(237,233,254,0.9); color: #6d28d9; }
.ld-root.light .ld-node-red    { background: rgba(254,226,226,0.9); color: #b91c1c; }
.ld-node-green  { background: rgba(16,185,129,0.12); border: 1.5px solid rgba(16,185,129,0.45); color: #6ee7b7; box-shadow: 0 0 18px rgba(16,185,129,0.18); }
.ld-node-cyan   { background: rgba(0,212,255,0.10);  border: 1.5px solid rgba(0,212,255,0.45);  color: #67e8f9; box-shadow: 0 0 18px rgba(0,212,255,0.18); }
.ld-node-violet { background: rgba(124,58,237,0.12); border: 1.5px solid rgba(124,58,237,0.45); color: #c4b5fd; box-shadow: 0 0 18px rgba(124,58,237,0.18); }
.ld-node-red    { background: rgba(239,68,68,0.10);  border: 1.5px solid rgba(239,68,68,0.4);   color: #fca5a5; box-shadow: 0 0 14px rgba(239,68,68,0.15); }

@keyframes ld-node-in {
  from { opacity: 0; transform: scale(0.85) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.ld-node:nth-child(1) { animation-delay: 0.9s; }
.ld-node:nth-child(3) { animation-delay: 1.1s; }
.ld-node:nth-child(5) { animation-delay: 1.3s; }
.ld-node:nth-child(7) { animation-delay: 1.5s; }

.ld-arrow {
  display: flex; align-items: center;
  padding: 0 4px; z-index: 1;
  animation: ld-arrow-in 0.4s ease both;
}
.ld-arrow:nth-child(2) { animation-delay: 1.05s; }
.ld-arrow:nth-child(4) { animation-delay: 1.25s; }
.ld-arrow:nth-child(6) { animation-delay: 1.45s; }
@keyframes ld-arrow-in { from { opacity: 0; width: 0; } to { opacity: 1; } }
.ld-arrow svg { color: rgba(0,212,255,0.45); }

.ld-node-status {
  position: absolute; top: -5px; right: -5px;
  width: 14px; height: 14px;
  border-radius: 50%; border: 2px solid #050d1f;
  font-size: 7px; display: flex; align-items: center; justify-content: center;
}

/* ── STATS BAR ── */
.ld-stats-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  margin: 0 auto;
  width: min(100% - 40px, 920px);
  border-top: 1px solid rgba(255,255,255,0.06);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 46px 0;
  background: rgba(255,255,255,0.018);
  border-radius: 28px;
  backdrop-filter: blur(18px);
  transition: background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
}
.ld-root.light .ld-stats-bar {
  background: rgba(255,255,255,0.72);
  border-color: rgba(15,23,42,0.08);
  box-shadow: 0 18px 60px rgba(15,23,42,0.08);
}
.ld-stat-item {
  min-width: 0;
  text-align: center; padding: 18px clamp(12px, 2vw, 24px);
  position: relative;
  animation: ld-fade-up 0.7s ease both;
}
.ld-stat-item + .ld-stat-item::before {
  content: '';
  position: absolute; left: 0; top: 25%; height: 50%;
  width: 1px; background: rgba(255,255,255,0.07);
}
.ld-root.light .ld-stat-item + .ld-stat-item::before { background: rgba(15,23,42,0.08); }
.ld-stat-num {
  font-family: 'Open Sans', sans-serif;
  font-size: clamp(30px, 3.4vw, 44px); font-weight: 800;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1; margin-bottom: 8px;
  white-space: nowrap;
}
.ld-stat-desc {
  font-size: 13px; font-weight: 600; color: #94a3b8;
  line-height: 1.45;
}
.ld-root.light .ld-stat-desc { color: #475569; }

/* ── SECTION WRAPPER ── */
.ld-section {
  max-width: 1120px; margin: 0 auto;
  padding: 96px clamp(20px, 4vw, 40px);
}
.ld-how-section {
  border-top: 1px solid rgba(255,255,255,0.04);
}
.ld-root.light .ld-how-section {
  border-top-color: rgba(15,23,42,0.08);
}
.ld-section-tag {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 800; letter-spacing: 1.5px;
  text-transform: uppercase; color: #00d4ff;
  margin-bottom: 16px;
}
.ld-section-tag-line {
  width: 28px; height: 2px;
  background: linear-gradient(90deg, #00d4ff, #7c3aed);
  border-radius: 999px;
}
.ld-section-heading {
  font-family: 'Open Sans', sans-serif;
  font-size: clamp(30px, 3.6vw, 44px);
  font-weight: 800; line-height: 1.18;
  letter-spacing: -0.8px; color: #f8fafc;
  margin-bottom: 16px;
}
.ld-root.light .ld-section-heading { color: #0f172a; }
.ld-section-sub {
  font-size: 16px; font-weight: 500;
  color: #94a3b8; line-height: 1.7;
  max-width: 620px;
}
.ld-root.light .ld-section-sub { color: #475569; }

/* ── FEATURES ── */
.ld-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 22px; margin-top: 48px;
}
.ld-feat-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px;
  padding: 30px 28px;
  transition: all 0.3s ease;
  cursor: default;
  animation: ld-fade-up 0.6s ease both;
  position: relative; overflow: hidden;
}
.ld-root.light .ld-feat-card {
  background: rgba(255,255,255,0.78);
  border-color: rgba(15,23,42,0.08);
  box-shadow: 0 14px 36px rgba(15,23,42,0.06);
}
.ld-feat-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent);
  opacity: 0; transition: opacity 0.3s;
}
.ld-feat-card:hover {
  border-color: rgba(0,212,255,0.2);
  background: rgba(0,212,255,0.04);
  transform: translateY(-4px);
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
}
.ld-root.light .ld-feat-card:hover {
  background: rgba(255,255,255,0.96);
  border-color: rgba(14,165,233,0.24);
  box-shadow: 0 22px 58px rgba(15,23,42,0.12);
}
.ld-feat-card:hover::before { opacity: 1; }
.ld-feat-icon {
  width: 50px; height: 50px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; margin-bottom: 18px;
  position: relative;
}
.ld-feat-icon::after {
  content: '';
  position: absolute; inset: 0;
  border-radius: 14px;
  opacity: 0.15;
}
.ld-feat-icon.c1 { background: rgba(0,212,255,0.12); }
.ld-feat-icon.c1::after { background: #00d4ff; }
.ld-feat-icon.c2 { background: rgba(124,58,237,0.12); }
.ld-feat-icon.c2::after { background: #7c3aed; }
.ld-feat-icon.c3 { background: rgba(16,185,129,0.12); }
.ld-feat-icon.c3::after { background: #10b981; }
.ld-feat-icon.c4 { background: rgba(245,158,11,0.12); }
.ld-feat-icon.c4::after { background: #f59e0b; }
.ld-feat-icon.c5 { background: rgba(239,68,68,0.12); }
.ld-feat-icon.c5::after { background: #ef4444; }
.ld-feat-icon.c6 { background: rgba(99,102,241,0.12); }
.ld-feat-icon.c6::after { background: #6366f1; }
.ld-feat-title {
  font-size: 16px; font-weight: 800;
  color: #f1f5f9; margin-bottom: 8px; letter-spacing: -0.3px;
}
.ld-root.light .ld-feat-title { color: #0f172a; }
.ld-feat-desc {
  font-size: 13.5px; font-weight: 500;
  color: #94a3b8; line-height: 1.7;
}
.ld-root.light .ld-feat-desc { color: #475569; }

/* ── HOW IT WORKS ── */
.ld-how-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0;
  margin-top: 60px;
  position: relative;
}
.ld-how-grid::before {
  content: '';
  position: absolute;
  top: 38px; left: 12%; right: 12%; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0,212,255,0.25), rgba(124,58,237,0.25), transparent);
}
.ld-how-step {
  text-align: center; padding: 0 28px;
  animation: ld-fade-up 0.6s ease both;
}
.ld-how-step:nth-child(1) { animation-delay: 0.1s; }
.ld-how-step:nth-child(2) { animation-delay: 0.2s; }
.ld-how-step:nth-child(3) { animation-delay: 0.3s; }
.ld-how-step:nth-child(4) { animation-delay: 0.4s; }
.ld-how-num {
  width: 58px; height: 58px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Open Sans', sans-serif;
  font-size: 20px; font-weight: 800; color: white;
  margin: 0 auto 20px;
  position: relative; z-index: 1;
  box-shadow: 0 0 28px rgba(0,212,255,0.3);
}
.ld-how-title {
  font-size: 16px; font-weight: 800;
  color: #f1f5f9; margin-bottom: 8px;
}
.ld-root.light .ld-how-title { color: #0f172a; }
.ld-how-desc {
  font-size: 13px; font-weight: 500;
  color: #94a3b8; line-height: 1.65;
}
.ld-root.light .ld-how-desc { color: #475569; }

/* ── CTA SECTION ── */
.ld-cta-section {
  padding: 96px clamp(20px, 4vw, 40px);
  text-align: center;
  position: relative;
}
.ld-cta-card {
  max-width: 700px; margin: 0 auto;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(0,212,255,0.15);
  border-radius: 28px;
  padding: clamp(44px, 6vw, 70px) clamp(24px, 5vw, 60px);
  position: relative; overflow: hidden;
  box-shadow: 0 40px 100px rgba(0,0,0,0.4);
}
.ld-root.light .ld-cta-card {
  background: rgba(255,255,255,0.82);
  border-color: rgba(14,165,233,0.18);
  box-shadow: 0 30px 90px rgba(15,23,42,0.12);
}
.ld-cta-card::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at top, rgba(0,212,255,0.07), transparent 65%);
  pointer-events: none;
}
.ld-cta-heading {
  font-family: 'Open Sans', sans-serif;
  font-size: clamp(28px, 3.8vw, 42px);
  font-weight: 800; line-height: 1.15;
  letter-spacing: -0.8px; color: #f8fafc;
  margin-bottom: 14px;
}
.ld-root.light .ld-cta-heading { color: #0f172a; }
.ld-cta-sub {
  font-size: 16px; color: #94a3b8;
  line-height: 1.65; margin-bottom: 36px;
}
.ld-root.light .ld-cta-sub { color: #475569; }
.ld-cta-big-btn {
  display: inline-flex; align-items: center; gap: 12px;
  padding: 18px 44px;
  border: none;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  color: white;
  border-radius: 16px;
  font-family: 'Open Sans', sans-serif;
  font-size: 17px; font-weight: 800;
  cursor: pointer;
  transition: all 0.22s ease;
  box-shadow: 0 10px 36px rgba(0,212,255,0.35);
  letter-spacing: -0.2px;
}
.ld-cta-big-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 48px rgba(0,212,255,0.5);
}
.ld-cta-note {
  margin-top: 16px;
  font-size: 12px; color: #334155;
  font-weight: 500;
}
.ld-root.light .ld-cta-note { color: #64748b; }

/* ── FOOTER ── */
.ld-footer {
  border-top: 1px solid rgba(255,255,255,0.05);
  padding: 28px clamp(20px, 4vw, 60px);
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px;
}
.ld-root.light .ld-footer { border-top-color: rgba(15,23,42,0.08); }
.ld-footer-logo {
  display: flex; align-items: center; gap: 9px;
  font-family: 'Open Sans', sans-serif; font-size: 15px; font-weight: 700;
  color: #475569;
}
.ld-root.light .ld-footer-logo { color: #475569; }
.ld-footer-copy {
  font-size: 12px; color: #334155; font-weight: 400;
}
.ld-root.light .ld-footer-copy { color: #64748b; }

/* ── ANIMATIONS ── */
@keyframes ld-fade-up {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ld-soft-bob {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes ld-shimmer {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(120%); }
}

.ld-preview,
.ld-cta-card {
  animation-name: ld-fade-up, ld-soft-bob;
  animation-duration: 0.9s, 7s;
  animation-delay: 0.8s, 1.6s;
  animation-timing-function: ease, ease-in-out;
  animation-fill-mode: both, none;
  animation-iteration-count: 1, infinite;
}

.ld-cta-primary::before,
.ld-btn-solid::before,
.ld-cta-big-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent, rgba(255,255,255,0.28), transparent);
  transform: translateX(-120%);
  animation: ld-shimmer 3.6s ease-in-out infinite;
}

.ld-cta-primary,
.ld-btn-solid,
.ld-cta-big-btn {
  position: relative;
  overflow: hidden;
}

/* Scrollbar */
.ld-root::-webkit-scrollbar { width: 4px; }
.ld-root::-webkit-scrollbar-track { background: transparent; }
.ld-root::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
.ld-root.light::-webkit-scrollbar-thumb { background: #cbd5e1; }

@media (max-width: 900px) {
  .ld-nav {
    height: auto;
    min-height: 68px;
    padding-top: 12px;
    padding-bottom: 12px;
    gap: 14px;
  }

  .ld-nav-cta {
    gap: 8px;
  }

  .ld-btn-ghost,
  .ld-btn-solid {
    padding: 9px 14px;
    font-size: 13px;
  }

  .ld-hero {
    padding-top: 118px;
    padding-bottom: 72px;
  }

  .ld-preview {
    margin-top: 42px;
  }

  .ld-stats-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 28px 0;
  }

  .ld-stat-item:nth-child(3)::before {
    display: none;
  }

  .ld-how-grid::before {
    display: none;
  }

  .ld-how-grid {
    gap: 34px 0;
  }
}

@media (max-width: 640px) {
  .ld-nav {
    align-items: flex-start;
    flex-direction: column;
    padding: 10px 14px 12px;
    gap: 10px;
  }

  .ld-nav-cta {
    width: 100%;
    display: grid;
    grid-template-columns: 38px 1fr 1fr;
    gap: 8px;
  }

  .ld-btn-ghost,
  .ld-btn-solid {
    width: 100%;
    min-width: 0;
    min-height: 42px;
    padding: 11px 14px;
    font-size: 13px;
  }

  .ld-theme-toggle {
    width: 38px;
    height: 38px;
    border-radius: 11px;
  }

  .ld-hero {
    padding-top: 132px;
    padding-bottom: 52px;
  }

  .ld-hero-badge {
    margin-bottom: 16px;
    padding: 6px 12px;
    font-size: 11px;
  }

  .ld-hero-title {
    font-size: clamp(30px, 11vw, 42px);
    letter-spacing: -0.8px;
    margin-bottom: 16px;
  }

  .ld-hero-sub {
    font-size: 14px;
    line-height: 1.65;
    margin-bottom: 24px;
  }

  .ld-cta-primary,
  .ld-cta-secondary {
    width: 100%;
    justify-content: center;
    padding: 14px 22px;
  }

  .ld-hero-btns {
    gap: 10px;
  }

  .ld-preview {
    margin-top: 28px;
  }

  .ld-preview-frame {
    border-radius: 16px;
    padding: 16px 14px;
  }

  .ld-preview-bar {
    margin-bottom: 16px;
  }

  .ld-graph-demo {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
    padding: 18px 4px 12px;
    min-height: 0;
  }

  .ld-arrow {
    justify-content: center;
    transform: rotate(90deg);
    padding: 2px 0;
  }

  .ld-node {
    width: 100%;
    min-width: 0;
    padding: 11px 14px;
    font-size: 12px;
  }

  .ld-stats-bar {
    grid-template-columns: 1fr;
    width: min(100% - 24px, 420px);
  }

  .ld-stat-item + .ld-stat-item::before {
    left: 18%;
    right: 18%;
    top: 0;
    width: auto;
    height: 1px;
  }

  .ld-section {
    padding-top: 60px;
    padding-bottom: 60px;
  }

  .ld-footer {
    justify-content: center;
    text-align: center;
  }

  .ld-cta-card {
    border-radius: 22px;
  }
}

@media (max-width: 420px) {
  .ld-nav {
    padding-left: 12px;
    padding-right: 12px;
  }

  .ld-nav-brand {
    font-size: 15px;
  }

  .ld-nav-cta {
    grid-template-columns: auto 1fr;
  }

  .ld-btn-solid {
    grid-column: 1 / -1;
  }

  .ld-hero {
    padding-left: 12px;
    padding-right: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ld-root *,
  .ld-root *::before,
  .ld-root *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}


/* ── Animated logo SVG ── */
@keyframes tlg-draw {
  0%   { stroke-dashoffset: 22; opacity: 0; }
  18%  { opacity: 1; }
  65%  { stroke-dashoffset: 0; opacity: 1; }
  100% { stroke-dashoffset: -22; opacity: 0; }
}
.ld-nav-icon { overflow: hidden; position: relative; }
.tlg-edge {
  stroke-dasharray: 22;
  stroke-dashoffset: 22;
  animation: tlg-draw 2.8s ease-in-out infinite;
}
.tlg-e2 { animation-delay: 0.7s; }
.tlg-e3 { animation-delay: 1.4s; }
.tlg-e4 { animation-delay: 2.1s; }
`;

/* ── Particle canvas ── */
function HeroCanvas({ dark }) {
  const ref = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    let W = c.width = window.innerWidth;
    let H = c.height = window.innerHeight;
    const onResize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-0.5)*0.35, vy: (Math.random()-0.5)*0.35,
      r: Math.random()*1.5+0.3, a: Math.random()*0.5+0.05,
    }));
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      const rgb = dark ? "0,212,255" : "14,165,233";
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(${rgb},${dark ? p.a : p.a * 0.8})`; ctx.fill();
      });
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<150){ ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle=`rgba(${rgb},${(1-d/150)*(dark ? 0.08 : 0.06)})`; ctx.lineWidth=0.5; ctx.stroke(); }
      }
      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", onResize);
    };
  }, [dark]);
  return <canvas ref={ref} className="ld-hero-canvas" />;
}

/* ── Animated counter ── */
function Counter({ to, suffix="" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = to / 60;
        const tick = () => {
          start = Math.min(start + step, to);
          setVal(Math.round(start));
          if (start < to) requestAnimationFrame(tick);
        };
        tick();
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (el) obs.observe(el);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

const FEATURES = [
  { icon:"🗂️", cls:"c1", title:"Visual Node Graph", desc:"Every task becomes an interactive node. See your entire project structure at a glance with a beautifully laid-out dependency graph." },
  { icon:"🔗", cls:"c2", title:"Dependency Linking", desc:"Connect tasks with a simple parent-child relationship. Child tasks stay locked until their parent is completed." },
  { icon:"🚫", cls:"c5", title:"Cycle Detection", desc:"Automatically detects and blocks circular dependencies before they can cause infinite loops or confusion in your workflow." },
  { icon:"🟢", cls:"c3", title:"Live Status Tracking", desc:"Tasks auto-update to show Ready, Blocked, or Completed states. Instantly know what your team can work on right now." },
  { icon:"☁️", cls:"c6", title:"Real-time Cloud Sync", desc:"Powered by Firebase Firestore. Every change syncs instantly across all devices — no refreshing, no conflicts." },
  { icon:"🔒", cls:"c4", title:"Secure Auth", desc:"Each user gets their own isolated workspace. Tasks and data are private and protected by Firebase Authentication." },
];

const HOW_STEPS = [
  { n:"1", title:"Create an Account", desc:"Sign up in seconds with your email. Your data is private and isolated to your account." },
  { n:"2", title:"Add Your Tasks", desc:"Type in your project tasks one by one. Each task becomes a visual node on the graph." },
  { n:"3", title:"Link Dependencies", desc:"Select a parent task and a child task to create a dependency arrow between them." },
  { n:"4", title:"Track Progress", desc:"Click tasks to complete them. Watch blocked tasks automatically unlock as dependencies clear." },
];

export default function Landing({ onGetStarted, onSignIn, darkTheme, setDarkTheme }) {
  const dark = Boolean(darkTheme);
  const setDark = setDarkTheme;

  useEffect(() => {
    const existing = document.getElementById("ld-css");
    if (existing) {
      existing.textContent = LANDING_CSS;
    } else {
      const s = document.createElement("style");
      s.id = "ld-css"; s.textContent = LANDING_CSS;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <div className={`ld-root ${dark ? "dark" : "light"}`}>
      {/* NAV */}
      <nav className="ld-nav">
        <div className="ld-nav-logo">
          <div className="ld-nav-icon">
  <svg width="100%" height="100%" viewBox="0 0 36 36" fill="none" style={{position:'absolute',inset:0}}>
    <line className="tlg-edge"      x1="8"  y1="11" x2="18" y2="7"  stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" strokeLinecap="round"/>
    <line className="tlg-edge tlg-e2" x1="18" y1="7"  x2="28" y2="14" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" strokeLinecap="round"/>
    <line className="tlg-edge tlg-e3" x1="28" y1="14" x2="18" y2="27" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" strokeLinecap="round"/>
    <line className="tlg-edge tlg-e4" x1="8"  y1="11" x2="18" y2="27" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="8"  cy="11" r="2.2" fill="white" opacity="0.9"/>
    <circle cx="18" cy="7"  r="2.2" fill="white" opacity="0.9"/>
    <circle cx="28" cy="14" r="2.2" fill="white" opacity="0.9"/>
    <circle cx="18" cy="27" r="2.8" fill="white" opacity="0.9"/>
  </svg>
</div>
          <span className="ld-nav-brand">TaskGraph</span>
        </div>
        <div className="ld-nav-cta">
          <button className="ld-theme-toggle" onClick={() => setDark(d => !d)} title="Toggle theme" aria-label="Toggle theme">
            {dark ? "☀️" : "🌙"}
          </button>
          <button className="ld-btn-ghost" onClick={onSignIn || onGetStarted}>Sign In</button>
          <button className="ld-btn-solid" onClick={onGetStarted}>Get Started Free →</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="ld-hero">
        <HeroCanvas dark={dark} />
        <div className="ld-orb ld-orb-1" />
        <div className="ld-orb ld-orb-2" />
        <div className="ld-orb ld-orb-3" />

        <div className="ld-hero-inner">
          <div className="ld-hero-badge">
            <div className="ld-hero-badge-dot" />
            TaskGraph · Visual Workflow Intelligence
          </div>

          <h1 className="ld-hero-title">
            Visualize Tasks,<br />
            <span className="accent">Eliminate Blockers</span>
          </h1>

          <p className="ld-hero-sub">
            Map your project dependencies as an interactive graph.
            See what's blocked, what's ready, and what's done — all in real time.
          </p>

          <div className="ld-hero-btns">
            <button className="ld-cta-primary" onClick={onGetStarted}>
              Launch App  →
            </button>
            <button className="ld-cta-secondary" onClick={() => document.getElementById('ld-how').scrollIntoView({ behavior:'smooth' })}>
              See How It Works
            </button>
          </div>
        </div>

        {/* Graph preview */}
        <div className="ld-preview">
          <div className="ld-preview-frame">
            <div className="ld-preview-bar">
              <div className="ld-dot-r" /><div className="ld-dot-y" /><div className="ld-dot-g" />
              <span className="ld-preview-title">TaskGraph — Dependency Visualizer</span>
            </div>
            <div className="ld-graph-demo">
              <div className="ld-node ld-node-green">Design Mockup ✓</div>
              <div className="ld-arrow">
                <svg width="32" height="12" viewBox="0 0 32 12" fill="none">
                  <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 2L28 6L20 10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="ld-node ld-node-cyan">Frontend Dev</div>
              <div className="ld-arrow">
                <svg width="32" height="12" viewBox="0 0 32 12" fill="none">
                  <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 2L28 6L20 10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="ld-node ld-node-violet">API Integration</div>
              <div className="ld-arrow">
                <svg width="32" height="12" viewBox="0 0 32 12" fill="none">
                  <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 2L28 6L20 10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="ld-node ld-node-red">QA Testing ⚠</div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="ld-stats-bar">
        {[
          { n:100, s:"%", d:"Real-time sync" },
          { n:0, s:" loops", d:"Circular dependencies caught" },
          { n:3, s:" states", d:"Ready, Blocked & Done" },
          { n:1, s:" click", d:"To complete a task" },
        ].map((s,i) => (
          <div className="ld-stat-item" key={i} style={{ animationDelay:`${i*0.1}s` }}>
            <div className="ld-stat-num"><Counter to={s.n} />{s.s}</div>
            <div className="ld-stat-desc">{s.d}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section className="ld-section">
        <div className="ld-section-tag">
          <div className="ld-section-tag-line" />
          Features
        </div>
        <h2 className="ld-section-heading">Everything you need to<br />manage task flow</h2>
        <p className="ld-section-sub">Built for teams and solo developers who need to visualize complex project dependencies without the bloat.</p>
        <div className="ld-features-grid">
          {FEATURES.map((f,i) => (
            <div className="ld-feat-card" key={i} style={{ animationDelay:`${i*0.08}s` }}>
              <div className={`ld-feat-icon ${f.cls}`}>{f.icon}</div>
              <div className="ld-feat-title">{f.title}</div>
              <div className="ld-feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="ld-section ld-how-section" id="ld-how">
        <div className="ld-section-tag">
          <div className="ld-section-tag-line" />
          How It Works
        </div>
        <h2 className="ld-section-heading">Up and running<br />in 4 simple steps</h2>
        <p className="ld-section-sub">No setup, no configuration. Just create an account and start mapping your project in minutes.</p>
        <div className="ld-how-grid">
          {HOW_STEPS.map((s,i) => (
            <div className="ld-how-step" key={i} style={{ animationDelay:`${i*0.1}s` }}>
              <div className="ld-how-num">{s.n}</div>
              <div className="ld-how-title">{s.title}</div>
              <div className="ld-how-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="ld-cta-section">
        <div className="ld-cta-card">
          <h2 className="ld-cta-heading">Ready to visualize<br />your workflow?</h2>
          <p className="ld-cta-sub">Create your free account and map your first dependency graph in under 2 minutes.</p>
          <button className="ld-cta-big-btn" onClick={onGetStarted}>
            Get Started Free  →
          </button>
          <p className="ld-cta-note">No credit card required · Free to use · Secure cloud storage</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ld-footer">
        <div className="ld-footer-logo">
          <div style={{width:26,height:26,borderRadius:7,background:"linear-gradient(135deg,#00d4ff,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative",flexShrink:0}}>
  <svg width="100%" height="100%" viewBox="0 0 26 26" fill="none" style={{position:'absolute',inset:0}}>
    <line x1="6" y1="8" x2="13" y2="5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="13" y1="5" x2="20" y2="10" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="20" y1="10" x2="13" y2="20" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="6" y1="8" x2="13" y2="20" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="6" cy="8" r="1.8" fill="white"/>
    <circle cx="13" cy="5" r="1.8" fill="white"/>
    <circle cx="20" cy="10" r="1.8" fill="white"/>
    <circle cx="13" cy="20" r="2.2" fill="white"/>
  </svg>
</div>
          TaskGraph
        </div>
        <div className="ld-footer-copy">Built for internship · Task Dependency Visualizer</div>
      </footer>
    </div>
  );
}
