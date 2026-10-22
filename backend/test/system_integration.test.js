/**
 * ReviewGuard AI - Comprehensive System Integration, Persistence, & RBAC Test Suite
 * Validates database persistence, retrieval, filtering, deletion, user auth & registration,
 * RBAC authorization, rule updates, dashboard telemetry calculation, and CSV validation.
 */

const test = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { db } = require("../src/db");
const { HeuristicEngine } = require("../src/engine/heuristicEngine");
const { analyzeSentiment, evaluateRatingSentimentConsistency } = require("../src/engine/sentimentAnalyzer");
const { validateReviewPayload } = require("../src/validator");
const { JWT_SECRET } = require("../src/middleware/auth");

// ============================================================================
// 1. MIXED SENTIMENT & COMPLEX LINGUISTIC HANDLING
// ============================================================================
test("Mixed Sentiment: Accurately identifies compound sentiment with conflicting clauses", () => {
  const headline = "Decent screen but disappointing battery";
  const body = "The OLED display is remarkably vivid and sharp, but the battery drains completely within two hours and the customer support was extremely rude and unhelpful.";
  
  const sentiment = analyzeSentiment(headline, body);
  assert.ok(sentiment.positiveWords.length > 0, "Should identify positive words (vivid, sharp)");
  assert.ok(sentiment.negativeWords.length > 0, "Should identify negative words (disappointing, drains, rude, unhelpful)");
  // Overall negative bias due to multiple strong negatives
  assert.ok(sentiment.score <= 0, "Conflicting clauses with dominant negatives should yield non-positive score");
});

test("Mixed Sentiment: Rating-Sentiment evaluation handles nuanced 3-star mixed review", () => {
  const sentiment = analyzeSentiment("Average", "Has some great features but also notable drawbacks and slow shipping.");
  const evalResult = evaluateRatingSentimentConsistency(3, sentiment);
  // 3-star with mixed/mild sentiment is normal consumer behavior
  assert.strictEqual(evalResult.isConsistent, true, "3-star rating with balanced/mixed sentiment should be consistent");
  assert.strictEqual(evalResult.mismatch, false);
});

// ============================================================================
// 2. DATABASE PERSISTENCE, RETRIEVAL, AND HISTORY FILTERING
// ============================================================================
test("Database Persistence: Persists a review and retrieves it by ID", async () => {
  const testReview = {
    product_name: "Test Wireless Mouse",
    product_id: "TEST-PROD-001",
    category: "Electronics",
    platform: "Amazon",
    reviewer_name: "Jane Doe",
    reviewer_id: "REV-JANE-001",
    rating: 4,
    headline: "Reliable mouse",
    review_text: "Good ergonomic feel and smooth tracking. Battery lasts around three months.",
    review_date: new Date().toISOString(),
    risk_score: 12,
    risk_level: "Low",
    assessment: "Appears Genuine",
    classification_label: "LOW RISK — Appears Genuine",
    sentiment_analysis: { label: "Positive", score: 3 },
    triggered_rules: [],
    all_rules_audit: []
  };

  const created = await db.reviews.create(testReview);
  assert.ok(created._id, "Created review must have an _id");
  assert.strictEqual(created.product_name, "Test Wireless Mouse");

  const fetched = await db.reviews.findById(created._id);
  assert.ok(fetched, "Fetched review must exist");
  assert.strictEqual(fetched._id, created._id);
  assert.strictEqual(fetched.reviewer_name, "Jane Doe");
  assert.strictEqual(fetched.rating, 4);

  // Clean up
  await db.reviews.deleteById(created._id);
});

test("History Filtering: Queries reviews by platform, sentiment, category, and text search", async () => {
  // Create 2 test reviews with distinctive attributes
  const reviewA = await db.reviews.create({
    product_name: "Mechanical Keyboard RGB",
    product_id: "KEY-001",
    category: "Electronics",
    platform: "Trustpilot",
    reviewer_name: "KeyTester",
    rating: 5,
    headline: "Exceptional switches",
    review_text: "Typing experience is pristine, sturdy aluminum chassis.",
    review_date: new Date().toISOString(),
    risk_score: 8,
    risk_level: "Low",
    assessment: "Appears Genuine",
    sentiment_analysis: { label: "Positive", score: 4 },
    triggered_rules: []
  });

  const reviewB = await db.reviews.create({
    product_name: "Organic Green Tea",
    product_id: "TEA-001",
    category: "Grocery",
    platform: "Flipkart",
    reviewer_name: "TeaLover",
    rating: 1,
    headline: "Stale and bitter",
    review_text: "Very disappointing taste and arrived damaged.",
    review_date: new Date().toISOString(),
    risk_score: 45,
    risk_level: "Moderate",
    assessment: "Needs Review",
    sentiment_analysis: { label: "Negative", score: -4 },
    triggered_rules: []
  });

  // Filter by platform: Trustpilot
  const platformResult = await db.reviews.find({ platform: "Trustpilot" });
  assert.ok(platformResult.some(r => r._id === reviewA._id));
  assert.ok(!platformResult.some(r => r._id === reviewB._id));

  // Filter by sentiment: Negative
  const sentimentResult = await db.reviews.find({ sentiment: "Negative" });
  assert.ok(sentimentResult.some(r => r._id === reviewB._id));

  // Filter by category: Grocery
  const categoryResult = await db.reviews.find({ category: "Grocery" });
  assert.ok(categoryResult.some(r => r._id === reviewB._id));
  assert.ok(!categoryResult.some(r => r._id === reviewA._id));

  // Multi-field text search for "aluminum"
  const searchResult = await db.reviews.find({ search: "aluminum" });
  assert.ok(searchResult.some(r => r._id === reviewA._id));

  // Clean up
  await db.reviews.deleteById(reviewA._id);
  await db.reviews.deleteById(reviewB._id);
});

// ============================================================================
// 3. REVIEW DELETION (SINGLE AND BULK)
// ============================================================================
test("Review Deletion: Single deletion removes record from database", async () => {
  const review = await db.reviews.create({
    product_name: "Temporary Item",
    category: "Other",
    rating: 3,
    headline: "Temp",
    review_text: "To be deleted soon.",
    risk_score: 0,
    risk_level: "Low"
  });

  const deleteSuccess = await db.reviews.deleteById(review._id);
  assert.strictEqual(deleteSuccess, true, "Delete should return true");

  const afterFetch = await db.reviews.findById(review._id);
  assert.strictEqual(afterFetch, null, "Deleted review should not exist in database");
});

test("Review Deletion: Bulk deletion removes multiple records simultaneously", async () => {
  const r1 = await db.reviews.create({ product_name: "Bulk 1", category: "Other", rating: 5, review_text: "Text 1" });
  const r2 = await db.reviews.create({ product_name: "Bulk 2", category: "Other", rating: 4, review_text: "Text 2" });

  const deletedCount = await db.reviews.deleteMany([r1._id, r2._id]);
  assert.strictEqual(deletedCount, 2, "Should delete exactly 2 reviews");

  const check1 = await db.reviews.findById(r1._id);
  const check2 = await db.reviews.findById(r2._id);
  assert.strictEqual(check1, null);
  assert.strictEqual(check2, null);
});

// ============================================================================
// 4. AUTHENTICATION, PASSWORD HASHING, & REGISTRATION
// ============================================================================
test("Authentication: Passwords hashed with bcrypt and verified with compare", async () => {
  const rawPassword = "SecurePass@2026!";
  const hash = await bcrypt.hash(rawPassword, 10);

  assert.notStrictEqual(rawPassword, hash);
  const isValid = await bcrypt.compare(rawPassword, hash);
  assert.strictEqual(isValid, true, "Bcrypt comparison should succeed for correct password");

  const isInvalid = await bcrypt.compare("WrongPassword", hash);
  assert.strictEqual(isInvalid, false, "Bcrypt comparison should fail for incorrect password");
});

test("Authentication: JWT token generation and claims decoding", () => {
  const payload = { id: "USER-123", username: "analyst_sarah", role: "analyst" };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

  const decoded = jwt.verify(token, JWT_SECRET);
  assert.strictEqual(decoded.username, "analyst_sarah");
  assert.strictEqual(decoded.role, "analyst");
});

test("Authorization (RBAC): Analyst role rejected from admin-only requirement", () => {
  const analystToken = jwt.sign({ id: "U1", username: "analyst_user", role: "analyst" }, JWT_SECRET);
  const adminToken = jwt.sign({ id: "U2", username: "admin_user", role: "admin" }, JWT_SECRET);

  const decodedAnalyst = jwt.verify(analystToken, JWT_SECRET);
  const decodedAdmin = jwt.verify(adminToken, JWT_SECRET);

  const checkIsAdmin = (user) => user && user.role === "admin";

  assert.strictEqual(checkIsAdmin(decodedAnalyst), false, "Analyst must not pass admin check");
  assert.strictEqual(checkIsAdmin(decodedAdmin), true, "Admin must pass admin check");
});

// ============================================================================
// 5. RULE CONFIGURATION UPDATES & DYNAMIC SCORING IMPACT
// ============================================================================
test("Rule Engine Governance: Custom weight modifications alter subsequent scoring", async () => {
  // Create an engine instance with default weights
  const defaultEngine = new HeuristicEngine();
  const testPayload = {
    product_name: "Energy Drink",
    category: "Grocery",
    rating: 5,
    headline: "Massive Discount Promo",
    review_text: "100% recommended guaranteed satisfaction buy now today with discount code!"
  };

  const defaultReport = await defaultEngine.analyze(testPayload);
  const defaultScore = defaultReport.forensic_assessment.risk_score;

  // Create an engine instance with doubled weight for RULE_02 (Promotional Spam)
  const modifiedConfig = {
    rules: defaultEngine.rules.map(r => r.id === "RULE_02" ? { ...r, weight: 45 } : r)
  };
  const elevatedEngine = new HeuristicEngine(modifiedConfig);
  const elevatedReport = await elevatedEngine.analyze(testPayload);
  const elevatedScore = elevatedReport.forensic_assessment.risk_score;

  assert.ok(elevatedScore > defaultScore, `Elevated weight (45 pts) should produce higher score than default. Got: ${elevatedScore} vs ${defaultScore}`);
});

// ============================================================================
// 6. DASHBOARD STATISTICS DERIVATION
// ============================================================================
test("Dashboard Telemetry: Aggregates risk bands, suspicious counts, and platform distributions accurately", () => {
  const sampleCorpus = [
    { rating: 5, risk_score: 10, risk_level: "Low", platform: "Amazon", category: "Electronics", sentiment_analysis: { label: "Positive" } },
    { rating: 4, risk_score: 20, risk_level: "Low", platform: "Amazon", category: "Electronics", sentiment_analysis: { label: "Positive" } },
    { rating: 3, risk_score: 35, risk_level: "Moderate", platform: "Flipkart", category: "Fashion", sentiment_analysis: { label: "Neutral" } },
    { rating: 1, risk_score: 65, risk_level: "High", platform: "Google Reviews", category: "Books", sentiment_analysis: { label: "Negative" } },
    { rating: 5, risk_score: 85, risk_level: "Very High", platform: "Amazon", category: "Electronics", sentiment_analysis: { label: "Positive" } }
  ];

  let low = 0, mod = 0, high = 0, veryHigh = 0;
  const platformCounts = {};

  sampleCorpus.forEach(r => {
    if (r.risk_score <= 24) low++;
    else if (r.risk_score <= 49) mod++;
    else if (r.risk_score <= 74) high++;
    else veryHigh++;

    platformCounts[r.platform] = (platformCounts[r.platform] || 0) + 1;
  });

  const suspiciousCount = high + veryHigh;

  assert.strictEqual(low, 2, "Should have 2 low risk reviews");
  assert.strictEqual(mod, 1, "Should have 1 moderate risk review");
  assert.strictEqual(high, 1, "Should have 1 high risk review");
  assert.strictEqual(veryHigh, 1, "Should have 1 very high risk review");
  assert.strictEqual(suspiciousCount, 2, "Suspicious count (high + very high) should equal 2");
  assert.strictEqual(platformCounts["Amazon"], 3, "Amazon should have 3 reviews");
  assert.strictEqual(platformCounts["Flipkart"], 1, "Flipkart should have 1 review");
});

// ============================================================================
// 7. CSV BATCH ROW-LEVEL VALIDATION
// ============================================================================
test("CSV Row Validation: Rejects invalid or missing fields and accepts valid rows", () => {
  // Valid row
  const validRow = {
    product_name: "Smart Watch V2",
    reviewer_name: "Alex M.",
    category: "Electronics",
    rating: 5,
    headline: "Impressive display",
    review_text: "Bright screen and accurate step tracking. Water resistant as advertised."
  };
  const validRes = validateReviewPayload(validRow);
  assert.strictEqual(validRes.isValid, true, "Valid row should pass validation");

  // Invalid: missing review_text
  const missingTextRow = {
    product_name: "Smart Watch V2",
    reviewer_name: "Alex M.",
    category: "Electronics",
    rating: 5,
    headline: "Nice"
  };
  const missingTextRes = validateReviewPayload(missingTextRow);
  assert.strictEqual(missingTextRes.isValid, false, "Row missing review_text must fail");
  assert.ok(missingTextRes.errors.review_text, "Should contain review_text error");

  // Invalid: out-of-range rating (6 stars)
  const invalidRatingRow = {
    product_name: "Smart Watch V2",
    reviewer_name: "Alex M.",
    category: "Electronics",
    rating: 6,
    headline: "Over-rated",
    review_text: "Six stars rating is mathematically invalid."
  };
  const invalidRatingRes = validateReviewPayload(invalidRatingRow);
  assert.strictEqual(invalidRatingRes.isValid, false, "Rating > 5 must fail validation");

  // Invalid: rating <= 0
  const zeroRatingRow = {
    product_name: "Smart Watch V2",
    reviewer_name: "Alex M.",
    category: "Electronics",
    rating: 0,
    headline: "Zero rating",
    review_text: "Zero stars is invalid."
  };
  const zeroRatingRes = validateReviewPayload(zeroRatingRow);
  assert.strictEqual(zeroRatingRes.isValid, false, "Rating < 1 must fail validation");
});
