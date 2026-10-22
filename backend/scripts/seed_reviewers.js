/**
 * ReviewGuard AI - Seed Reviewer Profiles Script
 * Seeds realistic multi-review histories for David K., Rahul123, Sneha_09, and Aman45
 */

const { db } = require("../src/db");
const { HeuristicEngine } = require("../src/engine/heuristicEngine");

const SAMPLE_PROFILES_DATA = [
  // 1. David K. (Authentic Reviewer Profile - Electronics & Tech)
  {
    reviewer_name: "David K.",
    reviewer_id: "REV-DK-901",
    product_name: "Apple MacBook Air 15-inch M3",
    product_id: "PROD-ELEC-002",
    category: "Electronics",
    rating: 5,
    headline: "Incredible battery life and silent operation",
    review_text: "The M3 processor handles all my photo editing workflows without heating up. Battery easily lasts 15-18 hours of real-world use. The midnight finish does pick up fingerprints though.",
    platform: "Amazon"
  },
  {
    reviewer_name: "David K.",
    reviewer_id: "REV-DK-901",
    product_name: "Logitech MX Master 3S Wireless Mouse",
    product_id: "PROD-ELEC-003",
    category: "Electronics",
    rating: 4,
    headline: "Ergonomic productivity mouse",
    review_text: "Quiet click switches feel great and the magspeed scroll wheel is unmatched for large spreadsheets. Bluetooth connection occasionally drops for half a second on waking from sleep.",
    platform: "BestBuy"
  },

  // 2. Rahul123 (Suspicious Commercial Promoter Profile - 5★ Zero Variance, High Template Reuse)
  {
    reviewer_name: "Rahul123",
    reviewer_id: "REV-RH-123",
    product_name: "Samsung Galaxy S24 Ultra",
    product_id: "PROD-ELEC-004",
    category: "Electronics",
    rating: 5,
    headline: "BEST SMARTPHONE IN THE WORLD BUY NOW",
    review_text: "AMAZING BEST SMARTPHONE IN THE WORLD BUY NOW BUY NOW 100% SATISFACTION GUARANTEED INCREDIBLE DEAL DO NOT MISS OUT BEST QUALITY EVER BUY NOW!",
    platform: "Amazon"
  },
  {
    reviewer_name: "Rahul123",
    reviewer_id: "REV-RH-123",
    product_name: "Sony Bravia 55-inch 4K OLED TV",
    product_id: "PROD-ELEC-005",
    category: "Electronics",
    rating: 5,
    headline: "BEST TELEVISION IN THE WORLD BUY NOW",
    review_text: "AMAZING BEST TELEVISION IN THE WORLD BUY NOW BUY NOW 100% SATISFACTION GUARANTEED INCREDIBLE DEAL DO NOT MISS OUT BEST QUALITY EVER BUY NOW!",
    platform: "Amazon"
  },
  {
    reviewer_name: "Rahul123",
    reviewer_id: "REV-RH-123",
    product_name: "Bose QuietComfort Ultra Earbuds",
    product_id: "PROD-ELEC-006",
    category: "Electronics",
    rating: 5,
    headline: "BEST EARBUDS IN THE WORLD BUY NOW",
    review_text: "AMAZING BEST EARBUDS IN THE WORLD BUY NOW BUY NOW 100% SATISFACTION GUARANTEED INCREDIBLE DEAL DO NOT MISS OUT BEST QUALITY EVER BUY NOW!",
    platform: "Flipkart"
  },
  {
    reviewer_name: "Rahul123",
    reviewer_id: "REV-RH-123",
    product_name: "Dyson V15 Detect Cordless Vacuum",
    product_id: "PROD-HOME-001",
    category: "Home/Kitchen",
    rating: 5,
    headline: "BEST VACUUM IN THE WORLD BUY NOW",
    review_text: "AMAZING BEST VACUUM IN THE WORLD BUY NOW BUY NOW 100% SATISFACTION GUARANTEED INCREDIBLE DEAL DO NOT MISS OUT BEST QUALITY EVER BUY NOW!",
    platform: "Web"
  },

  // 3. Sneha_09 (Authentic Varied Multi-Category Reviewer)
  {
    reviewer_name: "Sneha_09",
    reviewer_id: "REV-SN-009",
    product_name: "CeraVe Hydrating Facial Cleanser",
    product_id: "PROD-BEAU-001",
    category: "Beauty",
    rating: 5,
    headline: "Gentle daily cleanser for sensitive skin",
    review_text: "Non-foaming lotion texture cleanses without stripping away moisture barrier. Ceramides and hyaluronic acid kept my skin calm through dry winter months.",
    platform: "Amazon"
  },
  {
    reviewer_name: "Sneha_09",
    reviewer_id: "REV-SN-009",
    product_name: "Maybelline New York Fit Me Foundation",
    product_id: "PROD-BEAU-002",
    category: "Beauty",
    rating: 3,
    headline: "Decent matte finish but oxidizes slightly",
    review_text: "Coverage is medium and buildable, comfortable for daily office wear. However shade 128 oxidizes about half a shade darker after three hours.",
    platform: "Nykaa"
  },
  {
    reviewer_name: "Sneha_09",
    reviewer_id: "REV-SN-009",
    product_name: "Atomic Habits by James Clear",
    product_id: "PROD-BOOK-001",
    category: "Books",
    rating: 4,
    headline: "Actionable frameworks for habit formation",
    review_text: "Clear and practical advice on habit stacking and environmental design. Some sections feel repetitive if you have read Charles Duhigg, but still very valuable.",
    platform: "Amazon"
  },
  {
    reviewer_name: "Sneha_09",
    reviewer_id: "REV-SN-009",
    product_name: "Philips Essential Air Fryer HD9252",
    product_id: "PROD-HOME-002",
    category: "Home/Kitchen",
    rating: 4,
    headline: "Compact and great for quick snacks",
    review_text: "Bakes fries and chicken wings evenly with very little oil. Basket size is just enough for two people, larger families will need a bigger model.",
    platform: "Flipkart"
  },

  // 4. Aman45 (Contradictory / Negative Reviewer Anomaly)
  {
    reviewer_name: "Aman45",
    reviewer_id: "REV-AM-045",
    product_name: "Nike Air Zoom Pegasus 40",
    product_id: "PROD-FASH-003",
    category: "Fashion",
    rating: 1,
    headline: "Absolutely wonderful shoes",
    review_text: "These are the most comfortable running shoes I have ever worn, perfectly cushioned, love the color, completely satisfied with this purchase!!",
    platform: "Amazon"
  },
  {
    reviewer_name: "Aman45",
    reviewer_id: "REV-AM-045",
    product_name: "Adidas Ultraboost Light Running Shoes",
    product_id: "PROD-FASH-004",
    category: "Fashion",
    rating: 1,
    headline: "Fantastic quality very pleased",
    review_text: "Superb cushioning and durable outsole, great arch support, highly recommended product for all marathon runners!!",
    platform: "Flipkart"
  },
  {
    reviewer_name: "Aman45",
    reviewer_id: "REV-AM-045",
    product_name: "Puma Men's Tazon 6 Sneaker",
    product_id: "PROD-FASH-005",
    category: "Fashion",
    rating: 1,
    headline: "Brilliant sneakers excellent",
    review_text: "Great fit and stylish look, very happy with delivery and packaging, wonderful sneakers for daily training!!",
    platform: "Amazon"
  }
];

async function seedReviewerProfiles() {
  console.log("Seeding realistic longitudinal profiles for David K., Rahul123, Sneha_09, Aman45...");
  const currentConfig = await db.ruleConfig.get();
  const engine = new HeuristicEngine(currentConfig);

  for (const item of SAMPLE_PROFILES_DATA) {
    const stored = await db.reviews.find({});
    const history = await db.reviews.findByReviewer(item.reviewer_id || item.reviewer_name);
    
    // Run full forensic analysis
    const analysis = await engine.analyze(
      {
        ...item,
        review_date: new Date(Date.now() - Math.floor(Math.random() * 30) * 3600 * 1000).toISOString()
      },
      { storedReviews: stored, reviewerHistory: history }
    );

    const forensic = analysis.forensic_assessment || {};
    const recordToSave = {
      product_name: item.product_name,
      product_id: item.product_id,
      category: item.category,
      reviewer_name: item.reviewer_name,
      reviewer_id: item.reviewer_id,
      rating: item.rating,
      headline: item.headline,
      review_text: item.review_text,
      platform: item.platform,
      review_date: analysis.review_details?.review_date || new Date().toISOString(),
      createdAt: analysis.review_details?.review_date || new Date().toISOString(),
      risk_score: forensic.risk_score ?? 0,
      risk_level: forensic.risk_level || "Low",
      assessment: forensic.assessment || "Appears Genuine",
      classification_label: forensic.classification_label || "LOW RISK — Appears Genuine",
      rule_engine_version: forensic.rule_engine_version || "2.4.0",
      sentiment_analysis: analysis.sentiment_analysis,
      triggered_rules: analysis.triggered_rules || [],
      lexical_metrics: analysis.lexical_metrics,
      duplicate_forensics: analysis.duplicate_forensics
    };

    const saved = await db.reviews.create(recordToSave);
    console.log(`Saved review [${saved._id}] for ${item.reviewer_name} (${item.rating}★, Risk: ${recordToSave.risk_score} [${recordToSave.risk_level}])`);
  }

  console.log("All reviewer profile records successfully seeded!");
}

if (require.main === module) {
  seedReviewerProfiles().then(() => process.exit(0)).catch(err => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}

module.exports = { seedReviewerProfiles, SAMPLE_PROFILES_DATA };
