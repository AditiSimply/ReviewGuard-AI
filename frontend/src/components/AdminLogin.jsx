import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  ShieldCheck,
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Sun,
  Moon,
  ArrowLeft,
  KeyRound,
  Terminal,
  CheckCircle2
} from "lucide-react";

export default function AdminLogin({ onCancel, onLoginSuccess }) {
  const { login, isLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!identifier.trim()) {
      setErrorMessage("Please enter your administrator email or username.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your administrator password.");
      return;
    }

    const res = await login(identifier.trim(), password);
    if (!res.success) {
      setErrorMessage(res.error || "Authentication failed. Invalid credentials.");
      return;
    }

    if (res.user?.role !== "admin") {
      setErrorMessage("Access Denied: This account does not possess administrator privileges. Please log in with a designated administrator account.");
      return;
    }

    if (onLoginSuccess) {
      onLoginSuccess(res.user);
    }
  };

  return (
    <div style={{
      width: "100%",
      minHeight: "calc(100vh - 120px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px"
    }}>
      <div className="card animate-fade" style={{
        width: "100%",
        maxWidth: "520px",
        padding: "36px 32px",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border-medium)",
        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.25)"
      }}>
        {/* Header Icon & Title */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            margin: "0 auto 16px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #4F46E5, #8B5CF6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(99, 102, 241, 0.35)"
          }}>
            <KeyRound size={28} color="#FFF" />
          </div>

          <h2 style={{ fontSize: "24px", fontWeight: "800", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Admin Authentication Gate
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
            Enter verified administrator credentials to access rule configuration, user governance, audit telemetry, and review records.
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div style={{
            padding: "14px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--risk-very-high-bg)",
            border: "1px solid var(--risk-very-high-border)",
            color: "var(--risk-very-high)",
            fontSize: "14px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ flex: 1, lineHeight: "1.4" }}>
              <strong style={{ display: "block", marginBottom: "2px" }}>Authentication Error</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "var(--text-secondary)" }}>
              Admin Email or Username
            </label>
            <div style={{ position: "relative" }}>
              <User size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. admin@reviewguard.ai or admin"
                autoComplete="username"
                required
                className="input-control has-left-icon"
                style={{ height: "46px", fontSize: "14px" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "var(--text-secondary)" }}>
              Admin Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter administrator password"
                autoComplete="current-password"
                required
                className="input-control has-left-icon"
                style={{ height: "46px", fontSize: "14px", paddingRight: "44px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: "100%", height: "46px", fontSize: "15px", fontWeight: "700", marginTop: "8px" }}
          >
            {isLoading ? "Verifying Credentials..." : "Sign In to Admin Panel"}
          </button>
        </form>

        {/* Action Controls & Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)" }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              style={{ fontSize: "13px", padding: "8px 14px" }}
            >
              <ArrowLeft size={16} />
              <span>Return to Dashboard</span>
            </button>
          )}

          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            RBAC Protected • Bcrypt Hashed
          </span>
        </div>

        {/* Local Admin Account Provisioning Notice */}
        <div style={{
          marginTop: "20px",
          padding: "14px",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          fontSize: "12px",
          color: "var(--text-secondary)",
          lineHeight: "1.5"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--primary)", fontWeight: "700", marginBottom: "4px" }}>
            <Terminal size={14} />
            <span>Local Administrator Provisioning</span>
          </div>
          To provision or reset the primary administrator account locally, run:
          <code style={{
            display: "block",
            marginTop: "6px",
            padding: "6px 10px",
            background: "var(--bg-card)",
            borderRadius: "4px",
            fontFamily: "monospace",
            color: "var(--text-primary)",
            border: "1px solid var(--border-subtle)"
          }}>
            npm run seed (in backend/)
          </code>
        </div>
      </div>
    </div>
  );
}
