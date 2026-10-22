import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Download
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

const RISK_LEVELS = ["all", "Low", "Moderate", "High", "Very High"];
const ASSESSMENTS = ["all", "Appears Genuine", "Needs Review", "Suspicious", "Strongly Suspicious"];
const PLATFORMS = ["all", "Amazon", "Flipkart", "Google Reviews", "Trustpilot", "App Store", "Direct E-Commerce"];
const SENTIMENTS = ["all", "Positive", "Negative", "Neutral", "Mixed"];

export default function ReviewHistory({ onViewReport, refreshTrigger, highlightReviewId }) {
  const { user, isAdmin, isAnalyst, token } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [sentiment, setSentiment] = useState("all");
  const [rating, setRating] = useState("all");
  const [riskLevel, setRiskLevel] = useState("all");
  const [assessment, setAssessment] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination & Sorting (Default: newest createdAt first)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modals & Action States
  const [deleteModalItem, setDeleteModalItem] = useState(null);
  const [clearHistoryModal, setClearHistoryModal] = useState(false);
  const [reanalyzingId, setReanalyzingId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });

      if (search) params.append("search", search);
      if (category !== "all") params.append("category", category);
      if (platform !== "all") params.append("platform", platform);
      if (sentiment !== "all") params.append("sentiment", sentiment);
      if (rating !== "all") params.append("rating", rating);
      if (riskLevel !== "all") params.append("risk_level", riskLevel);
      if (assessment !== "all") params.append("assessment", assessment);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`${API_BASE}/reviews/history?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load review history.");
      }

      setReviews(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);
      setTotalItems(json.pagination?.totalItems || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, limit, category, platform, sentiment, rating, riskLevel, assessment, sortBy, sortOrder, startDate, endDate]);

  // When a review is analysed or saved, reset page and filters to show the new review immediately at the top
  useEffect(() => {
    if (refreshTrigger) {
      setPage(1);
      setSearch("");
      setCategory("all");
      setPlatform("all");
      setSentiment("all");
      setRating("all");
      setRiskLevel("all");
      setAssessment("all");
      setStartDate("");
      setEndDate("");
      fetchHistory();
    }
  }, [refreshTrigger]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleReanalyze = async (reviewId) => {
    setReanalyzingId(reviewId);
    setActionMessage("");
    try {
      const res = await fetch(`${API_BASE}/reviews/${reviewId}/reanalyze`, {
        method: "POST"
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Re-analysis failed.");

      setActionMessage(`Review updated to current engine v${json.data?.rule_engine_version}.`);
      fetchHistory();
    } catch (err) {
      alert("Re-analysis error: " + err.message);
    } finally {
      setReanalyzingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalItem) return;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/reviews/${deleteModalItem._id}`, {
        method: "DELETE",
        headers
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete.");

      setActionMessage("Review record deleted successfully.");
      setDeleteModalItem(null);
      fetchHistory();
    } catch (err) {
      setError("Delete failed: " + err.message);
      setDeleteModalItem(null);
    }
  };

  const handleClearAllConfirm = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/reviews/clear-history`, {
        method: "POST",
        headers
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Clear history failed.");

      setActionMessage(json.message);
      setClearHistoryModal(false);
      fetchHistory();
    } catch (err) {
      setError("Clear history failed: " + err.message);
      setClearHistoryModal(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade" style={{ width: "100%", maxWidth: "1360px", margin: "0 auto", padding: "24px 28px 48px" }}>
      
      {/* Top Banner */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <History size={28} color="var(--primary)" />
              <span>Review Forensics Database Explorer</span>
            </h1>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginTop: "6px" }}>
              Query, filter, and audit persistent historical forensic analyses ({totalItems} records on file).
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (search) params.append("search", search);
                if (category !== "all") params.append("category", category);
                if (platform !== "all") params.append("platform", platform);
                if (sentiment !== "all") params.append("sentiment", sentiment);
                if (rating !== "all") params.append("rating", rating);
                if (riskLevel !== "all") params.append("risk_level", riskLevel);
                if (assessment !== "all") params.append("assessment", assessment);
                if (startDate) params.append("startDate", startDate);
                if (endDate) params.append("endDate", endDate);
                window.open(`${API_BASE}/reviews/export-csv?${params.toString()}`, "_blank");
              }}
              className="btn btn-secondary"
              style={{ padding: "10px 18px", fontSize: "14px" }}
              title="Download filtered reviews as CSV"
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setClearHistoryModal(true)}
                className="btn btn-danger"
                style={{ padding: "10px 18px", fontSize: "14px" }}
                title="Administrator: Wipe all review records"
              >
                <Trash2 size={16} />
                <span>Clear All History</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div style={{
          padding: "14px 20px",
          borderRadius: "var(--radius-md)",
          background: "var(--risk-low-bg)",
          border: "1px solid var(--risk-low-border)",
          color: "var(--risk-low)",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={18} />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage("")} style={{ background: "none", border: "none", color: "var(--risk-low)", cursor: "pointer", fontSize: "16px" }}>✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: "24px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "14px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "280px" }}>
            <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product title, reviewer name/ID, review keywords..."
              className="input-control has-left-icon"
              style={{ height: "48px", fontSize: "15px" }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "15px" }}>
            Search Records
          </button>
        </form>

        {/* Dropdown Filters Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", paddingTop: "8px", borderTop: "1px solid var(--border-subtle)" }}>
          <div>
            <label className="form-label" style={{ fontSize: "13px", marginBottom: "6px" }}>Category</label>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} style={{ minHeight: "44px", fontSize: "14px" }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: "13px", marginBottom: "6px" }}>Platform</label>
            <select value={platform} onChange={(e) => { setPlatform(e.target.value); setPage(1); }} style={{ minHeight: "44px", fontSize: "14px" }}>
              {PLATFORMS.map(p => <option key={p} value={p}>{p === "all" ? "All Platforms" : p}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: "13px", marginBottom: "6px" }}>Sentiment</label>
            <select value={sentiment} onChange={(e) => { setSentiment(e.target.value); setPage(1); }} style={{ minHeight: "44px", fontSize: "14px" }}>
              {SENTIMENTS.map(s => <option key={s} value={s}>{s === "all" ? "All Sentiments" : s}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: "13px", marginBottom: "6px" }}>Rating</label>
            <select value={rating} onChange={(e) => { setRating(e.target.value); setPage(1); }} style={{ minHeight: "44px", fontSize: "14px" }}>
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: "13px", marginBottom: "6px" }}>Risk Band</label>
            <select value={riskLevel} onChange={(e) => { setRiskLevel(e.target.value); setPage(1); }} style={{ minHeight: "44px", fontSize: "14px" }}>
              {RISK_LEVELS.map(r => <option key={r} value={r}>{r === "all" ? "All Risk Bands" : r}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: "13px", marginBottom: "6px" }}>Assessment</label>
            <select value={assessment} onChange={(e) => { setAssessment(e.target.value); setPage(1); }} style={{ minHeight: "44px", fontSize: "14px" }}>
              {ASSESSMENTS.map(a => <option key={a} value={a}>{a === "all" ? "All Verdicts" : a}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: "13px", marginBottom: "6px" }}>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ minHeight: "44px", fontSize: "14px" }}>
              <option value="createdAt">Date Analyzed</option>
              <option value="risk_score">Risk Score</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: "13px", marginBottom: "6px" }}>Order</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ minHeight: "44px", fontSize: "14px" }}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: "24px" }}>
        {loading ? (
          <div style={{ padding: "64px", textAlign: "center", color: "var(--text-muted)" }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px", color: "var(--primary)" }} />
            <p style={{ fontSize: "15px", margin: 0 }}>Loading reviews from database...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ padding: "64px", textAlign: "center", color: "var(--text-muted)" }}>
            <FileText size={36} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <p style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>No Reviews Found</p>
            <p style={{ fontSize: "14px", marginTop: "6px" }}>Try relaxing your search terms or filter constraints.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Reviewer</th>
                  <th>Rating</th>
                  <th>Sentiment</th>
                  <th>Risk Score</th>
                  <th>Classification</th>
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => {
                  const isHighlighted = r._id === highlightReviewId;
                  return (
                    <tr key={r._id} style={{ background: isHighlighted ? "rgba(99, 102, 241, 0.12)" : undefined }}>
                      <td style={{ maxWidth: "240px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <p style={{ fontWeight: "600", margin: "0 0 2px" }} className="truncate" title={r.product_name}>
                            {r.product_name}
                          </p>
                          {isHighlighted && (
                            <span className="badge badge-low" style={{ fontSize: "10px", padding: "1px 6px" }}>
                              Just Added
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                          {r.product_id || "SKU-GEN"} • {r.platform || "Web"}
                        </p>
                      </td>
                    <td style={{ color: "var(--text-secondary)" }}>{r.category}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{r.reviewer_name}</td>
                    <td style={{ fontWeight: "700", color: "#F59E0B" }}>{r.rating}★</td>
                    <td>
                      <span className={`badge ${
                        r.sentiment_analysis?.label === "Positive"
                          ? "badge-low"
                          : r.sentiment_analysis?.label === "Negative"
                          ? "badge-very-high"
                          : "badge-mod"
                      }`} style={{ fontSize: "12px", padding: "2px 8px" }}>
                        {r.sentiment_analysis?.label || "Neutral"}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontWeight: "800", color: "var(--text-primary)" }}>
                      {r.risk_score} / 100
                    </td>
                    <td>
                      <span className={`badge ${
                        r.risk_score <= 24 ? "badge-low" : r.risk_score <= 49 ? "badge-mod" : r.risk_score <= 74 ? "badge-high" : "badge-very-high"
                      }`} style={{ fontSize: "12px" }}>
                        {r.classification_label || r.assessment}
                      </span>
                    </td>
                    <td style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : (r.review_date?.substring(0, 10) || "N/A")}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                        <button
                          onClick={() => onViewReport(r)}
                          className="btn btn-secondary"
                          style={{ padding: "6px 14px", fontSize: "13px", minHeight: "36px" }}
                          title="Open detailed forensic report"
                        >
                          Deep-Dive
                        </button>

                        <button
                          onClick={() => handleReanalyze(r._id)}
                          disabled={reanalyzingId === r._id}
                          className="btn btn-secondary"
                          style={{ width: "36px", height: "36px", minHeight: "36px", padding: 0 }}
                          title="Re-analyze with current active engine weights"
                        >
                          <RefreshCw size={14} className={reanalyzingId === r._id ? "animate-spin" : ""} />
                        </button>

                        <button
                          onClick={() => setDeleteModalItem(r)}
                          className="btn btn-danger"
                          style={{ width: "36px", height: "36px", minHeight: "36px", padding: 0 }}
                          title="Delete review record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", paddingTop: "20px", marginTop: "16px", borderTop: "1px solid var(--border-subtle)", fontSize: "14px", color: "var(--text-secondary)" }}>
          <div>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems} reviews
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-secondary"
              style={{ minHeight: "38px", padding: "6px 14px", fontSize: "13px" }}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <span style={{ fontWeight: "700", padding: "0 8px" }}>
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn btn-secondary"
              style={{ minHeight: "38px", padding: "6px 14px", fontSize: "13px" }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalItem && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} className="animate-fade">
          <div className="card" style={{ width: "100%", maxWidth: "480px", border: "1px solid var(--risk-very-high-border)", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--risk-very-high)", marginBottom: "14px" }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "var(--text-primary)" }}>Confirm Deletion</h3>
            </div>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 20px" }}>
              Are you sure you want to delete the forensic record for product:
              <strong style={{ color: "var(--text-primary)", display: "block", marginTop: "6px" }}>"{deleteModalItem.product_name}"</strong>
              Reviewer: {deleteModalItem.reviewer_name} [{deleteModalItem._id}]
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="btn btn-danger"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All History Confirmation Modal */}
      {clearHistoryModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} className="animate-fade">
          <div className="card" style={{ width: "100%", maxWidth: "480px", border: "1px solid var(--risk-very-high-border)", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--risk-very-high)", marginBottom: "14px" }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "var(--text-primary)" }}>Clear Entire Review History</h3>
            </div>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 20px" }}>
              <strong style={{ color: "var(--risk-very-high)", display: "block", marginBottom: "6px" }}>Administrative Warning:</strong>
              This action will remove all {totalItems} stored review forensic records and reset database analytics.
              This cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setClearHistoryModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllConfirm}
                className="btn btn-danger"
              >
                Yes, Wipe All History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
