import React, { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import TopNavbar from "./components/TopNavbar";
import Sidebar from "./components/Sidebar";
import OverviewAnalytics from "./components/OverviewAnalytics";
import ReviewAnalyzer from "./components/ReviewAnalyzer";
import AnalysisResultCard from "./components/AnalysisResultCard";
import BatchForensics from "./components/BatchForensics";
import ReviewHistory from "./components/ReviewHistory";
import ReviewerAnalytics from "./components/ReviewerAnalytics";
import AdminPanel from "./components/AdminPanel";
import AdminLogin from "./components/AdminLogin";
import { useAuth } from "./context/AuthContext";
import { X } from "lucide-react";

const API_BASE = "http://127.0.0.1:5000/api";

function AppContent() {
  const { user, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard"); // Default landing page is Dashboard
  const [inspectingReport, setInspectingReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastReport, setLastReport] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [highlightReviewId, setHighlightReviewId] = useState(null);
  const [systemStatus, setSystemStatus] = useState({
    status: "healthy",
    dbEngine: "Resilient Storage",
    ruleVersion: "2.4.0"
  });

  // Fetch initial telemetry and seed report
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(res => res.json())
      .then(data => {
        if (data.database) {
          setSystemStatus({
            status: data.status,
            dbEngine: data.database.engine,
            ruleVersion: data.version
          });
        }
      })
      .catch(() => {});

    // Fetch initial sample review for the forensic report view
    fetch(`${API_BASE}/reviews/history?limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          setLastReport(data.data[0]);
        }
      })
      .catch(() => {});
  }, []);

  // Handler when a review is analyzed or selected for report view
  const handleViewReport = (report) => {
    setLastReport(report);
    setInspectingReport(report);
  };

  const handleAnalysisComplete = (savedRecord) => {
    if (savedRecord) {
      setLastReport(savedRecord);
      setHighlightReviewId(savedRecord._id || null);
    }
    // Auto-refresh Review History, Admin Panel, and Dashboard statistics
    setRefreshTrigger(prev => prev + 1);
  };

  const handleNavigateToHistory = (reviewId) => {
    if (reviewId) {
      setHighlightReviewId(reviewId);
    }
    // Ensure fresh data is fetched when navigating
    setRefreshTrigger(prev => prev + 1);
    setActiveTab("history");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReanalyze = async (reviewId) => {
    try {
      const res = await fetch(`${API_BASE}/reviews/${reviewId}/reanalyze`, {
        method: "POST"
      });
      const json = await res.json();
      if (json.success && json.data) {
        setLastReport(json.data);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (e) {
      console.error("Re-analyze error:", e);
    }
  };

  return (
    <div className="app-shell">
      {/* Sidebar Navigation - All tabs including Admin are directly visible and accessible */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="main-viewport">
        <TopNavbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          systemStatus={systemStatus}
        />

        <main className="page-content">
          {activeTab === "dashboard" && (
            <OverviewAnalytics
              onViewReport={handleViewReport}
              onNavigateToAnalyze={() => setActiveTab("analyze")}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === "analyze" && (
            <ReviewAnalyzer
              onAnalysisComplete={handleAnalysisComplete}
              onNavigateToHistory={handleNavigateToHistory}
              onViewReport={handleViewReport}
            />
          )}

          {activeTab === "history" && (
            <ReviewHistory
              onViewReport={handleViewReport}
              refreshTrigger={refreshTrigger}
              highlightReviewId={highlightReviewId}
            />
          )}

          {activeTab === "batch" && (
            <BatchForensics
              onNavigateToHistory={() => {
                setRefreshTrigger(prev => prev + 1);
                setActiveTab("history");
              }}
            />
          )}

          {activeTab === "reviewer" && (
            <div style={{ width: "100%", maxWidth: "1360px", margin: "0 auto", padding: "24px 28px 48px" }}>
              <ReviewerAnalytics onViewReport={handleViewReport} />
            </div>
          )}

          {/* ADMIN TAB: Renders AdminLogin if not authenticated as admin; AdminPanel when authenticated */}
          {activeTab === "admin" && (
            isAdmin ? (
              <AdminPanel
                onViewReport={handleViewReport}
                refreshTrigger={refreshTrigger}
                onLogout={() => {
                  logout();
                  setActiveTab("dashboard");
                }}
              />
            ) : (
              <AdminLogin
                onCancel={() => setActiveTab("dashboard")}
                onLoginSuccess={() => setActiveTab("admin")}
              />
            )
          )}

          {/* Deep-Dive Inspection Modal */}
          {inspectingReport && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                backdropFilter: "blur(4px)",
                zIndex: 9999,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "20px"
              }}
              onClick={() => setInspectingReport(null)}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: "1150px",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  backgroundColor: "var(--bg-main)",
                  borderRadius: "16px",
                  border: "1px solid var(--border-medium)",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                  padding: "24px",
                  position: "relative"
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--text-primary)" }}>
                    Review Forensic Report Deep-Dive
                  </h3>
                  <button
                    onClick={() => setInspectingReport(null)}
                    className="btn btn-secondary"
                    style={{ padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <X size={16} />
                    <span>Close</span>
                  </button>
                </div>
                <AnalysisResultCard
                  report={inspectingReport}
                  onReanalyze={async (id) => {
                    await handleReanalyze(id);
                    setInspectingReport(null);
                  }}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
