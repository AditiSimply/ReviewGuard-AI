/**
 * ReviewGuard AI - Protected Admin Control Center Routes
 * Implements user management, rule weight & threshold configuration, versioning,
 * product catalogue management, and administrative audit logging.
 */

const express = require("express");
const bcrypt = require("bcryptjs");
const { db } = require("../db");
const { authenticateToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const router = express.Router();

// Apply auth and admin enforcement to all admin routes
router.use(authenticateToken);
router.use(requireRole("admin"));

// 1. User Management: List All Users
router.get("/users", async (req, res) => {
  try {
    const users = await db.users.getAll();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. User Management: Create New User
router.post("/users", async (req, res) => {
  try {
    const { username, email, password, role, name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Username, email, and password are required." });
    }

    const existingEmail = await db.users.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "A user with this email already exists." });
    }

    const existingUsername = await db.users.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ success: false, message: "A user with this username already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await db.users.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: role === "admin" ? "admin" : "analyst",
      name: name || username
    });

    await db.auditLogs.log({
      username: req.user.username,
      action: "CREATE_USER",
      entity_type: "USER",
      entity_id: newUser._id,
      details: `Created new user account '${newUser.username}' with role '${newUser.role}'.`
    });

    res.json({
      success: true,
      message: `User '${newUser.username}' created successfully.`,
      data: newUser
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. User Management: Update Role
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "analyst"].includes(role)) {
      return res.status(400).json({ success: false, message: "Role must be 'admin' or 'analyst'." });
    }

    const targetUser = await db.users.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (targetUser.role === "admin" && role !== "admin") {
      if (req.user.id === targetUser._id) {
        return res.status(400).json({
          success: false,
          message: "You cannot demote your own administrator account."
        });
      }
      const activeAdminCount = await db.users.countActiveAdmins();
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot demote the last remaining active administrator. System requires at least one active administrator."
        });
      }
    }

    const updated = await db.users.updateRole(req.params.id, role);
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    await db.auditLogs.log({
      username: req.user.username,
      action: "UPDATE_USER_ROLE",
      entity_type: "USER",
      entity_id: req.params.id,
      details: `Updated role of user [${req.params.id}] to '${role}'.`
    });

    res.json({ success: true, message: `Role updated to '${role}'.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. User Management: Toggle Active/Inactive
router.patch(["/users/:id/toggle-active", "/users/:id/toggle-status"], async (req, res) => {
  try {
    const targetUser = await db.users.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (targetUser.role === "admin" && targetUser.isActive !== false) {
      if (req.user.id === targetUser._id) {
        return res.status(400).json({
          success: false,
          message: "You cannot deactivate your own administrator account."
        });
      }
      const activeAdminCount = await db.users.countActiveAdmins();
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot deactivate the last remaining active administrator. System requires at least one active administrator."
        });
      }
    }

    const newStatus = await db.users.toggleActive(req.params.id);
    if (newStatus === null) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    await db.auditLogs.log({
      username: req.user.username,
      action: "TOGGLE_USER_STATUS",
      entity_type: "USER",
      entity_id: req.params.id,
      details: `Toggled user status for '${targetUser.username}' to ${newStatus ? 'Active' : 'Deactivated'}.`
    });

    res.json({ success: true, isActive: newStatus, message: `User status changed to ${newStatus ? 'Active' : 'Deactivated'}.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4B. Admin Review Management: Query All Reviews
router.get("/reviews", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search = "",
      category = "all",
      rating = "all",
      risk_level = "all",
      assessment = "all",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const query = { search, category, rating, risk_level, assessment };
    const allMatching = await db.reviews.find(query, { sortBy, sortOrder });
    const totalItems = allMatching.length;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const totalPages = Math.ceil(totalItems / limitNum) || 1;
    const startIdx = (pageNum - 1) * limitNum;
    const paginated = allMatching.slice(startIdx, startIdx + limitNum);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages,
        totalItems
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4C. Admin Review Management: Bulk Delete Reviews (Defined before :id to prevent capturing 'bulk')
router.delete("/reviews/bulk", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide an array of review IDs to delete." });
    }

    const countDeleted = await db.reviews.deleteBatch(ids);

    await db.auditLogs.log({
      username: req.user.username,
      action: "ADMIN_BULK_DELETE_REVIEWS",
      entity_type: "REVIEWS",
      details: `Admin bulk-deleted ${countDeleted} review records.`
    });

    res.json({
      success: true,
      count: countDeleted,
      message: `Successfully deleted ${countDeleted} review record(s).`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4D. Admin Review Management: Delete Single Review
router.delete("/reviews/:id", async (req, res) => {
  try {
    const reviewId = req.params.id;
    const existing = await db.reviews.findById(reviewId);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Review not found or already deleted." });
    }

    const deleted = await db.reviews.deleteById(reviewId);
    if (!deleted) {
      return res.status(500).json({ success: false, message: "Could not remove review record." });
    }

    await db.auditLogs.log({
      username: req.user.username,
      action: "ADMIN_DELETE_REVIEW",
      entity_type: "REVIEW",
      entity_id: reviewId,
      details: `Admin deleted review record for product "${existing.product_name}".`
    });

    res.json({ success: true, message: `Review [${reviewId}] deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Rule Configuration: Get Active Rules & Thresholds
router.get("/rules", async (req, res) => {
  try {
    const config = await db.ruleConfig.get();
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Rule Configuration: Update Weights and Thresholds (Versioning & Audit)
router.put("/rules", async (req, res) => {
  try {
    const { rules, bands } = req.body;

    if (!Array.isArray(rules) || rules.length === 0) {
      return res.status(400).json({ success: false, message: "Rules array is required." });
    }

    // Validate rule weight boundaries
    for (const r of rules) {
      if (typeof r.weight !== "number" || r.weight < 1 || r.weight > 50) {
        return res.status(400).json({
          success: false,
          message: `Rule '${r.id}' weight must be an integer between 1 and 50.`
        });
      }
    }

    // Validate risk band ordering: lowMax < modMax < highMax
    if (bands) {
      if (bands.lowMax >= bands.modMax || bands.modMax >= bands.highMax) {
        return res.status(400).json({
          success: false,
          message: "Risk bands must satisfy: Low Max < Moderate Max < High Max."
        });
      }
    }

    const updatedConfig = await db.ruleConfig.update(
      { rules, bands: bands || { lowMax: 24, modMax: 49, highMax: 74 } },
      req.user.username
    );

    await db.auditLogs.log({
      username: req.user.username,
      action: "UPDATE_RULE_CONFIGURATION",
      entity_type: "CONFIG",
      details: `Updated heuristic rule weights and risk thresholds to Version ${updatedConfig.version}.`
    });

    res.json({
      success: true,
      message: `Rule configuration updated to Version ${updatedConfig.version}.`,
      data: updatedConfig
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Rule Configuration: Reset to Factory Defaults
router.post("/rules/reset", async (req, res) => {
  try {
    const resetConfig = await db.ruleConfig.resetToDefault(req.user.username);

    await db.auditLogs.log({
      username: req.user.username,
      action: "RESET_RULE_CONFIGURATION",
      entity_type: "CONFIG",
      details: `Reset all 20 rule weights and thresholds to factory defaults (v${resetConfig.version}).`
    });

    res.json({
      success: true,
      message: `All rules and risk thresholds have been restored to factory defaults (v${resetConfig.version}).`,
      data: resetConfig
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Product Catalogue: List Products
router.get("/products", async (req, res) => {
  try {
    const products = await db.products.getAll();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Product Catalogue: Add Product
router.post("/products", async (req, res) => {
  try {
    const { name, category, keywords, product_id } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, message: "Product name and category are required." });
    }

    const kwArray = Array.isArray(keywords)
      ? keywords
      : (keywords ? keywords.split(",").map(k => k.trim()) : []);

    const created = await db.products.create({
      product_id: product_id || `PROD-NEW-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      category: category.trim(),
      keywords: kwArray,
      verified: true
    });

    await db.auditLogs.log({
      username: req.user.username,
      action: "ADD_PRODUCT_CATALOGUE",
      entity_type: "PRODUCT",
      entity_id: created.product_id,
      details: `Added new catalogue product '${created.name}' under category '${created.category}'.`
    });

    res.json({ success: true, message: "Product added to verified catalogue.", data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Product Catalogue: Delete Product
router.delete("/products/:id", async (req, res) => {
  try {
    const deleted = await db.products.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    await db.auditLogs.log({
      username: req.user.username,
      action: "DELETE_PRODUCT_CATALOGUE",
      entity_type: "PRODUCT",
      entity_id: req.params.id,
      details: `Removed product [${req.params.id}] from verified catalogue.`
    });

    res.json({ success: true, message: `Product [${req.params.id}] deleted.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Administrative Audit Logs
router.get("/audit-logs", async (req, res) => {
  try {
    const logs = await db.auditLogs.getAll(200);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Export Audit Logs as CSV
router.get("/export-audit-logs", async (req, res) => {
  try {
    const logs = await db.auditLogs.getAll(500);
    const headers = ["Log_ID", "Timestamp", "User", "Action", "Entity_Type", "Entity_ID", "Details"];
    const rows = [headers.join(",")];

    logs.forEach(l => {
      rows.push([
        `"${l._id}"`,
        `"${l.timestamp}"`,
        `"${l.username}"`,
        `"${l.action}"`,
        `"${l.entity_type || ""}"`,
        `"${l.entity_id || ""}"`,
        `"${(l.details || "").replace(/"/g, '""')}"`
      ].join(","));
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="reviewguard_audit_trail.csv"');
    res.send(rows.join("\n"));
  } catch (err) {
    res.status(500).send("Export failed: " + err.message);
  }
});

// 13. System Health & Safe Diagnostics (Admin Only, No Secrets Exposed)
router.get("/system-health", async (req, res) => {
  try {
    const reviewsCount = await db.reviews.count();
    const users = await db.users.getAll();
    const ruleConfig = await db.ruleConfig.get();
    const auditLogs = await db.auditLogs.getAll(1);
    const products = await db.products.getAll();
    const dbStatus = db.getStatus();

    const mem = process.memoryUsage();
    const toMB = (bytes) => (bytes / (1024 * 1024)).toFixed(1) + " MB";

    // Sanitize DB URI to remove any credentials
    let sanitizedDbTarget = dbStatus.databaseUri;
    try {
      if (sanitizedDbTarget.includes("@")) {
        sanitizedDbTarget = sanitizedDbTarget.replace(/:\/\/.*@/, "://***:***@");
      }
    } catch (e) {}

    const enabledRules = (ruleConfig.rules || []).filter(r => r.enabled !== false).length;

    res.json({
      success: true,
      service: {
        name: "ReviewGuard AI Backend API",
        version: "2.4.0",
        environment: process.env.NODE_ENV || "development",
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      },
      database: {
        connected: dbStatus.connected,
        engine: dbStatus.engine,
        statusMessage: dbStatus.statusMessage,
        target: sanitizedDbTarget,
        counts: {
          reviews: reviewsCount,
          users: users.length,
          activeUsers: users.filter(u => u.isActive !== false).length,
          products: products.length,
          auditLogs: auditLogs.length
        }
      },
      ruleEngine: {
        version: `v${ruleConfig.version || 1}`,
        totalRules: (ruleConfig.rules || []).length,
        enabledRules,
        disabledRules: (ruleConfig.rules || []).length - enabledRules,
        lastUpdated: ruleConfig.updatedAt,
        updatedBy: ruleConfig.updatedBy
      },
      memory: {
        rss: toMB(mem.rss),
        heapUsed: toMB(mem.heapUsed),
        heapTotal: toMB(mem.heapTotal),
        external: toMB(mem.external)
      },
      security: {
        authStrategy: "JWT + Bcrypt (Salt rounds: 10)",
        rbac: "Enforced (Roles: admin, analyst)",
        tokenExpiry: "24h",
        corsPolicy: "Standard Authorized Headers"
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Health query error: " + err.message });
  }
});

module.exports = router;
