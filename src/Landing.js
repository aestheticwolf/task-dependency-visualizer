import React, { useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════
   LANDING PAGE CSS
═══════════════════════════════════════════════════════ */
const LANDING_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Syne:wght@700;800&display=swap');

.ld-root *, .ld-root *::before, .ld-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

.ld-root {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: #050d1f;
  color: #e2e8f0;
  overflow-x: hidden;
  min-height: 100vh;
}

/* ── NAV ── */
.ld-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 60px;
  height: 68px;
  background: rgba(5,13,31,0.75);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  animation: ld-nav-in 0.6s ease both;
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
}
.ld-nav-brand {
  font-family: 'Syne', sans-serif;
  font-size: 18px; font-weight: 800;
  color: #f8fafc;
  letter-spacing: -0.5px;
}
.ld-nav-cta {
  display: flex; align-items: center; gap: 12px;
}
.ld-btn-ghost {
  padding: 9px 20px;
  border: 1px solid rgba(255,255,255,0.12);
  background: transparent;
  color: #94a3b8;
  border-radius: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px; font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.ld-btn-ghost:hover {
  color: #f1f5f9;
  border-color: rgba(0,212,255,0.35);
  background: rgba(0,212,255,0.06);
}
.ld-btn-solid {
  padding: 9px 22px;
  border: none;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  color: white;
  border-radius: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif;
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
  min-height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
  padding: 120px 40px 80px;
  position: relative;
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
@keyframes ld-orb-float {
  0%,100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-30px) scale(1.06); }
}

.ld-hero-inner { position: relative; z-index: 1; max-width: 820px; }

.ld-hero-badge {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 7px 16px;
  border-radius: 999px;
  border: 1px solid rgba(0,212,255,0.2);
  background: rgba(0,212,255,0.07);
  font-size: 12px; font-weight: 700;
  color: #67e8f9;
  letter-spacing: 0.5px; text-transform: uppercase;
  margin-bottom: 28px;
  animation: ld-fade-up 0.8s ease 0.2s both;
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
  font-family: 'Syne', sans-serif;
  font-size: clamp(44px, 6vw, 80px);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -2px;
  color: #f8fafc;
  margin-bottom: 22px;
  animation: ld-fade-up 0.8s ease 0.35s both;
}
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
  color: #64748b;
  line-height: 1.75;
  max-width: 560px; margin: 0 auto 44px;
  font-weight: 400;
  animation: ld-fade-up 0.8s ease 0.5s both;
}

.ld-hero-btns {
  display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;
  animation: ld-fade-up 0.8s ease 0.65s both;
}
.ld-cta-primary {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 16px 34px;
  border: none;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  color: white;
  border-radius: 14px;
  font-family: 'Plus Jakarta Sans', sans-serif;
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
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px; font-weight: 600;
  cursor: pointer;
  transition: all 0.22s ease;
}
.ld-cta-secondary:hover { border-color: rgba(0,212,255,0.35); color: #f1f5f9; background: rgba(0,212,255,0.06); transform: translateY(-2px); }

/* ── GRAPH PREVIEW ── */
.ld-preview {
  position: relative; z-index: 1;
  margin: 70px auto 0;
  max-width: 860px;
  animation: ld-fade-up 0.9s ease 0.8s both;
}
.ld-preview-frame {
  border-radius: 20px;
  border: 1px solid rgba(0,212,255,0.15);
  background: rgba(7,15,40,0.8);
  backdrop-filter: blur(20px);
  padding: 28px;
  box-shadow: 0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,255,0.05);
  overflow: hidden;
  position: relative;
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

/* Animated node graph */
.ld-graph-demo {
  display: flex; align-items: center; justify-content: center;
  gap: 0; padding: 20px 10px;
  position: relative; min-height: 160px;
}
.ld-node {
  padding: 12px 22px;
  border-radius: 12px;
  font-size: 13px; font-weight: 700;
  white-space: nowrap;
  position: relative; z-index: 2;
  animation: ld-node-in 0.5s cubic-bezier(0.16,1,0.3,1) both;
}
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
  padding: 0 8px; z-index: 1;
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
  display: flex; justify-content: center; gap: 0;
  margin: 0 auto;
  max-width: 900px;
  border-top: 1px solid rgba(255,255,255,0.06);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 60px 40px;
  background: rgba(255,255,255,0.01);
  flex-wrap: wrap;
}
.ld-stat-item {
  flex: 1; min-width: 180px;
  text-align: center; padding: 24px 20px;
  position: relative;
  animation: ld-fade-up 0.7s ease both;
}
.ld-stat-item + .ld-stat-item::before {
  content: '';
  position: absolute; left: 0; top: 25%; height: 50%;
  width: 1px; background: rgba(255,255,255,0.07);
}
.ld-stat-num {
  font-family: 'Syne', sans-serif;
  font-size: 46px; font-weight: 800;
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1; margin-bottom: 6px;
}
.ld-stat-desc {
  font-size: 13px; font-weight: 500; color: #64748b;
}

/* ── SECTION WRAPPER ── */
.ld-section {
  max-width: 1080px; margin: 0 auto;
  padding: 100px 40px;
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
  font-family: 'Syne', sans-serif;
  font-size: clamp(30px, 4vw, 46px);
  font-weight: 800; line-height: 1.15;
  letter-spacing: -1px; color: #f8fafc;
  margin-bottom: 16px;
}
.ld-section-sub {
  font-size: 16px; font-weight: 400;
  color: #64748b; line-height: 1.7;
  max-width: 500px;
}

/* ── FEATURES ── */
.ld-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px; margin-top: 56px;
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
  font-size: 16px; font-weight: 700;
  color: #f1f5f9; margin-bottom: 8px; letter-spacing: -0.3px;
}
.ld-feat-desc {
  font-size: 13.5px; font-weight: 400;
  color: #64748b; line-height: 1.65;
}

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
  font-family: 'Syne', sans-serif;
  font-size: 20px; font-weight: 800; color: white;
  margin: 0 auto 20px;
  position: relative; z-index: 1;
  box-shadow: 0 0 28px rgba(0,212,255,0.3);
}
.ld-how-title {
  font-size: 16px; font-weight: 700;
  color: #f1f5f9; margin-bottom: 8px;
}
.ld-how-desc {
  font-size: 13px; font-weight: 400;
  color: #64748b; line-height: 1.6;
}

/* ── CTA SECTION ── */
.ld-cta-section {
  padding: 100px 40px;
  text-align: center;
  position: relative;
}
.ld-cta-card {
  max-width: 700px; margin: 0 auto;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(0,212,255,0.15);
  border-radius: 28px;
  padding: 70px 60px;
  position: relative; overflow: hidden;
  box-shadow: 0 40px 100px rgba(0,0,0,0.4);
}
.ld-cta-card::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at top, rgba(0,212,255,0.07), transparent 65%);
  pointer-events: none;
}
.ld-cta-heading {
  font-family: 'Syne', sans-serif;
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 800; line-height: 1.15;
  letter-spacing: -1px; color: #f8fafc;
  margin-bottom: 14px;
}
.ld-cta-sub {
  font-size: 16px; color: #64748b;
  line-height: 1.65; margin-bottom: 36px;
}
.ld-cta-big-btn {
  display: inline-flex; align-items: center; gap: 12px;
  padding: 18px 44px;
  border: none;
  background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
  color: white;
  border-radius: 16px;
  font-family: 'Plus Jakarta Sans', sans-serif;
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

/* ── FOOTER ── */
.ld-footer {
  border-top: 1px solid rgba(255,255,255,0.05);
  padding: 28px 60px;
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px;
}
.ld-footer-logo {
  display: flex; align-items: center; gap: 9px;
  font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
  color: #475569;
}
.ld-footer-copy {
  font-size: 12px; color: #334155; font-weight: 400;
}

/* ── ANIMATIONS ── */
@keyframes ld-fade-up {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Scrollbar */
.ld-root::-webkit-scrollbar { width: 4px; }
.ld-root::-webkit-scrollbar-track { background: transparent; }
.ld-root::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
`;

/* ── Particle canvas ── */
function HeroCanvas() {
  const ref = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    let W = c.width = window.innerWidth;
    let H = c.height = window.innerHeight;
    window.addEventListener("resize", () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; });
    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-0.5)*0.35, vy: (Math.random()-0.5)*0.35,
      r: Math.random()*1.5+0.3, a: Math.random()*0.5+0.05,
    }));
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(0,212,255,${p.a})`; ctx.fill();
      });
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<150){ ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle=`rgba(0,212,255,${(1-d/150)*0.08})`; ctx.lineWidth=0.5; ctx.stroke(); }
      }
      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf.current);
  }, []);
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

export default function Landing({ onGetStarted }) {
  useEffect(() => {
    if (!document.getElementById("ld-css")) {
      const s = document.createElement("style");
      s.id = "ld-css"; s.textContent = LANDING_CSS;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <div className="ld-root">
      {/* NAV */}
      <nav className="ld-nav">
        <div className="ld-nav-logo">
          <div className="ld-nav-icon">⬡</div>
          <span className="ld-nav-brand">TaskGraph</span>
        </div>
        <div className="ld-nav-cta">
          <button className="ld-btn-ghost" onClick={onGetStarted}>Sign In</button>
          <button className="ld-btn-solid" onClick={onGetStarted}>Get Started Free →</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="ld-hero">
        <HeroCanvas />
        <div className="ld-orb ld-orb-1" />
        <div className="ld-orb ld-orb-2" />
        <div className="ld-orb ld-orb-3" />

        <div className="ld-hero-inner">
          <div className="ld-hero-badge">
            <div className="ld-hero-badge-dot" />
            Internship Project · Task Dependency Visualizer
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
      <section className="ld-section" id="ld-how" style={{ borderTop:"1px solid rgba(255,255,255,0.04)" }}>
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
          <div style={{ width:26,height:26,borderRadius:7,background:"linear-gradient(135deg,#00d4ff,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13 }}>⬡</div>
          TaskGraph
        </div>
        <div className="ld-footer-copy">Built for internship · Task Dependency Visualizer</div>
      </footer>
    </div>
  );
}