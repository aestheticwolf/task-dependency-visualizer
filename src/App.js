import React, { useState, useEffect, useRef } from "react";
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

/* ─── helpers ─── */
function buildGraph(edges) {
  const graph = {};
  edges.forEach(e => {
    if (!graph[e.source]) graph[e.source] = [];
    graph[e.source].push(e.target);
  });
  return graph;
}

function hasCycle(graph) {
  const visited = new Set(), stack = new Set();
  function dfs(node) {
    if (stack.has(node)) return true;
    if (visited.has(node)) return false;
    visited.add(node); stack.add(node);
    for (const n of graph[node] || []) if (dfs(n)) return true;
    stack.delete(node);
    return false;
  }
  return Object.keys(graph).some(dfs);
}

function isBlocked(taskId, edges, nodes) {
  const parents = edges.filter(e => e.target === taskId).map(e => e.source);
  return parents.some(p => {
    const parent = nodes.find(n => n.id === p);
    return parent && parent.data.completed !== true;
  });
}

const nodeWidth = 160;
const nodeHeight = 48;

function getLayoutedElements(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", ranksep: 80, nodesep: 50 });
  nodes.forEach(n => g.setNode(n.id, { width: nodeWidth, height: nodeHeight }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return {
    nodes: nodes.map(n => {
      const pos = g.node(n.id);
      return { ...n, position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 } };
    }),
    edges,
  };
}

/* ─── styles ─── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Sora:wght@300;400;500;600;700&display=swap');

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: #020817;
    font-family: 'Sora', sans-serif;
  }

  /* ── Stat cards ── */
  .stat-card {
    background: rgba(15,23,42,0.7);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    transition: border-color 0.2s, transform 0.2s;
    cursor: default;
  }
  .stat-card:hover {
    border-color: rgba(56,189,248,0.25);
    transform: translateY(-2px);
  }
  .stat-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #475569;
    font-weight: 500;
  }
  .stat-value {
    font-family: 'Space Mono', monospace;
    font-size: 22px;
    font-weight: 700;
    line-height: 1;
  }

  /* ── Panel sections ── */
  .panel-section {
    background: rgba(15,23,42,0.6);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: border-color 0.2s;
  }
  .panel-section:hover {
    border-color: rgba(56,189,248,0.12);
  }

  .section-title {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #475569;
    font-weight: 600;
    margin-bottom: 2px;
  }

  /* ── Inputs ── */
  .dash-input, .dash-select {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid rgba(71,85,105,0.4);
    background: rgba(2,8,23,0.7);
    color: #f1f5f9;
    font-family: 'Sora', sans-serif;
    font-size: 12px;
    outline: none;
    transition: all 0.2s;
    -webkit-appearance: none;
  }
  .dash-input::placeholder { color: #334155; }
  .dash-input:focus, .dash-select:focus {
    border-color: rgba(56,189,248,0.5);
    box-shadow: 0 0 0 3px rgba(56,189,248,0.08);
    background: rgba(56,189,248,0.03);
  }
  .dash-select option { background: #1e293b; color: #f1f5f9; }

  /* ── Buttons ── */
  .dash-btn {
    width: 100%;
    padding: 10px 14px;
    border: none;
    border-radius: 8px;
    font-family: 'Sora', sans-serif;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.3px;
    transition: all 0.18s ease;
    position: relative;
    overflow: hidden;
  }
  .dash-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(rgba(255,255,255,0.08), transparent);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .dash-btn:hover::before { opacity: 1; }

  .btn-primary {
    background: linear-gradient(135deg, #38bdf8 0%, #6366f1 100%);
    color: white;
    box-shadow: 0 3px 12px rgba(56,189,248,0.2);
  }
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 5px 20px rgba(56,189,248,0.35);
  }
  .btn-primary:active { transform: translateY(0); }

  .btn-danger {
    background: rgba(239,68,68,0.12);
    color: #f87171;
    border: 1px solid rgba(239,68,68,0.2);
  }
  .btn-danger:hover {
    background: rgba(239,68,68,0.2);
    transform: translateY(-1px);
  }

  /* ── Search ── */
  .search-wrapper {
    position: relative;
  }
  .search-icon {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    color: #475569;
    font-size: 12px;
    pointer-events: none;
  }
  .dash-input.with-icon { padding-left: 30px; }

  /* ── Progress bar ── */
  .progress-bar-track {
    height: 5px;
    background: rgba(255,255,255,0.05);
    border-radius: 999px;
    overflow: hidden;
    margin-top: 4px;
  }
  .progress-bar-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #38bdf8, #22c55e);
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ── ReactFlow custom nodes ── */
  .react-flow__node {
    font-family: 'Sora', sans-serif !important;
    font-size: 12px !important;
  }

  /* ── Empty state ── */
  .empty-state {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    pointer-events: none;
    animation: fadeInUp 0.5s ease forwards;
  }
  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
    filter: grayscale(0.5);
    opacity: 0.5;
  }
  .empty-text {
    color: #334155;
    font-size: 14px;
    font-weight: 500;
  }
  .empty-sub {
    color: #1e293b;
    font-size: 12px;
    margin-top: 4px;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translate(-50%, calc(-50% + 10px)); }
    to { opacity: 1; transform: translate(-50%, -50%); }
  }

  /* ── Toast notification ── */
  .toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 9999;
  }
  .toast {
    padding: 12px 18px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    animation: toastIn 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 220px;
  }
  .toast-success { background: rgba(34,197,94,0.15); color: #86efac; border-color: rgba(34,197,94,0.2); }
  .toast-error { background: rgba(239,68,68,0.15); color: #fca5a5; border-color: rgba(239,68,68,0.2); }
  .toast-info { background: rgba(56,189,248,0.12); color: #7dd3fc; border-color: rgba(56,189,248,0.2); }

  @keyframes toastIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #334155; }

  /* ── Legend ── */
  .legend-item {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 11px;
    color: #64748b;
  }
  .legend-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ── Panel slide-in ── */
  @keyframes panelReveal {
    from { opacity: 0; transform: translateX(-16px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .left-panel { animation: panelReveal 0.4s ease forwards; }
`;

/* ─── Toast hook ─── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  return { toasts, show };
}

function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [taskName, setTaskName] = useState("");
  const [parent, setParent] = useState("");
  const [child, setChild] = useState("");
  const { toasts, show: showToast } = useToast();
  const clickTimeout = useRef(null);

  /* ── Firestore CRUD ── */
  const deleteNode = async (nodeId) => {
    const nodeSnap = await getDocs(collection(db, "users", user.uid, "nodes"));
    const edgeSnap = await getDocs(collection(db, "users", user.uid, "edges"));
    await Promise.all(nodeSnap.docs.map(async d => {
      if (d.data().id === nodeId) await deleteDoc(doc(db, "users", user.uid, "nodes", d.id));
    }));
    edgeSnap.forEach(async d => {
      if (d.data().source === nodeId || d.data().target === nodeId)
        await deleteDoc(doc(db, "users", user.uid, "edges", d.id));
    });
    showToast("Task deleted", "error");
  };

  const addTask = async () => {
    if (!taskName.trim()) return;
    const newNode = {
      id: Date.now().toString(),
      data: { label: taskName.trim(), completed: false },
      position: { x: Math.random() * 400, y: Math.random() * 400 }
    };
    await addDoc(collection(db, "users", user.uid, "nodes"), newNode);
    showToast(`"${taskName.trim()}" added`, "success");
    setTaskName("");
  };

  const addDependency = async () => {
    if (!parent || !child || parent === child) return;
    if (edges.some(e => e.source === parent && e.target === child)) {
      showToast("Dependency already exists", "error");
      return;
    }
    const newEdge = { id: `e${parent}-${child}`, source: parent, target: child, animated: true };
    const graph = buildGraph([...edges, newEdge]);
    if (hasCycle(graph)) {
      showToast("⚠ Circular dependency detected!", "error");
      return;
    }
    await addDoc(collection(db, "users", user.uid, "edges"), newEdge);
    showToast("Dependency added", "success");
    setParent(""); setChild("");
  };

  const onNodeClick = (event, node) => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      if (window.confirm(`Delete "${node.data.label}"?`)) deleteNode(node.id);
    } else {
      clickTimeout.current = setTimeout(async () => {
        const nodeSnap = await getDocs(collection(db, "users", user.uid, "nodes"));
        const docToUpdate = nodeSnap.docs.find(d => d.data().id === node.id);
        if (docToUpdate) {
          const wasCompleted = docToUpdate.data().data.completed;
          await updateDoc(doc(db, "users", user.uid, "nodes", docToUpdate.id), {
            "data.completed": !wasCompleted
          });
          showToast(wasCompleted ? "Task marked pending" : "Task completed ✓", wasCompleted ? "info" : "success");
        }
        clickTimeout.current = null;
      }, 250);
    }
  };

  const onEdgeClick = async (event, edge) => {
    if (!window.confirm("Remove this dependency?")) return;
    const edgeSnap = await getDocs(collection(db, "users", user.uid, "edges"));
    await Promise.all(edgeSnap.docs.map(async d => {
      if (d.data().id === edge.id) await deleteDoc(doc(db, "users", user.uid, "edges", d.id));
    }));
    showToast("Dependency removed", "info");
  };

  /* ── Stats ── */
  const totalTasks = nodes.length;
  const completedTasks = nodes.filter(n => n.data.completed).length;
  const blockedTasks = nodes.filter(n => !n.data.completed && isBlocked(n.id, edges, nodes)).length;
  const readyTasks = nodes.filter(n => !n.data.completed && !isBlocked(n.id, edges, nodes)).length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  /* ── Styled nodes ── */
  const styledNodes = nodes
    .filter(n => n.data.label.toLowerCase().includes(search.toLowerCase()))
    .map(n => {
      const done = n.data.completed;
      const blocked = isBlocked(n.id, edges, nodes);
      const isMatch = search && n.data.label.toLowerCase().includes(search.toLowerCase());

      let bg, border, textColor;
      if (done) { bg = "rgba(56,189,248,0.12)"; border = "1px solid rgba(56,189,248,0.4)"; textColor = "#7dd3fc"; }
      else if (blocked) { bg = "rgba(239,68,68,0.1)"; border = "1px solid rgba(239,68,68,0.35)"; textColor = "#fca5a5"; }
      else { bg = "rgba(34,197,94,0.1)"; border = "1px solid rgba(34,197,94,0.4)"; textColor = "#86efac"; }

      if (isMatch) border = "2px solid #facc15";

      return {
        ...n,
        title: done ? "Completed" : blocked ? "Blocked by dependency" : "Ready to work",
        style: {
          background: bg,
          border,
          color: textColor,
          borderRadius: "10px",
          padding: "10px 14px",
          fontFamily: "'Sora', sans-serif",
          fontSize: "12px",
          fontWeight: "500",
          backdropFilter: "blur(8px)",
          boxShadow: done
            ? "0 0 12px rgba(56,189,248,0.15)"
            : blocked
            ? "0 0 10px rgba(239,68,68,0.1)"
            : "0 0 12px rgba(34,197,94,0.15)",
          transition: "all 0.25s ease",
          cursor: "pointer",
        }
      };
    });

  /* ── Layout on edges change ── */
  useEffect(() => {
    setNodes(prev => getLayoutedElements(prev, edges).nodes);
  }, [edges]);

  /* ── Firestore subscriptions ── */
  useEffect(() => {
    if (!user) return;
    const unsubNodes = onSnapshot(collection(db, "users", user.uid, "nodes"), snapshot => {
      setNodes(snapshot.docs.map(d => d.data()));
    });
    const unsubEdges = onSnapshot(collection(db, "users", user.uid, "edges"), snapshot => {
      setEdges(snapshot.docs.map(d => d.data()));
    });
    return () => { unsubNodes(); unsubEdges(); };
  }, [user]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  if (!user) return <Login setUser={setUser} />;

  return (
    <>
      <style>{globalStyles}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Sora', sans-serif" }}>

        {/* ── LEFT PANEL ── */}
        <div className="left-panel" style={{
          width: "270px",
          flexShrink: 0,
          background: "rgba(2,8,23,0.95)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "18px 14px",
          overflowY: "auto",
        }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: 32, height: 32,
                background: "linear-gradient(135deg,#38bdf8,#6366f1)",
                borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
                boxShadow: "0 0 16px rgba(56,189,248,0.3)"
              }}>⬡</div>
              <div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 13, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.3px" }}>TaskGraph</div>
                <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.6px" }}>Visualizer</div>
              </div>
            </div>

            <button
              onClick={() => { signOut(auth); showToast("Signed out", "info"); }}
              title="Sign out"
              style={{
                padding: "6px 10px", background: "rgba(239,68,68,0.1)",
                color: "#f87171", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 7, cursor: "pointer", fontSize: 11, fontFamily: "'Sora',sans-serif",
                transition: "all 0.2s", fontWeight: 600
              }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(239,68,68,0.2)"}
              onMouseOut={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
            >
              Exit
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="stat-card">
              <span className="stat-label">Total</span>
              <span className="stat-value" style={{ color: "#94a3b8" }}>{totalTasks}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Links</span>
              <span className="stat-value" style={{ color: "#94a3b8" }}>{edges.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Done</span>
              <span className="stat-value" style={{ color: "#38bdf8" }}>{completedTasks}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Ready</span>
              <span className="stat-value" style={{ color: "#22c55e" }}>{readyTasks}</span>
            </div>
          </div>

          {/* Progress */}
          {totalTasks > 0 && (
            <div className="panel-section" style={{ gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="section-title">Progress</span>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "#38bdf8" }}>{progress}%</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              {blockedTasks > 0 && (
                <div style={{ fontSize: 11, color: "#f87171", display: "flex", alignItems: "center", gap: 5 }}>
                  <span>⚠</span> {blockedTasks} task{blockedTasks > 1 ? "s" : ""} blocked
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="panel-section" style={{ gap: 8 }}>
            <span className="section-title">Legend</span>
            <div className="legend-item"><div className="legend-dot" style={{ background: "#22c55e" }} /> Ready to work</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: "#38bdf8" }} /> Completed</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: "#ef4444" }} /> Blocked</div>
          </div>

          {/* Search */}
          <div className="panel-section">
            <span className="section-title">Search</span>
            <div className="search-wrapper">
              <span className="search-icon">⌕</span>
              <input
                className="dash-input with-icon"
                type="text"
                placeholder="Find task..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Add Task */}
          <div className="panel-section">
            <span className="section-title">New Task</span>
            <input
              className="dash-input"
              type="text"
              placeholder="Task name..."
              value={taskName}
              onChange={e => setTaskName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTask()}
            />
            <button className="dash-btn btn-primary" onClick={addTask} disabled={!taskName.trim()}>
              + Add Task
            </button>
          </div>

          {/* Add Dependency */}
          <div className="panel-section">
            <span className="section-title">Add Dependency</span>
            <select className="dash-select" value={parent} onChange={e => setParent(e.target.value)}>
              <option value="">↳ Parent task</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.data.label}</option>)}
            </select>
            <select className="dash-select" value={child} onChange={e => setChild(e.target.value)}>
              <option value="">↳ Child task</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.data.label}</option>)}
            </select>
            <button className="dash-btn btn-primary" onClick={addDependency} disabled={!parent || !child || parent === child}>
              Link Tasks
            </button>
          </div>

          {/* Controls hint */}
          <div style={{
            padding: "10px 12px",
            background: "rgba(56,189,248,0.04)",
            border: "1px solid rgba(56,189,248,0.08)",
            borderRadius: 10,
            fontSize: 11,
            color: "#334155",
            lineHeight: 1.7
          }}>
            <span style={{ color: "#38bdf8" }}>Click</span> to toggle complete<br />
            <span style={{ color: "#38bdf8" }}>Double-click</span> to delete node<br />
            <span style={{ color: "#38bdf8" }}>Click edge</span> to remove link
          </div>

          {/* Reset */}
          <button
            className="dash-btn btn-danger"
            style={{ marginTop: "auto" }}
            onClick={async () => {
              if (!window.confirm("Reset all tasks and dependencies?")) return;
              const nodeSnap = await getDocs(collection(db, "users", user.uid, "nodes"));
              const edgeSnap = await getDocs(collection(db, "users", user.uid, "edges"));
              await Promise.all([
                ...nodeSnap.docs.map(d => deleteDoc(doc(db, "users", user.uid, "nodes", d.id))),
                ...edgeSnap.docs.map(d => deleteDoc(doc(db, "users", user.uid, "edges", d.id))),
              ]);
              showToast("Board reset", "error");
            }}
          >
            Reset Board
          </button>
        </div>

        {/* ── GRAPH AREA ── */}
        <div style={{ flex: 1, position: "relative", background: "#020c1b" }}>
          {/* Subtle grid bg */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(rgba(56,189,248,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,0.025) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
            pointerEvents: "none"
          }} />

          {nodes.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">◈</div>
              <div className="empty-text">No tasks yet</div>
              <div className="empty-sub">Add your first task from the panel</div>
            </div>
          )}

          <ReactFlow
            nodes={styledNodes}
            edges={edges.map(e => ({
              ...e,
              type: "smoothstep",
              animated: true,
              style: { stroke: "rgba(56,189,248,0.5)", strokeWidth: 2 },
              markerEnd: { type: "arrowclosed", color: "rgba(56,189,248,0.5)" },
            }))}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
          >
            <MiniMap
              style={{ background: "rgba(2,8,23,0.9)", border: "1px solid rgba(56,189,248,0.1)", borderRadius: 10 }}
              nodeColor={n => n.data?.completed ? "#38bdf8" : isBlocked(n.id, edges, nodes) ? "#ef4444" : "#22c55e"}
              maskColor="rgba(2,8,23,0.6)"
            />
            <Controls style={{
              background: "rgba(2,8,23,0.8)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
            }} />
            <Background color="rgba(56,189,248,0.04)" gap={40} />
          </ReactFlow>
        </div>
      </div>

      {/* ── Toast Container ── */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"} {t.message}
          </div>
        ))}
      </div>
    </>
  );
}

export default App;