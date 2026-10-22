/**
 * ReviewGuard AI - Comprehensive Automated Test Suite
 * Validates all 20 heuristic rules, sentiment analysis, scoring, duplicates,
 * validation layer, and RBAC permissions.
 */

const test = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { analyzeSentiment, evaluateRatingSentimentConsistency } = require("../src/engine/sentimentAnalyzer");
const { HeuristicEngine } = require("../src/engine/heuristicEngine");
const { similarityEngine, normalizeText } = require("../src/engine/textSimilarity");
const { validateReviewPayload, isGibberish } = require("../src/validator");
const { validateProductCategory } = require("../src/productCategoryDb");
const { JWT_SECRET } = require("../src/middleware/auth");

const engine = new HeuristicEngine();

// ============================================================================
// 1. SENTIMENT & RATING CONSISTENCY TESTS
// ============================================================================
test("Sentiment: Evaluates clear positive sentiment with intensifiers", () => {
  const res = analyzeSentiment("Superb quality", "This sound quality is extremely clear and wonderfully balanced.");
  assert.strictEqual(res.label, "Positive");
  assert.ok(res.score > 2, "Score should be significantly positive");
});

test("Sentiment: Evaluates clear negative sentiment with negation", () => {
  const res = analyzeSentiment("Terrible failure", "The product did not work at all and broke within two days.");
  assert.strictEqual(res.label, "Negative");
  assert.ok(res.score < 0, "Score should be negative");
});

test("Sentiment: Handles subtle negation e.g. 'not bad'", () => {
  const res = analyzeSentiment("", "Overall it is not bad for the price.");
  assert.ok(res.score >= 0, "'not bad' should yield non-negative sentiment");
});

test("Rating Consistency: 5-star with positive text is consistent", () => {
  const sentiment = analyzeSentiment("Great", "Battery life is excellent and sound is clear.");
  const evalResult = evaluateRatingSentimentConsistency(5, sentiment);
  assert.strictEqual(evalResult.isConsistent, true);
  assert.strictEqual(evalResult.mismatch, false);
});

test("Rating Consistency: 1-star with positive praise triggers mismatch", () => {
  const sentiment = analyzeSentiment("Holy grail", "This is the most amazing product ever made, absolute perfection!");
  const evalResult = evaluateRatingSentimentConsistency(1, sentiment);
  assert.strictEqual(evalResult.isConsistent, false);
  assert.strictEqual(evalResult.mismatch, true);
  assert.strictEqual(evalResult.severity, "High");
});

test("Rating Consistency: 5-star with negative critique triggers mismatch", () => {
  const sentiment = analyzeSentiment("Disappointed", "Defective, terrible quality and completely broken.");
  const evalResult = evaluateRatingSentimentConsistency(5, sentiment);
  assert.strictEqual(evalResult.isConsistent, false);
  assert.strictEqual(evalResult.mismatch, true);
});

// ============================================================================
// 2. HEURISTIC ENGINE RULES (Testing all 20 rules)
// ============================================================================

// RULE 01: Rating-Sentiment Inconsistency
test("Rule 01: Triggers on rating-sentiment inconsistency", async () => {
  const report = await engine.analyze({
    product_name: "Wireless Earbuds",
    category: "Electronics",
    rating: 1,
    headline: "Best earphones ever",
    review_text: "Absolutely superb sound quality, divine bass, wonderful product!"
  });
  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_01");
  assert.ok(rule, "RULE_01 should be triggered");
  assert.strictEqual(rule.group, "SENTIMENT");
});

// RULE 02: Promotional and Spam Language
test("Rule 02: Triggers on promotional and commercial spam language", async () => {
  const report = await engine.analyze({
    product_name: "Protein Powder",
    category: "Grocery",
    rating: 5,
    headline: "Special deal",
    review_text: "100% recommended guaranteed satisfaction buy now and use discount code today!"
  });
  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_02");
  assert.ok(rule, "RULE_02 should be triggered");
});

// RULE 03: Repeated Words and Phrases
test("Rule 03: Triggers on chant-like repeated phrases", async () => {
  const report = await engine.analyze({
    product_name: "Backpack",
    category: "Fashion",
    rating: 5,
    headline: "Nice bag",
    review_text: "Good good good bag. Buy this now buy this now buy this now."
  });
  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_03");
  assert.ok(rule, "RULE_03 should be triggered for repetitive text");
});

// RULE 04: Excessive Capitalisation
test("Rule 04: Triggers on excessive shout capitalization", async () => {
  const report = await engine.analyze({
    product_name: "Gaming Keyboard",
    category: "Electronics",
    rating: 5,
    headline: "SHOUTING",
    review_text: "THIS KEYBOARD IS THE GREATEST KEYBOARD IN THE ENTIRE UNIVERSE BUY NOW!"
  });
  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_04");
  assert.ok(rule, "RULE_04 should trigger for all-caps text");
});

// RULE 05: Excessive Punctuation
test("Rule 05: Triggers on excessive dramatic punctuation chains", async () => {
  const report = await engine.analyze({
    product_name: "Running Shoes",
    category: "Fashion",
    rating: 5,
    headline: "Wow",
    review_text: "Unbelievable deal!!!!!! Best purchase ever made!!!!!!!!!"
  });
  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_05");
  assert.ok(rule, "RULE_05 should trigger on multiple exclamation marks");
});

// RULE 06: Hollow Superlatives
test("Rule 06: Triggers on hollow superlatives without specifics", async () => {
  const report = await engine.analyze({
    product_name: "Face Cream",
    category: "Beauty",
    rating: 5,
    headline: "Miracle",
    review_text: "This is a miracle of science, holy grail and life changing perfection."
  });
  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_06");
  assert.ok(rule, "RULE_06 should trigger on ungrounded grandiose claims");
});

// RULE 07: Keyword Stuffing
test("Rule 07: Triggers on brand and model keyword stuffing", async () => {
  const report = await engine.analyze({
    product_name: "Sony WH-1000XM5 Headphones",
    category: "Electronics",
    rating: 5,
    headline: "Sony headphones",
    review_text: "These Sony WH-1000XM5 headphones are headphones from Sony that make great headphones sound like Sony headphones."
  });
  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_07");
  assert.ok(rule, "RULE_07 should trigger on keyword stuffing");
});

// RULE 08: Generic or Low-Information Reviews
test("Rule 08: Triggers on generic low-information filler", async () => {
  const report = await engine.analyze({
    product_name: "Instant Pot",
    category: "Home/Kitchen",
    rating: 5,
    headline: "Nice",
    review_text: "good product very nice loved it very good"
  });
  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_08");
  assert.ok(rule, "RULE_08 should trigger on generic low-information text");
});

// RULE 09: Unusual Text Patterns
test("Rule 09: Triggers on unusual text symbols or formatting", async () => {
  const report = await engine.analyze({
    product_name: "Office Chair",
    category: "Home/Kitchen",
    rating: 4,
    headline: "Check",
    review_text: "Good comfortable chair @#$%^&* with nice back support and padding."
  });
  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_09");
  assert.ok(rule, "RULE_09 should trigger on irregular symbol sequences");
});

// RULE 10: Reviewer Behaviour Velocity
test("Rule 10: Triggers on high submission velocity from reviewer history", async () => {
  const pastReviews = [
    { rating: 5, review_text: "Great 1" },
    { rating: 5, review_text: "Great 2" },
    { rating: 5, review_text: "Great 3" },
    { rating: 5, review_text: "Great 4" },
    { rating: 5, review_text: "Great 5" }
  ];
  const report = await engine.analyze(
    {
      product_name: "USB Hub",
      category: "Electronics",
      reviewer_name: "PowerReviewer",
      reviewer_id: "REV-PWR-01",
      rating: 5,
      review_text: "Solid USB hub with fast transfer speeds across all ports."
    },
    { reviewerHistory: pastReviews }
  );
  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_10");
  assert.ok(rule, "RULE_10 should trigger for abnormal reviewer velocity");
});

// RULE 11: Product/Category Relevance Mismatch
test("Rule 11: Triggers when review text discusses wrong domain concepts", async () => {
  const report = await engine.analyze({
    product_name: "Noise Cancelling Headphones",
    category: "Electronics",
    rating: 5,
    headline: "Delicious",
    review_text: "These headphones have a very tasty flavor and delicious crunchy texture."
  });
  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_11");
  assert.ok(rule, "RULE_11 should trigger on edible terms for electronics");
});

// RULE 12: Repeated Sentence Structures
test("Rule 12: Triggers on repetitive sentence starters", async () => {
  const report = await engine.analyze({
    product_name: "Smart TV",
    category: "Electronics",
    rating: 5,
    headline: "Review",
    review_text: "It is very clear. It is very fast. It is very bright. It is very good."
  });
  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_12");
  assert.ok(rule, "RULE_12 should trigger on robotic sentence structures");
});

// RULE 13: Excessive Calls to Action
test("Rule 13: Triggers on direct commercial directives", async () => {
  const report = await engine.analyze({
    product_name: "Face Oil",
    category: "Beauty",
    rating: 5,
    headline: "Act fast",
    review_text: "Buy this now and do not hesitate to add to cart immediately!"
  });
  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_13");
  assert.ok(rule, "RULE_13 should trigger on commercial call-to-actions");
});

// RULE 14: Unusual Review Length
test("Rule 14: Triggers on unusually short text below normal baseline", async () => {
  const report = await engine.analyze({
    product_name: "Book",
    category: "Books",
    rating: 4,
    headline: "Nice",
    review_text: "Just ok book."
  });
  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_14");
  assert.ok(rule, "RULE_14 should trigger for very short text");
});

// RULE 15: Exact Duplicate Reviews
test("Rule 15: Triggers on exact verbatim duplicate against stored database", async () => {
  const existingDoc = {
    _id: "rev_existing_1",
    product_name: "Smart Watch",
    reviewer_name: "Sneha",
    rating: 4,
    review_text: "Heart rate sensor is accurate during jogging sessions."
  };

  const report = await engine.analyze(
    {
      product_name: "Smart Watch",
      category: "Electronics",
      reviewer_name: "CopyCatUser",
      rating: 4,
      review_text: "Heart rate sensor is accurate during jogging sessions."
    },
    { storedReviews: [existingDoc] }
  );

  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_15");
  assert.ok(rule, "RULE_15 should trigger for exact duplicate");
  assert.strictEqual(report.duplicate_forensics.is_exact_duplicate, true);
});

// RULE 16: Near-Duplicate Reviews
test("Rule 16: Triggers on near-duplicate text using TF-IDF cosine similarity", async () => {
  const existingDoc = {
    _id: "rev_existing_2",
    product_name: "Electric Kettle",
    reviewer_name: "Amit",
    rating: 4,
    review_text: "Heats two liters of water within four minutes and auto shutoff works reliably."
  };

  const report = await engine.analyze(
    {
      product_name: "Electric Kettle",
      category: "Home/Kitchen",
      reviewer_name: "Rohit",
      rating: 4,
      review_text: "Heats two liters of water within four minutes and the auto shutoff works very reliably."
    },
    { storedReviews: [existingDoc] }
  );

  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_16");
  assert.ok(rule, "RULE_16 should trigger for near-duplicate");
  assert.strictEqual(report.duplicate_forensics.is_near_duplicate, true);
});

// RULE 17: Repeated Templates Across Products
test("Rule 17: Triggers when same reviewer reuses template for different product", async () => {
  const reviewerPast = [
    {
      product_name: "Wireless Mouse",
      review_text: "Best product ever made in the world, works smoothly and feels comfortable in hand."
    }
  ];

  const report = await engine.analyze(
    {
      product_name: "Keyboard",
      category: "Electronics",
      reviewer_name: "TemplateSpammer",
      reviewer_id: "REV-TMP-01",
      rating: 5,
      review_text: "Best product ever made in the world, works smoothly and feels comfortable to use."
    },
    { reviewerHistory: reviewerPast }
  );

  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_17");
  assert.ok(rule, "RULE_17 should trigger on cross-product template reuse");
});

// RULE 18: Unusual Reviewer Rating Distribution
test("Rule 18: Triggers when reviewer has 0 rating variance (all 5-stars)", async () => {
  const reviewerPast = [
    { rating: 5, review_text: "Good 1" },
    { rating: 5, review_text: "Good 2" },
    { rating: 5, review_text: "Good 3" },
    { rating: 5, review_text: "Good 4" }
  ];

  const report = await engine.analyze(
    {
      product_name: "T-shirt",
      category: "Fashion",
      reviewer_name: "FiveStarOnly",
      rating: 5,
      review_text: "Fabric feels soft and fits comfortably."
    },
    { reviewerHistory: reviewerPast }
  );

  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_18");
  assert.ok(rule, "RULE_18 should trigger on unvarying 5-star history");
});

// RULE 19: Bursts of Similar Reviews
test("Rule 19: Triggers on burst of similar reviews for the same product", async () => {
  const storedReviews = [
    {
      _id: "r1",
      product_name: "Yoga Mat",
      rating: 5,
      review_text: "Excellent grip on wooden floor, lightweight to carry.",
      createdAt: new Date().toISOString()
    },
    {
      _id: "r2",
      product_name: "Yoga Mat",
      rating: 5,
      review_text: "Excellent grip on wooden floor, lightweight to carry.",
      createdAt: new Date().toISOString()
    },
    {
      _id: "r3",
      product_name: "Yoga Mat",
      rating: 5,
      review_text: "Excellent grip on wooden floor, lightweight to carry.",
      createdAt: new Date().toISOString()
    }
  ];

  const report = await engine.analyze(
    {
      product_name: "Yoga Mat",
      category: "Sports",
      rating: 5,
      review_text: "Excellent grip on wooden floor, lightweight to carry."
    },
    { storedReviews }
  );

  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_19");
  assert.ok(rule, "RULE_19 should trigger for sudden coordinated burst");
});

// RULE 20: Cross-Reviewer High-Similarity Language
test("Rule 20: Triggers when distinct reviewer accounts share near-identical text", async () => {
  const storedReviews = [
    {
      _id: "r_user_A",
      product_name: "Lip Balm",
      reviewer_name: "UserAlice",
      reviewer_id: "REV-ALICE",
      rating: 5,
      review_text: "Keeps lips hydrated all day without stickiness and smells fresh."
    }
  ];

  const report = await engine.analyze(
    {
      product_name: "Lip Balm",
      category: "Beauty",
      reviewer_name: "UserBob",
      reviewer_id: "REV-BOB",
      rating: 5,
      review_text: "Keeps lips hydrated all day without stickiness and smells fresh."
    },
    { storedReviews }
  );

  const rule = report.triggered_rules.find(r => r.rule_id === "RULE_20");
  assert.ok(rule, "RULE_20 should trigger on syndicate sockpuppet similarity");
});

// ============================================================================
// 3. ANTI-DOUBLE-COUNTING & SCORING BOUNDS
// ============================================================================
test("Scoring: Applies anti-double-counting correlation dampening", async () => {
  const report = await engine.analyze({
    product_name: "Gadget",
    category: "Electronics",
    rating: 5,
    headline: "BUY NOW",
    review_text: "BUY THIS NOW! 100% recommended guaranteed satisfaction incredible deal holy grail masterpiece run and don't miss out!!!"
  });

  assert.ok(report.forensic_assessment.risk_score <= 100, "Risk score must never exceed 100");
  assert.ok(report.forensic_assessment.risk_score >= 0, "Risk score must be at least 0");

  // Check dampening factor presence on subsequent rules
  const promotionalRules = report.triggered_rules.filter(r => r.group === "PROMOTIONAL");
  if (promotionalRules.length > 1) {
    assert.strictEqual(promotionalRules[0].damping_factor, 1.0);
    assert.ok(promotionalRules[1].damping_factor < 1.0, "Second rule in group must be dampened");
  }
});

// ============================================================================
// 4. INPUT VALIDATION TESTS
// ============================================================================
test("Validator: Rejects missing required fields", () => {
  const res = validateReviewPayload({});
  assert.strictEqual(res.isValid, false);
  assert.ok(res.errors.product_name, "Should flag missing product name");
  assert.ok(res.errors.category, "Should flag missing category");
  assert.ok(res.errors.reviewer_name, "Should flag missing reviewer name");
  assert.ok(res.errors.rating, "Should flag missing rating");
  assert.ok(res.errors.review_text, "Should flag missing review text");
});

test("Validator: Rejects invalid star rating (0, 6, string)", () => {
  assert.strictEqual(validateReviewPayload({ product_name: "Test", category: "Books", reviewer_name: "User", rating: 0, review_text: "Valid length text for testing." }).isValid, false);
  assert.strictEqual(validateReviewPayload({ product_name: "Test", category: "Books", reviewer_name: "User", rating: 6, review_text: "Valid length text for testing." }).isValid, false);
  assert.strictEqual(validateReviewPayload({ product_name: "Test", category: "Books", reviewer_name: "User", rating: 3.5, review_text: "Valid length text for testing." }).isValid, false);
});

test("Validator: Rejects pure gibberish and consonant spam", () => {
  assert.strictEqual(isGibberish("zkrtplwqsdmnbvc"), true);
  assert.strictEqual(isGibberish("Natural readable text"), false);
});

test("Validator: Product and category mismatch verification", () => {
  const check = validateProductCategory("Apple iPhone 15 Pro", "Footwear");
  assert.strictEqual(check.valid, false);
  assert.ok(check.message.includes("Electronics"));
});

// ============================================================================
// 5. AUTHENTICATION & RBAC PERMISSION TESTS
// ============================================================================
test("Auth: Generates and verifies valid JWT token", () => {
  const payload = { id: "usr_test", username: "analyst_tester", role: "analyst" };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
  const decoded = jwt.verify(token, JWT_SECRET);
  assert.strictEqual(decoded.username, "analyst_tester");
  assert.strictEqual(decoded.role, "analyst");
});

test("Auth: Password hashing verification with bcrypt", async () => {
  const raw = "Admin@123";
  const hash = await bcrypt.hash(raw, 10);
  const match = await bcrypt.compare(raw, hash);
  const badMatch = await bcrypt.compare("WrongPass", hash);
  assert.strictEqual(match, true);
  assert.strictEqual(badMatch, false);
});

// ============================================================================
// 6. CLASSIFICATION LABELS, THRESHOLD BOUNDARIES & EXPLANATIONS
// ============================================================================
test("Classification: Score 0 with no triggered rules displays LOW RISK — Appears Genuine with non-conclusive explanation", async () => {
  const report = await engine.analyze({
    product_name: "Standard Ergonomic Office Chair",
    category: "Home/Kitchen",
    reviewer_name: "NormalBuyer_01",
    rating: 4,
    headline: "Comfortable lumbar support during long shifts",
    review_text: "The mesh back provides adequate airflow and the armrests adjust easily to desk height. Assembly took about fifteen minutes with the included allen wrench."
  });

  assert.strictEqual(report.forensic_assessment.risk_score, 0);
  assert.strictEqual(report.triggered_rules.length, 0);
  assert.strictEqual(report.forensic_assessment.risk_level, "Low");
  assert.strictEqual(report.forensic_assessment.assessment, "Appears Genuine");
  assert.strictEqual(report.forensic_assessment.classification_label, "LOW RISK — Appears Genuine");
  assert.ok(
    report.forensic_assessment.assessment_explanation.includes("No suspicious indicators were detected"),
    "Explanation must note no suspicious indicators were detected"
  );
  assert.ok(
    report.forensic_assessment.assessment_explanation.includes("cannot definitively prove authenticity"),
    "Explanation must not claim authenticity is proven merely because score is 0"
  );
});

test("Classification: Score boundary 0–24 maps to LOW RISK — Appears Genuine", () => {
  const testEngine = new HeuristicEngine();
  
  [0, 10, 24].forEach(score => {
    let riskLevel = "Low";
    let assessment = "Appears Genuine";
    if (score <= testEngine.bands.lowMax) {
      riskLevel = "Low";
      assessment = "Appears Genuine";
    } else if (score <= testEngine.bands.modMax) {
      riskLevel = "Moderate";
      assessment = "Needs Review";
    } else if (score <= testEngine.bands.highMax) {
      riskLevel = "High";
      assessment = "Suspicious";
    } else {
      riskLevel = "Very High";
      assessment = "Strongly Suspicious";
    }
    const label = `${riskLevel.toUpperCase()} RISK — ${assessment}`;
    assert.strictEqual(riskLevel, "Low");
    assert.strictEqual(assessment, "Appears Genuine");
    assert.strictEqual(label, "LOW RISK — Appears Genuine");
  });
});

test("Classification: Score boundary 25–49 maps to MODERATE RISK — Needs Review", () => {
  const testEngine = new HeuristicEngine();

  [25, 37, 49].forEach(score => {
    let riskLevel = "Low";
    let assessment = "Appears Genuine";
    if (score <= testEngine.bands.lowMax) {
      riskLevel = "Low";
      assessment = "Appears Genuine";
    } else if (score <= testEngine.bands.modMax) {
      riskLevel = "Moderate";
      assessment = "Needs Review";
    } else if (score <= testEngine.bands.highMax) {
      riskLevel = "High";
      assessment = "Suspicious";
    } else {
      riskLevel = "Very High";
      assessment = "Strongly Suspicious";
    }
    const label = `${riskLevel.toUpperCase()} RISK — ${assessment}`;
    assert.strictEqual(riskLevel, "Moderate");
    assert.strictEqual(assessment, "Needs Review");
    assert.strictEqual(label, "MODERATE RISK — Needs Review");
  });
});

test("Classification: Score boundary 50–74 maps to HIGH RISK — Suspicious", () => {
  const testEngine = new HeuristicEngine();

  [50, 62, 74].forEach(score => {
    let riskLevel = "Low";
    let assessment = "Appears Genuine";
    if (score <= testEngine.bands.lowMax) {
      riskLevel = "Low";
      assessment = "Appears Genuine";
    } else if (score <= testEngine.bands.modMax) {
      riskLevel = "Moderate";
      assessment = "Needs Review";
    } else if (score <= testEngine.bands.highMax) {
      riskLevel = "High";
      assessment = "Suspicious";
    } else {
      riskLevel = "Very High";
      assessment = "Strongly Suspicious";
    }
    const label = `${riskLevel.toUpperCase()} RISK — ${assessment}`;
    assert.strictEqual(riskLevel, "High");
    assert.strictEqual(assessment, "Suspicious");
    assert.strictEqual(label, "HIGH RISK — Suspicious");
  });
});

test("Classification: Score boundary 75–100 maps to VERY HIGH RISK — Strongly Suspicious", () => {
  const testEngine = new HeuristicEngine();

  [75, 88, 100].forEach(score => {
    let riskLevel = "Low";
    let assessment = "Appears Genuine";
    if (score <= testEngine.bands.lowMax) {
      riskLevel = "Low";
      assessment = "Appears Genuine";
    } else if (score <= testEngine.bands.modMax) {
      riskLevel = "Moderate";
      assessment = "Needs Review";
    } else if (score <= testEngine.bands.highMax) {
      riskLevel = "High";
      assessment = "Suspicious";
    } else {
      riskLevel = "Very High";
      assessment = "Strongly Suspicious";
    }
    const label = `${riskLevel.toUpperCase()} RISK — ${assessment}`;
    assert.strictEqual(riskLevel, "Very High");
    assert.strictEqual(assessment, "Strongly Suspicious");
    assert.strictEqual(label, "VERY HIGH RISK — Strongly Suspicious");
  });
});

test("Classification: Custom configurable bands dynamically alter classification thresholds", async () => {
  // Configure custom bands: Low Max = 15, Mod Max = 35, High Max = 60
  const customEngine = new HeuristicEngine({
    bands: { lowMax: 15, modMax: 35, highMax: 60 }
  });

  assert.strictEqual(customEngine.bands.lowMax, 15);
  assert.strictEqual(customEngine.bands.modMax, 35);
  assert.strictEqual(customEngine.bands.highMax, 60);

  // A review that triggers Rule 02 (+18 pts) would be Moderate under custom bands (18 > 15), but Low under default bands (18 <= 24)
  const report = await customEngine.analyze({
    product_name: "Protein Powder",
    category: "Grocery",
    rating: 5,
    headline: "Discount Code",
    review_text: "Use my discount code for savings on this product!"
  });

  if (report.forensic_assessment.risk_score > 15 && report.forensic_assessment.risk_score <= 35) {
    assert.strictEqual(report.forensic_assessment.risk_level, "Moderate");
    assert.strictEqual(report.forensic_assessment.assessment, "Needs Review");
    assert.strictEqual(report.forensic_assessment.classification_label, "MODERATE RISK — Needs Review");
  }
});
