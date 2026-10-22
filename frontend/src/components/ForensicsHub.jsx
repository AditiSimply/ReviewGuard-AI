import React from "react";
import { FileText, Network, UserCheck, ShieldAlert } from "lucide-react";
import AnalysisResultCard from "./AnalysisResultCard";
import InvestigationView from "./InvestigationView";
import ReviewerAnalytics from "./ReviewerAnalytics";

export default function ForensicsHub({
  subTab = "report",
  setSubTab,
  report,
  onReanalyze,
  onViewReport
}) {
  const tabs = [
    {
      id: "report",
      label: "Detailed Forensic Report",
      icon: FileText,
      desc: "Comprehensive heuristic evidence and text forensic breakdown"
    },
    {
      id: "campaign",
      label: "Campaign & Duplicate Detection",
      icon: Network,
      desc: "Exact & near-duplicate matching, TF-IDF cosine similarity, and cluster analysis"
    },
    {
      id: "reviewer",
      label: "Reviewer Profiling",
      icon: UserCheck,
      desc: "Account submission history, rating distribution, and behavioral patterns"
    }
  ];

  return (
    <div className="space-y-6 animate-fade" style={{ width: "100%", maxWidth: "1360px", margin: "0 auto", padding: "24px 28px 48px" }}>
      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldAlert size={28} color="var(--primary)" />
            <span>Forensics Intelligence Hub</span>
          </h1>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginTop: "6px" }}>
            Deep-dive forensic evidence, cross-review duplicate matching, and reviewer behavioral intelligence.
          </p>
        </div>
      </div>

      {/* Clean Sub-tab Navigation */}
      <div style={{
        display: "flex",
        gap: "8px",
        background: "var(--bg-card)",
        padding: "6px",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-medium)",
        overflowX: "auto"
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              style={{
                flex: 1,
                minWidth: "200px",
                padding: "12px 18px",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: isActive ? "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: isActive ? "0 2px 8px rgba(99, 102, 241, 0.15), inset 0 0 0 1px var(--primary)" : "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                transition: "all var(--transition-fast)",
                textAlign: "left"
              }}
            >
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: isActive ? "var(--primary)" : "var(--bg-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isActive ? "#FFF" : "var(--text-muted)",
                flexShrink: 0
              }}>
                <Icon size={18} />
              </div>
              <div style={{ overflow: "hidden" }}>
                <span style={{ fontSize: "15px", fontWeight: "700", display: "block", color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  {tab.label}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {tab.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Subtab Views */}
      <div>
        {subTab === "report" && (
          <AnalysisResultCard report={report} onReanalyze={onReanalyze} />
        )}

        {subTab === "campaign" && (
          <InvestigationView onViewReport={onViewReport} />
        )}

        {subTab === "reviewer" && (
          <ReviewerAnalytics onViewReport={onViewReport} />
        )}
      </div>
    </div>
  );
}
