/**
 * ReviewGuard AI - Cross-Review Duplicate & Campaign Investigation Routes
 * Performs TF-IDF cosine similarity clustering, temporal burst detection,
 * cross-account syndicate identification, and relationship graph generation.
 */

const express = require("express");
const { db } = require("../db");
const { similarityEngine, normalizeText } = require("../engine/textSimilarity");

const router = express.Router();

// 1. Cross-Review Duplicate and Cluster Forensics Overview
router.get("/overview", async (req, res) => {
  try {
    const threshold = parseFloat(req.query.threshold || "0.70");
    const reviews = await db.reviews.find({});

    if (reviews.length < 2) {
      return res.json({
        success: true,
        totalReviews: reviews.length,
        clustersCount: 0,
        exactDuplicatesCount: 0,
        nearDuplicatesCount: 0,
        clusters: [],
        pairwiseMatches: [],
        bursts: [],
        message: "Insufficient reviews stored to perform cross-review clustering (minimum 2 required)."
      });
    }

    // Run similarity clustering
    const clusterResult = similarityEngine.findClusters(reviews, threshold);
    const bursts = similarityEngine.detectReviewBursts(reviews, 48, 2);

    const exactCount = clusterResult.pairwiseMatches.filter(m => m.isExact).length;
    const nearCount = clusterResult.pairwiseMatches.filter(m => !m.isExact).length;

    // Build interactive graph data (nodes and links)
    const nodesMap = new Map();
    const links = [];

    clusterResult.pairwiseMatches.forEach(match => {
      if (!nodesMap.has(match.sourceId)) {
        const doc = reviews.find(r => r._id === match.sourceId);
        nodesMap.set(match.sourceId, {
          id: match.sourceId,
          label: doc ? `${doc.product_name?.substring(0, 20)}... (${doc.reviewer_name})` : match.sourceId,
          product: match.sourceProduct,
          reviewer: match.sourceReviewer,
          risk: doc?.risk_level || "Medium",
          score: doc?.risk_score || 50
        });
      }

      if (!nodesMap.has(match.targetId)) {
        const doc = reviews.find(r => r._id === match.targetId);
        nodesMap.set(match.targetId, {
          id: match.targetId,
          label: doc ? `${doc.product_name?.substring(0, 20)}... (${doc.reviewer_name})` : match.targetId,
          product: match.targetProduct,
          reviewer: match.targetReviewer,
          risk: doc?.risk_level || "Medium",
          score: doc?.risk_score || 50
        });
      }

      links.push({
        source: match.sourceId,
        target: match.targetId,
        similarity: match.similarity,
        isExact: match.isExact
      });
    });

    res.json({
      success: true,
      totalReviews: reviews.length,
      threshold,
      clustersCount: clusterResult.clusters.length,
      exactDuplicatesCount: exactCount,
      nearDuplicatesCount: nearCount,
      clusters: clusterResult.clusters,
      pairwiseMatches: clusterResult.pairwiseMatches.slice(0, 50),
      bursts,
      graphData: {
        nodes: Array.from(nodesMap.values()),
        links
      },
      methodologyNote: "Text similarity indicates structural or lexical overlap. It does not definitively prove fraud or common authorship. Findings should be cross-referenced with purchase verification and account telemetry."
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Investigation analysis failed: " + err.message });
  }
});

// 2. Export Investigation Report as CSV
router.get("/export-report", async (req, res) => {
  try {
    const reviews = await db.reviews.find({});
    const clusterResult = similarityEngine.findClusters(reviews, 0.70);

    const headers = [
      "Match_Type",
      "Similarity_Score",
      "Source_Review_ID",
      "Source_Product",
      "Source_Reviewer",
      "Target_Review_ID",
      "Target_Product",
      "Target_Reviewer"
    ];

    const csvRows = [headers.join(",")];

    clusterResult.pairwiseMatches.forEach(m => {
      csvRows.push([
        m.isExact ? "Exact_Duplicate" : "Near_Duplicate",
        m.similarity,
        `"${m.sourceId}"`,
        `"${(m.sourceProduct || "").replace(/"/g, '""')}"`,
        `"${(m.sourceReviewer || "").replace(/"/g, '""')}"`,
        `"${m.targetId}"`,
        `"${(m.targetProduct || "").replace(/"/g, '""')}"`,
        `"${(m.targetReviewer || "").replace(/"/g, '""')}"`
      ].join(","));
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="reviewguard_duplicate_investigation.csv"');
    res.send(csvRows.join("\n"));
  } catch (err) {
    res.status(500).send("Export failed: " + err.message);
  }
});

module.exports = router;
