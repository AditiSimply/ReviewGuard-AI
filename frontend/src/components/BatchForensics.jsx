import React, { useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Layers,
  ArrowRight,
  RefreshCw,
  FileText
} from "lucide-react";

const API_BASE = "http://127.0.0.1:5000/api";

const SAMPLE_CSV_CONTENT = `product_name,category,reviewer_name,rating,review_text,headline,platform
"Sony WH-1000XM5 Wireless Headphones",Electronics,"Alex_M",5,"AMAZING BEST EVER PRODUCT!!! Buy this right now 100% recommended guaranteed satisfaction incredible deal run and buy don't miss out!!!!!","MUST BUY NOW","Amazon"
"Sony WH-1000XM5 Wireless Headphones",Electronics,"Sarah_P",4,"Battery lasts 28 hours with ANC on. Sound is balanced though headband has minor pressure after 3 hours.","Good ANC","Flipkart"
"CeraVe Hydrating Facial Cleanser",Beauty,"Pooja_Bot",1,"Stunning holy grail product! Best lip balm ever made, 500 stars to this divine gift!!","Holy Grail","Amazon"
"Organic Extra Virgin Olive Oil 1L",Grocery,"ChefDave",5,"Rich peppery finish, perfect for fresh salads and bread dipping. Dark bottle protects from oxidation.","Authentic taste","Web"
"Invalid Entry 1",Electronics,"BadUser",6,"Rating 6 is invalid and should be rejected with row-level error.","Too high rating","Amazon"
"Invalid Entry 2",Grocery,"EmptyText",4,"","Missing review text","Amazon"`;

export default function BatchForensics({ onNavigateToHistory }) {
  const [file, setFile] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchResults, setBatchResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.name.toLowerCase().endsWith(".csv")) {
        setErrorMessage("Please select a valid .csv file.");
        return;
      }
      setFile(selected);
      setErrorMessage("");
      setPreviewData(null);
      setBatchResults(null);
    }
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "reviewguard_sample_batch.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = async () => {
    if (!file) return;
    setIsPreviewing(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/batch/preview-csv`, {
        method: "POST",
        body: formData
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to preview CSV file.");
      }

      setPreviewData(json);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleProcessBatch = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(15);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const progressTimer = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 400);

    try {
      const res = await fetch(`${API_BASE}/batch/process-batch`, {
        method: "POST",
        body: formData
      });

      const json = await res.json();
      clearInterval(progressTimer);
      setProgress(100);

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Batch analysis failed.");
      }

      setBatchResults(json);
    } catch (err) {
      clearInterval(progressTimer);
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade" style={{ width: "100%", maxWidth: "1360px", margin: "0 auto", padding: "24px 28px 48px" }}>
      
      {/* Top Banner */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Layers size={28} color="var(--primary)" />
              <span>Batch CSV Review Forensics</span>
            </h1>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginTop: "6px" }}>
              Bulk review ingestion, schema pre-validation, intra-batch duplicate checks, and dual CSV exports.
            </p>
          </div>

          <button
            onClick={handleDownloadSample}
            className="btn btn-secondary"
            style={{ padding: "10px 18px", fontSize: "14px" }}
            title="Download pre-configured CSV with sample valid and invalid rows"
          >
            <FileSpreadsheet size={18} color="var(--risk-low)" />
            <span>Download Sample Template</span>
          </button>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <div className="card" style={{ padding: "36px", textAlign: "center", border: "2px dashed var(--border-medium)" }}>
        <Upload size={40} style={{ margin: "0 auto 12px", color: "var(--primary)", opacity: 0.8 }} />
        <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 6px", color: "var(--text-primary)" }}>
          Select or Drop Review CSV File
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 auto 18px", maxWidth: "600px" }}>
          Required CSV Headers: <code className="font-mono" style={{ color: "var(--primary)", background: "var(--bg-surface)", padding: "2px 6px", borderRadius: "4px" }}>product_name, category, reviewer_name, rating, review_text</code>
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "14px" }}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            id="csv-upload-input"
            style={{ display: "none" }}
          />
          <label
            htmlFor="csv-upload-input"
            className="btn btn-primary"
            style={{ padding: "12px 24px", fontSize: "15px", cursor: "pointer" }}
          >
            Browse CSV File
          </label>

          {file && (
            <span style={{ fontSize: "14px", fontWeight: "600", background: "var(--bg-surface)", padding: "10px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-medium)" }}>
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </span>
          )}

          {file && !previewData && !batchResults && (
            <button
              onClick={handlePreview}
              disabled={isPreviewing}
              className="btn btn-secondary"
              style={{ padding: "12px 20px", fontSize: "15px" }}
            >
              {isPreviewing ? "Validating Rows..." : "Validate & Preview Rows"}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
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
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Pre-validation Preview Results */}
      {previewData && !batchResults && (
        <div className="card space-y-5" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "18px" }}>
            <div>
              <h3 className="section-title" style={{ margin: 0 }}>
                Pre-Validation Summary for "{previewData.filename}"
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
                {previewData.totalRows} rows parsed ({previewData.validCount} valid, {previewData.invalidCount} invalid)
              </p>
            </div>

            <button
              onClick={handleProcessBatch}
              disabled={isProcessing || previewData.validCount === 0}
              className="btn btn-primary btn-lg"
            >
              {isProcessing ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <RefreshCw size={18} className="animate-spin" />
                  Processing Heuristics ({progress}%)...
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>Execute Heuristics on {previewData.validCount} Valid Rows</span>
                  <ArrowRight size={18} />
                </span>
              )}
            </button>
          </div>

          {/* Validation Metrics Grid */}
          <div className="grid-3" style={{ gap: "16px", textAlign: "center" }}>
            <div style={{ padding: "18px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border-medium)" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Total Ingested</span>
              <p style={{ fontSize: "28px", fontWeight: "900", color: "var(--text-primary)", margin: "8px 0 0" }}>{previewData.totalRows}</p>
            </div>
            <div style={{ padding: "18px", borderRadius: "var(--radius-md)", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--risk-low)" }}>Valid Rows</span>
              <p style={{ fontSize: "28px", fontWeight: "900", color: "var(--risk-low)", margin: "8px 0 0" }}>{previewData.validCount}</p>
            </div>
            <div style={{ padding: "18px", borderRadius: "var(--radius-md)", background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.3)" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--risk-very-high)" }}>Rejected Rows</span>
              <p style={{ fontSize: "28px", fontWeight: "900", color: "var(--risk-very-high)", margin: "8px 0 0" }}>{previewData.invalidCount}</p>
            </div>
          </div>

          {/* Rejected Rows Table if any */}
          {previewData.invalidRows && previewData.invalidRows.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: "700", color: "var(--risk-very-high)", marginBottom: "12px" }}>
                <AlertCircle size={18} />
                <span>Row-Level Validation Errors ({previewData.invalidRows.length} errors)</span>
              </div>
              <div className="table-container">
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>Row #</th>
                      <th>Product Title</th>
                      <th>Reviewer</th>
                      <th>Rating</th>
                      <th>Exact Reason for Rejection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.invalidRows.map((err, idx) => (
                      <tr key={idx}>
                        <td className="font-mono" style={{ fontWeight: "800", color: "var(--risk-very-high)" }}>{err.rowNumber}</td>
                        <td style={{ fontWeight: "600" }}>{err.data?.product_name || "N/A"}</td>
                        <td>{err.data?.reviewer_name || "N/A"}</td>
                        <td style={{ fontWeight: "700", color: "#F59E0B" }}>{err.data?.rating ?? "N/A"}</td>
                        <td style={{ color: "var(--risk-very-high)", fontWeight: "600" }}>{err.errorSummary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar during execution */}
      {isProcessing && (
        <div className="card space-y-3" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "15px", fontWeight: "600" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary)" }}>
              <RefreshCw size={18} className="animate-spin" /> Running 20 Heuristic Rules on Batch...
            </span>
            <span className="font-mono">{progress}%</span>
          </div>
          <div style={{ width: "100%", height: "10px", borderRadius: "999px", background: "var(--bg-input)", overflow: "hidden" }}>
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #4F46E5, #06B6D4)",
                transition: "width 0.3s ease",
                borderRadius: "999px"
              }}
            />
          </div>
        </div>
      )}

      {/* Batch Processing Final Results & Dual Exports */}
      {batchResults && (
        <div className="card space-y-5 animate-fade" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "18px" }}>
            <div>
              <h3 className="section-title" style={{ margin: 0 }}>
                Batch Forensic Processing Completed
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
                {batchResults.summary?.analyzedCount} reviews evaluated and saved into persistent database.
              </p>
            </div>

            {/* Dual CSV Downloads */}
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <a
                href={`${API_BASE}/batch/export-results`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ padding: "10px 18px", fontSize: "14px", textDecoration: "none" }}
                title="Download CSV of all analyzed reviews and risk scores"
              >
                <Download size={16} color="var(--risk-low)" />
                <span>Export Results CSV</span>
              </a>

              {batchResults.summary?.rejectedCount > 0 && (
                <a
                  href={`${API_BASE}/batch/export-errors`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: "10px 18px", fontSize: "14px", textDecoration: "none" }}
                  title="Download CSV of rejected rows and validation failures"
                >
                  <Download size={16} color="var(--risk-very-high)" />
                  <span>Export Errors CSV</span>
                </a>
              )}
            </div>
          </div>

          {/* Result Counts Breakdown */}
          <div className="grid-4" style={{ gap: "16px", textAlign: "center" }}>
            <div style={{ padding: "16px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border-medium)" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Total Analysed</span>
              <p style={{ fontSize: "28px", fontWeight: "900", color: "var(--text-primary)", margin: "8px 0 0" }}>{batchResults.summary?.analyzedCount}</p>
            </div>
            <div style={{ padding: "16px", borderRadius: "var(--radius-md)", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--risk-low)" }}>Appears Genuine</span>
              <p style={{ fontSize: "28px", fontWeight: "900", color: "var(--risk-low)", margin: "8px 0 0" }}>{batchResults.summary?.appearsGenuine ?? batchResults.summary?.likelyGenuine}</p>
            </div>
            <div style={{ padding: "16px", borderRadius: "var(--radius-md)", background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "#F59E0B" }}>Needs Review</span>
              <p style={{ fontSize: "28px", fontWeight: "900", color: "#F59E0B", margin: "8px 0 0" }}>{batchResults.summary?.needsReview}</p>
            </div>
            <div style={{ padding: "16px", borderRadius: "var(--radius-md)", background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.3)" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--risk-very-high)" }}>Suspicious</span>
              <p style={{ fontSize: "28px", fontWeight: "900", color: "var(--risk-very-high)", margin: "8px 0 0" }}>{batchResults.summary?.suspicious}</p>
            </div>
          </div>

          {/* Processed Results Table */}
          <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Product Title</th>
                  <th>Reviewer</th>
                  <th>Rating</th>
                  <th>Risk Score</th>
                  <th>Assessment</th>
                  <th>Duplicate Status</th>
                  <th>Triggered Indicators</th>
                </tr>
              </thead>
              <tbody>
                {batchResults.results?.map((r) => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: "600", maxWidth: "240px" }} className="truncate">{r.product_name}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{r.reviewer_name}</td>
                    <td style={{ fontWeight: "700", color: "#F59E0B" }}>{r.rating}★</td>
                    <td className="font-mono" style={{ fontWeight: "800", color: "var(--text-primary)" }}>{r.risk_score} / 100</td>
                    <td>
                      <span className={`badge ${
                        r.risk_score <= 24 ? "badge-low" : r.risk_score <= 49 ? "badge-mod" : r.risk_score <= 74 ? "badge-high" : "badge-very-high"
                      }`}>
                        {r.assessment}
                      </span>
                    </td>
                    <td>
                      {r.duplicate_forensics?.is_exact_duplicate ? (
                        <span style={{ color: "var(--risk-very-high)", fontWeight: "700" }}>Exact Duplicate</span>
                      ) : r.duplicate_forensics?.is_near_duplicate ? (
                        <span style={{ color: "#F59E0B", fontWeight: "700" }}>Near Duplicate</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>Unique</span>
                      )}
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {(r.triggered_rules || []).length} triggered
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
