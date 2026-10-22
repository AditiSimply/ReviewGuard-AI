import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Search,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Loader2,
  RefreshCw,
  Sparkles,
  ShieldAlert
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

const API_BASE = "http://127.0.0.1:5000/api";

const CORE_SAMPLE_PROFILES = [
  { name: "David K.", label: "David K.", desc: "Organic Genuine Profile (Balanced 4–5★)" },
  { name: "Rahul123", label: "Rahul123", desc: "Commercial Astroturfer (100% 5★, Zero Variance, Template Reuse)" },
  { name: "Sneha_09", label: "Sneha_09", desc: "Multi-Category Authentic (Natural 3–5★ Variance)" },
  { name: "Aman45", label: "Aman45", desc: "Contradictory / Negative Anomaly (1★ Rating Mismatches)" }
];

export default function ReviewerAnalytics({ onViewReport }) {
  const [query, setQuery] = useState("");
  const [selectedReviewer, setSelectedReviewer] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dbReviewers, setDbReviewers] = useState([]);
  const [loadingReviewersList, setLoadingReviewersList] = useState(true);

  // 1. Load dynamic reviewer list from database on mount
  const fetchAvailableReviewers = async () => {
    setLoadingReviewersList(true);
    try {
      const res = await fetch(`${API_BASE}/analytics/reviewers`);
      const json = await res.json();
      if (res.ok && json.success) {
        setDbReviewers(json.data || []);
      }
    } catch (e) {
      console.warn("Could not fetch reviewers list:", e.message);
    } finally {
      setLoadingReviewersList(false);
    }
  };

  useEffect(() => {
    fetchAvailableReviewers();
  }, []);

  // 2. Fetch specific reviewer longitudinal profile
  const fetchReviewerProfile = async (identifier) => {
    if (!identifier || !identifier.trim()) return;
    const cleanId = identifier.trim();
    setLoading(true);
    setError(null);
    setProfile(null); // wipe previous stale data immediately to prevent displaying old reviewer data
    setSelectedReviewer(cleanId);

    try {
      const res = await fetch(`${API_BASE}/analytics/reviewer/${encodeURIComponent(cleanId)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || `No review history found for this reviewer "${cleanId}".`);
      }
      setProfile(json);
      setError(null);
    } catch (err) {
      setError(err.message || "No review history found for this reviewer");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      fetchReviewerProfile(query);
    }
  };

  // Convert rating distribution to recharts format
  const chartData = profile?.ratingDistribution
    ? Object.entries(profile.ratingDistribution).map(([star, count]) => ({
        stars: `${star}★`,
        count
      }))
    : [];

  return (
    <div className="space-y-6 animate-fade">
      {/* Top Banner */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ maxWidth: "600px" }}>
            <h2 className="section-title" style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
              <UserCheck size={24} color="var(--primary)" />
              <span>Reviewer Behaviour & Longitudinal Profiling</span>
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "6px", lineHeight: "1.5" }}>
              Analyzes historical rating dispersion, intra-user template repetition, temporal velocity, and rating-sentiment anomalies across multiple submissions.
            </p>
          </div>

          {/* Target Profile Shortcuts */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Target Reviewer Profiles:
            </span>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              {CORE_SAMPLE_PROFILES.map((p) => {
                const isSelected = selectedReviewer === p.name;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setQuery(p.name);
                      fetchReviewerProfile(p.name);
                    }}
                    className={`btn ${isSelected ? "btn-primary" : "btn-secondary"}`}
                    style={{
                      padding: "7px 14px",
                      fontSize: "13px",
                      minHeight: "36px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                    title={p.desc}
                  >
                    <span>{p.label}</span>
                    {isSelected && (
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FFF" }} />
                    )}
                  </button>
                );
              })}

              {/* Negative Test Button */}
              <button
                type="button"
                onClick={() => {
                  setQuery("NonExistentReviewer");
                  fetchReviewerProfile("NonExistentReviewer");
                }}
                className={`btn ${selectedReviewer === "NonExistentReviewer" ? "btn-primary" : "btn-secondary"}`}
                style={{
                  padding: "7px 12px",
                  fontSize: "12px",
                  minHeight: "36px",
                  borderColor: "var(--risk-very-high-border)",
                  color: "var(--risk-very-high)"
                }}
                title="Verify that a reviewer with zero records displays 'No review history found for this reviewer'"
              >
                Test Unrecorded Reviewer
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Database Discovered Reviewers */}
        {dbReviewers.length > 0 && (
          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>
                All Discovered Reviewers in Database ({dbReviewers.length}):
              </span>
              <button
                type="button"
                onClick={fetchAvailableReviewers}
                className="btn btn-secondary"
                style={{ padding: "4px 10px", fontSize: "11px", minHeight: "26px", display: "flex", alignItems: "center", gap: "4px" }}
                title="Refresh list of reviewers from active database"
              >
                <RefreshCw size={12} className={loadingReviewersList ? "animate-spin" : ""} />
                <span>Refresh List</span>
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "100px", overflowY: "auto", padding: "2px 0" }}>
              {dbReviewers.slice(0, 30).map((rev) => {
                const isSelected = selectedReviewer === rev.name || selectedReviewer === rev.reviewer_id;
                return (
                  <button
                    key={rev.name + rev.reviewer_id}
                    type="button"
                    onClick={() => {
                      setQuery(rev.name);
                      fetchReviewerProfile(rev.name);
                    }}
                    className={`btn ${isSelected ? "btn-primary" : "btn-secondary"}`}
                    style={{
                      padding: "4px 10px",
                      fontSize: "12px",
                      minHeight: "28px",
                      borderRadius: "6px"
                    }}
                  >
                    <span>{rev.name}</span>
                    <span style={{ fontSize: "10px", opacity: 0.75, marginLeft: "4px" }}>
                      ({rev.count} rev)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: "24px" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "280px" }}>
            <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Reviewer Name or Reviewer ID (e.g. David K., Rahul123, Sneha_09, Aman45)..."
              className="input-control has-left-icon"
              style={{ height: "48px", fontSize: "15px" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn btn-primary"
            style={{ padding: "12px 24px", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            <span>{loading ? "Analyzing..." : "Lookup Reviewer"}</span>
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <Loader2 size={36} color="var(--primary)" className="animate-spin" style={{ margin: "0 auto 12px" }} />
          <p style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
            Analyzing Longitudinal Reviewer Telemetry...
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>
            Computing historical rating dispersion, standard deviation variance, and template re-use across submissions.
          </p>
        </div>
      )}

      {/* Error / Not Found State */}
      {!loading && error && (
        <div className="card" style={{ padding: "36px 24px", textAlign: "center", color: "var(--risk-very-high)", border: "1px solid var(--risk-very-high-border)", background: "var(--risk-very-high-bg)" }}>
          <AlertTriangle size={36} style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "18px", fontWeight: "800", margin: 0 }}>
            No review history found for this reviewer
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "8px" }}>
            {error}
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
            Select one of the verified sample profile buttons above (David K., Rahul123, Sneha_09, Aman45) or verify that reviews have been submitted and saved.
          </p>
        </div>
      )}

      {/* Empty State when no profile is selected yet */}
      {!loading && !error && !profile && (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <UserCheck size={42} color="var(--primary)" style={{ margin: "0 auto 14px", opacity: 0.8 }} />
          <h3 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
            Select a Reviewer to Generate Longitudinal Profile
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "560px", margin: "8px auto 20px", lineHeight: "1.5" }}>
            Choose one of the sample profile shortcuts above or enter any reviewer name to inspect rating variance, astroturfing template reuse, and behavioral assessments.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
            {CORE_SAMPLE_PROFILES.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  setQuery(p.name);
                  fetchReviewerProfile(p.name);
                }}
                className="btn btn-secondary"
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                Inspect {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Profile Details (Rendered when profile exists and not loading) */}
      {!loading && profile && (
        <div className="space-y-6 animate-fade">
          {/* Header Card */}
          <div className="card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "12px",
                  background: profile.suspiciousPatternDetected
                    ? "linear-gradient(135deg, #EF4444, #DC2626)"
                    : "linear-gradient(135deg, #4F46E5, #3B82F6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  color: "#FFF",
                  fontSize: "22px",
                  flexShrink: 0
                }}>
                  {profile.reviewerId?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
                    {profile.reviewerId}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                    <span className={`badge ${profile.hasSufficientHistory ? "badge-low" : "badge-mod"}`} style={{ fontSize: "12px" }}>
                      {profile.hasSufficientHistory ? "Sufficient Longitudinal History" : "Limited History"}
                    </span>
                    <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      {profile.reviewCount} review(s) recorded in database
                    </span>
                  </div>
                </div>
              </div>

              {/* Behavioural Assessment Indicator */}
              <div>
                {profile.suspiciousPatternDetected ? (
                  <div style={{ padding: "12px 18px", borderRadius: "var(--radius-md)", background: "var(--risk-very-high-bg)", border: "1px solid var(--risk-very-high-border)", color: "var(--risk-very-high)", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                    <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                    <div>
                      <p style={{ fontWeight: "800", margin: 0 }}>Anomalous Activity Pattern</p>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0" }}>{profile.patternNotes}</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "12px 18px", borderRadius: "var(--radius-md)", background: "var(--risk-low-bg)", border: "1px solid var(--risk-low-border)", color: "var(--risk-low)", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                    <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
                    <div>
                      <p style={{ fontWeight: "800", margin: 0 }}>Standard Reviewer Profile</p>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0" }}>{profile.patternNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid-4" style={{ gap: "20px" }}>
            <div className="card" style={{ padding: "20px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Submissions</span>
              <p style={{ fontSize: "32px", fontWeight: "900", color: "var(--text-primary)", margin: "8px 0 4px" }}>{profile.reviewCount}</p>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>Recorded in Database</p>
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Average Rating</span>
              <p style={{ fontSize: "32px", fontWeight: "900", color: "#F59E0B", margin: "8px 0 4px" }}>{profile.averageRating} ★</p>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>Historical Mean Rating</p>
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Rating Variance (StdDev)</span>
              <p style={{ fontSize: "32px", fontWeight: "900", color: profile.ratingStdDev === 0 ? "var(--risk-very-high)" : "var(--primary)", margin: "8px 0 4px" }}>
                {profile.ratingStdDev}
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                {profile.ratingStdDev === 0 ? "Zero variance (100% same rating)" : "Natural rating dispersion"}
              </p>
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Template Re-Use</span>
              <p className="font-mono" style={{ fontSize: "32px", fontWeight: "900", color: profile.maxInternalSimilarity >= 0.7 ? "var(--risk-very-high)" : "var(--text-primary)", margin: "8px 0 4px" }}>
                {Math.round(profile.maxInternalSimilarity * 100)}%
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>Max Intra-User Similarity</p>
            </div>
          </div>

          {/* Rating Distribution Chart */}
          <div className="card" style={{ padding: "24px" }}>
            <h4 className="section-title" style={{ marginBottom: "6px" }}>
              Reviewer Rating Histogram
            </h4>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Distribution of star ratings awarded by this reviewer across all product evaluations.
            </p>
            <div style={{ width: "100%", height: "240px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="stars" stroke="var(--text-muted)" fontSize={13} />
                  <YAxis stroke="var(--text-muted)" fontSize={13} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-medium)", borderRadius: 10, fontSize: 13 }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Submissions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Reviewer's Historical Submissions Table */}
          <div className="card" style={{ padding: "24px" }}>
            <h4 className="section-title" style={{ marginBottom: "16px" }}>
              Historical Submissions ({profile.reviews?.length || 0})
            </h4>
            <div className="table-container">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Product Title</th>
                    <th>Category</th>
                    <th>Rating</th>
                    <th>Risk Score</th>
                    <th>Assessment</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.reviews?.map((r) => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: "600", maxWidth: "260px" }} className="truncate">{r.product_name}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{r.category}</td>
                      <td style={{ fontWeight: "700", color: "#F59E0B" }}>{r.rating}★</td>
                      <td className="font-mono" style={{ fontWeight: "800", color: "var(--text-primary)" }}>
                        {r.risk_score} / 100
                      </td>
                      <td>
                        <span className={`badge ${
                          r.risk_score <= 24 ? "badge-low" : r.risk_score <= 49 ? "badge-mod" : "badge-very-high"
                        }`}>
                          {r.assessment}
                        </span>
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
          </div>
        </div>
      )}
    </div>
  );
}
