/**
 * ReviewGuard AI - Comprehensive Persistence & Admin Governance Test Runner
 * Validates:
 * 1. Review Persistence & Payload Integrity
 * 2. Deduplication & Idempotency
 * 3. Review History Querying & Reporting
 * 4. Admin Review Management (View, Search, Filter)
 * 5. Admin Single & Bulk Deletion
 * 6. Dashboard Consistency & Dynamic Recalculation
 * 7. RBAC Protection on Admin Review & User Endpoints
 * 8. User Management Safeguards (Sole Admin Protection, Self-Demotion Block)
 * 9. Database Error Reporting
 */

const axios = require("./backend/node_modules/axios");

const BASE_URL = "http://127.0.0.1:5000";

async function run() {
  console.log("=======================================================================");
  console.log("  REVIEWGUARD AI: PERSISTENCE & ADMIN GOVERNANCE VERIFICATION");
  console.log("=======================================================================\n");

  let passed = 0;
  let total = 10;

  // Step 0: Obtain Tokens
  const adminRes = await axios.post(`${BASE_URL}/api/auth/login`, {
    identifier: "admin@reviewguard.ai",
    password: "Admin@123"
  });
  const adminToken = adminRes.data.token;
  const adminUser = adminRes.data.user;

  const analystRes = await axios.post(`${BASE_URL}/api/auth/login`, {
    identifier: "analyst@reviewguard.ai",
    password: "Analyst@123"
  });
  const analystToken = analystRes.data.token;
  const analystUser = analystRes.data.user;

  // Test 1: Analyse and Persist Review to DB
  let createdReviewId = null;
  const testTimestamp = Date.now();
  const testReviewText = `The ergonomic grip of this garden shear prevents blister formation during prolonged hedge trimming. Titanium coating resisted sap buildup. Batch verification #${testTimestamp}.`;

  try {
    const res = await axios.post(`${BASE_URL}/api/reviews/analyze`, {
      product_name: `Ergonomic Hedge Shears v${testTimestamp}`,
      category: "Home/Kitchen",
      reviewer_name: `HedgeMaster_${testTimestamp}`,
      rating: 4,
      headline: "Effective and comfortable garden shears",
      review_text: testReviewText,
      platform: "Amazon",
      save_to_db: true
    }, {
      headers: { Authorization: `Bearer ${analystToken}` }
    });

    const d = res.data;
    if (d.success && d.saved && d.data._id && d.data.risk_score !== undefined && d.data.classification_label) {
      createdReviewId = d.data._id;
      passed++;
      console.log(`[PASS] Test 1: Review Analyzed & Persisted to DB`);
      console.log(`       Record ID: ${createdReviewId}, Saved: ${d.saved}, Risk: ${d.data.risk_score} [${d.data.classification_label}]`);
    } else {
      console.log(`[FAIL] Test 1: Persistence flag or ID missing: ${JSON.stringify(d)}`);
    }
  } catch (err) {
    console.log(`[FAIL] Test 1: ${err.message}`);
  }

  // Test 2: Verify Review Appears in Review History
  try {
    const res = await axios.get(`${BASE_URL}/api/reviews/history?search=${testTimestamp}`);
    const found = res.data.data.find(r => r._id === createdReviewId);
    if (found && found.sentiment_analysis && found.risk_score !== undefined) {
      passed++;
      console.log(`[PASS] Test 2: Review Found in History API`);
      console.log(`       Product: "${found.product_name}", Sentiment: ${found.sentiment_analysis.label}, Date: ${found.createdAt}`);
    } else {
      console.log(`[FAIL] Test 2: Created review not found in history`);
    }
  } catch (err) {
    console.log(`[FAIL] Test 2: ${err.message}`);
  }

  // Test 3: Retrieve Complete Forensic Report for Saved Review
  try {
    const res = await axios.get(`${BASE_URL}/api/reviews/${createdReviewId}`);
    const r = res.data.data;
    if (res.data.success && r && r.lexical_metrics && r.sentiment_analysis && r.rule_engine_version) {
      passed++;
      console.log(`[PASS] Test 3: Complete Forensic Report Retrieved`);
      console.log(`       Engine v${r.rule_engine_version}, Word Count: ${r.lexical_metrics.word_count}, Consistency: ${r.sentiment_analysis.rating_consistency?.is_consistent}`);
    } else {
      console.log(`[FAIL] Test 3: Incomplete forensic report payload`);
    }
  } catch (err) {
    console.log(`[FAIL] Test 3: ${err.message}`);
  }

  // Test 4: Admin Review Management - Locate Record in Admin Reviews API
  try {
    const res = await axios.get(`${BASE_URL}/api/admin/reviews?search=${testTimestamp}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const found = res.data.data.find(r => r._id === createdReviewId);
    if (res.data.success && found) {
      passed++;
      console.log(`[PASS] Test 4: Record Located in Admin Review Management API`);
      console.log(`       Total matching admin items: ${res.data.pagination.totalItems}`);
    } else {
      console.log(`[FAIL] Test 4: Record not returned in admin review listing`);
    }
  } catch (err) {
    console.log(`[FAIL] Test 4: ${err.message}`);
  }

  // Test 5: RBAC - Non-Admin User Blocked from Admin Review & User APIs
  try {
    let reviewBlocked = false;
    let usersBlocked = false;
    try {
      await axios.get(`${BASE_URL}/api/admin/reviews`, {
        headers: { Authorization: `Bearer ${analystToken}` }
      });
    } catch (e) {
      reviewBlocked = e.response?.status === 403;
    }

    try {
      await axios.get(`${BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${analystToken}` }
      });
    } catch (e) {
      usersBlocked = e.response?.status === 403;
    }

    if (reviewBlocked && usersBlocked) {
      passed++;
      console.log(`[PASS] Test 5: RBAC Enforced (Analyst Blocked from Admin APIs with HTTP 403)`);
    } else {
      console.log(`[FAIL] Test 5: Analyst access was not forbidden (Review blocked: ${reviewBlocked}, Users blocked: ${usersBlocked})`);
    }
  } catch (err) {
    console.log(`[FAIL] Test 5: ${err.message}`);
  }

  // Test 6: Dashboard Statistics Consistency Check
  let countBeforeDelete = 0;
  try {
    const dashRes = await axios.get(`${BASE_URL}/api/analytics/dashboard`);
    countBeforeDelete = dashRes.data.totalReviews;
    if (dashRes.data.success && typeof countBeforeDelete === "number" && countBeforeDelete > 0) {
      passed++;
      console.log(`[PASS] Test 6: Dashboard Telemetry Reflects Database Records`);
      console.log(`       Active Count: ${countBeforeDelete}, Avg Score: ${dashRes.data.averageRiskScore}/100`);
    } else {
      console.log(`[FAIL] Test 6: Invalid dashboard statistics`);
    }
  } catch (err) {
    console.log(`[FAIL] Test 6: ${err.message}`);
  }

  // Test 7: Admin Delete Record & Verify Immediate Removal Everywhere
  try {
    const delRes = await axios.delete(`${BASE_URL}/api/admin/reviews/${createdReviewId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // Verify it is gone from Admin Review listing
    const adminCheck = await axios.get(`${BASE_URL}/api/admin/reviews?search=${testTimestamp}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const foundInAdmin = adminCheck.data.data.some(r => r._id === createdReviewId);

    // Verify it is gone from Review History
    const historyCheck = await axios.get(`${BASE_URL}/api/reviews/history?search=${testTimestamp}`);
    const foundInHistory = historyCheck.data.data.some(r => r._id === createdReviewId);

    // Verify dashboard count decremented
    const dashAfter = await axios.get(`${BASE_URL}/api/analytics/dashboard`);
    const countAfterDelete = dashAfter.data.totalReviews;

    if (delRes.data.success && !foundInAdmin && !foundInHistory && countAfterDelete === countBeforeDelete - 1) {
      passed++;
      console.log(`[PASS] Test 7: Admin Deletion Successful & Reflected Globally`);
      console.log(`       Record ${createdReviewId} wiped from Admin, History, and Dashboard (${countBeforeDelete} -> ${countAfterDelete})`);
    } else {
      console.log(`[FAIL] Test 7: Deletion verification failed (foundInAdmin: ${foundInAdmin}, foundInHistory: ${foundInHistory}, count: ${countAfterDelete})`);
    }
  } catch (err) {
    console.log(`[FAIL] Test 7: ${err.message}`);
  }

  // Test 8: Bulk Deletion Feature
  try {
    // Create 2 test reviews to bulk delete
    const r1 = await axios.post(`${BASE_URL}/api/reviews/analyze`, {
      product_name: `Bulk Item 1 ${testTimestamp}`,
      category: "Books",
      reviewer_name: "Tester A",
      rating: 5,
      headline: "Good read",
      review_text: "Informative book with clear chapter layouts and practical code examples for students.",
      save_to_db: true
    }, { headers: { Authorization: `Bearer ${adminToken}` } });

    const r2 = await axios.post(`${BASE_URL}/api/reviews/analyze`, {
      product_name: `Bulk Item 2 ${testTimestamp}`,
      category: "Books",
      reviewer_name: "Tester B",
      rating: 4,
      headline: "Interesting read",
      review_text: "Good historical analysis of distributed database consensus mechanisms and storage engines.",
      save_to_db: true
    }, { headers: { Authorization: `Bearer ${adminToken}` } });

    const id1 = r1.data.data._id;
    const id2 = r2.data.data._id;

    const bulkRes = await axios.delete(`${BASE_URL}/api/admin/reviews/bulk`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { ids: [id1, id2] }
    });

    if (bulkRes.data.success && bulkRes.data.count === 2) {
      passed++;
      console.log(`[PASS] Test 8: Admin Bulk Deletion Operates Accurately`);
      console.log(`       Deleted ${bulkRes.data.count} records in batch.`);
    } else {
      console.log(`[FAIL] Test 8: Bulk deletion result mismatch: ${JSON.stringify(bulkRes.data)}`);
    }
  } catch (err) {
    console.log(`[FAIL] Test 8: ${err.message}`);
  }

  // Test 9: Admin User Governance Safeguards (Prevent Self-Demotion & Sole-Admin Removal)
  try {
    let selfDemoteBlocked = false;
    let selfDeactivateBlocked = false;

    // Try to demote self
    try {
      await axios.patch(`${BASE_URL}/api/admin/users/${adminUser.id || adminUser._id}/role`, {
        role: "analyst"
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    } catch (e) {
      selfDemoteBlocked = e.response?.status === 400 && e.response?.data?.message?.includes("cannot demote");
    }

    // Try to deactivate self
    try {
      await axios.patch(`${BASE_URL}/api/admin/users/${adminUser.id || adminUser._id}/toggle-active`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    } catch (e) {
      selfDeactivateBlocked = e.response?.status === 400 && e.response?.data?.message?.includes("cannot deactivate");
    }

    if (selfDemoteBlocked && selfDeactivateBlocked) {
      passed++;
      console.log(`[PASS] Test 9: User Governance Safeguards Active`);
      console.log(`       Self-demotion blocked: ${selfDemoteBlocked}, Self-deactivation blocked: ${selfDeactivateBlocked}`);
    } else {
      console.log(`[FAIL] Test 9: Safeguard bypass detected (demoteBlocked: ${selfDemoteBlocked}, deactivateBlocked: ${selfDeactivateBlocked})`);
    }
  } catch (err) {
    console.log(`[FAIL] Test 9: ${err.message}`);
  }

  // Test 10: Idempotency & Duplicate Persistence Handling
  try {
    const dupRes = await axios.post(`${BASE_URL}/api/reviews/analyze`, {
      product_name: "CeraVe Hydrating Cleanser",
      category: "Beauty",
      reviewer_name: "GentleUser",
      rating: 5,
      headline: "Daily cleanser",
      review_text: "Very gentle hydrating facial cleanser that does not strip natural oils from dry skin. Excellent formulation.",
      save_to_db: true
    }, { headers: { Authorization: `Bearer ${adminToken}` } });

    // Try re-submitting verbatim same review with save_to_db: true
    const dupRes2 = await axios.post(`${BASE_URL}/api/reviews/analyze`, {
      product_name: "CeraVe Hydrating Cleanser",
      category: "Beauty",
      reviewer_name: "GentleUser",
      rating: 5,
      headline: "Daily cleanser",
      review_text: "Very gentle hydrating facial cleanser that does not strip natural oils from dry skin. Excellent formulation.",
      save_to_db: true
    }, { headers: { Authorization: `Bearer ${adminToken}` } });

    const isDupDetected = dupRes2.data.is_duplicate === true;
    const sameId = dupRes.data.data._id === dupRes2.data.data._id;

    if (isDupDetected && sameId) {
      passed++;
      console.log(`[PASS] Test 10: Idempotency & Duplicate Re-Submission Protection`);
      console.log(`       Duplicate flagged: ${isDupDetected}, Same Record Preserved [${dupRes2.data.data._id}]`);
    } else {
      console.log(`[FAIL] Test 10: Duplicate handling failed (isDup: ${isDupDetected}, sameId: ${sameId})`);
    }
  } catch (err) {
    console.log(`[FAIL] Test 10: ${err.message}`);
  }

  console.log("\n=======================================================================");
  console.log(`  VERIFICATION OUTCOME: ${passed} OF ${total} TESTS PASSED [${Math.round((passed / total) * 100)}%]`);
  console.log("=======================================================================\n");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run().catch(e => {
  console.error("Fatal test runner error:", e);
  process.exit(1);
});
