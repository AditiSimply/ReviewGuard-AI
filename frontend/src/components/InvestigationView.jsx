import React, { useState, useEffect } from "react";
import {
  Network,
  Sliders,
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
  Info
} from "lucide-react";

const API_BASE = "http://127.0.0.1:5000/api";

export default function InvestigationView({ onViewReport }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [threshold, setThreshold] = useState(0.70);
  const [selectedNode, setSelectedNode] = useState(null);

  const fetchInvestigationData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/investigation/overview?threshold=${threshold}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to load investigation data");
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigationData();
  }, [threshold]);

  const handleExportReport = () => {
    window.open(`${API_BASE}/investigation/export-report`, "_blank");
  };

  const {
    totalReviews = 0,
    clustersCount = 0,
    exactDuplicatesCount = 0,
    nearDuplicatesCount = 0,
    pairwiseMatches = [],
    bursts = [],
    graphData = { nodes: [], links: [] },
    methodologyNote = ""
  } = data || {};

  return (
    <div className="space-y-6 animate-fade">
      {/* Top Banner & Similarity Slider */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h2 className="section-title" style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
              <Network size={24} color="var(--primary)" />
              <span>Duplicate & Campaign Detection</span>
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Cross-review TF-IDF vectorization, cosine similarity clustering, and temporal burst analysis.
            </p>
          </div>

          {/* Threshold Slider & Export */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--bg-surface)", padding: "8px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-medium)" }}>
              <Sliders size={16} color="var(--primary)" />
              <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)" }}>Threshold:</span>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                style={{ width: "110px", cursor: "pointer", height: "6px" }}
              />
              <span className="font-mono" style={{ fontSize: "15px", fontWeight: "700", color: "var(--primary)" }}>
                {Math.round(threshold * 100)}%
              </span>
            </div>

            <button
              onClick={handleExportReport}
              className="btn btn-secondary"
              style={{ padding: "8px 16px", fontSize: "14px" }}
              title="Download CSV report of all similarity pairs"
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>

            <button
              onClick={fetchInvestigationData}
              className="btn btn-secondary"
              style={{ padding: "8px 14px", fontSize: "14px" }}
              title="Refresh analysis"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ gap: "20px" }}>
        <div className="card" style={{ padding: "20px" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Exact Duplicates</span>
          <p style={{ fontSize: "32px", fontWeight: "900", color: "var(--risk-very-high)", margin: "8px 0 4px" }}>{exactDuplicatesCount}</p>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>100% Identical Text Hashes</p>
        </div>

        <div className="card" style={{ padding: "20px" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Near-Duplicate Pairs</span>
          <p style={{ fontSize: "32px", fontWeight: "900", color: "#F59E0B", margin: "8px 0 4px" }}>{nearDuplicatesCount}</p>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>≥ {Math.round(threshold * 100)}% TF-IDF Cosine Similarity</p>
        </div>

        <div className="card" style={{ padding: "20px" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Identified Clusters</span>
          <p style={{ fontSize: "32px", fontWeight: "900", color: "var(--primary)", margin: "8px 0 4px" }}>{clustersCount}</p>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>Connected Review Communities</p>
        </div>

        <div className="card" style={{ padding: "20px" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Campaign Bursts</span>
          <p style={{ fontSize: "32px", fontWeight: "900", color: "var(--accent-purple)", margin: "8px 0 4px" }}>{bursts.length}</p>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>Temporal Influxes within 48h</p>
        </div>
      </div>

      {/* Interactive Cluster Relationship Graph */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 className="section-title" style={{ margin: 0 }}>
              Review Similarity Relationship Graph
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Nodes represent reviews (colored by risk); links represent pairwise similarity exceeding {Math.round(threshold * 100)}%
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "13px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--risk-low)" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--risk-low)" }} /> Low Risk
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#F59E0B" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#F59E0B" }} /> Moderate
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--risk-very-high)" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--risk-very-high)" }} /> Suspicious
            </span>
          </div>
        </div>

        {graphData.nodes.length === 0 ? (
          <div style={{ height: "260px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-lg)", background: "var(--bg-surface)", border: "1px solid var(--border-medium)", color: "var(--text-muted)" }}>
            <CheckCircle2 size={36} color="var(--risk-low)" style={{ marginBottom: "10px" }} />
            <p style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>No Duplicate Clusters at {Math.round(threshold * 100)}% Threshold</p>
            <p style={{ fontSize: "14px", marginTop: "6px" }}>Lower the similarity slider if you wish to inspect weaker stylistic affinities.</p>
          </div>
        ) : (
          <div style={{ height: "340px", width: "100%", borderRadius: "var(--radius-lg)", background: "var(--bg-input)", border: "1px solid var(--border-medium)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <svg style={{ width: "100%", height: "100%" }} viewBox="0 0 600 300">
              {graphData.links.map((link, idx) => {
                const srcIdx = graphData.nodes.findIndex(n => n.id === link.source);
                const tgtIdx = graphData.nodes.findIndex(n => n.id === link.target);
                if (srcIdx === -1 || tgtIdx === -1) return null;

                const total = graphData.nodes.length;
                const angle1 = (srcIdx / total) * 2 * Math.PI;
                const angle2 = (tgtIdx / total) * 2 * Math.PI;
                const x1 = 300 + 190 * Math.cos(angle1);
                const y1 = 150 + 105 * Math.sin(angle1);
                const x2 = 300 + 190 * Math.cos(angle2);
                const y2 = 150 + 105 * Math.sin(angle2);

                return (
                  <line
                    key={idx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={link.isExact ? "var(--risk-very-high)" : "var(--primary)"}
                    strokeWidth={link.isExact ? 3 : 1.5}
                    strokeDasharray={link.isExact ? "none" : "4 2"}
                    opacity={0.65}
                  />
                );
              })}

              {graphData.nodes.map((node, idx) => {
                const total = graphData.nodes.length;
                const angle = (idx / total) * 2 * Math.PI;
                const x = 300 + 190 * Math.cos(angle);
                const y = 150 + 105 * Math.sin(angle);
                const color =
                  node.risk === "Low"
                    ? "#10B981"
                    : node.risk === "Moderate"
                    ? "#F59E0B"
                    : "#F43F5E";

                const isSelected = selectedNode?.id === node.id;

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 15 : 10}
                      fill={color}
                      stroke="#FFFFFF"
                      strokeWidth={isSelected ? 3 : 1.5}
                    />
                    <text
                      x={x}
                      y={y + 20}
                      fontSize="11"
                      fill="var(--text-secondary)"
                      textAnchor="middle"
                      style={{ fontWeight: "700", pointerEvents: "none" }}
                    >
                      {node.reviewer || node.id.substring(0, 7)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {selectedNode && (
              <div style={{ position: "absolute", bottom: "16px", right: "16px", padding: "16px", borderRadius: "var(--radius-md)", background: "var(--bg-card)", border: "1px solid var(--border-medium)", boxShadow: "var(--shadow-lg)", maxWidth: "320px", fontSize: "14px" }} className="animate-fade">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "700", marginBottom: "6px" }}>
                  <span>Selected Review:</span>
                  <button onClick={() => setSelectedNode(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
                </div>
                <p className="font-mono" style={{ fontSize: "12px", color: "var(--primary)", margin: "0 0 4px" }}>{selectedNode.id}</p>
                <p style={{ color: "var(--text-secondary)", margin: "0 0 2px" }} className="truncate">Product: {selectedNode.product}</p>
                <p style={{ color: "var(--text-secondary)", margin: "0 0 8px" }}>Reviewer: {selectedNode.reviewer}</p>
                <span className={`badge ${
                  selectedNode.risk === "Low" ? "badge-low" : selectedNode.risk === "Moderate" ? "badge-mod" : "badge-very-high"
                }`}>
                  {selectedNode.risk} ({selectedNode.score}/100)
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Temporal Burst Forensics */}
      <div className="card" style={{ padding: "24px" }}>
        <h3 className="section-title" style={{ marginBottom: "6px" }}>
          Temporal Review Bursts & Coordination Waves
        </h3>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "18px" }}>
          Spikes of similar submissions for a single product within narrow 24–48 hour windows.
        </p>

        {bursts.length === 0 ? (
          <p style={{ fontSize: "14px", color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>
            No temporal velocity bursts detected across active catalogue records.
          </p>
        ) : (
          <div className="grid-2" style={{ gap: "16px" }}>
            {bursts.map((b, idx) => (
              <div key={idx} style={{ padding: "18px 20px", borderRadius: "var(--radius-md)", border: "1px solid rgba(244, 63, 94, 0.3)", background: "rgba(244, 63, 94, 0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontWeight: "700", color: "var(--risk-very-high)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock size={16} /> Burst Wave #{idx + 1}
                  </span>
                  <span className="badge badge-high">{b.reviewCount} Reviews</span>
                </div>
                <p style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 4px" }}>{b.product}</p>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 10px" }}>
                  Time Window: {b.startTime?.substring(0, 16).replace("T", " ")} to {b.endTime?.substring(0, 16).replace("T", " ")}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {b.reviews.map((r, i) => (
                    <span key={i} style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "4px", background: "var(--bg-surface)", color: "var(--text-secondary)" }}>
                      {r.reviewer} ({r.rating}★)
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pairwise Matches Detail Table */}
      <div className="card" style={{ padding: "24px" }}>
        <h3 className="section-title" style={{ marginBottom: "6px" }}>
          Pairwise High-Similarity Matches ({pairwiseMatches.length} Matches)
        </h3>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "18px" }}>
          Detailed comparison of reviews with matching phrasing, templates, or exact duplicate bodies.
        </p>

        {pairwiseMatches.length === 0 ? (
          <p style={{ fontSize: "14px", color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>No pairwise matches exceeding threshold.</p>
        ) : (
          <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Similarity</th>
                  <th>Source Review</th>
                  <th>Target Review</th>
                </tr>
              </thead>
              <tbody>
                {pairwiseMatches.map((m, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className={`badge ${m.isExact ? "badge-very-high" : "badge-mod"}`}>
                        {m.isExact ? "Exact Match" : "Near Duplicate"}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontWeight: "800", color: "var(--text-primary)" }}>
                      {Math.round(m.similarity * 100)}%
                    </td>
                    <td>
                      <p style={{ fontWeight: "600", margin: "0 0 2px" }} className="truncate">{m.sourceProduct}</p>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Reviewer: {m.sourceReviewer} [{m.sourceId}]</p>
                    </td>
                    <td>
                      <p style={{ fontWeight: "600", margin: "0 0 2px" }} className="truncate">{m.targetProduct}</p>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Reviewer: {m.targetReviewer} [{m.targetId}]</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Limitations Notice */}
      <div style={{ padding: "16px 20px", borderRadius: "var(--radius-md)", background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)", display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <Info size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <p style={{ fontSize: "14px", fontWeight: "700", color: "var(--primary)", margin: "0 0 4px" }}>Methodology & Evidence Limitations</p>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
            {methodologyNote} Cross-review similarity and template detection analyze structural and n-gram overlap. They do not constitute conclusive legal proof of common authorship or fraud.
          </p>
        </div>
      </div>
    </div>
  );
}
