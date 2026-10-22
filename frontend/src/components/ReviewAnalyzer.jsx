import React, { useState, useEffect } from "react";
import {
  SearchCode,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Star,
  Layers,
  ArrowRight,
  Info,
  RotateCcw,
  FileText,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  Package,
  User,
  MessageSquare,
  Activity,
  Check,
  Save,
  History,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://127.0.0.1:5000/api";

const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Beauty",
  "Home/Kitchen",
  "Grocery",
  "Books",
  "Sports",
  "Other"
];

const PLATFORMS = [
  "Amazon",
  "Flipkart",
  "Google Reviews",
  "Trustpilot",
  "App Store",
  "Direct E-Commerce"
];

// Curated Sample Review Presets
const SAMPLE_PRESETS = [
  {
    title: "⚡ Critical Regression: Rating Mismatch",
    desc: "5★ rating with 'Very Bad Quality' headline and negative text",
    data: {
      product_name: "Sony Wireless Earbuds",
      product_id: "PROD-ELEC-009",
      category: "Electronics",
      reviewer_name: "John Customer",
      reviewer_id: "User884920",
      rating: 5,
      headline: "Very Bad Quality",
      review_text: "it stopped working after 2 days! Extremely disappointing",
      platform: "Amazon"
    }
  },
  {
    title: "🚨 Promotional Spam",
    desc: "Shout uppercase, commercial hype, and calls to action",
    data: {
      product_name: "Sony WH-1000XM5 Wireless Headphones",
      product_id: "PROD-ELEC-001",
      category: "Electronics",
      reviewer_name: "PromoBot_99",
      reviewer_id: "REV-BOT-99",
      rating: 5,
      headline: "AMAZING DEAL BUY NOW 100% RECOMMENDED!!!!",
      review_text: "AMAZING BEST EVER PRODUCT IN THE UNIVERSE!!! Buy this right now 100% recommended guaranteed satisfaction incredible deal run and buy don't miss out!!!!!",
      platform: "Amazon"
    }
  },
  {
    title: "🛡️ Authentic Nuanced Review",
    desc: "Balanced feedback, realistic details, genuine rating",
    data: {
      product_name: "Samsung Galaxy Watch 6",
      product_id: "PROD-ELEC-002",
      category: "Electronics",
      reviewer_name: "TechEnthusiast_Priya",
      reviewer_id: "REV-PR-402",
      rating: 4,
      headline: "Solid health tracker with minor battery limitations",
      review_text: "The sleep tracking accuracy and heart rate monitor are significantly improved over the Watch 5. However, the battery barely lasts 28 hours with the Always-On Display enabled, so expect daily charging.",
      platform: "Amazon"
    }
  },
  {
    title: "⚠️ Coordinated Competitor Smear",
    desc: "1★ rating with fraud accusations and zero product detail",
    data: {
      product_name: "Prestige Iris 750W Mixer Grinder",
      product_id: "PROD-HOME-001",
      category: "Home/Kitchen",
      reviewer_name: "AnonymousBuyer",
      reviewer_id: "REV-ANON-007",
      rating: 1,
      headline: "TOTAL FRAUD AND SCAM DO NOT BUY!!",
      review_text: "Horrible company complete fraud defective garbage scam rip-off boycott this seller waste of money useless trash never buy again!!!!!",
      platform: "Flipkart"
    }
  },
  {
    title: "🔄 Generic Fluff Review",
    desc: "Vague high praise applicable to any arbitrary item",
    data: {
      product_name: "Apple MacBook Air M3",
      product_id: "PROD-ELEC-003",
      category: "Electronics",
      reviewer_name: "QuickReviewer",
      reviewer_id: "REV-QR-100",
      rating: 5,
      headline: "Nice item",
      review_text: "Good product. Works well. Highly recommended. Fast delivery.",
      platform: "Amazon"
    }
  }
];

const INITIAL_FORM = {
  product_name: "Sony Wireless Earbuds",
  product_id: "PROD-ELEC-009",
  category: "Electronics",
  reviewer_name: "John Customer",
  reviewer_id: "User884920",
  rating: 5,
  headline: "Very Bad Quality",
  review_text: "it stopped working after 2 days! Extremely disappointing",
  platform: "Amazon",
  review_date: new Date().toISOString().substring(0, 10)
};

export default function ReviewAnalyzer({ onAnalysisComplete, onNavigateToHistory, onViewReport }) {
  const { token } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [autoSave, setAutoSave] = useState(true);
  const [persistenceStatus, setPersistenceStatus] = useState(null);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const handlePresetSelect = (e) => {
    const idx = e.target.value;
    if (idx === "") return;
    const preset = SAMPLE_PRESETS[parseInt(idx, 10)];
    if (preset) {
      setFormData(prev => ({
        ...prev,
        ...preset.data,
        review_date: new Date().toISOString().substring(0, 10)
      }));
      setFieldErrors({});
      setGeneralError("");
    }
  };

  const handleReset = () => {
    setFormData({
      product_name: "",
      product_id: "",
      category: "Electronics",
      reviewer_name: "",
      reviewer_id: "",
      rating: 5,
      headline: "",
      review_text: "",
      platform: "Amazon",
      review_date: new Date().toISOString().substring(0, 10)
    });
    setFieldErrors({});
    setGeneralError("");
    setCurrentResult(null);
    setPersistenceStatus(null);
  };

  // Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.product_name.trim()) errors.product_name = "Product title is required.";
    if (!formData.reviewer_name.trim()) errors.reviewer_name = "Reviewer display name is required.";
    if (!formData.category) errors.category = "Please select a category.";
    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      errors.rating = "Star rating must be between 1 and 5.";
    }
    if (!formData.review_text.trim()) {
      errors.review_text = "Review text is required.";
    } else if (formData.review_text.trim().length < 12) {
      errors.review_text = "Review text must be at least 12 characters.";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/reviews/analyze`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...formData,
          save_to_db: autoSave
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error || "Analysis failed.");
      }

      setCurrentResult(json.data);
      setPersistenceStatus({
        saved: json.saved,
        save_error: json.save_error || null,
        is_duplicate: json.is_duplicate,
        message: json.message,
        id: json.data._id
      });

      // If saved or existing in database, notify parent to refresh lists and dashboard
      if (json.saved && onAnalysisComplete) {
        onAnalysisComplete(json.data);
      }

      // Scroll smoothly to results section
      setTimeout(() => {
        const resultsEl = document.getElementById("analysis-results-section");
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (err) {
      setGeneralError(err.message || "An unexpected error occurred during review analysis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSave = async () => {
    if (!currentResult) return;
    setIsSavingManual(true);
    setGeneralError("");
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/reviews/save`, {
        method: "POST",
        headers,
        body: JSON.stringify(currentResult)
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error || "Database save failed.");
      }

      setPersistenceStatus({
        saved: true,
        save_error: null,
        is_duplicate: json.already_saved,
        message: json.message,
        id: json.data._id
      });

      if (onAnalysisComplete) {
        onAnalysisComplete(json.data);
      }
    } catch (err) {
      setGeneralError("Save error: " + err.message);
    } finally {
      setIsSavingManual(false);
    }
  };

  const wordCount = formData.review_text.trim() ? formData.review_text.trim().split(/\s+/).length : 0;
  const charCount = formData.review_text.length;

  return (
    <div className="space-y-6 animate-fade" style={{ width: "100%", maxWidth: "1280px", margin: "0 auto", padding: "24px 28px 48px" }}>
      
      {/* Page Title & Preset Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <SearchCode size={28} color="var(--primary)" />
            <span>Review Forensic Analyser</span>
          </h1>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginTop: "6px" }}>
            Evaluate consumer reviews for authenticity, sentiment alignment, and suspicious heuristic signals.
          </p>
        </div>

        {/* Optional Preset Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            Load Sample:
          </label>
          <select
            onChange={handlePresetSelect}
            defaultValue=""
            style={{ width: "260px", minHeight: "42px", padding: "8px 36px 8px 12px", fontSize: "14px" }}
          >
            <option value="">-- Choose sample review --</option>
            {SAMPLE_PRESETS.map((preset, idx) => (
              <option key={idx} value={idx}>
                {preset.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* General Error Banner */}
      {generalError && (
        <div style={{
          padding: "16px 20px",
          borderRadius: "var(--radius-md)",
          background: "var(--risk-very-high-bg)",
          border: "1px solid var(--risk-very-high-border)",
          color: "var(--risk-very-high)",
          fontSize: "15px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <XCircle size={20} style={{ flexShrink: 0 }} />
          <span>{generalError}</span>
        </div>
      )}

      {/* Analysis Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* SECTION 1: Product Details */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
            <Package size={22} color="var(--primary)" />
            <h2 className="section-title" style={{ margin: 0 }}>
              1. Product Details
            </h2>
          </div>

          <div className="grid-2" style={{ gap: "20px" }}>
            {/* Product Title (Required) */}
            <div>
              <label className="form-label">
                Product Title / Model Name <span style={{ color: "var(--risk-very-high)" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                style={{ borderColor: fieldErrors.product_name ? "var(--risk-very-high)" : undefined }}
              />
              {fieldErrors.product_name && (
                <p style={{ fontSize: "13px", color: "var(--risk-very-high)", marginTop: "6px" }}>
                  {fieldErrors.product_name}
                </p>
              )}
            </div>

            {/* Product Category (Required) */}
            <div>
              <label className="form-label">
                Product Category <span style={{ color: "var(--risk-very-high)" }}>*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ borderColor: fieldErrors.category ? "var(--risk-very-high)" : undefined }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {fieldErrors.category && (
                <p style={{ fontSize: "13px", color: "var(--risk-very-high)", marginTop: "6px" }}>
                  {fieldErrors.category}
                </p>
              )}
            </div>

            {/* Product ID or SKU (Optional) */}
            <div>
              <label className="form-label">
                Product ID or SKU (Optional)
              </label>
              <input
                type="text"
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                placeholder="e.g. PROD-ELEC-009 or SKU-8841"
              />
            </div>

            {/* Origin Platform (Optional) */}
            <div>
              <label className="form-label">
                Origin Platform (Optional)
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: Review Details */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
            <MessageSquare size={22} color="var(--accent-blue)" />
            <h2 className="section-title" style={{ margin: 0 }}>
              2. Review Details
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Reviewer Info Row */}
            <div className="grid-3" style={{ gap: "20px" }}>
              {/* Reviewer Name */}
              <div>
                <label className="form-label">
                  Reviewer Display Name <span style={{ color: "var(--risk-very-high)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.reviewer_name}
                  onChange={(e) => setFormData({ ...formData, reviewer_name: e.target.value })}
                  placeholder="e.g. John Customer"
                  style={{ borderColor: fieldErrors.reviewer_name ? "var(--risk-very-high)" : undefined }}
                />
                {fieldErrors.reviewer_name && (
                  <p style={{ fontSize: "13px", color: "var(--risk-very-high)", marginTop: "6px" }}>
                    {fieldErrors.reviewer_name}
                  </p>
                )}
              </div>

              {/* Reviewer ID */}
              <div>
                <label className="form-label">
                  Reviewer ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.reviewer_id}
                  onChange={(e) => setFormData({ ...formData, reviewer_id: e.target.value })}
                  placeholder="e.g. User884920"
                />
              </div>

              {/* Review Date */}
              <div>
                <label className="form-label">
                  Review Date
                </label>
                <input
                  type="date"
                  value={formData.review_date}
                  onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                />
              </div>
            </div>

            {/* Star Rating Selector */}
            <div>
              <label className="form-label">
                Assigned Star Rating <span style={{ color: "var(--risk-very-high)" }}>*</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid",
                        borderColor: formData.rating >= star ? "#F59E0B" : "var(--border-medium)",
                        background: formData.rating >= star ? "rgba(245, 158, 11, 0.15)" : "var(--bg-input)",
                        color: formData.rating >= star ? "#F59E0B" : "var(--text-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all var(--transition-fast)"
                      }}
                      title={`Rate ${star} Star${star > 1 ? "s" : ""}`}
                    >
                      <Star size={20} fill={formData.rating >= star ? "#F59E0B" : "none"} />
                      <span style={{ fontSize: "15px", fontWeight: "700" }}>{star}</span>
                    </button>
                  ))}
                </div>

                <span style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#F59E0B",
                  background: "rgba(245, 158, 11, 0.12)",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-md)"
                }}>
                  {formData.rating === 5 ? "5 Stars (Maximum Score)" : formData.rating === 1 ? "1 Star (Minimum Score)" : `${formData.rating} Stars`}
                </span>
              </div>
              {fieldErrors.rating && (
                <p style={{ fontSize: "13px", color: "var(--risk-very-high)", marginTop: "6px" }}>
                  {fieldErrors.rating}
                </p>
              )}
            </div>

            {/* Review Headline */}
            <div>
              <label className="form-label">
                Review Headline / Summary Line (Optional)
              </label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                placeholder="e.g. Very Bad Quality"
              />
            </div>

            {/* Full Review Text */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Full Review Text <span style={{ color: "var(--risk-very-high)" }}>*</span>
                </label>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", gap: "16px" }}>
                  <span>{wordCount} words</span>
                  <span>{charCount} / 4000 characters</span>
                </div>
              </div>
              <textarea
                value={formData.review_text}
                onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                placeholder="Paste or write the consumer review content here for heuristic inspection..."
                style={{
                  minHeight: "150px",
                  fontSize: "15px",
                  borderColor: fieldErrors.review_text ? "var(--risk-very-high)" : undefined
                }}
              />
              {fieldErrors.review_text && (
                <p style={{ fontSize: "13px", color: "var(--risk-very-high)", marginTop: "6px" }}>
                  {fieldErrors.review_text}
                </p>
              )}
            </div>
          </div>

          {/* Database Persistence Option */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-surface)",
            padding: "14px 20px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-medium)",
            marginTop: "20px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                id="auto-save-checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--primary)" }}
              />
              <label htmlFor="auto-save-checkbox" style={{ fontSize: "14px", fontWeight: "600", cursor: "pointer", color: "var(--text-primary)", margin: 0 }}>
                Persist analysis to database automatically
              </label>
            </div>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {autoSave ? "Saves full forensic results to database history" : "Evaluation only (requires manual save)"}
            </span>
          </div>

          {/* Form Action Buttons */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            paddingTop: "24px",
            marginTop: "16px",
            borderTop: "1px solid var(--border-subtle)"
          }}>
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary"
            >
              <RotateCcw size={16} />
              <span>Reset Form</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg"
            >
              {isSubmitting ? (
                <>
                  <span style={{ width: "18px", height: "18px", border: "2px solid #FFF", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span>Analysing Review Heuristics...</span>
                </>
              ) : (
                <>
                  <span>Analyse Review</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* SECTION 3: Analysis Results */}
      {currentResult && (
        <div id="analysis-results-section" className="card animate-fade" style={{ border: "2px solid var(--primary)", padding: "32px" }}>
          
          {/* Persistence Status Feedback Banner */}
          {persistenceStatus && (
            <div style={{
              marginBottom: "24px",
              padding: "16px 20px",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
              background: persistenceStatus.saved
                ? "rgba(16, 185, 129, 0.12)"
                : persistenceStatus.save_error
                ? "rgba(239, 68, 68, 0.12)"
                : persistenceStatus.is_duplicate
                ? "rgba(245, 158, 11, 0.12)"
                : "rgba(99, 102, 241, 0.12)",
              border: `1px solid ${
                persistenceStatus.saved
                  ? "rgba(16, 185, 129, 0.3)"
                  : persistenceStatus.save_error
                  ? "rgba(239, 68, 68, 0.3)"
                  : persistenceStatus.is_duplicate
                  ? "rgba(245, 158, 11, 0.3)"
                  : "rgba(99, 102, 241, 0.3)"
              }`,
              color: persistenceStatus.saved
                ? "var(--risk-low)"
                : persistenceStatus.save_error
                ? "var(--risk-very-high)"
                : persistenceStatus.is_duplicate
                ? "#F59E0B"
                : "var(--primary)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {persistenceStatus.saved ? (
                  <CheckCircle2 size={22} color="var(--risk-low)" />
                ) : persistenceStatus.save_error ? (
                  <AlertCircle size={22} color="var(--risk-very-high)" />
                ) : persistenceStatus.is_duplicate ? (
                  <AlertTriangle size={22} color="#F59E0B" />
                ) : (
                  <Info size={22} color="var(--primary)" />
                )}
                <div>
                  <span style={{ fontWeight: "700", fontSize: "15px", display: "block" }}>
                    {persistenceStatus.saved
                      ? "✓ Review Persisted to Database"
                      : persistenceStatus.save_error
                      ? "⚠️ Analysis Succeeded, but Database Save Failed"
                      : persistenceStatus.is_duplicate
                      ? "⚠️ Matching Record in Database"
                      : "ℹ️ Evaluation-Only Analysis (Unsaved)"}
                  </span>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px", display: "block" }}>
                    {persistenceStatus.save_error
                      ? `Error: ${persistenceStatus.save_error}`
                      : persistenceStatus.message}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                {persistenceStatus.saved && onNavigateToHistory && (
                  <button
                    type="button"
                    onClick={() => onNavigateToHistory(persistenceStatus.id)}
                    className="btn btn-secondary"
                    style={{ padding: "8px 16px", fontSize: "13px", minHeight: "38px" }}
                  >
                    <History size={15} />
                    <span>View in Review History →</span>
                  </button>
                )}

                {persistenceStatus.saved && onViewReport && (
                  <button
                    type="button"
                    onClick={() => onViewReport(currentResult)}
                    className="btn btn-primary"
                    style={{ padding: "8px 16px", fontSize: "13px", minHeight: "38px" }}
                  >
                    <FileText size={15} />
                    <span>Open Forensic Report →</span>
                  </button>
                )}

                {persistenceStatus.save_error && (
                  <button
                    type="button"
                    onClick={handleManualSave}
                    disabled={isSavingManual}
                    className="btn btn-primary"
                    style={{ padding: "8px 18px", fontSize: "13px", minHeight: "38px" }}
                  >
                    <Save size={15} />
                    <span>{isSavingManual ? "Retrying..." : "Retry Database Save"}</span>
                  </button>
                )}

                {!persistenceStatus.saved && !persistenceStatus.save_error && !persistenceStatus.is_duplicate && (
                  <button
                    type="button"
                    onClick={handleManualSave}
                    disabled={isSavingManual}
                    className="btn btn-primary"
                    style={{ padding: "8px 18px", fontSize: "13px", minHeight: "38px" }}
                  >
                    <Save size={15} />
                    <span>{isSavingManual ? "Saving..." : "Save to Database"}</span>
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Section 3 Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ShieldCheck size={24} color="var(--primary)" />
              <h2 className="section-title" style={{ margin: 0 }}>
                3. Analysis Results
              </h2>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => onAnalysisComplete && onAnalysisComplete(currentResult)}
                className="btn btn-primary"
                style={{ padding: "10px 18px", fontSize: "14px" }}
              >
                <FileText size={16} />
                <span>Open Detailed Forensic Report →</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(currentResult, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `forensic_report_${currentResult._id || Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="btn btn-secondary"
                style={{ padding: "10px 14px", fontSize: "14px" }}
                title="Export JSON"
              >
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Prominent Score & Assessment Card */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "24px",
            background: "var(--bg-surface)",
            padding: "24px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-medium)",
            marginBottom: "24px"
          }}>
            {/* Risk Score */}
            <div>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                Heuristic Risk Score
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "8px" }}>
                <span style={{
                  fontSize: "44px",
                  fontWeight: "900",
                  lineHeight: 1,
                  color: currentResult.risk_score <= 24 ? "var(--risk-low)" : currentResult.risk_score <= 49 ? "var(--risk-mod)" : "var(--risk-very-high)"
                }}>
                  {currentResult.risk_score}
                </span>
                <span style={{ fontSize: "18px", fontWeight: "600", color: "var(--text-muted)" }}>/ 100</span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px", margin: 0 }}>
                Weighted heuristic score across 20 empirical rules.
              </p>
            </div>

            {/* Risk Level & Assessment */}
            <div>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                Classification
              </span>
              <div style={{ marginTop: "10px" }}>
                <span className={`badge ${
                  currentResult.risk_score <= 24 ? "badge-low" : currentResult.risk_score <= 49 ? "badge-mod" : "badge-very-high"
                }`} style={{ fontSize: "14px", padding: "6px 16px", textTransform: "none", fontWeight: "700" }}>
                  {currentResult.classification_label || `${(currentResult.risk_level || (currentResult.risk_score <= 24 ? "Low" : currentResult.risk_score <= 49 ? "Moderate" : currentResult.risk_score <= 74 ? "High" : "Very High")).toUpperCase()} RISK — ${currentResult.assessment || (currentResult.risk_score <= 24 ? "Appears Genuine" : currentResult.risk_score <= 49 ? "Needs Review" : currentResult.risk_score <= 74 ? "Suspicious" : "Strongly Suspicious")}`}
                </span>
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "10px", margin: 0, lineHeight: "1.5" }}>
                {currentResult.assessment_explanation || (
                  currentResult.risk_score === 0 && (!currentResult.triggered_rules || currentResult.triggered_rules.length === 0)
                    ? "No suspicious indicators were detected across empirical heuristic rules. The review exhibits organic language patterns, though heuristic scoring cannot definitively prove authenticity."
                    : currentResult.risk_score <= 24
                    ? "Low risk heuristic score. Content exhibits organic feedback patterns with minimal risk signals, appearing genuine under empirical rule tests."
                    : currentResult.risk_score <= 49
                    ? "Moderate risk signals or mild stylistic anomalies detected. Human verification is recommended."
                    : currentResult.risk_score <= 74
                    ? "Suspicious patterns detected across multiple forensic heuristic indicators."
                    : "Strongly suspicious patterns detected across critical heuristic indicators."
                )}
              </p>
            </div>
          </div>

          {/* Sentiment & Rating Consistency Banner */}
          {currentResult.sentiment_analysis && (
            <div style={{
              padding: "20px 24px",
              borderRadius: "var(--radius-lg)",
              background: currentResult.sentiment_analysis.rating_consistency?.is_consistent ? "var(--bg-surface)" : "rgba(245, 158, 11, 0.12)",
              border: `1px solid ${currentResult.sentiment_analysis.rating_consistency?.is_consistent ? "var(--border-medium)" : "rgba(245, 158, 11, 0.35)"}`,
              marginBottom: "24px"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Activity size={20} color={currentResult.sentiment_analysis.rating_consistency?.is_consistent ? "var(--primary)" : "#F59E0B"} />
                  <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
                    Sentiment & Rating Consistency
                  </span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span className={`badge ${
                    currentResult.sentiment_analysis.label === "Positive"
                      ? "badge-low"
                      : currentResult.sentiment_analysis.label === "Negative"
                      ? "badge-very-high"
                      : "badge-mod"
                  }`} style={{ fontSize: "12px" }}>
                    {currentResult.sentiment_analysis.label} Sentiment
                  </span>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-full)",
                    background: currentResult.sentiment_analysis.rating_consistency?.is_consistent ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.2)",
                    color: currentResult.sentiment_analysis.rating_consistency?.is_consistent ? "var(--risk-low)" : "#F59E0B",
                    border: `1px solid ${currentResult.sentiment_analysis.rating_consistency?.is_consistent ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.35)"}`
                  }}>
                    {currentResult.sentiment_analysis.rating_consistency?.is_consistent ? "Rating & Sentiment Consistent" : "Rating-Sentiment Contradiction / Mismatch"}
                  </span>
                </div>
              </div>

              <p style={{
                fontSize: "15px",
                color: currentResult.sentiment_analysis.rating_consistency?.is_consistent ? "var(--text-secondary)" : "#F59E0B",
                margin: 0,
                lineHeight: "1.6"
              }}>
                {currentResult.sentiment_analysis.rating_consistency?.explanation || "Sentiment evaluation complete."}
              </p>
            </div>
          )}

          {/* Main Reasons Behind the Score */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
              <ShieldAlert size={18} color="var(--primary)" />
              <span>Main Reasons Behind This Score</span>
            </h3>

            {currentResult.triggered_rules && currentResult.triggered_rules.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {currentResult.triggered_rules.map((rule, idx) => (
                  <div key={idx} style={{
                    padding: "16px 20px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-medium)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px"
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
                          {rule.rule_name || rule.name || "Detection Rule"}
                        </span>
                        <span className={`badge ${rule.severity === "High" ? "badge-very-high" : "badge-mod"}`} style={{ fontSize: "11px" }}>
                          {rule.severity} Severity
                        </span>
                      </div>
                      <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
                        {rule.evidence}
                      </p>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={{
                        fontSize: "15px",
                        fontWeight: "800",
                        color: "var(--risk-very-high)",
                        background: "var(--risk-very-high-bg)",
                        padding: "4px 10px",
                        borderRadius: "var(--radius-md)",
                        display: "inline-block"
                      }}>
                        +{rule.effective_contribution || rule.weight || rule.base_weight || 0} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "24px", textAlign: "center", background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-medium)" }}>
                <CheckCircle2 size={32} color="var(--risk-low)" style={{ margin: "0 auto 10px" }} />
                <p style={{ fontSize: "16px", fontWeight: "700", color: "var(--risk-low)", margin: 0 }}>
                  No Suspicious Heuristic Indicators Detected
                </p>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "6px 0 0", maxWidth: "600px", marginInline: "auto", lineHeight: "1.5" }}>
                  No suspicious indicators were detected across empirical rules. Note that while the review appears genuine, a risk score of 0 does not definitively prove authenticity.
                </p>
              </div>
            )}
          </div>

          {/* Expandable Technical Details & Evidence Accordion */}
          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "16px" }}>
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              <span>{showTechnicalDetails ? "Hide Technical Details & Rule Specifications" : "Show Technical Details & Rule Specifications"}</span>
              {showTechnicalDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showTechnicalDetails && (
              <div className="animate-fade" style={{ marginTop: "16px" }}>
                <div className="table-container">
                  <table className="table-custom">
                    <thead>
                      <tr>
                        <th>Rule ID</th>
                        <th>Indicator Name</th>
                        <th>Family</th>
                        <th>Severity</th>
                        <th>Effective Weight</th>
                        <th>Empirical Evidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentResult.triggered_rules || []).map((rule, idx) => (
                        <tr key={idx}>
                          <td className="font-mono" style={{ fontWeight: "700", color: "var(--primary)" }}>
                            {rule.rule_id || rule.id}
                          </td>
                          <td style={{ fontWeight: "600" }}>
                            {rule.rule_name || rule.name}
                          </td>
                          <td>
                            <span style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "4px", background: "var(--bg-elevated)" }}>
                              {rule.group}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${rule.severity === "High" ? "badge-very-high" : "badge-mod"}`} style={{ fontSize: "11px" }}>
                              {rule.severity}
                            </span>
                          </td>
                          <td style={{ fontWeight: "700" }}>
                            +{rule.effective_contribution || rule.weight || 0} pts
                          </td>
                          <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                            {rule.evidence}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
