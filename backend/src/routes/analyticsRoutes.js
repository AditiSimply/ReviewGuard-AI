/**
 * ReviewGuard AI - Dashboard & Reviewer Analytics Routes
 * Computes strictly database-backed statistics, distributions, trends, and reviewer profiles.
 * Never fabricates numbers.
 */

const express = require("express");
const { db } = require("../db");
const { similarityEngine } = require("../engine/textSimilarity");

const router = express.Router();

// 1. Core Dashboard Analytics Endpoint
router.get("/dashboard", async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    let reviews = await db.reviews.find({});

    // Apply category filter if provided
    if (category && category !== "all") {
      reviews = reviews.filter(r => r.category?.toLowerCase() === category.toLowerCase());
    }

    // Apply date filters if provided
    if (startDate) {
      const startMs = new Date(startDate).getTime();
      reviews = reviews.filter(r => new Date(r.createdAt || r.review_date).getTime() >= startMs);
    }
    if (endDate) {
      const endMs = new Date(endDate).getTime();
      reviews = reviews.filter(r => new Date(r.createdAt || r.review_date).getTime() <= endMs);
    }

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return res.json({
        success: true,
        totalReviews: 0,
        averageRiskScore: 0,
        assessmentCounts: { genuine: 0, needsReview: 0, suspicious: 0 },
        riskLevelCounts: { low: 0, moderate: 0, high: 0, veryHigh: 0 },
        riskDistribution: [
          { name: "LOW RISK — Appears Genuine (0–24)", count: 0, color: "#10B981" },
          { name: "MODERATE RISK — Needs Review (25–49)", count: 0, color: "#F59E0B" },
          { name: "HIGH RISK — Suspicious (50–74)", count: 0, color: "#F97316" },
          { name: "VERY HIGH RISK — Strongly Suspicious (75–100)", count: 0, color: "#EF4444" }
        ],
        categoryWise: [],
        platformWise: [],
        ratingDistribution: [],
        sentimentDistribution: [],
        topIndicators: [],
        duplicateCount: 0,
        trends: [],
        recentAnalyses: []
      });
    }

    // Assessment counts
    let genuineCount = 0;
    let needsReviewCount = 0;
    let suspiciousCount = 0;
    let totalRiskScore = 0;

    // Risk level distribution
    const riskLevelCounts = { Low: 0, Moderate: 0, High: 0, "Very High": 0 };

    // Rating counts
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    // Sentiment counts
    const sentimentCounts = { Positive: 0, Negative: 0, Neutral: 0, Mixed: 0 };

    // Category-wise accumulation
    const categoryMap = {};

    // Platform-wise accumulation
    const platformMap = {};

    // Triggered rules frequency
    const ruleFrequencyMap = {};

    // Duplicates counter
    let exactDuplicatesCount = 0;
    let nearDuplicatesCount = 0;

    reviews.forEach(r => {
      // Risk score & assessments
      const score = r.risk_score || 0;
      totalRiskScore += score;

      if (r.assessment === "Appears Genuine" || r.assessment === "Likely Genuine") genuineCount++;
      else if (r.assessment === "Needs Review") needsReviewCount++;
      else if (r.assessment === "Suspicious" || r.assessment === "Strongly Suspicious") suspiciousCount++;

      // Risk level
      const rLevel = r.risk_level || (score <= 24 ? "Low" : score <= 49 ? "Moderate" : score <= 74 ? "High" : "Very High");
      if (riskLevelCounts[rLevel] !== undefined) {
        riskLevelCounts[rLevel]++;
      }

      // Ratings
      const rat = Math.round(r.rating || 5);
      if (ratingCounts[rat] !== undefined) ratingCounts[rat]++;

      // Sentiment
      const sent = r.sentiment_analysis?.label || "Neutral";
      if (sentimentCounts[sent] !== undefined) sentimentCounts[sent]++;

      // Category
      const cat = r.category || "Other";
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, count: 0, totalScore: 0, suspicious: 0 };
      }
      categoryMap[cat].count++;
      categoryMap[cat].totalScore += score;
      if (r.assessment === "Suspicious" || r.assessment === "Strongly Suspicious") categoryMap[cat].suspicious++;

      // Platform
      const plat = r.platform || "Direct E-Commerce";
      if (!platformMap[plat]) {
        platformMap[plat] = { platform: plat, count: 0, totalScore: 0, suspicious: 0 };
      }
      platformMap[plat].count++;
      platformMap[plat].totalScore += score;
      if (r.assessment === "Suspicious" || r.assessment === "Strongly Suspicious") platformMap[plat].suspicious++;

      // Indicators
      (r.triggered_rules || []).forEach(tr => {
        const id = tr.rule_id || tr.id;
        const name = tr.name || id;
        if (!ruleFrequencyMap[id]) {
          ruleFrequencyMap[id] = { id, name, count: 0, group: tr.group, severity: tr.severity };
        }
        ruleFrequencyMap[id].count++;
      });

      // Duplicate check
      if (r.duplicate_forensics?.is_exact_duplicate) exactDuplicatesCount++;
      else if (r.duplicate_forensics?.is_near_duplicate) nearDuplicatesCount++;
    });

    const averageRiskScore = Number((totalRiskScore / totalReviews).toFixed(1));

    // Format category stats
    const categoryWise = Object.values(categoryMap).map(c => ({
      category: c.category,
      count: c.count,
      avgRiskScore: Number((c.totalScore / c.count).toFixed(1)),
      suspiciousRatio: Number(((c.suspicious / c.count) * 100).toFixed(1))
    }));

    // Format platform stats
    const platformWise = Object.values(platformMap).map(p => ({
      platform: p.platform,
      count: p.count,
      avgRiskScore: Number((p.totalScore / p.count).toFixed(1)),
      suspiciousRatio: Number(((p.suspicious / p.count) * 100).toFixed(1))
    }));

    // Format top triggered rules
    const topIndicators = Object.values(ruleFrequencyMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Format review trends over time (group by day or hour)
    const trendsMap = {};
    reviews.forEach(r => {
      const dateKey = (r.createdAt || r.review_date || new Date().toISOString()).substring(0, 10);
      if (!trendsMap[dateKey]) {
        trendsMap[dateKey] = { date: dateKey, total: 0, suspicious: 0, genuine: 0, avgScoreTotal: 0 };
      }
      trendsMap[dateKey].total++;
      trendsMap[dateKey].avgScoreTotal += (r.risk_score || 0);
      if (r.assessment === "Suspicious" || r.assessment === "Strongly Suspicious") trendsMap[dateKey].suspicious++;
      if (r.assessment === "Appears Genuine" || r.assessment === "Likely Genuine") trendsMap[dateKey].genuine++;
    });

    const trends = Object.values(trendsMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map(t => ({
        date: t.date,
        total: t.total,
        suspicious: t.suspicious,
        genuine: t.genuine,
        avgRiskScore: Number((t.avgScoreTotal / t.total).toFixed(1))
      }));

    res.json({
      success: true,
      totalReviews,
      averageRiskScore,
      assessmentCounts: {
        genuine: genuineCount,
        needsReview: needsReviewCount,
        suspicious: suspiciousCount
      },
      riskLevelCounts: {
        low: riskLevelCounts["Low"],
        moderate: riskLevelCounts["Moderate"],
        high: riskLevelCounts["High"],
        veryHigh: riskLevelCounts["Very High"]
      },
      riskDistribution: [
        { name: "LOW RISK — Appears Genuine (0–24)", count: riskLevelCounts["Low"], color: "#10B981" },
        { name: "MODERATE RISK — Needs Review (25–49)", count: riskLevelCounts["Moderate"], color: "#F59E0B" },
        { name: "HIGH RISK — Suspicious (50–74)", count: riskLevelCounts["High"], color: "#F97316" },
        { name: "VERY HIGH RISK — Strongly Suspicious (75–100)", count: riskLevelCounts["Very High"], color: "#EF4444" }
      ],
      ratingDistribution: [
        { rating: "1 Star", count: ratingCounts[1] },
        { rating: "2 Stars", count: ratingCounts[2] },
        { rating: "3 Stars", count: ratingCounts[3] },
        { rating: "4 Stars", count: ratingCounts[4] },
        { rating: "5 Stars", count: ratingCounts[5] }
      ],
      sentimentDistribution: [
        { sentiment: "Positive", count: sentimentCounts["Positive"], color: "#10B981" },
        { sentiment: "Negative", count: sentimentCounts["Negative"], color: "#EF4444" },
        { sentiment: "Neutral", count: sentimentCounts["Neutral"], color: "#6B7280" },
        { sentiment: "Mixed", count: sentimentCounts["Mixed"], color: "#8B5CF6" }
      ],
      categoryWise,
      platformWise,
      topIndicators,
      duplicateCounts: {
        exact: exactDuplicatesCount,
        near: nearDuplicatesCount,
        total: exactDuplicatesCount + nearDuplicatesCount
      },
      trends,
      recentAnalyses: reviews.slice(0, 6)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Dashboard analytics error: " + err.message });
  }
});

// 2. Dynamic List of Available Reviewer Profiles
router.get("/reviewers", async (req, res) => {
  try {
    const list = await db.reviews.getReviewersSummary();
    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to list reviewers: " + err.message });
  }
});

// 3. Reviewer Profile Analytics Endpoint
router.get("/reviewer/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const reviewerReviews = await db.reviews.findByReviewer(identifier);

    if (reviewerReviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No review history found for this reviewer "${identifier}".`
      });
    }

    const reviewCount = reviewerReviews.length;
    const ratings = reviewerReviews.map(r => r.rating || 5);
    const avgRating = Number((ratings.reduce((a, b) => a + b, 0) / reviewCount).toFixed(2));

    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => { if (ratingDistribution[r] !== undefined) ratingDistribution[r]++; });

    // Rating variance & standard deviation
    const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avgRating, 2), 0) / reviewCount;
    const stdDev = Number(Math.sqrt(variance).toFixed(2));

    // Internal text similarity across reviewer's submissions
    let maxInternalSimilarity = 0;
    if (reviewCount >= 2) {
      for (let i = 0; i < reviewCount; i++) {
        for (let j = i + 1; j < reviewCount; j++) {
          const sim = similarityEngine.compareQueryAgainstCorpus(
            reviewerReviews[i].review_text,
            [reviewerReviews[j]]
          );
          if (sim.length > 0 && sim[0].similarityScore > maxInternalSimilarity) {
            maxInternalSimilarity = sim[0].similarityScore;
          }
        }
      }
    }

    const isSuspiciousPattern = (reviewCount >= 3 && stdDev === 0.0) || maxInternalSimilarity >= 0.70;

    res.json({
      success: true,
      reviewerId: identifier,
      reviewCount,
      hasSufficientHistory: reviewCount >= 2,
      averageRating: avgRating,
      ratingStdDev: stdDev,
      ratingDistribution,
      maxInternalSimilarity,
      suspiciousPatternDetected: isSuspiciousPattern,
      patternNotes: isSuspiciousPattern
        ? "Reviewer demonstrates zero rating variance or high template reuse across multiple reviews."
        : "Rating distribution and submission variability conform to standard individual behavior.",
      reviews: reviewerReviews
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Reviewer profile analysis error: " + err.message });
  }
});

module.exports = router;
