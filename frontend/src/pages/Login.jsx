import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("demo@velora.test");
  const [password, setPassword] = useState("Demo@123");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const next = location.state?.from || "/";

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const user = await login(email, password);
      notify(`Welcome back, ${user.name.split(" ")[0]}`);
      navigate(user.role === "admin" ? "/admin" : next);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container auth-layout">
      <div>
        <div className="page-head">
          <p className="eyebrow">Account</p>
          <h1>Sign in.</h1>
        </div>
        <p className="lede">Your bag follows you — Context API keeps it in one place, whether you are on the shop or at checkout.</p>
      </div>
      <form className="card auth-card form" onSubmit={submit}>
        <div className="hint">
          Customer: demo@velora.test / Demo@123<br />
          Admin: admin@velora.test / Admin@123
        </div>
        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={saving}>{saving ? "Signing in…" : "Sign in"}</button>
        <p>New here? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
