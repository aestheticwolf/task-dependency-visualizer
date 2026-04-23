import React, { useState, useEffect, useRef } from "react";
import ReactFlow from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { db } from "./firebase";

import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Login from "./Login";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc, 
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { MiniMap, Controls, Background } from "reactflow";


// Build graph from edges
function buildGraph(edges) {
  const graph = {};
  edges.forEach(e => {
    if (!graph[e.source]) graph[e.source] = [];
    graph[e.source].push(e.target);
  });
  return graph;
}

// DFS cycle detection
function hasCycle(graph) {
  let visited = new Set();
  let stack = new Set();

  function dfs(node) {
    if (stack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    stack.add(node);

    for (let n of graph[node] || []) {
      if (dfs(n)) return true;
    }

    stack.delete(node);
    return false;
  }

  return Object.keys(graph).some(dfs);
}

// Check blocked
function isBlocked(taskId, edges, nodes) {
  const parents = edges
    .filter(e => e.target === taskId)
    .map(e => e.source);

  return parents.some(p => {
    const parent = nodes.find(n => n.id === p);
    return parent && parent.data.completed !== true;
  });
}


const nodeWidth = 150;
const nodeHeight = 50;

function getLayoutedElements(nodes, edges) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "LR" }); // left → right

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - nodeWidth / 2,
        y: pos.y - nodeHeight / 2
      }
    };
  });

  return { nodes: newNodes, edges };
}

function App() {
  const [nodes, setNodes] = useState([]);
  
  const [edges, setEdges] = useState([]);

  const [search, setSearch] = useState("");

  const [user, setUser] = useState(null);

  // const deleteNode = async (nodeId) => {
  //   const nodeSnap = await getDocs(collection(db, "users", user.uid, "nodes"));

  const deleteNode = async (nodeId) => {
    const nodeSnap = await getDocs(collection(db, "users", user.uid, "nodes"));
    const edgeSnap = await getDocs(collection(db, "users", user.uid, "edges"));
  
    await Promise.all(
      nodeSnap.docs.map(async (d) => {
        if (d.data().id === nodeId) {
          await deleteDoc(doc(db, "users", user.uid, "nodes", d.id));
        }
      })
    );
  
    edgeSnap.forEach(async (d) => {
      if (d.data().source === nodeId || d.data().target === nodeId) {
        await deleteDoc(doc(db, "users", user.uid, "edges", d.id));
      }
    });
  };
  

  const [taskName, setTaskName] = useState("");
  const [parent, setParent] = useState("");
  const [child, setChild] = useState("");

  
  const addTask = async () => {
    if (!taskName) return;
  
    const newNode = {
      id: Date.now().toString(),
      data: { label: taskName, completed: false },
      position: { x: Math.random() * 400, y: Math.random() * 400 }
    };
  
    await addDoc(collection(db, "users", user.uid, "nodes"), newNode);
  
    // setEdges(newEdges);
    setTaskName("");
  };

  const addDependency = async () => {
    if (!parent || !child || parent === child) return;
  
    const exists = edges.some(
      e => e.source === parent && e.target === child
    );
  
    if (exists) {
      alert("Dependency already exists!");
      return;
    }
  
    const newEdge = {
      id: `e${parent}-${child}`,
      source: parent,
      target: child,
      animated: true
    };
  
    const newEdges = [...edges, newEdge];
  
    const graph = buildGraph(newEdges);
  
    if (hasCycle(graph)) {
      alert("Cycle detected!");
      return;
    }
  
    await addDoc(collection(db, "users", user.uid, "edges"), newEdge);

    
setParent("");
setChild("");
  
    // setEdges(newEdges);
  };

  const styledNodes = nodes
  .filter(n =>
    n.data.label.toLowerCase().includes(search.toLowerCase())
  )
  .map(n => {
    let bg = "lightgreen";

    if (n.data.completed) bg = "lightblue";
    else if (isBlocked(n.id, edges, nodes)) bg = "lightcoral";

    const isMatch = n.data.label
      .toLowerCase()
      .includes(search.toLowerCase());

      return {
        ...n,
        title: isBlocked(n.id, edges, nodes)
          ? "Blocked by dependency"
          : "Ready",
        style: {
          background: bg,
          padding: 10,
          borderRadius: "8px",
          border: isMatch
  ? "2px solid yellow"
  : !n.data.completed && !isBlocked(n.id, edges, nodes)
  ? "2px solid #22c55e"
  : "1px solid #ccc",
          transition: "all 0.3s ease"
        }
      };
  });

  const clickTimeout = useRef(null);


  const onNodeClick = (event, node) => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
  
      if (window.confirm("Delete this task?")) {
        deleteNode(node.id);
      }
    } else {
      clickTimeout.current = setTimeout(async () => {
        const nodeSnap = await getDocs(
          collection(db, "users", user.uid, "nodes")
        );
  
        const docToUpdate = nodeSnap.docs.find(
          (d) => d.data().id === node.id
        );
  
        if (docToUpdate) {
          await updateDoc(
            doc(db, "users", user.uid, "nodes", docToUpdate.id),
            {
              "data.completed":
                !docToUpdate.data().data.completed
            }
          );
        }
  
        clickTimeout.current = null;
      }, 250);
    }
  };

  const onEdgeClick = async (event, edge) => {
    if (!window.confirm("Delete this dependency?")) return;
  
    const edgeSnap = await getDocs(
      collection(db, "users", user.uid, "edges")
    );
  
    await Promise.all(
      edgeSnap.docs.map(async (d) => {
        if (d.data().id === edge.id) {
          await deleteDoc(doc(db, "users", user.uid, "edges", d.id));
        }
      })
    );
  };


  const totalTasks = nodes.length;

const completedTasks = nodes.filter(n => n.data.completed).length;

const blockedTasks = nodes.filter(n =>
  !n.data.completed && isBlocked(n.id, edges, nodes)
).length;

const readyTasks = nodes.filter(n =>
  !n.data.completed && !isBlocked(n.id, edges, nodes)
).length;

useEffect(() => {
  setNodes(prevNodes => {
    const layouted = getLayoutedElements(prevNodes, edges);
    return layouted.nodes;
  });
}, [edges]);


useEffect(() => {
  if (!user) return;

  const unsubNodes = onSnapshot(
    collection(db, "users", user.uid, "nodes"),
    (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setNodes(data);
    }
  );

  const unsubEdges = onSnapshot(
    collection(db, "users", user.uid, "edges"),
    (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setEdges(data);
    }
  );

  return () => {
    unsubNodes();
    unsubEdges();
  };
}, [user]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  
    return () => unsub();
  }, []);


  if (!user) return <Login setUser={setUser} />;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial" }}>

      
      {/* LEFT PANEL */}
      <div style={{
        width: "280px",
        padding: "20px",
        background: "#0f172a",
        color: "white",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        alignItems: "stretch"
      }}>
        
        <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
}}>
  <h2 style={{ fontWeight: "600" }}>Task Manager</h2>

  <button
    onClick={() => signOut(auth)}
    style={{
      padding: "6px 10px",
      background: "#ef4444",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
      transition: "0.2s"
    }}
    onMouseOver={e => e.target.style.opacity = 0.8}
    onMouseOut={e => e.target.style.opacity = 1}
  >
    Logout
  </button>
</div>

        <p style={{ fontSize: "12px", opacity: 0.7 }}>
  Click = Complete | Double Click = Delete
</p>
      
        <div style={{
  background: "#1e293b",
  padding: "12px",
  borderRadius: "10px"
}}>
  <p>Total: {totalTasks}</p>

  <p>Dependencies: {edges.length}</p>

  <p style={{ color: "#22c55e" }}>Completed: {completedTasks}</p>
  <p style={{ color: "#ef4444" }}>Blocked: {blockedTasks}</p>
  <p style={{ color: "#facc15" }}>Ready: {readyTasks}</p>
</div>

<div style={{
  background: "#1e293b",
  padding: "12px",
  borderRadius: "10px"
}}>
  <h4 style={{ margin: "0 0 8px 0" }}>Search</h4>

  <input
    type="text"
    placeholder="Search task..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{
      width: "100%",
      padding: "8px",
      borderRadius: "6px",
      border: "none"
    }}
  />
</div>
  
<div style={{
  background: "#1e293b",
  padding: "12px",
  borderRadius: "10px"
}}>
  <h4 style={{ margin: "0 0 8px 0" }}>Add Task</h4>
          <input
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "6px",
              border: "none"
            }}
            type="text"
            placeholder="Task name"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
          <button
            style={{
              width: "100%",
              padding: "8px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              transition: "0.2s"
            }}
            onMouseOver={e => e.target.style.opacity = 0.8}
            onMouseOut={e => e.target.style.opacity = 1}

            onClick={addTask}
          >
            Add Task
          </button>
        </div>
  
        <div style={{
  background: "#1e293b",
  padding: "12px",
  borderRadius: "10px"
}}>
  <h4 style={{ margin: "0 0 8px 0" }}>Add Dependency</h4>
  
          <select
  style={{
    width: "100%",
    padding: "8px",
    marginBottom: "8px",
    borderRadius: "6px",
    border: "none"
  }}
            onChange={(e) => setParent(e.target.value)}
          >
            <option value="">Parent Task</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.data.label}
              </option>
            ))}
          </select>
  
          <select
  style={{
    width: "100%",
    padding: "8px",
    marginBottom: "8px",
    borderRadius: "6px",
    border: "none"
  }}
            onChange={(e) => setChild(e.target.value)}
          >
            <option value="">Child Task</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.data.label}
              </option>
            ))}
          </select>
  
          <button
  style={{
    width: "100%",
    padding: "8px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    transition: "0.2s"
  }}
  onMouseOver={e => e.target.style.opacity = 0.8}
  onMouseOut={e => e.target.style.opacity = 1}
  onClick={addDependency}
>
  Add Dependency
</button>
        </div>
  
        <button
          style={{
            marginTop: "auto",
            padding: "10px",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            transition: "0.2s"
          }}

          
onMouseOver={e => e.target.style.opacity = 0.8}
onMouseOut={e => e.target.style.opacity = 1}
          onClick={async () => {
            const nodeSnap = await getDocs(collection(db, "users", user.uid, "nodes"));
            const edgeSnap = await getDocs(collection(db, "users", user.uid, "edges"));
          
            nodeSnap.forEach(async (d) => {
              await deleteDoc(doc(db, "users", user.uid, "nodes", d.id));
            });
          
            edgeSnap.forEach(async (d) => {
              await deleteDoc(doc(db, "users", user.uid, "edges", d.id));
            });
          }}
        >
          Reset All
        </button>
  
      </div>
  
      {/* GRAPH */}
      <div style={{ flex: 1, background: "#e2e8f0", position: "relative" }}>
      
      {nodes.length === 0 && (
  <div style={{
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    color: "#64748b",
    fontSize: "18px"
  }}>
    No tasks yet. Add your first task.
  </div>
)}
      
      <ReactFlow 
  nodes={styledNodes} 
  edges={edges.map(e => ({ ...e, type: "smoothstep", animated: true,
    style: { stroke: "#60a5fa", strokeWidth: 2 } }))} 
  onNodeClick={onNodeClick}
  onEdgeClick={onEdgeClick}
  // onNodeDoubleClick={onNodeDoubleClick}
  fitView
>
  <MiniMap />
  <Controls />
  <Background />
</ReactFlow>
      </div>
    </div>
  );
}

export default App;