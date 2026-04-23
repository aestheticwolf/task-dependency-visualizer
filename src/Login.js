import React, { useState } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";

function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    if (!email || !password) {
      alert("Enter email and password");
      return;
    }
  
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      setUser(res.user);
    } catch (err) {
      alert(err.message);
    }
  };

  const signup = async () => {
    if (!email || !password) {
      alert("Enter email and password");
      return;
    }
  
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      setUser(res.user);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#0f172a"
    }}>
      <div style={{
        background: "#1e293b",
        padding: "30px",
        borderRadius: "12px",
        width: "340px",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
      }}>
        
        <h2 style={{ textAlign: "center", color: "white", marginBottom: "10px" }}>
          Task Visualizer
        </h2>

        <input
  type="email"
  placeholder="Email"
  value={email}
  onChange={e => setEmail(e.target.value)}
  style={{
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #334155",
    outline: "none",
    background: "#0f172a",
    color: "white",
    boxSizing: "border-box",
    transition: "0.2s"
  }}
  onFocus={e => e.target.style.border = "1px solid #3b82f6"}
onBlur={e => e.target.style.border = "1px solid #334155"}
/>

<input
  type="password"
  placeholder="Password"
  value={password}
  onChange={e => setPassword(e.target.value)}
  style={{
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #334155",
    outline: "none",
    background: "#0f172a",
    color: "white",
    boxSizing: "border-box",
    transition: "0.2s"
  }}
  onFocus={e => e.target.style.border = "1px solid #3b82f6"}
  onBlur={e => e.target.style.border = "1px solid #334155"}
/>

<button
  onClick={login}
  disabled={!email || !password}
  style={{
    padding: "10px",
    background: email && password ? "#3b82f6" : "#64748b",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: email && password ? "pointer" : "not-allowed",
    transition: "0.2s"
  }}
  onMouseOver={e => e.target.style.opacity = 0.8}
onMouseOut={e => e.target.style.opacity = 1}
>
  Login
</button>

<button
  onClick={signup}
  disabled={!email || !password}
  style={{
    padding: "10px",
    background: email && password ? "#22c55e" : "#64748b",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: email && password ? "pointer" : "not-allowed",
    transition: "0.2s"
  }}
  onMouseOver={e => e.target.style.opacity = 0.8}
  onMouseOut={e => e.target.style.opacity = 1}
>
  Signup
</button>

        <p style={{
  fontSize: "12px",
  color: "#94a3b8",
  textAlign: "center"
}}>
  New user? Signup first, then login
</p>

      </div>
    </div>
  );
}

export default Login;