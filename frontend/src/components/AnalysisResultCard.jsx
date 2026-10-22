import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  RefreshCw,
  Info
} from "lucide-react";

const ALL_20_RULES = [
  { id: "RULE_01", name: "Rating-Sentiment Inconsistency", group: "Sentiment & Polarity", severity: "High", defaultWeight: 20 },
  { id: "RULE_02", name: "Promotional and Spam Language", group: "Commercial & Promotional", severity: "High", defaultWeight: 18 },
  { id: "RULE_03", name: "Repeated Words and Phrases", group: "Syntactic & Lexical", severity: "Medium", defaultWeight: 14 },
  { id: "RULE_04", name: "Excessive Capitalization", group: "Stylometric & Punctuation", severity: "Low", defaultWeight: 10 },
  { id: "RULE_05", name: "Excessive Punctuation Marks", group: "Stylometric & Punctuation", severity: "Low", defaultWeight: 8 },
  { id: "RULE_06", name: "Hollow & Generic Superlatives", group: "Linguistic & Rhetorical", severity: "Medium", defaultWeight: 14 },
  { id: "RULE_07", name: "Low-Information Generic Review", group: "Linguistic & Rhetorical", severity: "Medium", defaultWeight: 12 },
  { id: "RULE_08", name: "Absolute & Unrealistic Claims", group: "Linguistic & Rhetorical", severity: "Medium", defaultWeight: 12 },
  { id: "RULE_09", name: "Keyword Stuffing & Product Over-Mention", group: "Commercial & Promotional", severity: "High", defaultWeight: 15 },
  { id: "RULE_10", name: "Incompatible Category Terms", group: "Domain & Contextual", severity: "High", defaultWeight: 16 },
  { id: "RULE_11", name: "Reviewer Uniform Rating History", group: "Behavioral & Profile", severity: "Medium", defaultWeight: 12 },
  { id: "RULE_12", name: "Reviewer Extreme Velocity Burst", group: "Temporal & Behavioral", severity: "High", defaultWeight: 18 },
  { id: "RULE_13", name: "Call-to-Action Directives", group: "Commercial & Promotional", severity: "High", defaultWeight: 16 },
  { id: "RULE_14", name: "Unusual Review-Length Patterns", group: "Stylometric & Structural", severity: "Low", defaultWeight: 8 },
  { id: "RULE_15", name: "Exact Duplicate Reviews", group: "Syndication & Duplication", severity: "Critical", defaultWeight: 35 },
  { id: "RULE_16", name: "Near-Duplicate Reviews", group: "Syndication & Duplication", severity: "High", defaultWeight: 24 },
  { id: "RULE_17", name: "Repeated Templates Across Products", group: "Syndication & Duplication", severity: "High", defaultWeight: 22 },
  { id: "RULE_18", name: "Excessive Reviewer Rating Deviation", group: "Behavioral & Profile", severity: "Medium", defaultWeight: 14 },
  { id: "RULE_19", name: "Product Review Velocity Burst", group: "Temporal & Campaign", severity: "High", defaultWeight: 20 },
  { id: "RULE_20", name: "Cross-Reviewer High-Similarity Language", group: "Syndication & Duplication", severity: "High", defaultWeight: 22 }
];

export default function AnalysisResultCard({ report, onReanalyze }) {
  const [copied, setCopied] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [ruleFilterMode, setRuleFilterMode] = useState("all");

  if (!report) {
    return (
      <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
        <FileText size={48} style={{ margin: "0 auto 16px", color: "var(--primary)", opacity: 0.6 }} />
        <h3 className="section-title" style={{ margin: "0 0 8px", color: "var(--text-primary)" }}>No Forensic Report Loaded</h3>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)", margin: 0 }}>
          Submit a review via the Review Analyser or select an existing record from History to view its detailed forensic deep-dive.
        </p>
      </div>
    );
  }

  const {
    _id,
    product_name,
    product_id,
    category,
    reviewer_name,
    reviewer_id,
    rating,
    headline,
    review_text = "",
    platform,
    review_date,
    risk_score = 0,
    risk_level = "Low",
    assessment = "Appears Genuine",
    rule_engine_version = "2.4.0",
    sentiment_analysis = {},
    triggered_rules = [],
    lexical_metrics = {},
    highlighted_phrases = [],
    duplicate_forensics = {},
    reviewer_forensics = {},
    all_rules_audit = []
  } = report;

  const computedRulesAudit = (all_rules_audit && all_rules_audit.length > 0)
    ? all_rules_audit
    : ALL_20_RULES.map(rule => {
        const match = (triggered_rules || []).find(tr => (tr.rule_id || tr.id) === rule.id);
        if (match) {
          return {
            rule_id: rule.id,
            name: rule.name,
            group: rule.group,
            severity: match.severity || rule.severity,
            base_weight: match.base_weight || rule.defaultWeight,
            enabled: true,
            triggered: true,
            effective_contribution: match.effective_contribution || match.base_weight || rule.defaultWeight,
            damping_factor: match.damping_factor || 1.0,
            evidence: match.evidence || "Suspicious pattern matched rule criteria.",
            explanation: match.explanation || "Rule triggered based on heuristic criteria."
          };
        }
        return {
          rule_id: rule.id,
          name: rule.name,
          group: rule.group,
          severity: rule.severity,
          base_weight: rule.defaultWeight,
          enabled: true,
          triggered: false,
          effective_contribution: 0,
          damping_factor: 1.0,
          evidence: "No anomalous pattern observed; review characteristics meet baseline organic standards.",
          explanation: "Empirical heuristic test passed."
        };
      });

  const handleCopySummary = () => {
    const summary = `ReviewGuard AI Forensic Report [${_id || "NEW"}]
Product: ${product_name} (${category})
Reviewer: ${reviewer_name} | Rating: ${rating}★
Risk Score: ${risk_score}/100 [${risk_level.toUpperCase()} RISK — ${assessment}]
Sentiment: ${sentiment_analysis.label || "N/A"} (Rating Consistency: ${sentiment_analysis.rating_consistency?.is_consistent ? "Consistent" : "Mismatch"})
Triggered Heuristics: ${triggered_rules.length} rules
Duplicate Status: ${duplicate_forensics.is_exact_duplicate ? "Exact Duplicate" : duplicate_forensics.is_near_duplicate ? "Near Duplicate" : "Unique"}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reviewguard_forensic_report_${_id || Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to render highlighted text
  const renderHighlightedReview = () => {
    if (!review_text) return null;
    if (!highlighted_phrases || highlighted_phrases.length === 0) {
      return <p style={{ fontSize: "15px", lineHeight: "1.7", color: "var(--text-primary)", margin: 0 }}>{review_text}</p>;
    }

    const escapedPhrases = highlighted_phrases
      .map(p => (typeof p === "string" ? p : p.phrase))
      .filter(Boolean)
      .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

    if (escapedPhrases.length === 0) {
      return <p style={{ fontSize: "15px", lineHeight: "1.7", color: "var(--text-primary)", margin: 0 }}>{review_text}</p>;
    }

    const regex = new RegExp(`(${escapedPhrases.join("|")})`, "gi");
    const parts = review_text.split(regex);

    return (
      <p style={{ fontSize: "15px", lineHeight: "1.7", color: "var(--text-primary)", margin: 0 }}>
        {parts.map((part, i) => {
          const match = highlighted_phrases.find(
            p => (typeof p === "string" ? p : p.phrase).toLowerCase() === part.toLowerCase()
          );
          if (match) {
            return (
              <mark
                key={i}
                style={{
                  background: "rgba(244, 63, 94, 0.2)",
                  color: "#FDA4AF",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  borderBottom: "2px solid #F43F5E",
                  fontWeight: "600"
                }}
              >
                {part}
              </mark>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    );
  };

  return (
    <div className="space-y-6 animate-fade">
      {/* Action Bar */}
      <div className="card" style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "14px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-secondary)" }}>
            Forensic Report:
          </span>
          <span className="font-mono" style={{ fontSize: "14px", color: "var(--primary)", fontWeight: "700" }}>
            {_id || "Active Review"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={handleCopySummary}
            className="btn btn-secondary"
            style={{ padding: "8px 16px", fontSize: "14px" }}
            title="Copy forensic summary to clipboard"
          >
            {copied ? <Check size={16} color="var(--risk-low)" /> : <Copy size={16} />}
            <span>{copied ? "Copied" : "Copy Summary"}</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="btn btn-secondary"
            style={{ padding: "8px 16px", fontSize: "14px" }}
            title="Download full forensic report as JSON"
          >
            <Download size={16} />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ padding: "8px 16px", fontSize: "14px" }}
            title="Print or Save as PDF"
          >
            <Printer size={16} />
            <span>Print / PDF</span>
          </button>

          {onReanalyze && _id && (
            <button
              onClick={async () => {
                setIsReanalyzing(true);
                await onReanalyze(_id);
                setIsReanalyzing(false);
              }}
              disabled={isReanalyzing}
              className="btn btn-primary"
              style={{ padding: "8px 18px", fontSize: "14px" }}
              title="Re-run heuristics against current rule-engine version"
            >
              <RefreshCw size={16} className={isReanalyzing ? "animate-spin" : ""} />
              <span>Re-analyze</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Score & Assessment Header */}
      <div className="card" style={{ padding: "28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", alignItems: "center" }}>
          {/* Left: Product & Reviewer Context */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span className="badge badge-low">{category}</span>
              <span className="font-mono" style={{ fontSize: "13px", color: "var(--text-muted)" }}>{product_id || "SKU-N/A"}</span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>• Platform: {platform || "Web"}</span>
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-primary)", margin: "0 0 10px" }}>
              {product_name}
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px", fontSize: "14px", color: "var(--text-secondary)" }}>
              <span>Reviewer: <strong style={{ color: "var(--text-primary)" }}>{reviewer_name}</strong> ({reviewer_id || "N/A"})</span>
              <span style={{ fontWeight: "700", color: "#F59E0B" }}>{rating} ★ Rated</span>
              <span>Date: {review_date ? review_date.substring(0, 10) : "N/A"}</span>
            </div>
          </div>

          {/* Right: Heuristic Risk Score Badge */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", borderRadius: "var(--radius-lg)", background: "var(--bg-surface)", border: "1px solid var(--border-medium)" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
              Heuristic Risk Score
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", margin: "8px 0" }}>
              <span style={{
                fontSize: "44px",
                fontWeight: "900",
                color: risk_score <= 24 ? "var(--risk-low)" : risk_score <= 49 ? "var(--risk-mod)" : "var(--risk-very-high)"
              }}>
                {risk_score}
              </span>
              <span style={{ fontSize: "18px", color: "var(--text-muted)", fontWeight: "600" }}>/ 100</span>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <span className={`badge ${
                risk_level === "Low" ? "badge-low" : risk_level === "Moderate" ? "badge-mod" : "badge-very-high"
              }`} style={{ fontSize: "14px", padding: "6px 14px", textTransform: "none", fontWeight: "700" }}>
                {report.classification_label || `${(risk_level || (risk_score <= 24 ? "Low" : risk_score <= 49 ? "Moderate" : risk_score <= 74 ? "High" : "Very High")).toUpperCase()} RISK — ${assessment || (risk_score <= 24 ? "Appears Genuine" : risk_score <= 49 ? "Needs Review" : risk_score <= 74 ? "Suspicious" : "Strongly Suspicious")}`}
              </span>
            </div>
            {risk_score === 0 && (!triggered_rules || triggered_rules.length === 0) && (
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px", margin: 0 }}>
                No suspicious indicators were detected. Authenticity cannot be definitively proven solely by a zero score.
              </p>
            )}
            <span className="font-mono" style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
              Engine Version: v{rule_engine_version}
            </span>
          </div>
        </div>

        {/* Explainability Notice */}
        <div style={{ marginTop: "20px", padding: "14px 18px", borderRadius: "var(--radius-md)", background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)", display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <Info size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
            <strong style={{ color: "var(--primary)" }}>Forensic Transparency Notice: </strong>
            This score is derived from 20 explainable heuristic rules with correlation dampening. It represents empirical risk of non-organic feedback, not a statistical certainty of fraud.
          </p>
        </div>
      </div>

      {/* Review Content & Token Highlighting */}
      <div className="card" style={{ padding: "24px" }}>
        <h3 className="section-title" style={{ marginBottom: "14px" }}>
          Review Content & Empirical Highlighting
        </h3>

        {headline && (
          <p style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "12px", fontStyle: "italic" }}>
            "{headline}"
          </p>
        )}

        <div style={{ padding: "18px 20px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border-medium)" }}>
          {renderHighlightedReview()}
        </div>
      </div>

      {/* Sentiment & Rating Consistency */}
      {sentiment_analysis && (
        <div className="card" style={{ padding: "24px" }}>
          <h3 className="section-title" style={{ marginBottom: "14px" }}>
            Sentiment Polarity & Rating Consistency
          </h3>

          <div className="grid-3" style={{ gap: "16px", marginBottom: "16px" }}>
            <div style={{ padding: "16px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border-medium)" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Sentiment Polarity</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                <span className={`badge ${
                  sentiment_analysis.label === "Positive" ? "badge-low" : sentiment_analysis.label === "Negative" ? "badge-very-high" : "badge-mod"
                }`} style={{ fontSize: "13px" }}>
                  {sentiment_analysis.label || "Neutral"}
                </span>
                <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: "600" }}>
                  (Score: {sentiment_analysis.score || 0})
                </span>
              </div>
            </div>

            <div style={{ padding: "16px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border-medium)" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Consistency Status</span>
              <div style={{ marginTop: "6px" }}>
                <span style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: sentiment_analysis.rating_consistency?.is_consistent ? "var(--risk-low)" : "#F59E0B"
                }}>
                  {sentiment_analysis.rating_consistency?.is_consistent ? "Consistent with Rating" : "Rating Contradiction Detected"}
                </span>
              </div>
            </div>

            <div style={{ padding: "16px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border-medium)" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "700" }}>Evidence Words</span>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px", margin: 0 }} className="truncate">
                {(sentiment_analysis.negative_words || []).length > 0
                  ? `Negatives: ${sentiment_analysis.negative_words.join(", ")}`
                  : `Positives: ${(sentiment_analysis.positive_words || []).join(", ") || "None"}`}
              </p>
            </div>
          </div>

          {sentiment_analysis.rating_consistency?.explanation && (
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", fontStyle: "italic", borderLeft: "3px solid var(--primary)", paddingLeft: "12px", margin: 0, lineHeight: "1.5" }}>
              {sentiment_analysis.rating_consistency.explanation}
            </p>
          )}
        </div>
      )}

      {/* Comprehensive 20-Rule Forensic Audit Table (Triggered & Non-Triggered) */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 className="section-title" style={{ margin: 0 }}>
              Explainable Forensic Rule Audit (All 20 Heuristic Rules)
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Comprehensive evaluation status, base weights, effective contributions, and empirical evidence.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: "6px", background: "var(--bg-surface)", padding: "4px", borderRadius: "8px", border: "1px solid var(--border-medium)" }}>
            <button
              type="button"
              onClick={() => setRuleFilterMode("all")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: ruleFilterMode === "all" ? "var(--bg-card)" : "transparent",
                color: ruleFilterMode === "all" ? "var(--text-primary)" : "var(--text-muted)",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              All 20 Rules
            </button>
            <button
              type="button"
              onClick={() => setRuleFilterMode("triggered")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: ruleFilterMode === "triggered" ? "var(--bg-card)" : "transparent",
                color: ruleFilterMode === "triggered" ? "var(--risk-very-high)" : "var(--text-muted)",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Triggered ({triggered_rules.length})
            </button>
            <button
              type="button"
              onClick={() => setRuleFilterMode("passed")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: ruleFilterMode === "passed" ? "var(--bg-card)" : "transparent",
                color: ruleFilterMode === "passed" ? "var(--risk-low)" : "var(--text-muted)",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Passed ({20 - triggered_rules.length})
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Rule ID</th>
                <th>Indicator Name</th>
                <th>Family</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Contribution</th>
                <th>Empirical Evidence & Rationale</th>
              </tr>
            </thead>
            <tbody>
              {computedRulesAudit
                .filter(r => {
                  if (ruleFilterMode === "triggered") return r.triggered;
                  if (ruleFilterMode === "passed") return !r.triggered;
                  return true;
                })
                .map((r, idx) => (
                  <tr key={idx} style={{ opacity: r.triggered ? 1 : 0.85 }}>
                    <td className="font-mono" style={{ fontWeight: "800", color: r.triggered ? "var(--primary)" : "var(--text-muted)" }}>
                      {r.rule_id}
                    </td>
                    <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                      {r.name}
                    </td>
                    <td>
                      <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: "var(--bg-surface)", color: "var(--text-secondary)" }}>
                        {r.group}
                      </span>
                    </td>
                    <td>
                      {r.triggered ? (
                        <span className="badge badge-very-high" style={{ fontSize: "11px" }}>
                          Triggered
                        </span>
                      ) : (
                        <span className="badge badge-low" style={{ fontSize: "11px" }}>
                          Passed (Clean)
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {r.severity}
                      </span>
                    </td>
                    <td style={{ fontWeight: "700", color: r.triggered ? "var(--risk-very-high)" : "var(--text-muted)" }}>
                      {r.triggered ? `+${r.effective_contribution} pts` : "0 pts"}
                    </td>
                    <td style={{ fontSize: "13px", color: r.triggered ? "var(--text-primary)" : "var(--text-muted)", maxWidth: "340px" }}>
                      {r.evidence}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diagnostics Grid */}
      <div className="grid-4" style={{ gap: "20px" }}>
        {/* Stylometric Metrics */}
        <div className="card" style={{ padding: "20px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px" }}>
            Stylometric Metrics
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Word Count:</span>
              <strong style={{ color: "var(--text-primary)" }}>{lexical_metrics.word_count || 0}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Character Count:</span>
              <strong style={{ color: "var(--text-primary)" }}>{lexical_metrics.character_count || 0}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Uppercase Ratio:</span>
              <strong style={{ color: "var(--text-primary)" }}>{Math.round((lexical_metrics.uppercase_ratio || 0) * 100)}%</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Exclamation Marks:</span>
              <strong style={{ color: "var(--text-primary)" }}>{lexical_metrics.exclamation_count || 0}</strong>
            </div>
          </div>
        </div>

        {/* Duplicate Forensics */}
        <div className="card" style={{ padding: "20px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px" }}>
            Duplicate Forensics
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Exact Duplicate:</span>
              <strong style={{ color: duplicate_forensics.is_exact_duplicate ? "var(--risk-very-high)" : "var(--risk-low)" }}>
                {duplicate_forensics.is_exact_duplicate ? "YES (Exact Match)" : "No"}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Near Duplicate:</span>
              <strong style={{ color: duplicate_forensics.is_near_duplicate ? "#F59E0B" : "var(--risk-low)" }}>
                {duplicate_forensics.is_near_duplicate ? "YES" : "No"}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Top Similarity:</span>
              <strong className="font-mono" style={{ color: "var(--text-primary)" }}>
                {Math.round((duplicate_forensics.highest_similarity_score || 0) * 100)}%
              </strong>
            </div>
          </div>
        </div>

        {/* Reviewer History */}
        <div className="card" style={{ padding: "20px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px" }}>
            Reviewer History
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Sufficient History:</span>
              <strong style={{ color: reviewer_forensics.has_sufficient_history ? "var(--risk-low)" : "var(--text-muted)" }}>
                {reviewer_forensics.has_sufficient_history ? "Yes" : "Insufficient"}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Recorded Reviews:</span>
              <strong style={{ color: "var(--text-primary)" }}>{reviewer_forensics.history_count || 0}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Avg Rating:</span>
              <strong style={{ color: "var(--text-primary)" }}>{reviewer_forensics.avg_historical_rating || rating}★</strong>
            </div>
          </div>
        </div>

        {/* Suggested Next Steps */}
        <div className="card" style={{ padding: "20px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px" }}>
            Forensic Next Steps
          </h4>
          <ul style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {risk_score >= 50 ? (
              <>
                <li style={{ color: "var(--risk-very-high)" }}>Flag for manual investigation</li>
                <li>Cross-reference reviewer account history</li>
                <li>Check duplicate clusters in Campaign Forensics</li>
              </>
            ) : risk_score >= 25 ? (
              <>
                <li style={{ color: "#F59E0B" }}>Monitor product for velocity bursts</li>
                <li>Review related submissions by same account</li>
              </>
            ) : (
              <>
                <li style={{ color: "var(--risk-low)" }}>Verified as low risk</li>
                <li>Normal organic feedback pattern</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
