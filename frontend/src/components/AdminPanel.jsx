import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Sliders,
  Users,
  Package,
  ScrollText,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Download,
  Search,
  Shield,
  Activity,
  UserCheck,
  FileText,
  Filter,
  RefreshCw,
  Eye,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Lock,
  LogOut
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

export default function AdminPanel({ onViewReport, refreshTrigger, onLogout }) {
  const { user, token, logout } = useAuth();
  const getAuthHeaders = (extraHeaders = {}) => {
    const headers = { ...extraHeaders };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };
  const [activeTab, setActiveTab] = useState("reviews"); // 'reviews' | 'rules' | 'users' | 'products' | 'audit' | 'health'

  // Global Status Banner
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Generic Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    isDanger: true,
    action: null
  });

  // -------------------------------------------------------------
  // 1. REVIEWS MANAGEMENT STATE
  // -------------------------------------------------------------
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewCategory, setReviewCategory] = useState("all");
  const [reviewRisk, setReviewRisk] = useState("all");
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPagination, setReviewPagination] = useState({ page: 1, limit: 12, totalPages: 1, totalItems: 0 });
  const [selectedReviewIds, setSelectedReviewIds] = useState(new Set());

  // -------------------------------------------------------------
  // 2. RULES CONFIGURATION STATE
  // -------------------------------------------------------------
  const [ruleConfig, setRuleConfig] = useState(null);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesSaving, setRulesSaving] = useState(false);

  // -------------------------------------------------------------
  // 3. USERS MANAGEMENT STATE
  // -------------------------------------------------------------
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [newUserModal, setNewUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({ username: "", email: "", password: "", role: "analyst", name: "" });

  // -------------------------------------------------------------
  // 4. CATALOGUE STATE
  // -------------------------------------------------------------
  const [productsList, setProductsList] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [newProductModal, setNewProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({ name: "", category: "Electronics", keywords: "", product_id: "" });

  // -------------------------------------------------------------
  // 5. AUDIT LOGS STATE
  // -------------------------------------------------------------
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // -------------------------------------------------------------
  // 6. SYSTEM HEALTH & DIAGNOSTICS STATE
  // -------------------------------------------------------------
  const [systemHealth, setSystemHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const showNotification = (message, type = "success") => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback(null);
    }, 6000);
  };

  // =============================================================
  // FETCH HANDLERS
  // =============================================================

  // Fetch Reviews with Pagination & Filters
  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const params = new URLSearchParams({
        page: reviewPage,
        limit: 12,
        search: reviewSearch,
        category: reviewCategory,
        risk_level: reviewRisk
      });

      const res = await fetch(`${API_BASE}/admin/reviews?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.message || "Failed to load reviews.");

      setReviewsList(json.data || []);
      if (json.pagination) {
        setReviewPagination(json.pagination);
      }
    } catch (err) {
      showNotification(`Review loading error: ${err.message}`, "error");
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch Rules
  const fetchRules = async () => {
    setRulesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/rules`, {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success && json.data) setRuleConfig(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setRulesLoading(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success && json.data) setUsersList(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/products`, {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success && json.data) setProductsList(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs`, {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success && json.data) setAuditLogs(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setAuditLoading(false);
    }
  };

  // Fetch System Health Telemetry
  const fetchSystemHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/system-health`, {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) {
        setSystemHealth(json);
      } else {
        showNotification(json.error || "Failed to load system diagnostics.", "error");
      }
    } catch (e) {
      showNotification(`System health error: ${e.message}`, "error");
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reviews") fetchReviews();
    else if (activeTab === "rules") fetchRules();
    else if (activeTab === "users") fetchUsers();
    else if (activeTab === "products") fetchProducts();
    else if (activeTab === "audit") fetchAuditLogs();
    else if (activeTab === "health") fetchSystemHealth();
  }, [activeTab, reviewPage, reviewCategory, reviewRisk]);

  // When a review is saved or analyzed, auto-refresh the Admin reviews list
  useEffect(() => {
    if (refreshTrigger) {
      setReviewPage(1);
      setReviewSearch("");
      setReviewCategory("all");
      setReviewRisk("all");
      fetchReviews();
      fetchAuditLogs();
    }
  }, [refreshTrigger]);

  // Trigger search on debounce or button
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setReviewPage(1);
    fetchReviews();
  };

  // =============================================================
  // REVIEWS MANAGEMENT ACTIONS
  // =============================================================

  const toggleSelectAllReviews = () => {
    if (selectedReviewIds.size === reviewsList.length && reviewsList.length > 0) {
      setSelectedReviewIds(new Set());
    } else {
      setSelectedReviewIds(new Set(reviewsList.map(r => r._id)));
    }
  };

  const toggleSelectReview = (id) => {
    const updated = new Set(selectedReviewIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedReviewIds(updated);
  };

  // Delete Individual Review
  const confirmDeleteReview = (review) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Review Record",
      message: `Are you sure you want to permanently delete the review record for "${review.product_name}" by reviewer "${review.reviewer_name || 'Anonymous'}" (ID: ${review._id})? This action cannot be undone.`,
      confirmText: "Delete Review",
      isDanger: true,
      action: async () => {
        try {
          const res = await fetch(`${API_BASE}/admin/reviews/${review._id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
          });
          const json = await res.json();
          if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete review record.");

          showNotification(`Review record [${review._id}] successfully removed from the database.`);
          setSelectedReviewIds(prev => {
            const next = new Set(prev);
            next.delete(review._id);
            return next;
          });
          fetchReviews();
          fetchAuditLogs();
        } catch (err) {
          showNotification(`Deletion failed: ${err.message}`, "error");
        }
      }
    });
  };

  // Bulk Delete Selected Reviews
  const confirmBulkDelete = () => {
    const count = selectedReviewIds.size;
    if (count === 0) return;

    setConfirmModal({
      isOpen: true,
      title: `Bulk Delete ${count} Review Record${count > 1 ? 's' : ''}`,
      message: `You are about to permanently delete ${count} selected review records from the database. This action is irreversible and will be logged to the administrative audit trail.`,
      confirmText: `Permanently Delete ${count} Records`,
      isDanger: true,
      action: async () => {
        try {
          const res = await fetch(`${API_BASE}/admin/reviews/bulk`, {
            method: "DELETE",
            headers: getAuthHeaders({
              "Content-Type": "application/json"
            }),
            body: JSON.stringify({ ids: Array.from(selectedReviewIds) })
          });
          const json = await res.json();
          if (!res.ok || !json.success) throw new Error(json.message || "Bulk deletion failed.");

          showNotification(`Successfully deleted ${json.count || count} review records from database.`);
          setSelectedReviewIds(new Set());
          fetchReviews();
          fetchAuditLogs();
        } catch (err) {
          showNotification(`Bulk deletion error: ${err.message}`, "error");
        }
      }
    });
  };

  // =============================================================
  // RULES MANAGEMENT ACTIONS
  // =============================================================

  const handleWeightChange = (ruleId, newWeight) => {
    setRuleConfig(prev => ({
      ...prev,
      rules: prev.rules.map(r => r.id === ruleId ? { ...r, weight: parseInt(newWeight, 10) || 1 } : r)
    }));
  };

  const handleRuleToggle = (ruleId) => {
    setRuleConfig(prev => ({
      ...prev,
      rules: prev.rules.map(r => r.id === ruleId ? { ...r, enabled: r.enabled === false ? true : false } : r)
    }));
  };

  const handleSaveRules = async () => {
    setRulesSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/rules`, {
        method: "PUT",
        headers: getAuthHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          rules: ruleConfig.rules,
          bands: ruleConfig.bands
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to update rules.");

      setRuleConfig(json.data);
      showNotification(`Rule weights & thresholds saved successfully as Engine Version ${json.data.version}.`);
      fetchAuditLogs();
    } catch (err) {
      showNotification(`Error saving rules: ${err.message}`, "error");
    } finally {
      setRulesSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setConfirmModal({
      isOpen: true,
      title: "Restore Factory Defaults",
      message: "Are you sure you want to restore all 20 explainable heuristic rule weights and risk classification thresholds to their default values?",
      confirmText: "Restore Defaults",
      isDanger: false,
      action: async () => {
        try {
          const res = await fetch(`${API_BASE}/admin/rules/reset`, {
            method: "POST",
            headers: getAuthHeaders()
          });
          const json = await res.json();
          if (json.success && json.data) {
            setRuleConfig(json.data);
            showNotification(`Factory default weights restored (Version ${json.data.version}).`);
            fetchAuditLogs();
          }
        } catch (e) {
          showNotification(`Reset error: ${e.message}`, "error");
        }
      }
    });
  };

  // =============================================================
  // USER GOVERNANCE ACTIONS & SAFEGUARDS
  // =============================================================

  const activeAdminCount = usersList.filter(u => u.role === "admin" && u.isActive !== false).length;

  const handleRoleChange = async (targetUser, newRole) => {
    const isSelf = targetUser._id === user?._id || targetUser.username === user?.username;
    if (isSelf && targetUser.role === "admin" && newRole !== "admin") {
      showNotification("Safeguard Violation: You cannot demote your own administrator account.", "error");
      return;
    }
    if (targetUser.role === "admin" && newRole !== "admin" && activeAdminCount <= 1) {
      showNotification("Safeguard Violation: Cannot demote the last remaining active administrator.", "error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/users/${targetUser._id}/role`, {
        method: "PATCH",
        headers: getAuthHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({ role: newRole })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to update role.");

      showNotification(`User @${targetUser.username} role changed to ${newRole.toUpperCase()}.`);
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      showNotification(`Role update failed: ${err.message}`, "error");
    }
  };

  const handleToggleUserStatus = (targetUser) => {
    const isSelf = targetUser._id === user?._id || targetUser.username === user?.username;
    if (isSelf && targetUser.isActive !== false) {
      showNotification("Safeguard Violation: You cannot deactivate your own administrative account.", "error");
      return;
    }
    if (targetUser.role === "admin" && targetUser.isActive !== false && activeAdminCount <= 1) {
      showNotification("Safeguard Violation: Cannot deactivate the sole remaining active administrator.", "error");
      return;
    }

    const actionText = targetUser.isActive !== false ? "deactivate" : "reactivate";
    setConfirmModal({
      isOpen: true,
      title: `${targetUser.isActive !== false ? "Deactivate" : "Activate"} User Account`,
      message: `Are you sure you want to ${actionText} the account for "${targetUser.name || targetUser.username}" (@${targetUser.username})?`,
      confirmText: `${targetUser.isActive !== false ? "Deactivate" : "Activate"} Account`,
      isDanger: targetUser.isActive !== false,
      action: async () => {
        try {
          const res = await fetch(`${API_BASE}/admin/users/${targetUser._id}/toggle-active`, {
            method: "PATCH",
            headers: getAuthHeaders()
          });
          const json = await res.json();
          if (!res.ok || !json.success) throw new Error(json.message || "Failed to change user status.");

          showNotification(`User @${targetUser.username} account has been ${json.isActive ? "activated" : "deactivated"}.`);
          fetchUsers();
          fetchAuditLogs();
        } catch (err) {
          showNotification(`Status change failed: ${err.message}`, "error");
        }
      }
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(newUserData)
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      setNewUserModal(false);
      setNewUserData({ username: "", email: "", password: "", role: "analyst", name: "" });
      showNotification(`User account @${json.data.username} created successfully.`);
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      showNotification(`User creation error: ${err.message}`, "error");
    }
  };

  // =============================================================
  // PRODUCT CATALOGUE ACTIONS
  // =============================================================

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/products`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(newProductData)
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      setNewProductModal(false);
      setNewProductData({ name: "", category: "Electronics", keywords: "", product_id: "" });
      showNotification(`Product "${json.data.name}" added to verified catalogue.`);
      fetchProducts();
      fetchAuditLogs();
    } catch (err) {
      showNotification(`Product addition error: ${err.message}`, "error");
    }
  };

  const handleDeleteProduct = (prodId) => {
    setConfirmModal({
      isOpen: true,
      title: "Remove Verified Catalogue Product",
      message: `Remove product [${prodId}] from the verified domain catalogue?`,
      confirmText: "Remove Product",
      isDanger: true,
      action: async () => {
        try {
          const res = await fetch(`${API_BASE}/admin/products/${prodId}`, {
            method: "DELETE",
            headers: getAuthHeaders()
          });
          const json = await res.json();
          if (!res.ok || !json.success) throw new Error(json.message || "Failed to remove product.");

          showNotification(`Product [${prodId}] removed from catalogue.`);
          fetchProducts();
          fetchAuditLogs();
        } catch (err) {
          showNotification(`Catalogue error: ${err.message}`, "error");
        }
      }
    });
  };

  const exportAuditLogs = () => {
    window.open(`${API_BASE}/admin/export-audit-logs`, "_blank");
  };

  return (
    <div className="space-y-6 animate-fade" style={{ width: "100%", maxWidth: "1360px", margin: "0 auto", padding: "24px 28px 48px" }}>
      
      {/* Top Banner */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
                <ShieldAlert size={28} color="var(--accent-purple)" />
                <span>Admin Governance & Management Center</span>
              </h1>
              <span className="badge badge-high" style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>
                Admin Session Active
              </span>
            </div>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", margin: 0 }}>
              Persisted review records management, 20-rule explainable engine governance, RBAC user administration, and audit telemetry.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "8px",
              background: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              fontSize: "13px"
            }}>
              <Shield size={16} color="var(--accent-purple)" />
              <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>{user?.username || "admin"}</span>
              <span style={{ fontSize: "11px", color: "var(--accent-purple)", fontWeight: "800", textTransform: "uppercase" }}>({user?.role || "admin"})</span>
            </div>

            <button
              onClick={() => {
                logout();
                if (onLogout) onLogout();
              }}
              className="btn btn-secondary"
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--risk-very-high)",
                borderColor: "var(--risk-very-high-border)"
              }}
              title="End administrator session and return to Dashboard"
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", background: "var(--bg-surface)", padding: "6px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-medium)" }}>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`btn ${activeTab === "reviews" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 16px", fontSize: "14px", minHeight: "40px" }}
          >
            <FileText size={16} />
            <span>Review Records</span>
          </button>

          <button
            onClick={() => setActiveTab("rules")}
            className={`btn ${activeTab === "rules" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 16px", fontSize: "14px", minHeight: "40px" }}
          >
            <Sliders size={16} />
            <span>20 Rule Weights</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`btn ${activeTab === "users" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 16px", fontSize: "14px", minHeight: "40px" }}
          >
            <Users size={16} />
            <span>Users & Roles</span>
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`btn ${activeTab === "products" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 16px", fontSize: "14px", minHeight: "40px" }}
          >
            <Package size={16} />
            <span>Catalogue</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`btn ${activeTab === "audit" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 16px", fontSize: "14px", minHeight: "40px" }}
          >
            <ScrollText size={16} />
            <span>Audit Trail</span>
          </button>

          <button
            onClick={() => setActiveTab("health")}
            className={`btn ${activeTab === "health" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 16px", fontSize: "14px", minHeight: "40px" }}
          >
            <Activity size={16} />
            <span>System Health</span>
          </button>
        </div>
      </div>

      {/* Global In-Page Status Notification */}
      {feedback && (
        <div style={{
          padding: "14px 20px",
          borderRadius: "var(--radius-md)",
          background: feedback.type === "error" ? "rgba(239, 68, 68, 0.15)" : "var(--risk-low-bg)",
          border: `1px solid ${feedback.type === "error" ? "rgba(239, 68, 68, 0.3)" : "var(--risk-low-border)"}`,
          color: feedback.type === "error" ? "var(--risk-very-high)" : "var(--risk-low)",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {feedback.type === "error" ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span style={{ fontWeight: "600" }}>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "16px" }}>✕</button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: PERSISTED REVIEWS MANAGEMENT                      */}
      {/* ========================================================= */}
      {activeTab === "reviews" && (
        <div className="card space-y-4 animate-fade" style={{ padding: "28px" }}>
          
          {/* Header Controls & Filter Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h3 className="section-title" style={{ margin: 0 }}>Review Database Management</h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Inspect, forensic deep-dive, or permanently delete persisted reviews ({reviewPagination.totalItems} total records in database)
              </p>
            </div>

            {/* Bulk Action Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {selectedReviewIds.size > 0 && (
                <button
                  onClick={confirmBulkDelete}
                  className="btn btn-danger"
                  style={{ padding: "8px 16px", fontSize: "14px" }}
                >
                  <Trash2 size={16} />
                  <span>Delete Selected ({selectedReviewIds.size})</span>
                </button>
              )}
              
              <button
                onClick={fetchReviews}
                className="btn btn-secondary"
                style={{ padding: "8px 14px", fontSize: "14px" }}
                title="Refresh reviews"
              >
                <RefreshCw size={16} className={reviewsLoading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", paddingTop: "8px" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
              <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                placeholder="Search by product, reviewer, or review text..."
                style={{ width: "100%", paddingLeft: "38px", minHeight: "42px", fontSize: "14px" }}
              />
            </div>

            <select
              value={reviewCategory}
              onChange={(e) => { setReviewCategory(e.target.value); setReviewPage(1); }}
              style={{ minWidth: "160px", minHeight: "42px", fontSize: "14px" }}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={reviewRisk}
              onChange={(e) => { setReviewRisk(e.target.value); setReviewPage(1); }}
              style={{ minWidth: "160px", minHeight: "42px", fontSize: "14px" }}
            >
              <option value="all">All Risk Levels</option>
              <option value="Low">Low Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="High">High Risk</option>
              <option value="Very High">Very High Risk</option>
            </select>

            <button type="submit" className="btn btn-primary" style={{ minHeight: "42px", padding: "8px 18px", fontSize: "14px" }}>
              Search
            </button>
          </form>

          {/* Review Data Table */}
          <div className="table-container" style={{ marginTop: "16px" }}>
            <table className="table-custom">
              <thead>
                <tr>
                  <th style={{ width: "44px", textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={toggleSelectAllReviews}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}
                      title="Select / Deselect All on this page"
                    >
                      {selectedReviewIds.size === reviewsList.length && reviewsList.length > 0 ? (
                        <CheckSquare size={18} color="var(--primary)" />
                      ) : (
                        <Square size={18} color="var(--text-muted)" />
                      )}
                    </button>
                  </th>
                  <th>Product Details</th>
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
                {reviewsLoading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px", color: "var(--primary)" }} />
                      <p>Loading records from database...</p>
                    </td>
                  </tr>
                ) : reviewsList.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "56px", color: "var(--text-muted)" }}>
                      <FileText size={36} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                      <p style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>No review records found</p>
                      <p style={{ fontSize: "13px", marginTop: "4px" }}>
                        {reviewSearch || reviewCategory !== "all" || reviewRisk !== "all"
                          ? "Try clearing your search query or filter selections."
                          : "Analysed reviews will appear here once persisted to the database."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  reviewsList.map((r) => {
                    const isSelected = selectedReviewIds.has(r._id);
                    const sentLabel = r.sentiment_analysis?.label || "Neutral";
                    const score = r.risk_score || 0;
                    const rLevel = r.risk_level || (score <= 24 ? "Low" : score <= 49 ? "Moderate" : score <= 74 ? "High" : "Very High");
                    const dateFormatted = new Date(r.createdAt || r.review_date || Date.now()).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    });

                    return (
                      <tr key={r._id} style={{ background: isSelected ? "rgba(99, 102, 241, 0.08)" : undefined }}>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => toggleSelectReview(r._id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            {isSelected ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} color="var(--text-muted)" />}
                          </button>
                        </td>
                        <td>
                          <div style={{ fontWeight: "700", color: "var(--text-primary)" }}>{r.product_name}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            <span className="badge badge-low" style={{ fontSize: "11px", padding: "1px 6px", marginRight: "6px" }}>{r.category || "General"}</span>
                            {r.platform && <span style={{ opacity: 0.8 }}>{r.platform}</span>}
                          </div>
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontWeight: "500" }}>
                          {r.reviewer_name || "Anonymous"}
                        </td>
                        <td>
                          <span style={{ fontWeight: "700", color: "#F59E0B" }}>
                            {"★".repeat(Math.min(5, Math.max(1, Math.round(r.rating || 5))))}
                          </span>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "4px" }}>({r.rating}★)</span>
                        </td>
                        <td>
                          <span style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "700",
                            background: sentLabel === "Positive" ? "rgba(16, 185, 129, 0.15)" : sentLabel === "Negative" ? "rgba(239, 68, 68, 0.15)" : sentLabel === "Mixed" ? "rgba(139, 92, 246, 0.15)" : "rgba(100, 116, 139, 0.15)",
                            color: sentLabel === "Positive" ? "var(--risk-low)" : sentLabel === "Negative" ? "var(--risk-very-high)" : sentLabel === "Mixed" ? "var(--accent-purple)" : "var(--text-muted)"
                          }}>
                            {sentLabel}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            score <= 24 ? "badge-low" : score <= 49 ? "badge-mod" : score <= 74 ? "badge-high" : "badge-very-high"
                          }`} style={{ fontWeight: "800", fontSize: "13px" }}>
                            {score}/100
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>
                            {r.classification_label || r.assessment || "Appears Genuine"}
                          </span>
                        </td>
                        <td style={{ fontSize: "13px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {dateFormatted}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                            {onViewReport && (
                              <button
                                onClick={() => onViewReport(r)}
                                className="btn btn-secondary"
                                style={{ padding: "6px 10px", fontSize: "12px", minHeight: "32px" }}
                                title="Open full forensic audit report"
                              >
                                <Eye size={14} />
                                <span>Report</span>
                              </button>
                            )}
                            <button
                              onClick={() => confirmDeleteReview(r)}
                              className="btn btn-danger"
                              style={{ width: "32px", height: "32px", minHeight: "32px", padding: 0 }}
                              title="Delete review record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {reviewPagination.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                Showing page <strong style={{ color: "var(--text-primary)" }}>{reviewPagination.page}</strong> of <strong style={{ color: "var(--text-primary)" }}>{reviewPagination.totalPages}</strong> ({reviewPagination.totalItems} total reviews)
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                  disabled={reviewPagination.page <= 1}
                  className="btn btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "13px" }}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setReviewPage(p => Math.min(reviewPagination.totalPages, p + 1))}
                  disabled={reviewPagination.page >= reviewPagination.totalPages}
                  className="btn btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "13px" }}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: 20 RULE WEIGHTS & THRESHOLDS CONFIGURATION        */}
      {/* ========================================================= */}
      {activeTab === "rules" && (
        <div className="space-y-6 animate-fade">
          {rulesLoading || !ruleConfig ? (
            <div style={{ padding: "64px", textAlign: "center", color: "var(--text-muted)", fontSize: "15px" }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px", color: "var(--primary)" }} />
              <p>Loading rule configuration and version data...</p>
            </div>
          ) : (
            <>
              {/* Header Card with Controls */}
              <div className="card" style={{ padding: "24px 28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <h3 className="section-title" style={{ margin: 0 }}>Heuristic Rules & Weight Tuning</h3>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
                      Active Engine Version: <strong style={{ color: "var(--accent-purple)" }}>v{ruleConfig.version}</strong> (Modified by: {ruleConfig.updated_by || "System"})
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      onClick={handleResetDefaults}
                      className="btn btn-secondary"
                      style={{ padding: "10px 18px", fontSize: "14px" }}
                    >
                      <RotateCcw size={16} />
                      <span>Restore Factory Defaults</span>
                    </button>

                    <button
                      onClick={handleSaveRules}
                      disabled={rulesSaving}
                      className="btn btn-primary"
                      style={{ padding: "10px 20px", fontSize: "14px" }}
                    >
                      <Save size={16} />
                      <span>{rulesSaving ? "Saving Config..." : "Save Configuration"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 20 Rules Grid */}
              <div className="card" style={{ padding: "28px" }}>
                <h4 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "18px" }}>20 Explainable Detection Rules</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "18px" }}>
                  {(ruleConfig.rules || []).map((rule) => (
                    <div
                      key={rule.id}
                      style={{
                        padding: "18px 20px",
                        borderRadius: "var(--radius-md)",
                        background: rule.enabled !== false ? "var(--bg-surface)" : "rgba(30, 41, 59, 0.4)",
                        border: `1px solid ${rule.enabled !== false ? "var(--border-medium)" : "var(--border-subtle)"}`,
                        opacity: rule.enabled !== false ? 1 : 0.65,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                          <span className="font-mono" style={{ fontSize: "12px", color: "var(--primary)", fontWeight: "700" }}>
                            {rule.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRuleToggle(rule.id)}
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              background: rule.enabled !== false ? "rgba(16, 185, 129, 0.15)" : "rgba(100, 116, 139, 0.2)",
                              color: rule.enabled !== false ? "var(--risk-low)" : "var(--text-muted)",
                              border: `1px solid ${rule.enabled !== false ? "rgba(16, 185, 129, 0.3)" : "rgba(100, 116, 139, 0.3)"}`
                            }}
                          >
                            {rule.enabled !== false ? "Enabled" : "Disabled"}
                          </button>
                        </div>
                        <h5 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 6px" }}>{rule.name}</h5>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5", margin: 0 }}>
                          {rule.description}
                        </p>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", paddingTop: "14px", marginTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-muted)" }}>
                          Weight: <strong style={{ color: "var(--text-primary)", fontSize: "15px" }}>{rule.weight}</strong>
                        </span>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, maxWidth: "220px" }}>
                          <input
                            type="range"
                            min="1"
                            max="50"
                            value={rule.weight}
                            onChange={(e) => handleWeightChange(rule.id, e.target.value)}
                            disabled={rule.enabled === false}
                            style={{ flex: 1, cursor: "pointer", height: "6px" }}
                          />
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={rule.weight}
                            onChange={(e) => handleWeightChange(rule.id, e.target.value)}
                            disabled={rule.enabled === false}
                            style={{ width: "56px", minHeight: "36px", padding: "4px", fontSize: "14px", fontWeight: "700", textAlign: "center" }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: USER ACCOUNT GOVERNANCE                            */}
      {/* ========================================================= */}
      {activeTab === "users" && (
        <div className="card space-y-4 animate-fade" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h3 className="section-title" style={{ margin: 0 }}>User Account Governance</h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Manage roles, access status, and enforce administrative safeguards ({activeAdminCount} active administrator{activeAdminCount > 1 ? 's' : ''})
              </p>
            </div>
            <button
              onClick={() => setNewUserModal(true)}
              className="btn btn-primary"
              style={{ padding: "10px 18px", fontSize: "14px" }}
            >
              <Plus size={16} />
              <span>Create New User</span>
            </button>
          </div>

          <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>User Identity</th>
                  <th>Email Address</th>
                  <th>Role Assignment</th>
                  <th>Account Status</th>
                  <th style={{ textAlign: "right" }}>Governance Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => {
                  const isSelf = u._id === user?._id || u.username === user?.username;
                  const isSoleAdmin = u.role === "admin" && activeAdminCount <= 1;

                  return (
                    <tr key={u._id}>
                      <td style={{ fontWeight: "600" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>{u.name || u.username}</span>
                          {isSelf && (
                            <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px", background: "rgba(99, 102, 241, 0.2)", color: "var(--primary)" }}>
                              You
                            </span>
                          )}
                          {isSoleAdmin && (
                            <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px", background: "rgba(245, 158, 11, 0.2)", color: "#F59E0B" }} title="Sole active administrator on system">
                              Sole Admin
                            </span>
                          )}
                        </div>
                        <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>@{u.username}</span>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                      <td>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          disabled={isSelf || isSoleAdmin}
                          style={{
                            padding: "6px 12px",
                            fontSize: "13px",
                            fontWeight: "700",
                            borderRadius: "6px",
                            background: u.role === "admin" ? "rgba(139, 92, 246, 0.15)" : "rgba(59, 130, 246, 0.15)",
                            color: u.role === "admin" ? "var(--accent-purple)" : "var(--accent-blue)",
                            border: `1px solid ${u.role === "admin" ? "rgba(139, 92, 246, 0.3)" : "rgba(59, 130, 246, 0.3)"}`,
                            cursor: (isSelf || isSoleAdmin) ? "not-allowed" : "pointer"
                          }}
                          title={isSelf ? "Cannot demote your own account" : isSoleAdmin ? "Cannot demote the last active admin" : "Change role"}
                        >
                          <option value="admin">Administrator</option>
                          <option value="analyst">Analyst</option>
                        </select>
                      </td>
                      <td>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "700",
                          background: u.isActive !== false ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                          color: u.isActive !== false ? "var(--risk-low)" : "var(--risk-very-high)"
                        }}>
                          {u.isActive !== false ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          disabled={isSelf || (u.role === "admin" && isSoleAdmin && u.isActive !== false)}
                          className={`btn ${u.isActive !== false ? "btn-secondary" : "btn-primary"}`}
                          style={{
                            padding: "6px 14px",
                            fontSize: "13px",
                            minHeight: "36px",
                            cursor: (isSelf || (u.role === "admin" && isSoleAdmin && u.isActive !== false)) ? "not-allowed" : "pointer",
                            opacity: (isSelf || (u.role === "admin" && isSoleAdmin && u.isActive !== false)) ? 0.5 : 1
                          }}
                          title={isSelf ? "Cannot deactivate your own active session" : (u.role === "admin" && isSoleAdmin) ? "Cannot deactivate sole active administrator" : "Toggle account status"}
                        >
                          {u.isActive !== false ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: PRODUCT CATALOGUE MANAGEMENT                      */}
      {/* ========================================================= */}
      {activeTab === "products" && (
        <div className="card space-y-4 animate-fade" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h3 className="section-title" style={{ margin: 0 }}>Verified Product Catalogue</h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>Products and verified category mappings used for cross-relevance detection</p>
            </div>
            <button
              onClick={() => setNewProductModal(true)}
              className="btn btn-primary"
              style={{ padding: "10px 18px", fontSize: "14px" }}
            >
              <Plus size={16} />
              <span>Add Verified Product</span>
            </button>
          </div>

          <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Keywords</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {productsList.map((p) => (
                  <tr key={p.product_id}>
                    <td className="font-mono" style={{ color: "var(--primary)", fontWeight: "700" }}>{p.product_id}</td>
                    <td style={{ fontWeight: "600" }}>{p.name}</td>
                    <td>
                      <span className="badge badge-low" style={{ fontSize: "12px" }}>{p.category}</span>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "13px", maxWidth: "280px" }} className="truncate">
                      {(p.keywords || []).join(", ")}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => handleDeleteProduct(p.product_id)}
                        className="btn btn-danger"
                        style={{ width: "36px", height: "36px", minHeight: "36px", padding: 0 }}
                        title="Delete product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: ADMINISTRATIVE AUDIT TRAIL                        */}
      {/* ========================================================= */}
      {activeTab === "audit" && (
        <div className="card space-y-4 animate-fade" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h3 className="section-title" style={{ margin: 0 }}>Administrative Audit Trail</h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>Immutable log of administrative actions, config changes, and review modifications</p>
            </div>
            <button
              onClick={exportAuditLogs}
              className="btn btn-secondary"
              style={{ padding: "10px 18px", fontSize: "14px" }}
              title="Download audit trail as CSV"
            >
              <Download size={16} />
              <span>Export Audit Trail (CSV)</span>
            </button>
          </div>

          <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id}>
                    <td className="font-mono" style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      {log.timestamp?.substring(0, 19).replace("T", " ")}
                    </td>
                    <td style={{ fontWeight: "700" }}>{log.username}</td>
                    <td className="font-mono" style={{ color: "var(--primary)", fontWeight: "700", fontSize: "13px" }}>{log.action}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{log.entity_type}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. SYSTEM HEALTH & DIAGNOSTICS TAB                       */}
      {/* ========================================================= */}
      {activeTab === "health" && (
        <div className="space-y-6">
          <div className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 className="section-title" style={{ margin: 0 }}>System Health, Service Status & Diagnostics</h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Real-time operational metrics, persistence engine status, security telemetry, and resource utilization.
              </p>
            </div>
            <button
              onClick={fetchSystemHealth}
              disabled={healthLoading}
              className="btn btn-secondary"
              style={{ padding: "8px 16px", fontSize: "14px" }}
              title="Refresh live system telemetry"
            >
              <RefreshCw size={16} className={healthLoading ? "animate-spin" : ""} />
              <span>Refresh Health</span>
            </button>
          </div>

          {healthLoading && !systemHealth ? (
            <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
              <RefreshCw size={36} className="animate-spin" style={{ margin: "0 auto 12px", color: "var(--primary)" }} />
              <p>Querying backend subsystem health...</p>
            </div>
          ) : systemHealth ? (
            <div className="space-y-6">
              {/* Primary Subsystem Health Cards */}
              <div className="grid-3" style={{ gap: "20px" }}>
                {/* Database Persistence Engine */}
                <div className="card" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: systemHealth.database?.connected ? "var(--risk-low)" : "#F59E0B",
                      boxShadow: systemHealth.database?.connected ? "0 0 8px var(--risk-low)" : "none"
                    }} />
                    <h4 style={{ fontSize: "14px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
                      Database Persistence
                    </h4>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Engine:</span>
                      <strong style={{ color: "var(--text-primary)" }}>{systemHealth.database?.engine || "MongoDB / Mongoose"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Status:</span>
                      <span className={`badge ${systemHealth.database?.connected ? "badge-low" : "badge-mod"}`} style={{ fontSize: "12px" }}>
                        {systemHealth.database?.statusMessage || (systemHealth.database?.connected ? "Active & Healthy" : "Fallback Storage")}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Endpoint:</span>
                      <span className="font-mono" style={{ fontSize: "12px", color: "var(--text-muted)" }}>{systemHealth.database?.target || "localhost"}</span>
                    </div>
                  </div>
                </div>

                {/* Heuristic Rule Engine */}
                <div className="card" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--accent-purple)", boxShadow: "0 0 8px var(--accent-purple)" }} />
                    <h4 style={{ fontSize: "14px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
                      Heuristic Detection Engine
                    </h4>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Engine Version:</span>
                      <strong className="font-mono" style={{ color: "var(--primary)" }}>{systemHealth.ruleEngine?.version || "v1"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Active Rules:</span>
                      <strong style={{ color: "var(--risk-low)" }}>{systemHealth.ruleEngine?.enabledRules} of {systemHealth.ruleEngine?.totalRules} Enabled</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Updated By:</span>
                      <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{systemHealth.ruleEngine?.updatedBy || "system"}</span>
                    </div>
                  </div>
                </div>

                {/* API Node Service */}
                <div className="card" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--primary)", boxShadow: "0 0 8px var(--primary)" }} />
                    <h4 style={{ fontSize: "14px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
                      Backend Service
                    </h4>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Runtime:</span>
                      <strong className="font-mono" style={{ color: "var(--text-primary)" }}>Node {systemHealth.service?.nodeVersion} ({systemHealth.service?.platform})</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Service Uptime:</span>
                      <strong style={{ color: "var(--text-primary)" }}>{Math.floor((systemHealth.service?.uptimeSeconds || 0) / 60)} min {((systemHealth.service?.uptimeSeconds || 0) % 60)} sec</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Environment:</span>
                      <span className="badge badge-low" style={{ fontSize: "12px" }}>{systemHealth.service?.environment}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Database Records & Storage Telemetry */}
              <div className="card" style={{ padding: "24px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px", color: "var(--text-primary)" }}>
                  Verified Database Record Counts
                </h4>
                <div className="grid-5" style={{ gap: "16px" }}>
                  <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border-medium)", textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--primary)" }}>{systemHealth.database?.counts?.reviews ?? 0}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Analyzed Reviews</div>
                  </div>
                  <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border-medium)", textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-primary)" }}>{systemHealth.database?.counts?.users ?? 0}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Total Users</div>
                  </div>
                  <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border-medium)", textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--risk-low)" }}>{systemHealth.database?.counts?.activeUsers ?? 0}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Active Users</div>
                  </div>
                  <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border-medium)", textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--accent-purple)" }}>{systemHealth.database?.counts?.products ?? 0}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Catalogued Products</div>
                  </div>
                  <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border-medium)", textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#F59E0B" }}>{systemHealth.database?.counts?.auditLogs ?? 0}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Audit Trail Records</div>
                  </div>
                </div>
              </div>

              {/* Memory & Security Telemetry Grid */}
              <div className="grid-2" style={{ gap: "20px" }}>
                {/* Memory Metrics */}
                <div className="card" style={{ padding: "20px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "14px" }}>
                    Node.js Memory Utilization
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Resident Set Size (RSS):</span>
                      <strong className="font-mono">{systemHealth.memory?.rss || "0 MB"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>V8 Heap Used:</span>
                      <strong className="font-mono" style={{ color: "var(--primary)" }}>{systemHealth.memory?.heapUsed || "0 MB"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>V8 Heap Total:</span>
                      <strong className="font-mono">{systemHealth.memory?.heapTotal || "0 MB"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>External Memory:</span>
                      <strong className="font-mono">{systemHealth.memory?.external || "0 MB"}</strong>
                    </div>
                  </div>
                </div>

                {/* Security Posture */}
                <div className="card" style={{ padding: "20px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "14px" }}>
                    Security Architecture & Safeguards
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Authentication:</span>
                      <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{systemHealth.security?.authStrategy}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Access Control:</span>
                      <span style={{ fontWeight: "600", color: "var(--risk-low)" }}>{systemHealth.security?.rbac}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Token Expiration:</span>
                      <span className="font-mono">{systemHealth.security?.tokenExpiry}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>CORS Security:</span>
                      <span>{systemHealth.security?.corsPolicy}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
              <p>Unable to retrieve system health telemetry.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* REUSABLE CONFIRMATION MODAL                              */}
      {/* ========================================================= */}
      {confirmModal.isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} className="animate-fade">
          <div className="card" style={{ width: "100%", maxWidth: "460px", border: "1px solid var(--border-medium)", boxShadow: "var(--shadow-lg)", padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              {confirmModal.isDanger ? (
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.15)", color: "var(--risk-very-high)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={22} />
                </div>
              ) : (
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(99, 102, 241, 0.15)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RotateCcw size={22} />
                </div>
              )}
              <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>{confirmModal.title}</h3>
            </div>
            
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 24px" }}>
              {confirmModal.message}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="btn btn-secondary"
                style={{ padding: "8px 18px", fontSize: "14px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const act = confirmModal.action;
                  setConfirmModal({ ...confirmModal, isOpen: false });
                  if (act) act();
                }}
                className={confirmModal.isDanger ? "btn btn-danger" : "btn btn-primary"}
                style={{ padding: "8px 20px", fontSize: "14px" }}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {newUserModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} className="animate-fade">
          <div className="card" style={{ width: "100%", maxWidth: "480px", border: "1px solid var(--border-medium)", boxShadow: "var(--shadow-lg)", padding: "28px" }}>
            <h3 className="section-title" style={{ marginBottom: "16px" }}>Create User Account</h3>
            <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                />
              </div>
              <div>
                <label className="form-label">Username</label>
                <input
                  type="text"
                  required
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                  placeholder="e.g. alex_m"
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="alex@reviewguard.ai"
                />
              </div>
              <div>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="••••••••••••"
                />
              </div>
              <div>
                <label className="form-label">Role</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                >
                  <option value="analyst">Analyst</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setNewUserModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PRODUCT MODAL */}
      {newProductModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} className="animate-fade">
          <div className="card" style={{ width: "100%", maxWidth: "480px", border: "1px solid var(--border-medium)", boxShadow: "var(--shadow-lg)", padding: "28px" }}>
            <h3 className="section-title" style={{ marginBottom: "16px" }}>Add Product to Verified Catalogue</h3>
            <form onSubmit={handleCreateProduct} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Product Name / Model</label>
                <input
                  type="text"
                  required
                  value={newProductData.name}
                  onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                  placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                />
              </div>
              <div>
                <label className="form-label">Category</label>
                <select
                  value={newProductData.category}
                  onChange={(e) => setNewProductData({ ...newProductData, category: e.target.value })}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Product ID / SKU (Optional)</label>
                <input
                  type="text"
                  value={newProductData.product_id}
                  onChange={(e) => setNewProductData({ ...newProductData, product_id: e.target.value })}
                  placeholder="e.g. PROD-ELEC-009"
                />
              </div>
              <div>
                <label className="form-label">Domain Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={newProductData.keywords}
                  onChange={(e) => setNewProductData({ ...newProductData, keywords: e.target.value })}
                  placeholder="noise cancelling, bluetooth, battery, sound"
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setNewProductModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
