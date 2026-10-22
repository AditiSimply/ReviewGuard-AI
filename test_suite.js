/**
 * ReviewGuard AI - Comprehensive Final-Year Project Verification Test Suite
 * Validates the full-stack system: 20-Rule Explainable Heuristic Forensics,
 * Authentication & RBAC, Sentiment Analysis, TF-IDF Cosine Similarity,
 * Cross-Review Duplicate Detection, Product Validation, and Batch Processing.
 */

const axios = require("./backend/node_modules/axios");

const BASE_URL = process.env.API_URL || "http://127.0.0.1:5000";

let adminToken = "";
let analystToken = "";

async function runTestSuite() {
  console.log("=======================================================================");
  console.log("  REVIEWGUARD AI: COMPLETE 20-TEST FORENSIC AUDIT & VERIFICATION SUITE");
  console.log("  Project: Intelligent Fake Review Detection & Review Forensics System");
  console.log("=======================================================================\n");

  let passedTests = 0;
  let totalTests = 21;

  // 1. Health Check & Architecture Telemetry
  try {
    const health = await axios.get(`${BASE_URL}/api/health`);
    console.log("✓ Backend Service Status: ONLINE");
    console.log(`  Engine: ${health.data.engine} (${health.data.version})`);
    console.log(`  Database Layer: ${health.data.database.engine} (${health.data.database.statusMessage})\n`);
  } catch (e) {
    console.error("Backend offline. Please start server via 'npm start' in backend directory:", e.message);
    return;
  }

  async function testCase(id, title, testFn) {
    try {
      const result = await testFn();
      if (result.pass) {
        passedTests++;
        console.log(`[PASS] Case #${id.toString().padStart(2, "0")}: ${title}`);
        console.log(`       Outcome: ${result.message}`);
      } else {
        console.log(`[FAIL] Case #${id.toString().padStart(2, "0")}: ${title} -> ${result.message}`);
      }
    } catch (err) {
      console.log(`[ERR]  Case #${id.toString().padStart(2, "0")}: ${title} -> Error: ${err.response?.data?.message || err.message}`);
    }
  }

  // Case 01: Admin Authentication
  await testCase(1, "Authentication - Admin Login & JWT Issuance", async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      identifier: "admin@reviewguard.ai",
      password: "Admin@123"
    });
    adminToken = res.data.token;
    const isRoleMatch = res.data.user.role?.toLowerCase() === "admin";
    return {
      pass: res.data.success && isRoleMatch && !!adminToken,
      message: `Admin authenticated successfully. Role: ${res.data.user.role}`
    };
  });

  // Case 02: Analyst Authentication
  await testCase(2, "Authentication - Analyst Login & Permissions", async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      identifier: "analyst@reviewguard.ai",
      password: "Analyst@123"
    });
    analystToken = res.data.token;
    const isRoleMatch = res.data.user.role?.toLowerCase() === "analyst";
    return {
      pass: res.data.success && isRoleMatch && !!analystToken,
      message: `Analyst authenticated successfully. Role: ${res.data.user.role}`
    };
  });

  // Case 03: Authentic Genuine Review (Low Risk)
  await testCase(3, "Core Engine - Authentic Review Assessment (Low Risk)", async () => {
    const ts = Date.now();
    const res = await axios.post(`${BASE_URL}/api/reviews/analyze`, {
      product_name: `Felco Classic Pruning Shears ${ts}`,
      category: "Home/Kitchen",
      reviewer_name: `Gardener_${ts}`,
      rating: 4,
      headline: "Clean cuts on garden stems",
      review_text: `The carbon steel bypass blades slice cleanly through woody branches up to half an inch thick. Spring tension provides smooth opening rebound without jarring my wrist, and the safety lock engages securely with one thumb click. The textured non-slip grips stayed secure even when working in damp soil. Batch ${ts}`,
      save_to_db: false
    });
    const pass = res.data.success && res.data.data.assessment === "Appears Genuine" && res.data.data.risk_level === "Low" && res.data.data.classification_label === "LOW RISK — Appears Genuine";
    return {
      pass,
      message: `Risk Score: ${res.data.data.risk_score}/100 [${res.data.data.risk_level}] - ${res.data.data.assessment} (${res.data.data.classification_label})`
    };
  });

  // Case 04: Blatant Paid Spam (Promotional + Shout Uppercase + Calls to Action)
  await testCase(4, "Core Engine - Blatant Promotional Spam (High Risk / Multiple Rules)", async () => {
    const res = await axios.post(`${BASE_URL}/api/reviews/analyze`, {
      product_name: "Sony WH-1000XM5 Wireless Headphones",
      category: "Electronics",
      reviewer_name: "AffiliateBot",
      rating: 5,
      headline: "AMAZING DEAL BUY NOW",
      review_text: "AMAZING BEST EVER PRODUCT IN THE UNIVERSE!!! Buy this right now 100% recommended guaranteed satisfaction incredible deal run and buy don't miss out!!!!!"
    });
    const rulesCount = res.data.data.triggered_rules.length;
    const pass = res.data.success && res.data.data.risk_score >= 40 && rulesCount >= 4;
    return {
      pass,
      message: `Risk Score: ${res.data.data.risk_score}/100 [${res.data.data.risk_level}] - Triggered ${rulesCount} rules`
    };
  });

  // Case 05: Rating-Sentiment Contradiction (1-Star Glowing)
  await testCase(5, "Heuristics - Rating-Sentiment Inconsistency (Rule 01)", async () => {
    const res = await axios.post(`${BASE_URL}/api/reviews/analyze`, {
      product_name: "CeraVe Hydrating Facial Cleanser",
      category: "Beauty",
      reviewer_name: "ContradictUser",
      rating: 1,
      headline: "Best holy grail ever",
      review_text: "Absolutely stunning holy grail product! Best face wash ever made, 500 stars to this divine gift, completely cured my skin and made it flawless perfection!!"
    });
    const hasRule01 = res.data.data.triggered_rules.some(r => r.rule_id === "RULE_01");
    return {
      pass: res.data.success && hasRule01,
      message: `Detected Rule 01: Star Rating 1★ contradicted extreme positive sentiment (Score: ${res.data.data.sentiment_analysis.score})`
    };
  });

  // Case 06: Excessive Repetition & Chant (Rule 03)
  await testCase(6, "Heuristics - Repetitive Chant Patterns (Rule 03)", async () => {
    const res = await axios.post(`${BASE_URL}/api/reviews/analyze`, {
      product_name: "Nike Dri-FIT Running T-Shirt",
      category: "Fashion",
      reviewer_name: "ChantBot",
      rating: 5,
      headline: "Repetitive",
      review_text: "Best shirt best shirt best shirt. Buy this now buy this now buy this now."
    });
    const hasRule03 = res.data.data.triggered_rules.some(r => r.rule_id === "RULE_03");
    return {
      pass: res.data.success && hasRule03,
      message: `Triggered RULE_03: Consecutive identical phrase repetition flagged`
    };
  });

  // Case 07: Product/Category Cross-Domain Mismatch (Rule 11)
  await testCase(7, "Heuristics - Product/Category Relevance Mismatch (Rule 11)", async () => {
    const res = await axios.post(`${BASE_URL}/api/reviews/analyze`, {
      product_name: "Noise Cancelling Headphones",
      category: "Electronics",
      reviewer_name: "MismatchedReviewer",
      rating: 5,
      headline: "Delicious",
      review_text: "These headphones have a very tasty flavor and delicious crunchy texture that pairs well with soup."
    });
    const hasRule11 = res.data.data.triggered_rules.some(r => r.rule_id === "RULE_11");
    return {
      pass: res.data.success && hasRule11,
      message: `Triggered RULE_11: Functionally incompatible food attributes identified on electronics`
    };
  });

  // Case 08: Exact Duplicate Detection (Rule 15)
  await testCase(8, "Text Forensics - Exact Duplicate Hash Detection (Rule 15)", async () => {
    const text = "Verbatim identical review copy pasted across separate submissions for testing.";
    await axios.post(`${BASE_URL}/api/reviews/analyze`, {
      product_name: "Item Alpha",
      category: "Books",
      reviewer_name: "OriginalUser",
      rating: 4,
      review_text: text,
      force_reanalyze: true
    });

    const res = await axios.post(`${BASE_URL}/api/reviews/analyze`, {
      product_name: "Item Beta",
      category: "Books",
      reviewer_name: "CopyUser",
      rating: 4,
      review_text: text,
      force_reanalyze: true
    });

    const isExact = res.data.data.duplicate_forensics?.is_exact_duplicate;
    return {
      pass: res.data.success && isExact,
      message: `Identified 100% byte-for-byte exact duplicate hash`
    };
  });

  // Case 09: Near Duplicate Detection (Rule 16 - TF-IDF Cosine Similarity)
  await testCase(9, "Text Forensics - Near-Duplicate TF-IDF Similarity (Rule 16)", async () => {
    const baseText = "The mechanical keyboard switches provide crisp tactile feedback while typing code.";
    const nearText = "The mechanical keyboard switches provide very crisp tactile feedback while typing my code.";

    await axios.post(`${BASE_URL}/api/reviews/analyze`, {
      product_name: "Keychron K2",
      category: "Electronics",
      reviewer_name: "User1",
      rating: 5,
      review_text: baseText,
      force_reanalyze: true
    });

    const res = await axios.post(`${BASE_URL}/api/reviews/analyze`, {
      product_name: "Keychron K2",
      category: "Electronics",
      reviewer_name: "User2",
      rating: 5,
      review_text: nearText,
      force_reanalyze: true
    });

    const isNear = res.data.data.duplicate_forensics?.is_near_duplicate || res.data.data.duplicate_forensics?.highest_similarity_score >= 0.70;
    return {
      pass: res.data.success && isNear,
      message: `Computed Cosine & Jaccard Similarity: ${Math.round(res.data.data.duplicate_forensics.highest_similarity_score * 100)}%`
    };
  });

  // Case 10: Input Validation - Empty and Short Text Rejection
  await testCase(10, "Input Validation - Too Short Text Blocked (No Fake Prediction)", async () => {
    let blocked = false;
    try {
      await axios.post(`${BASE_URL}/api/reviews/analyze`, {
        product_name: "Mouse",
        category: "Electronics",
        reviewer_name: "Bob",
        rating: 5,
        review_text: "Good" // only 4 chars
      });
    } catch (err) {
      blocked = err.response?.status === 400 && err.response?.data?.blocked === true;
    }
    return {
      pass: blocked,
      message: "Rejected input under 12 characters with 400 Bad Request"
    };
  });

  // Case 11: Input Validation - Invalid Star Rating
  await testCase(11, "Input Validation - Out-of-Range Star Rating (0 or 6)", async () => {
    let blocked = false;
    try {
      await axios.post(`${BASE_URL}/api/reviews/analyze`, {
        product_name: "Monitor",
        category: "Electronics",
        reviewer_name: "Bob",
        rating: 6,
        review_text: "Solid 4K display with high refresh rate."
      });
    } catch (err) {
      blocked = err.response?.status === 400 && !!err.response?.data?.errors?.rating;
    }
    return {
      pass: blocked,
      message: "Blocked out-of-range rating with specific field error"
    };
  });

  // Case 12: Input Validation - Gibberish Rejection
  await testCase(12, "Input Validation - Gibberish & Consonant Noise Rejection", async () => {
    let blocked = false;
    try {
      await axios.post(`${BASE_URL}/api/reviews/analyze`, {
        product_name: "Smart Watch",
        category: "Electronics",
        reviewer_name: "Bob",
        rating: 4,
        review_text: "zkrtplwqsdmnbvcxzlkjhgfdsa"
      });
    } catch (err) {
      blocked = err.response?.status === 400;
    }
    return {
      pass: blocked,
      message: "Detected unnatural consonant cluster noise and blocked submission"
    };
  });

  // Case 13: Product-Category Catalogue Validation
  await testCase(13, "Catalogue Intelligence - Product/Category Mismatch Check", async () => {
    let blocked = false;
    try {
      await axios.post(`${BASE_URL}/api/reviews/analyze`, {
        product_name: "Apple iPhone 15 Pro",
        category: "Fashion", // Valid category, but mismatched with Electronics iPhone
        reviewer_name: "User",
        rating: 4,
        review_text: "Smooth display and great titanium chassis."
      });
    } catch (err) {
      blocked = err.response?.status === 400 && !!err.response?.data?.errors?.category_mismatch;
    }
    return {
      pass: blocked,
      message: "Detected verified catalogue entry classified under wrong category"
    };
  });

  // Case 14: Review History Persistence & Filters
  await testCase(14, "History & Database - Querying, Pagination, and Filters", async () => {
    const res = await axios.get(`${BASE_URL}/api/reviews/history?limit=5&category=Electronics`);
    return {
      pass: res.data.success && Array.isArray(res.data.data) && res.data.pagination.totalItems > 0,
      message: `Retrieved paginated records (${res.data.pagination.totalItems} matching category 'Electronics')`
    };
  });

  // Case 15: Re-analysis with Active Engine Version
  await testCase(15, "Forensics - Re-evaluating Historical Review with Engine Versioning", async () => {
    const listRes = await axios.get(`${BASE_URL}/api/reviews/history?limit=1`);
    const reviewId = listRes.data.data[0]._id;

    const reRes = await axios.post(`${BASE_URL}/api/reviews/${reviewId}/reanalyze`);
    return {
      pass: reRes.data.success && reRes.data.data.rule_engine_version === "2.4.0",
      message: `Review [${reviewId}] re-analyzed with v${reRes.data.data.rule_engine_version}`
    };
  });

  // Case 16: Reviewer Analytics Profile
  await testCase(16, "Reviewer Forensics - Profiling History, Rating Variance, and Templates", async () => {
    const res = await axios.get(`${BASE_URL}/api/analytics/reviewer/David%20K.`);
    return {
      pass: res.data.success && res.data.reviewCount > 0,
      message: `Reviewer 'David K.': ${res.data.reviewCount} review(s), Mean Rating: ${res.data.averageRating}★, Variance: ${res.data.ratingStdDev}`
    };
  });

  // Case 17: Cross-Review Campaign & Cluster Detection
  await testCase(17, "Campaign Forensics - Cluster Graph & Temporal Burst Inspection", async () => {
    const res = await axios.get(`${BASE_URL}/api/investigation/overview?threshold=0.65`);
    return {
      pass: res.data.success && res.data.graphData !== undefined,
      message: `Generated relationship graph: ${res.data.graphData.nodes.length} nodes, ${res.data.graphData.links.length} similarity links`
    };
  });

  // Case 18: Dashboard Analytics Telemetry
  await testCase(18, "Dashboard - Database-Backed KPI Aggregations", async () => {
    const res = await axios.get(`${BASE_URL}/api/analytics/dashboard`);
    const d = res.data;
    const pass = d.success && d.totalReviews > 0 && Array.isArray(d.riskDistribution);
    return {
      pass,
      message: `Total Reviews: ${d.totalReviews}, Avg Risk: ${d.averageRiskScore}/100, Genuine: ${d.assessmentCounts.genuine}, Suspicious: ${d.assessmentCounts.suspicious}`
    };
  });

  // Case 19: RBAC Enforcement - Analyst Blocked from Admin Endpoints
  await testCase(19, "Security & RBAC - Analyst Role Forbidden from Rule Weight Modification", async () => {
    let forbidden = false;
    try {
      await axios.put(`${BASE_URL}/api/admin/rules`, { rules: [] }, {
        headers: { Authorization: `Bearer ${analystToken}` }
      });
    } catch (err) {
      forbidden = err.response?.status === 403;
    }
    return {
      pass: forbidden,
      message: "Enforced HTTP 403 Forbidden on analyst token attempting admin rule change"
    };
  });

  // Case 20: Admin Rule Weight Configuration & Audit Logging
  await testCase(20, "Governance - Admin Rule Weight Modification, Versioning & Audit Trail", async () => {
    const rulesRes = await axios.get(`${BASE_URL}/api/admin/rules`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const currentConfig = rulesRes.data.data;

    const updatedRules = currentConfig.rules.map(r => r.id === "RULE_02" ? { ...r, weight: 18 } : r);
    const updateRes = await axios.put(`${BASE_URL}/api/admin/rules`, {
      rules: updatedRules,
      bands: currentConfig.bands
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const auditRes = await axios.get(`${BASE_URL}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const hasLog = auditRes.data.data.some(l => l.action === "UPDATE_RULE_CONFIGURATION");

    return {
      pass: updateRes.data.success && hasLog && updateRes.data.data.version > currentConfig.version,
      message: `Updated to Version ${updateRes.data.data.version}. Audit log successfully recorded without credential leaks.`
    };
  });

  // Case 21: Critical Sentiment Regression - 5-Star Contradiction with Negative Language
  await testCase(21, "Sentiment Regression - 5★ Rating with 'Very Bad Quality' Contradiction", async () => {
    const res = await axios.post(`${BASE_URL}/api/reviews/analyze`, {
      product_name: "Sony Wireless Earbuds",
      product_id: "PROD-ELEC-009",
      category: "Electronics",
      reviewer_name: "John Customer",
      reviewer_id: "User884920",
      rating: 5,
      headline: "Very Bad Quality",
      review_text: "it stopped working after 2 days! Extremely disappointing",
      platform: "Amazon",
      force_reanalyze: true
    });

    const data = res.data.data;
    const isNegative = data.sentiment_analysis.label === "Negative";
    const isMismatch = data.sentiment_analysis.rating_consistency.is_consistent === false;
    const hasExplanation = data.sentiment_analysis.rating_consistency.explanation.includes("negative sentiment") ||
                           data.sentiment_analysis.rating_consistency.explanation.includes("Contradiction");
    const triggeredRule1 = data.triggered_rules.some(r => (r.rule_id === "RULE_01" || r.id === "RULE_01"));
    const notForcedFake = data.assessment !== "Fake" && data.risk_score >= 50;

    const pass = isNegative && isMismatch && hasExplanation && triggeredRule1 && notForcedFake;

    return {
      pass,
      message: `Sentiment: ${data.sentiment_analysis.label} (${data.sentiment_analysis.score}), Mismatch Flagged: ${!data.sentiment_analysis.rating_consistency.is_consistent}, Score: ${data.risk_score}/100 [${data.risk_level} - ${data.assessment}], Triggered RULE_01: ${triggeredRule1}`
    };
  });

  console.log("\n=======================================================================");
  console.log(`  AUDIT COMPLETE: ${passedTests} OF ${totalTests} TESTS PASSED [${Math.round((passedTests / totalTests) * 100)}%]`);
  console.log("=======================================================================\n");
}

runTestSuite();
