import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  ShieldCheck,
  Shield,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  Sun,
  Moon,
  ArrowRight,
  ArrowLeft,
  Cpu,
  Network,
  Activity,
  CheckCircle2,
  TrendingUp,
  Fingerprint,
  UserPlus
} from "lucide-react";

export default function LoginPage({ onCancel, onLoginSuccess }) {
  const { login, register, isLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState("login");

  // Login form state (clean, no hardcoded passwords)
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Messages
  const [localError, setLocalError] = useState("");
  const [localSuccess, setLocalSuccess] = useState("");

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setLocalSuccess("");

    if (!identifier.trim()) {
      setLocalError("Please enter your email or username.");
      return;
    }
    if (!password) {
      setLocalError("Please enter your password.");
      return;
    }

    const res = await login(identifier.trim(), password);
    if (!res.success) {
      setLocalError(res.error || "Authentication failed. Check your credentials.");
    } else if (onLoginSuccess) {
      onLoginSuccess(res.user);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setLocalSuccess("");

    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setLocalError("All required registration fields must be provided.");
      return;
    }

    if (regPassword.length < 6) {
      setLocalError("Password must be at least 6 characters long.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setLocalError("Passwords do not match. Please re-enter matching passwords.");
      return;
    }

    const res = await register({
      username: regUsername.trim(),
      email: regEmail.trim(),
      password: regPassword,
      name: regName.trim() || regUsername.trim()
    });

    if (!res.success) {
      setLocalError(res.error || "Registration failed. Please try again.");
    } else {
      setLocalSuccess(res.message || "Account registered successfully!");
      if (onLoginSuccess) {
        onLoginSuccess(res.user);
      }
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Top Application Header */}
      <header className="login-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #4F46E5, #06B6D4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)"
          }}>
            <ShieldCheck size={22} color="#FFF" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "17px", fontWeight: "800", letterSpacing: "-0.02em" }}>ReviewGuard AI</span>
              <span className="badge badge-low" style={{ fontSize: "10px", padding: "2px 8px" }}>v2.4 Live</span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Intelligent Review Forensics & Fake Detection</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {onCancel && (
            <button
              onClick={onCancel}
              className="btn btn-secondary"
              style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
              title="Return to ReviewGuard AI application"
            >
              <ArrowLeft size={16} />
              <span>Return to Application</span>
            </button>
          )}

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "4px 12px",
            borderRadius: "999px",
            background: "var(--risk-low-bg)",
            border: "1px solid var(--risk-low-border)",
            color: "var(--risk-low)",
            fontSize: "12px",
            fontWeight: "600"
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--risk-low)" }} />
            <span>Backend Online (Port 5000)</span>
          </div>

          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{ padding: "8px 12px", borderRadius: "8px" }}
            title="Toggle Dark/Light Mode"
          >
            {isDark ? <Sun size={16} color="#F59E0B" /> : <Moon size={16} color="#6366F1" />}
            <span style={{ fontSize: "12px" }}>{isDark ? "Light" : "Dark"}</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="login-main">
        <div className="login-grid">
          {/* Left Column: Academic & System Highlights */}
          <div className="login-info-col">
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 12px",
              borderRadius: "999px",
              background: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              color: "var(--primary)",
              fontSize: "12px",
              fontWeight: "700",
              width: "fit-content"
            }}>
              <Sparkles size={14} />
              <span>Academic Engineering Capstone Project</span>
            </div>

            <div>
              <h1 style={{ fontSize: "38px", fontWeight: "900", letterSpacing: "-0.03em", lineHeight: "1.2", margin: "0 0 14px" }}>
                Intelligent Review <br />
                <span style={{
                  background: "linear-gradient(135deg, #38BDF8 0%, #818CF8 50%, #C084FC 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}>
                  Forensics & Fake Detection
                </span>
              </h1>
              <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.6", margin: 0, maxWidth: "620px" }}>
                A production-grade, explainable cybersecurity forensic system auditing consumer product feedback 
                via 20 empirical detection rules, TF-IDF cosine similarity clustering, temporal burst wave detection, 
                and longitudinal reviewer profiling.
              </p>
            </div>

            {/* 4 Feature Architecture Cards */}
            <div className="grid-2">
              <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary)", fontWeight: "700", fontSize: "13px" }}>
                  <Cpu size={16} />
                  <span>20 Heuristic Rules</span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                  Multi-family correlation dampening across Lexical, Content, Rating, Sentiment, and Metadata.
                </p>
              </div>

              <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-cyan)", fontWeight: "700", fontSize: "13px" }}>
                  <Network size={16} />
                  <span>TF-IDF Cluster Graph</span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                  Cosine similarity matrix, 3-gram Jaccard index, and interactive relationship network.
                </p>
              </div>

              <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--risk-low)", fontWeight: "700", fontSize: "13px" }}>
                  <TrendingUp size={16} />
                  <span>Temporal Burst Waves</span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                  Rolling 24h & 7d velocity spike detection exposing coordinated promotional campaigns.
                </p>
              </div>

              <div className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-purple)", fontWeight: "700", fontSize: "13px" }}>
                  <Fingerprint size={16} />
                  <span>Reviewer Fingerprinting</span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                  Rating variance (StdDev), template duplication history, and catalogue integrity check.
                </p>
              </div>
            </div>

            {/* Badges footer */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", fontSize: "12px", color: "var(--text-muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={14} color="var(--risk-low)" /> AFINN Sentiment with Negation Scope
              </span>
              <span>•</span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={14} color="var(--risk-low)" /> Explainable Heuristic Forensics
              </span>
              <span>•</span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={14} color="var(--risk-low)" /> Dual CSV Forensic Export
              </span>
            </div>
          </div>

          {/* Right Column: Authentication Terminal */}
          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <div className="login-card">
              {/* Mode Switcher Tabs */}
              <div style={{
                display: "flex",
                background: "var(--bg-surface)",
                padding: "4px",
                borderRadius: "var(--radius-md)",
                marginBottom: "20px",
                border: "1px solid var(--border-medium)"
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setLocalError("");
                    setLocalSuccess("");
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "none",
                    background: authMode === "login" ? "var(--bg-card)" : "transparent",
                    color: authMode === "login" ? "var(--text-primary)" : "var(--text-muted)",
                    fontWeight: authMode === "login" ? "700" : "500",
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: authMode === "login" ? "var(--shadow-sm)" : "none",
                    transition: "all var(--transition-fast)"
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setLocalError("");
                    setLocalSuccess("");
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "none",
                    background: authMode === "register" ? "var(--bg-card)" : "transparent",
                    color: authMode === "register" ? "var(--text-primary)" : "var(--text-muted)",
                    fontWeight: authMode === "register" ? "700" : "500",
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: authMode === "register" ? "var(--shadow-sm)" : "none",
                    transition: "all var(--transition-fast)"
                  }}
                >
                  Create Account
                </button>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 6px" }}>
                  {authMode === "login" ? "Sign In to ReviewGuard AI" : "Register Forensic Analyst"}
                </h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                  {authMode === "login"
                    ? "Enter your credentials to access role-protected features and the Admin Panel."
                    : "Create a new Analyst account to run analyses, export reports, and inspect forensics."}
                </p>
              </div>

              {/* Status Alerts */}
              {localError && (
                <div style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--risk-very-high-bg)",
                  border: "1px solid var(--risk-very-high-border)",
                  color: "var(--risk-very-high)",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px"
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{localError}</span>
                </div>
              )}

              {localSuccess && (
                <div style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--risk-low-bg)",
                  border: "1px solid var(--risk-low-border)",
                  color: "var(--risk-low)",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px"
                }}>
                  <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                  <span>{localSuccess}</span>
                </div>
              )}

              {/* LOGIN FORM */}
              {authMode === "login" && (
                <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>
                      Email or Username
                    </label>
                    <div style={{ position: "relative" }}>
                      <User size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. admin@reviewguard.ai or analyst"
                        autoComplete="username"
                        required
                        className="has-left-icon"
                        style={{ height: "46px" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>
                      Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <Lock size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your account password"
                        autoComplete="current-password"
                        required
                        className="has-left-icon"
                        style={{ height: "46px", paddingRight: "44px" }}
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
                          cursor: "pointer"
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary"
                    style={{ width: "100%", height: "46px", fontSize: "15px", marginTop: "6px" }}
                  >
                    {isLoading ? "Authenticating..." : "Sign In"}
                  </button>
                </form>
              )}

              {/* REGISTRATION FORM */}
              {authMode === "register" && (
                <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Maya Chen"
                      style={{ height: "44px" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>
                      Username *
                    </label>
                    <div style={{ position: "relative" }}>
                      <User size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="e.g. mayachen"
                        autoComplete="username"
                        required
                        className="has-left-icon"
                        style={{ height: "44px" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>
                      Email Address *
                    </label>
                    <div style={{ position: "relative" }}>
                      <Mail size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="e.g. analyst@example.com"
                        autoComplete="email"
                        required
                        className="has-left-icon"
                        style={{ height: "44px" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>
                      Password (min 6 characters) *
                    </label>
                    <div style={{ position: "relative" }}>
                      <Lock size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input
                        type={showRegPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Enter a secure password"
                        autoComplete="new-password"
                        required
                        className="has-left-icon"
                        style={{ height: "44px", paddingRight: "44px" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer"
                        }}
                      >
                        {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: "var(--text-secondary)" }}>
                      Confirm Password *
                    </label>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-type password"
                      autoComplete="new-password"
                      required
                      style={{ height: "44px" }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary"
                    style={{ width: "100%", height: "46px", fontSize: "15px", marginTop: "8px" }}
                  >
                    {isLoading ? "Creating Account..." : "Register Analyst Account"}
                  </button>
                </form>
              )}

              {/* Secure Provisioning Notice */}
              <div style={{
                marginTop: "20px",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                fontSize: "12px",
                color: "var(--text-muted)",
                lineHeight: "1.5"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--primary)", fontWeight: "700", marginBottom: "4px" }}>
                  <Shield size={14} />
                  <span>Administrative Governance Notice</span>
                </div>
                Self-service registration provisions <strong>Analyst</strong> permissions. 
                Administrator accounts are managed via the Admin Panel or provisioned locally via the command:
                <code style={{ display: "block", marginTop: "4px", padding: "4px 8px", background: "var(--bg-card)", borderRadius: "4px", color: "var(--text-primary)" }}>
                  npm run seed (in backend)
                </code>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
