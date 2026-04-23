import { useState, useEffect } from "react";
import { loginUser } from "../services/api";
import "./Auth.css";

export default function Auth({ onAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (localStorage.getItem("sessionExpired")) {
      setErrorMsg("Your session has expired. Please login again.");
      localStorage.removeItem("sessionExpired");
    }
  }, []);

  async function handleSubmit() {
    const res = await loginUser({ username, password });

    if (res.access_token) {
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("role", res.role);
      localStorage.setItem("username", username);
      onAuth();
    } else {
      alert(res.detail || "Login failed");
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        
        {errorMsg && (
          <div style={{
            background: "#fef2f2",
            color: "#dc2626",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "1rem",
            fontSize: "14px",
            border: "1px solid #f87171"
          }}>
            {errorMsg}
          </div>
        )}

        <input
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleSubmit}>
          Login
        </button>
      </div>
    </div>
  );
}