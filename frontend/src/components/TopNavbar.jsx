import React from "react";
import { Search, Sun, Moon, Database } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function TopNavbar({ searchQuery, setSearchQuery, systemStatus }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="top-navbar" style={{ height: "70px", minHeight: "70px", padding: "0 28px" }}>
      {/* Global Search Bar */}
      <div style={{ position: "relative", width: "360px", maxWidth: "100%", display: "flex", alignItems: "center" }}>
        <span
          className="input-icon-left"
          style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2
          }}
        >
          <Search size={18} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search reviews, products, reviewers..."
          className="input-control has-left-icon"
          style={{
            height: "44px",
            minHeight: "44px",
            fontSize: "14px",
            paddingLeft: "42px",
            paddingTop: 0,
            paddingBottom: 0,
            lineHeight: "44px"
          }}
        />
      </div>

      {/* Right Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        {/* System Status Telemetry */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "999px",
            background: "var(--risk-low-bg)",
            border: "1px solid var(--risk-low-border)",
            color: "var(--risk-low)",
            fontSize: "13px",
            fontWeight: "600"
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--risk-low)", animation: "pulse 2s infinite" }} />
            <span>20 Rules Active</span>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "999px",
            background: "rgba(59, 130, 246, 0.12)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            color: "var(--accent-blue)",
            fontSize: "13px",
            fontWeight: "600"
          }}>
            <Database size={15} />
            <span>{systemStatus?.dbEngine || "Resilient Storage"}</span>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary"
          style={{ width: "42px", height: "42px", minHeight: "42px", padding: 0, borderRadius: "10px" }}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#6366F1" />}
        </button>
      </div>
    </header>
  );
}
