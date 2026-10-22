/**
 * ReviewGuard AI - Batch CSV Forensics Routes
 * Supports CSV upload, schema & row validation, preview, heuristic batch analysis,
 * and separate CSV downloads for results and validation errors.
 */

const express = require("express");
const multer = require("multer");
const csvParser = require("csv-parser");
const { Readable } = require("stream");
const { validateReviewPayload } = require("../validator");
const { db } = require("../db");
const { HeuristicEngine } = require("../engine/heuristicEngine");
const { similarityEngine } = require("../engine/textSimilarity");

const router = express.Router();
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Cache for recent batch results for quick export
let lastBatchResults = [];
let lastBatchErrors = [];

/**
 * Parses CSV buffer into array of rows
 */
function parseCsvBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString("utf-8"));
    stream
      .pipe(csvParser({
        mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/[\s-]+/g, "_")
      }))
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
}

// 1. Upload, Validate, and Preview CSV
router.post("/preview-csv", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No CSV file uploaded." });
    }

    if (!req.file.originalname.toLowerCase().endsWith(".csv")) {
      return res.status(400).json({ success: false, message: "Only standard .csv files are supported." });
    }

    const rows = await parseCsvBuffer(req.file.buffer);

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "CSV file is empty. Please provide headers and at least 1 record."
      });
    }

    // Verify required header columns
    const firstRow = rows[0];
    const requiredColumns = ["product_name", "category", "reviewer_name", "rating", "review_text"];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        error_type: "Schema Error",
        message: `Missing required CSV column(s): [${missingColumns.join(", ")}]. Required schema: product_name, category, reviewer_name, rating, review_text, headline (optional), product_id (optional), platform (optional).`
      });
    }

    // Row-by-row validation
    const validRows = [];
    const invalidRows = [];

    rows.forEach((row, idx) => {
      const rowNumber = idx + 2; // Accounting for 1-based index and header row
      const payload = {
        product_name: row.product_name,
        product_id: row.product_id || `PROD-CSV-${rowNumber}`,
        category: row.category,
        reviewer_name: row.reviewer_name,
        reviewer_id: row.reviewer_id || `REV-CSV-${rowNumber}`,
        rating: row.rating ? parseInt(row.rating, 10) : undefined,
        headline: row.headline || "",
        review_text: row.review_text,
        platform: row.platform || "CSV Batch"
      };

      const validation = validateReviewPayload(payload);

      if (validation.isValid) {
        validRows.push({
          rowNumber,
          data: payload
        });
      } else {
        invalidRows.push({
          rowNumber,
          data: payload,
          errors: validation.errors,
          errorSummary: validation.errorSummary
        });
      }
    });

    res.json({
      success: true,
      filename: req.file.originalname,
      totalRows: rows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      previewValid: validRows.slice(0, 10),
      invalidRows: invalidRows.slice(0, 50)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "CSV parsing error: " + err.message });
  }
});

// 2. Execute Batch Analysis on Validated Rows
router.post("/process-batch", upload.single("file"), async (req, res) => {
  try {
    let rowsToProcess = [];

    if (req.file) {
      const parsed = await parseCsvBuffer(req.file.buffer);
      rowsToProcess = parsed.map((row, idx) => ({
        rowNumber: idx + 2,
        data: {
          product_name: row.product_name,
          product_id: row.product_id || `PROD-CSV-${idx + 2}`,
          category: row.category,
          reviewer_name: row.reviewer_name,
          reviewer_id: row.reviewer_id || `REV-CSV-${idx + 2}`,
          rating: row.rating ? parseInt(row.rating, 10) : undefined,
          headline: row.headline || "",
          review_text: row.review_text,
          platform: row.platform || "CSV Batch"
        }
      }));
    } else if (req.body.rows) {
      rowsToProcess = typeof req.body.rows === "string" ? JSON.parse(req.body.rows) : req.body.rows;
    } else {
      return res.status(400).json({ success: false, message: "No CSV file or row data provided for processing." });
    }

    const currentConfig = await db.ruleConfig.get();
    const activeEngine = new HeuristicEngine(currentConfig);
    const storedReviews = await db.reviews.find({});

    const processedResults = [];
    const validationErrors = [];
    const validBatchRecords = [];

    // Filter valid vs invalid
    rowsToProcess.forEach(item => {
      const payload = item.data || item;
      const validation = validateReviewPayload(payload);
      if (validation.isValid) {
        validBatchRecords.push({
          rowNumber: item.rowNumber || validBatchRecords.length + 1,
          payload
        });
      } else {
        validationErrors.push({
          rowNumber: item.rowNumber || validationErrors.length + 1,
          product_name: payload.product_name || "N/A",
          reviewer_name: payload.reviewer_name || "N/A",
          rating: payload.rating || "N/A",
          errors: validation.errorSummary
        });
      }
    });

    // Run batch analysis against stored DB and intra-batch duplicates
    for (const item of validBatchRecords) {
      const payload = item.payload;
      const otherBatchItems = validBatchRecords
        .filter(b => b.rowNumber !== item.rowNumber)
        .map(b => b.payload);

      const report = await activeEngine.analyze(payload, {
        storedReviews,
        reviewerHistory: storedReviews.filter(r => r.reviewer_name === payload.reviewer_name),
        batchReviews: otherBatchItems
      });

      const recordToSave = {
        _id: "rev_batch_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
        rowNumber: item.rowNumber,
        product_name: report.review_details.product_name,
        product_id: report.review_details.product_id,
        category: report.review_details.category,
        reviewer_name: report.review_details.reviewer_name,
        reviewer_id: report.review_details.reviewer_id,
        rating: report.review_details.rating,
        headline: report.review_details.headline,
        review_text: report.review_details.review_text,
        platform: report.review_details.platform,
        createdAt: new Date().toISOString(),
        risk_score: report.forensic_assessment.risk_score,
        risk_level: report.forensic_assessment.risk_level,
        assessment: report.forensic_assessment.assessment,
        classification_label: report.forensic_assessment.classification_label,
        assessment_explanation: report.forensic_assessment.assessment_explanation,
        rule_engine_version: report.forensic_assessment.rule_engine_version,
        sentiment_analysis: report.sentiment_analysis,
        triggered_rules: report.triggered_rules,
        triggered_rules_count: report.triggered_rules_count,
        lexical_metrics: report.lexical_metrics,
        duplicate_forensics: report.duplicate_forensics
      };

      processedResults.push(recordToSave);
    }

    // Save valid records into database
    if (processedResults.length > 0) {
      await db.reviews.createBatch(processedResults);
    }

    // Cache results for CSV download
    lastBatchResults = processedResults;
    lastBatchErrors = validationErrors;

    await db.auditLogs.log({
      username: req.user?.username || "Analyst",
      action: "BATCH_CSV_ANALYSIS",
      entity_type: "BATCH",
      details: `Processed batch of ${rowsToProcess.length} rows (${processedResults.length} analyzed, ${validationErrors.length} invalid).`
    });

    res.json({
      success: true,
      message: `Batch analysis completed: ${processedResults.length} records analyzed and saved, ${validationErrors.length} rows rejected.`,
      summary: {
        totalProcessed: rowsToProcess.length,
        analyzedCount: processedResults.length,
        rejectedCount: validationErrors.length,
        appearsGenuine: processedResults.filter(r => r.assessment === "Appears Genuine" || r.assessment === "Likely Genuine").length,
        likelyGenuine: processedResults.filter(r => r.assessment === "Appears Genuine" || r.assessment === "Likely Genuine").length,
        needsReview: processedResults.filter(r => r.assessment === "Needs Review").length,
        suspicious: processedResults.filter(r => r.assessment === "Suspicious" || r.assessment === "Strongly Suspicious").length
      },
      results: processedResults,
      validationErrors
    });
  } catch (err) {
    console.error("Batch processing error:", err);
    res.status(500).json({ success: false, message: "Batch processing failed: " + err.message });
  }
});

// 3. Export Batch Results as CSV
router.get("/export-results", (req, res) => {
  try {
    const headers = [
      "Review_ID",
      "Row_Number",
      "Product_Name",
      "Category",
      "Reviewer_Name",
      "Rating",
      "Risk_Score",
      "Risk_Level",
      "Assessment",
      "Classification_Label",
      "Sentiment",
      "Triggered_Indicators_Count",
      "Triggered_Rules",
      "Rule_Engine_Version",
      "Analyzed_At"
    ];

    const csvRows = [headers.join(",")];

    lastBatchResults.forEach(r => {
      const triggeredNames = (r.triggered_rules || []).map(tr => tr.name).join("; ");
      const classification = r.classification_label || `${(r.risk_level || "Low").toUpperCase()} RISK — ${r.assessment || "Appears Genuine"}`;
      const row = [
        `"${r._id || ""}"`,
        r.rowNumber || "",
        `"${(r.product_name || "").replace(/"/g, '""')}"`,
        `"${r.category || ""}"`,
        `"${(r.reviewer_name || "").replace(/"/g, '""')}"`,
        r.rating || "",
        r.risk_score || 0,
        `"${r.risk_level || ""}"`,
        `"${r.assessment || ""}"`,
        `"${classification}"`,
        `"${r.sentiment_analysis?.label || ""}"`,
        r.triggered_rules_count || 0,
        `"${triggeredNames.replace(/"/g, '""')}"`,
        `"v${r.rule_engine_version || "2.4.0"}"`,
        `"${r.createdAt || ""}"`
      ];
      csvRows.push(row.join(","));
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="reviewguard_batch_results.csv"');
    res.send(csvRows.join("\n"));
  } catch (err) {
    res.status(500).send("Export failed: " + err.message);
  }
});

// 4. Export Batch Validation Errors as CSV
router.get("/export-errors", (req, res) => {
  try {
    const headers = ["Row_Number", "Product_Name", "Reviewer_Name", "Rating", "Validation_Errors"];
    const csvRows = [headers.join(",")];

    lastBatchErrors.forEach(e => {
      const row = [
        e.rowNumber,
        `"${(e.product_name || "").replace(/"/g, '""')}"`,
        `"${(e.reviewer_name || "").replace(/"/g, '""')}"`,
        `"${e.rating || ""}"`,
        `"${(e.errors || "").replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(","));
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="reviewguard_validation_errors.csv"');
    res.send(csvRows.join("\n"));
  } catch (err) {
    res.status(500).send("Export failed: " + err.message);
  }
});

module.exports = router;
