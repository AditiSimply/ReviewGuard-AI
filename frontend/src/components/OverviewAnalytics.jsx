import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileSearch,
  Filter,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  RefreshCw,
  LayoutDashboard,
  Globe,
  Smile,
  Frown,
  Inbox
} from "lucide-react";

const API_BASE = "http://127.0.0.1:5000/api";

const CATEGORIES = [
  "all",
  "Electronics",
  "Fashion",
  "Beauty",
  "Home/Kitchen",
  "Grocery",
  "Books",
  "Sports",
  "Other"
];

export default function OverviewAnalytics({ onViewReport, onNavigateToAnalyze, refreshTrigger }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`${API_BASE}/analytics/dashboard?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to load dashboard data");
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedCategory, startDate, endDate, refreshTrigger]);

  if (loading && !data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", color: "var(--text-muted)" }}>
        <RefreshCw size={32} className="animate-spin" style={{ color: "var(--primary)", marginBottom: "16px" }} />
        <p style={{ fontSize: "16px", fontWeight: "600" }}>Loading dashboard statistics from database...</p>
      </div>
    );
  }

  const {
    totalReviews = 0,
    averageRiskScore = 0,
    assessmentCounts = { genuine: 0, needsReview: 0, suspicious: 0 },
    riskLevelCounts = { low: 0, moderate: 0, high: 0, veryHigh: 0 },
    riskDistribution = [],
    ratingDistribution = [],
    sentimentDistribution = [],
    platformWise = [],
    categoryWise = [],
    duplicateCounts = { exact: 0, near: 0, total: 0 },
    recentAnalyses = []
  } = data || {};

  return (
    <div className="space-y-6 animate-fade" style={{ width: "100%", maxWidth: "1360px", margin: "0 auto", padding: "24px 28px 48px" }}>
      
      {/* Top Banner & Filter Controls */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <LayoutDashboard size={28} color="var(--primary)" />
              <span>Review Intelligence Dashboard</span>
            </h1>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginTop: "6px" }}>
              Live database telemetry computed across {totalReviews} stored consumer review records.
            </p>
          </div>

          {/* Filter Bar */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Filter size={16} color="var(--text-muted)" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ width: "180px", minHeight: "42px", fontSize: "14px", padding: "8px 36px 8px 12px" }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "All Categories" : c}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={16} color="var(--text-muted)" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: "150px", minHeight: "42px", fontSize: "14px", padding: "8px 12px" }}
                title="Start Date"
              />
              <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: "150px", minHeight: "42px", fontSize: "14px", padding: "8px 12px" }}
                title="End Date"
              />
            </div>

            <button
              onClick={fetchDashboardData}
              className="btn btn-secondary"
              style={{ minHeight: "42px", padding: "8px 14px" }}
              title="Refresh statistics"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Sensible Empty State if database contains zero reviews */}
      {totalReviews === 0 ? (
        <div className="card" style={{ padding: "64px 24px", textAlign: "center", maxWidth: "680px", margin: "40px auto" }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "rgba(99, 102, 241, 0.12)",
            color: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px"
          }}>
            <Inbox size={32} />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-primary)", marginBottom: "8px" }}>
            No Review Records Found
          </h2>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: "1.6", maxWidth: "480px", margin: "0 auto 24px" }}>
            The review forensics database is currently empty. Run an individual review forensic evaluation or upload a CSV dataset to generate live telemetry.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={onNavigateToAnalyze}
              className="btn btn-primary"
              style={{ padding: "10px 22px", fontSize: "14px" }}
            >
              <span>Analyse First Review</span>
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 4 Essential KPI Cards */}
          <div className="grid-4" style={{ gap: "20px" }}>
            
            {/* Total Reviews Card */}
            <div className="card" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  Total Analysed
                </span>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(59, 130, 246, 0.15)", color: "var(--accent-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileSearch size={18} />
                </div>
              </div>
              <p style={{ fontSize: "32px", fontWeight: "900", color: "var(--text-primary)", margin: "12px 0 6px" }}>
                {totalReviews}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-secondary)" }}>
                <CheckCircle2 size={15} color="var(--risk-low)" />
                <span>Real Database Records</span>
              </div>
            </div>

            {/* Flagged Suspicious Reviews Card */}
            <div className="card" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  Flagged Suspicious
                </span>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(244, 63, 94, 0.15)", color: "var(--risk-very-high)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldAlert size={18} />
                </div>
              </div>
              <p style={{ fontSize: "32px", fontWeight: "900", color: "var(--risk-very-high)", margin: "12px 0 6px" }}>
                {assessmentCounts.suspicious}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
                <span className="badge badge-very-high" style={{ fontSize: "11px", padding: "2px 8px" }}>
                  {totalReviews > 0 ? Math.round((assessmentCounts.suspicious / totalReviews) * 100) : 0}% of Volume
                </span>
                <span>High + Very High Risk</span>
              </div>
            </div>

            {/* Average Risk Score Card */}
            <div className="card" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  Avg Risk Score
                </span>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.15)", color: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <p style={{ fontSize: "32px", fontWeight: "900", color: "var(--text-primary)", margin: "12px 0 6px" }}>
                {averageRiskScore} <span style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-muted)" }}>/ 100</span>
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <span className={`badge ${
                  averageRiskScore <= 24 ? "badge-low" : averageRiskScore <= 49 ? "badge-mod" : "badge-very-high"
                }`} style={{ fontSize: "11px", padding: "2px 8px" }}>
                  {averageRiskScore <= 24 ? "Low Risk" : averageRiskScore <= 49 ? "Moderate" : "Elevated Risk"}
                </span>
                <span style={{ color: "var(--text-muted)" }}>Heuristic Index</span>
              </div>
            </div>

            {/* Duplicates Identified */}
            <div className="card" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  Duplicates Flagged
                </span>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.15)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Layers size={18} />
                </div>
              </div>
              <p style={{ fontSize: "32px", fontWeight: "900", color: "var(--text-primary)", margin: "12px 0 6px" }}>
                {duplicateCounts.total}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
                <span>Exact: <strong style={{ color: "var(--text-primary)" }}>{duplicateCounts.exact}</strong></span>
                <span>Near: <strong style={{ color: "var(--text-primary)" }}>{duplicateCounts.near}</strong></span>
              </div>
            </div>
          </div>

          {/* 4 Risk Bands Detail Cards (Low, Moderate, High, Very High) */}
          <div className="card" style={{ padding: "20px 24px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "14px" }}>
              Risk Level Breakdown (Documented Threshold Bands)
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              <div style={{ padding: "14px 18px", borderRadius: "var(--radius-md)", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--risk-low)", textTransform: "uppercase" }}>Low Risk (0–24)</span>
                <p style={{ fontSize: "24px", fontWeight: "900", color: "var(--text-primary)", margin: "6px 0 2px" }}>
                  {riskLevelCounts.low || assessmentCounts.genuine}
                </p>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Appears Genuine</span>
              </div>

              <div style={{ padding: "14px 18px", borderRadius: "var(--radius-md)", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#F59E0B", textTransform: "uppercase" }}>Moderate Risk (25–49)</span>
                <p style={{ fontSize: "24px", fontWeight: "900", color: "var(--text-primary)", margin: "6px 0 2px" }}>
                  {riskLevelCounts.moderate || assessmentCounts.needsReview}
                </p>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Needs Review</span>
              </div>

              <div style={{ padding: "14px 18px", borderRadius: "var(--radius-md)", background: "rgba(249, 115, 22, 0.08)", border: "1px solid rgba(249, 115, 22, 0.25)" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#F97316", textTransform: "uppercase" }}>High Risk (50–74)</span>
                <p style={{ fontSize: "24px", fontWeight: "900", color: "var(--text-primary)", margin: "6px 0 2px" }}>
                  {riskLevelCounts.high || 0}
                </p>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Suspicious Patterns</span>
              </div>

              <div style={{ padding: "14px 18px", borderRadius: "var(--radius-md)", background: "rgba(244, 63, 94, 0.08)", border: "1px solid rgba(244, 63, 94, 0.25)" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--risk-very-high)", textTransform: "uppercase" }}>Very High Risk (75–100)</span>
                <p style={{ fontSize: "24px", fontWeight: "900", color: "var(--text-primary)", margin: "6px 0 2px" }}>
                  {riskLevelCounts.veryHigh || 0}
                </p>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Strongly Suspicious</span>
              </div>
            </div>
          </div>

          {/* Primary Analytics Charts Grid (Risk Distribution + Sentiment Distribution) */}
          <div className="grid-2" style={{ gap: "24px" }}>
            
            {/* Risk Level Distribution Chart */}
            <div className="card" style={{ padding: "24px" }}>
              <h3 className="section-title" style={{ marginBottom: "6px" }}>
                Risk Band Distribution
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                Categorized by heuristic risk score thresholds
              </p>
              <div style={{ width: "100%", height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={4}
                      label={({ count }) => count > 0 ? `${count}` : ""}
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-medium)", borderRadius: 10, fontSize: 13 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sentiment Distribution Chart */}
            <div className="card" style={{ padding: "24px" }}>
              <h3 className="section-title" style={{ marginBottom: "6px" }}>
                Sentiment Distribution
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                AFINN sentiment polarity with negation scope analysis
              </p>
              <div style={{ width: "100%", height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sentimentDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="sentiment" stroke="var(--text-muted)" fontSize={13} />
                    <YAxis stroke="var(--text-muted)" fontSize={13} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-medium)", borderRadius: 10, fontSize: 13 }}
                    />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Reviews Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Secondary Charts Grid (Platform-Wise + Category-Wise) */}
          <div className="grid-2" style={{ gap: "24px" }}>
            
            {/* Platform-Wise Analysis Chart */}
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Globe size={18} color="var(--primary)" />
                <h3 className="section-title" style={{ margin: 0 }}>Platform-Wise Analysis</h3>
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                Review volume and average risk score across origin platforms
              </p>
              <div style={{ width: "100%", height: "260px" }}>
                {platformWise.length === 0 ? (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                    No platform data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformWise}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="platform" stroke="var(--text-muted)" fontSize={12} interval={0} angle={-15} textAnchor="end" height={50} />
                      <YAxis stroke="var(--text-muted)" fontSize={13} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-medium)", borderRadius: 10, fontSize: 13 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="count" fill="#06B6D4" name="Volume" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="avgRiskScore" fill="#F43F5E" name="Avg Risk" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Category-Wise Analysis Chart */}
            <div className="card" style={{ padding: "24px" }}>
              <h3 className="section-title" style={{ marginBottom: "6px" }}>
                Category-Wise Analysis
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                Comparative review volume and average risk by product category
              </p>
              <div style={{ width: "100%", height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryWise} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={13} />
                    <YAxis dataKey="category" type="category" stroke="var(--text-muted)" fontSize={12} width={105} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-medium)", borderRadius: 10, fontSize: 13 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" fill="#3B82F6" name="Total Reviews" radius={[0, 6, 6, 0]} />
                    <Bar dataKey="avgRiskScore" fill="#F43F5E" name="Avg Risk Score" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Analyses Table */}
          <div className="card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 className="section-title" style={{ margin: 0 }}>Recent Forensic Analyses</h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Latest evaluated reviews saved to the database with one-click forensic deep dive.
                </p>
              </div>
              <button
                onClick={onNavigateToAnalyze}
                className="btn btn-primary"
                style={{ padding: "10px 18px", fontSize: "14px" }}
              >
                <span>Analyse New Review</span>
                <ArrowUpRight size={16} />
              </button>
            </div>

            {recentAnalyses.length === 0 ? (
              <div style={{ padding: "36px", textAlign: "center", color: "var(--text-muted)", fontSize: "15px" }}>
                No analyses recorded yet. Use the Review Analyser to inspect your first review.
              </div>
            ) : (
              <div className="table-container">
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>Product Title</th>
                      <th>Category</th>
                      <th>Platform</th>
                      <th>Reviewer</th>
                      <th>Rating</th>
                      <th>Risk Score</th>
                      <th>Assessment</th>
                      <th>Indicators</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAnalyses.map((r) => (
                      <tr key={r._id}>
                        <td style={{ fontWeight: "600", maxWidth: "220px" }} className="truncate">
                          {r.product_name}
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>{r.category}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{r.platform || "Web"}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{r.reviewer_name}</td>
                        <td style={{ fontWeight: "700", color: "#F59E0B" }}>{r.rating}★</td>
                        <td className="font-mono" style={{ fontWeight: "800", color: "var(--text-primary)" }}>
                          {r.risk_score} / 100
                        </td>
                        <td>
                          <span className={`badge ${
                            r.risk_score <= 24 ? "badge-low" : r.risk_score <= 49 ? "badge-mod" : r.risk_score <= 74 ? "badge-high" : "badge-very-high"
                          }`}>
                            {r.assessment}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {(r.triggered_rules || []).length} triggered
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={() => onViewReport(r)}
                            className="btn btn-secondary"
                            style={{ padding: "6px 14px", fontSize: "13px", minHeight: "34px" }}
                          >
                            Deep-Dive
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
