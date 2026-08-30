import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./auth-context";
import "./login.css";

export function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signIn({ email, password, remember });
      const destination = (location.state as { from?: string } | null)?.from ?? "/dashboard";
      navigate(destination, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-brand-panel" aria-label="Emma Healthcare">
        <div className="login-brand"><span>◒</span> EMMA</div>
        <h1>Empowering better<br />maternal healthcare.</h1>
        <footer><span>© 2026 Emma Healthcare Platform</span><span>Privacy &nbsp;&nbsp; Terms</span></footer>
      </section>
      <main className="login-form-panel">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <header>
            <h2>Welcome Back</h2>
            <p>Sign in to manage the Emma healthcare platform.</p>
          </header>
          <label>
            Email address
            <span className="login-input"><Mail aria-hidden="true" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" autoComplete="email" required /></span>
          </label>
          <label>
            Password
            <span className="login-input"><LockKeyhole aria-hidden="true" /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••••••" autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</button></span>
          </label>
          <div className="login-options"><label className="remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Remember me</label><button type="button" className="text-button">Forgot password?</button></div>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="sign-in-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign In →"}</button>
          <p className="secure-note"><ShieldCheck aria-hidden="true" /> Secure administrator access</p>
        </form>
      </main>
    </div>
  );
}
