/**
 * ReviewGuard AI - Comprehensive Review Analysis & History Routes
 * Handles forensic analysis, validation checklist, history query, re-analysis, and deletion.
 */

const express = require("express");
const crypto = require("crypto");
const { validateReviewPayload } = require("../validator");
const { db } = require("../db");
const { HeuristicEngine, defaultEngine } = require("../engine/heuristicEngine");
const { authenticateToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");

const router = express.Router();

// 1. Validation Checklist Pre-check Endpoint
router.post("/validate", async (req, res) => {
  try {
    const payload = req.body;
    const validation = validateReviewPayload(payload);

    let duplicateDoc = null;
    if (payload.review_text && payload.review_text.trim()) {
      const hash = crypto.createHash("md5").update(payload.review_text.trim().toLowerCase()).digest("hex");
      duplicateDoc = await db.reviews.findByHash(hash);
      if (duplicateDoc) {
        validation.checklist.duplicate_check = false;
      }
    }

    res.json({
      success: true,
      isValid: validation.isValid,
      errors: validation.errors,
      checklist: validation.checklist,
      is_duplicate: !!duplicateDoc,
      duplicateDoc: duplicateDoc ? {
        id: duplicateDoc._id,
        product_name: duplicateDoc.product_name,
        reviewer_name: duplicateDoc.reviewer_name,
        rating: duplicateDoc.rating,
        risk_level: duplicateDoc.risk_level
      } : null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Validation check failed: " + err.message });
  }
});

// 2. Primary Forensic Analysis Endpoint
router.post("/analyze", async (req, res) => {
  try {
    const {
      product_name,
      product_id,
      category,
      reviewer_name,
      reviewer_id,
      rating,
      headline,
      review_text,
      platform,
      review_date,
      save_to_db = true,
      force_reanalyze = false
    } = req.body;

    // A. Validate input payload
    const validation = validateReviewPayload({
      product_name,
      product_id,
      category,
      reviewer_name,
      rating,
      review_text
    });

    if (!validation.isValid) {
      await db.validationFailures.log({
        product_name,
        category,
        reviewer_name,
        rating,
        review_snippet: (review_text || "").substring(0, 100),
        errors: validation.errors,
        reason: "Input validation criteria unmet"
      });

      return res.status(400).json({
        success: false,
        blocked: true,
        error_type: "Validation Error",
        errors: validation.errors,
        checklist: validation.checklist,
        message: "Analysis blocked. Please correct the highlighted errors."
      });
    }

    // B. Check for existing exact duplicate in database if not forcing re-analysis
    const trimmedText = review_text.trim();
    const hash = crypto.createHash("md5").update(trimmedText.toLowerCase()).digest("hex");

    if (!force_reanalyze) {
      const existingDoc = await db.reviews.findByHash(hash);
      if (existingDoc) {
        return res.json({
          success: true,
          saved: false,
          is_duplicate: true,
          message: `Matching review already recorded in database [ID: ${existingDoc._id}]. Retrieved existing forensic record.`,
          data: existingDoc
        });
      }
    }

    // C. Retrieve active rule configuration & context
    const currentConfig = await db.ruleConfig.get();
    const activeEngine = new HeuristicEngine(currentConfig);

    // Fetch existing reviews for similarity corpus & reviewer history
    const allStoredReviews = await db.reviews.find({});
    const reviewerHistory = await db.reviews.findByReviewer(reviewer_id || reviewer_name);

    // D. Run Explainable Heuristic Forensic Analysis
    const analysisReport = await activeEngine.analyze(
      {
        product_name: product_name.trim(),
        product_id: (product_id && product_id.trim()) || "PROD-GEN",
        category: category.trim(),
        reviewer_name: reviewer_name.trim(),
        reviewer_id: (reviewer_id && reviewer_id.trim()) || "REV-USR",
        rating: Number(rating),
        headline: headline ? headline.trim() : "",
        review_text: trimmedText,
        platform: (platform && platform.trim()) || "Web",
        review_date: review_date || new Date().toISOString()
      },
      {
        storedReviews: allStoredReviews,
        reviewerHistory
      }
    );

    // E. Persist into Database
    const recordToSave = {
      _id: "rev_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      product_name: analysisReport.review_details.product_name,
      product_id: analysisReport.review_details.product_id,
      category: analysisReport.review_details.category,
      reviewer_name: analysisReport.review_details.reviewer_name,
      reviewer_id: analysisReport.review_details.reviewer_id,
      rating: analysisReport.review_details.rating,
      headline: analysisReport.review_details.headline,
      review_text: analysisReport.review_details.review_text,
      platform: analysisReport.review_details.platform,
      review_date: analysisReport.review_details.review_date,
      createdAt: new Date().toISOString(),
      risk_score: analysisReport.forensic_assessment.risk_score,
      risk_level: analysisReport.forensic_assessment.risk_level,
      assessment: analysisReport.forensic_assessment.assessment,
      classification_label: analysisReport.forensic_assessment.classification_label,
      assessment_explanation: analysisReport.forensic_assessment.assessment_explanation,
      rule_engine_version: analysisReport.forensic_assessment.rule_engine_version,
      sentiment_analysis: analysisReport.sentiment_analysis,
      triggered_rules: analysisReport.triggered_rules,
      triggered_rules_count: analysisReport.triggered_rules_count,
      text_hash: hash,
      lexical_metrics: analysisReport.lexical_metrics,
      highlighted_phrases: analysisReport.highlighted_phrases,
      duplicate_forensics: {
        ...(analysisReport.duplicate_forensics || {}),
        text_hash: hash
      },
      reviewer_forensics: analysisReport.reviewer_forensics,
      all_rules_audit: analysisReport.all_rules_audit || [],
      methodology_notes: analysisReport.methodology_notes
    };

    let saveError = null;
    if (save_to_db) {
      try {
        await db.reviews.create(recordToSave);
      } catch (dbErr) {
        console.error("Database Save Failure:", dbErr.message);
        saveError = dbErr.message || "Failed to persist analysis to database.";
      }
    }

    if (saveError) {
      return res.status(200).json({
        success: true,
        saved: false,
        save_error: saveError,
        is_duplicate: false,
        message: `Forensic analysis completed successfully, but database persistence failed: ${saveError}`,
        data: recordToSave
      });
    }

    res.json({
      success: true,
      saved: !!save_to_db,
      is_duplicate: false,
      message: save_to_db
        ? `Forensic analysis completed and successfully persisted to database [ID: ${recordToSave._id}].`
        : "Forensic analysis completed in evaluation mode (not saved to database).",
      data: recordToSave
    });
  } catch (err) {
    console.error("Analysis Error:", err);
    res.status(500).json({
      success: false,
      error_type: "Forensic Analysis Failure",
      message: err.message || "An error occurred during forensic evaluation."
    });
  }
});

// 2B. Explicit Save Review Endpoint
router.post("/save", async (req, res) => {
  try {
    const reviewData = req.body;
    if (!reviewData || !reviewData.product_name || !reviewData.review_text) {
      return res.status(400).json({ success: false, message: "Invalid review payload to save." });
    }

    // Check if review already saved
    if (reviewData._id) {
      const existing = await db.reviews.findById(reviewData._id);
      if (existing) {
        return res.json({
          success: true,
          already_saved: true,
          message: `Review record [${existing._id}] is already persisted in the database.`,
          data: existing
        });
      }
    }

    const saved = await db.reviews.create(reviewData);
    res.json({
      success: true,
      already_saved: false,
      message: `Review record [${saved._id}] successfully persisted to database.`,
      data: saved
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Database save failed: " + err.message });
  }
});

// 3. Review History Query with Search, Filters, Sorting, and Pagination
router.get("/history", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category = "all",
      platform = "all",
      sentiment = "all",
      rating = "all",
      risk_level = "all",
      assessment = "all",
      indicator = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
      startDate = "",
      endDate = ""
    } = req.query;

    const query = {
      search,
      category,
      platform,
      sentiment,
      rating,
      risk_level,
      assessment,
      indicator,
      startDate,
      endDate
    };

    const options = {
      sortBy,
      sortOrder
    };

    const allFiltered = await db.reviews.find(query, options);
    const totalCount = allFiltered.length;
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, parseInt(limit, 10));
    const totalPages = Math.ceil(totalCount / pageSize);

    const startIndex = (pageNum - 1) * pageSize;
    const paginatedItems = allFiltered.slice(startIndex, startIndex + pageSize);

    res.json({
      success: true,
      data: paginatedItems,
      pagination: {
        totalItems: totalCount,
        currentPage: pageNum,
        totalPages: Math.max(1, totalPages),
        limit: pageSize,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch review history: " + err.message });
  }
});

// 4. Retrieve Single Review by ID
router.get("/:id", async (req, res) => {
  try {
    const review = await db.reviews.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review record not found." });
    }
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Re-analyze Existing Review with Current Active Engine Version
router.post("/:id/reanalyze", async (req, res) => {
  try {
    const existing = await db.reviews.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Review record not found." });
    }

    const currentConfig = await db.ruleConfig.get();
    const activeEngine = new HeuristicEngine(currentConfig);

    const allStoredReviews = await db.reviews.find({});
    const otherStored = allStoredReviews.filter(r => r._id !== existing._id);
    const reviewerHistory = otherStored.filter(r => 
      (r.reviewer_id && r.reviewer_id === existing.reviewer_id) ||
      (r.reviewer_name && r.reviewer_name === existing.reviewer_name)
    );

    const reanalyzed = await activeEngine.analyze(
      {
        product_name: existing.product_name,
        product_id: existing.product_id,
        category: existing.category,
        reviewer_name: existing.reviewer_name,
        reviewer_id: existing.reviewer_id,
        rating: existing.rating,
        headline: existing.headline,
        review_text: existing.review_text,
        platform: existing.platform,
        review_date: existing.review_date
      },
      {
        storedReviews: otherStored,
        reviewerHistory
      }
    );

    const updated = await db.reviews.update(existing._id, {
      risk_score: reanalyzed.forensic_assessment.risk_score,
      risk_level: reanalyzed.forensic_assessment.risk_level,
      assessment: reanalyzed.forensic_assessment.assessment,
      classification_label: reanalyzed.forensic_assessment.classification_label,
      assessment_explanation: reanalyzed.forensic_assessment.assessment_explanation,
      rule_engine_version: reanalyzed.forensic_assessment.rule_engine_version,
      sentiment_analysis: reanalyzed.sentiment_analysis,
      triggered_rules: reanalyzed.triggered_rules,
      triggered_rules_count: reanalyzed.triggered_rules_count,
      lexical_metrics: reanalyzed.lexical_metrics,
      highlighted_phrases: reanalyzed.highlighted_phrases,
      duplicate_forensics: reanalyzed.duplicate_forensics,
      reviewer_forensics: reanalyzed.reviewer_forensics
    });

    res.json({
      success: true,
      message: `Review re-analyzed with Rule Engine v${reanalyzed.forensic_assessment.rule_engine_version}.`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Re-analysis failed: " + err.message });
  }
});

// 6. Delete Review (Accessible from Normal Review History)
router.delete("/:id", async (req, res) => {
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
      username: req.user?.username || "analyst",
      action: "DELETE_REVIEW",
      entity_type: "REVIEW",
      entity_id: reviewId,
      details: `Deleted review record for product "${existing.product_name}".`
    });

    res.json({
      success: true,
      message: `Review [${reviewId}] deleted successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Clear All Review History (Protected: Admin only)
router.post("/clear-history", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const countBefore = await db.reviews.count();
    await db.reviews.clearAll();

    await db.auditLogs.log({
      username: req.user.username,
      action: "CLEAR_HISTORY",
      entity_type: "REVIEWS",
      details: `Cleared all review history (${countBefore} records removed).`
    });

    res.json({
      success: true,
      message: `All review history cleared (${countBefore} records removed).`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Export Reviews as CSV
router.get("/export-csv", async (req, res) => {
  try {
    const {
      search = "",
      category = "all",
      platform = "all",
      sentiment = "all",
      rating = "all",
      risk_level = "all",
      assessment = "all",
      startDate = "",
      endDate = ""
    } = req.query;

    const query = {
      search,
      category,
      platform,
      sentiment,
      rating,
      risk_level,
      assessment,
      startDate,
      endDate
    };

    const reviews = await db.reviews.find(query, { sortBy: "createdAt", sortOrder: "desc" });

    const headers = [
      "Review_ID",
      "Date",
      "Product_Title",
      "Product_ID",
      "Category",
      "Platform",
      "Reviewer_Name",
      "Reviewer_ID",
      "Rating",
      "Headline",
      "Review_Text",
      "Risk_Score",
      "Risk_Level",
      "Assessment",
      "Sentiment",
      "Triggered_Rules_Count",
      "Exact_Duplicate",
      "Near_Duplicate"
    ];

    const escapeCsv = (val) => `"${String(val ?? "").replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

    const csvRows = [headers.join(",")];
    reviews.forEach(r => {
      csvRows.push([
        escapeCsv(r._id),
        escapeCsv(r.createdAt || r.review_date),
        escapeCsv(r.product_name),
        escapeCsv(r.product_id),
        escapeCsv(r.category),
        escapeCsv(r.platform),
        escapeCsv(r.reviewer_name),
        escapeCsv(r.reviewer_id),
        r.rating,
        escapeCsv(r.headline),
        escapeCsv(r.review_text),
        r.risk_score,
        escapeCsv(r.risk_level),
        escapeCsv(r.assessment),
        escapeCsv(r.sentiment_analysis?.label || "N/A"),
        (r.triggered_rules || []).length,
        r.duplicate_forensics?.is_exact_duplicate ? "Yes" : "No",
        r.duplicate_forensics?.is_near_duplicate ? "Yes" : "No"
      ].join(","));
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="reviewguard_export_${Date.now()}.csv"`);
    res.send(csvRows.join("\n"));
  } catch (err) {
    res.status(500).json({ success: false, error: "Export failed: " + err.message });
  }
});

module.exports = router;
