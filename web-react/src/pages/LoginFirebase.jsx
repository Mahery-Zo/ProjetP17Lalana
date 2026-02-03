import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import "./login_firebase.css";

export default function LoginFirebase() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setMsg("");

    try {
      await login(email, password);
      setMsg("✅ Logged in successfully");
      navigate("/dashboard");
    } catch (err) {
      setMsg("❌ " + (err?.message || "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to continue</p>

        <div className="input-group">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Email</label>
        </div>

        <div className="input-group">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <label>Password</label>
        </div>

        <button className="login-btn" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>

        {msg && <p className={`msg ${msg.startsWith("✅") ? "ok" : "err"}`}>{msg}</p>}
      
      <p className="auth-link">
                  Pas de compte ? <Link to="/register">S'inscrire</Link>
                </p>
       
      </form>

         

    </div>
  );
}
