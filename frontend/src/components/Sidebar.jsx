import React from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  SearchCode,
  ShieldAlert,
  History,
  Layers,
  UserCheck,
  Sparkles
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab }) {

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "analyze", label: "Analyse Review", icon: SearchCode },
    { id: "forensics", label: "Forensics", icon: ShieldAlert },
    { id: "history", label: "Review History", icon: History },
    { id: "batch", label: "Batch Analysis", icon: Layers },
    { id: "reviewer", label: "Reviewer Analytics", icon: UserCheck },
    { id: "admin", label: "Admin Panel", icon: ShieldCheck, badge: "Admin" }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "4px 8px 18px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "20px" }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #4F46E5, #06B6D4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(79, 70, 229, 0.35)",
          flexShrink: 0
        }}>
          <ShieldCheck size={22} color="#FFF" />
        </div>
        <div style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "17px", fontWeight: "800", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>ReviewGuard</span>
            <span style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "var(--primary)",
              background: "rgba(99, 102, 241, 0.15)",
              padding: "2px 6px",
              borderRadius: "4px"
            }}>AI</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0" }}>
            Review Forensics System
          </p>
        </div>
      </div>

      {/* Navigation Links - All 7 tabs directly visible */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, overflowY: "auto" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Icon size={18} color={isActive ? "var(--primary)" : "var(--text-muted)"} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: "10px",
                  fontWeight: "800",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: "rgba(139, 92, 246, 0.2)",
                  color: "var(--accent-purple)",
                  border: "1px solid rgba(139, 92, 246, 0.3)",
                  textTransform: "uppercase"
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Methodology Card */}
      <div style={{
        padding: "14px 16px",
        margin: "16px 0",
        borderRadius: "10px",
        background: "rgba(99, 102, 241, 0.08)",
        border: "1px solid rgba(99, 102, 241, 0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--primary)", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>
          <Sparkles size={15} />
          <span>Explainable Forensics</span>
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
          Rule-based risk assessment with anti-double-counting correlation dampening.
        </p>
      </div>

      {/* System Status Footer */}
      <div style={{
        paddingTop: "14px",
        borderTop: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--risk-low)",
            flexShrink: 0
          }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <p style={{ fontSize: "12px", fontWeight: "700", margin: 0, color: "var(--text-primary)" }}>
              Engine v2.4.0 Active
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
              20 Detection Rules Active
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
