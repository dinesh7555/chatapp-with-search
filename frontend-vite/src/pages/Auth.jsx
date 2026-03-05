import { useState } from "react";
import { loginUser} from "../services/api";
import "./Auth.css";


export default function Auth({ onAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit() {
    const res = await loginUser({ username, password });

    if (res.access_token) {
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("role", res.role);
      onAuth();
    } else {
      alert(res.detail || "Login failed");
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
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