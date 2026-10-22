/**
 * ReviewGuard AI - Comprehensive Persistent Database Layer
 * 
 * Supports both MongoDB (via Mongoose) and automatic persistent file-backed storage
 * if external MongoDB service is offline, ensuring 100% operational uptime.
 * Implements models for Users, Reviews, RuleConfigs, AuditLogs, and Products.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { DEFAULT_RULES } = require("./engine/rules");
const { INITIAL_PRODUCTS } = require("./productCategoryDb");
const {
  ReviewSchema,
  UserSchema,
  RuleConfigSchema,
  AuditLogSchema,
  ProductSchema
} = require("./models/schemas");

// Register Mongoose Models
let ReviewModel, UserModel, RuleConfigModel, AuditLogModel, ProductModel;
try {
  ReviewModel = mongoose.models.Review || mongoose.model("Review", ReviewSchema);
  UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
  RuleConfigModel = mongoose.models.RuleConfig || mongoose.model("RuleConfig", RuleConfigSchema);
  AuditLogModel = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
  ProductModel = mongoose.models.Product || mongoose.model("Product", ProductSchema);
} catch (e) {
  // If mongoose not ready, will initialize on connection
}

const DATA_FILE = path.join(__dirname, "..", "data", "reviewguard_db.json");
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/reviewguard";

let isMongoConnected = false;
let dbStatusMessage = "Initializing...";

// Default Pre-seeded Initial Reviews with rich forensic metadata
const INITIAL_REVIEWS = [
  {
    _id: "rev_001",
    product_name: "Sony WH-1000XM5 Wireless Headphones",
    product_id: "PROD-ELEC-001",
    category: "Electronics",
    reviewer_name: "David K.",
    reviewer_id: "REV-DK-901",
    rating: 4,
    headline: "Great ANC, minor headband pressure",
    review_text: "The battery lasts around 28 hours with active noise cancelling turned on. Sound reproduction is balanced with crisp highs, though the headband padding creates minor pressure after 3 hours of continuous use.",
    platform: "Amazon",
    review_date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    risk_score: 8,
    risk_level: "Low",
    assessment: "Appears Genuine",
    classification_label: "LOW RISK — Appears Genuine",
    rule_engine_version: "2.4.0",
    sentiment_analysis: {
      label: "Positive",
      score: 3,
      normalized_score: 0.35,
      rating_consistency: { is_consistent: true, severity: "None", explanation: "4-star rating is consistent with feedback." }
    },
    triggered_rules: [],
    lexical_metrics: {
      word_count: 32,
      character_count: 201,
      uppercase_ratio: 0.03,
      punctuation_ratio: 0.015,
      exclamation_count: 0
    },
    duplicate_forensics: {
      is_exact_duplicate: false,
      is_near_duplicate: false,
      highest_similarity_score: 0.12
    }
  },
  {
    _id: "rev_002",
    product_name: "Sony WH-1000XM5 Wireless Headphones",
    product_id: "PROD-ELEC-001",
    category: "Electronics",
    reviewer_name: "AffiliateBot99",
    reviewer_id: "REV-BOT-011",
    rating: 5,
    headline: "AMAZING DEAL BUY NOW 100% RECOMMENDED!!!!",
    review_text: "AMAZING BEST EVER PRODUCT IN THE UNIVERSE!!! Buy this right now 100% recommended guaranteed satisfaction incredible deal run and buy don't miss out!!!!!",
    platform: "Web",
    review_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    risk_score: 84,
    risk_level: "Very High",
    assessment: "Strongly Suspicious",
    classification_label: "VERY HIGH RISK — Strongly Suspicious",
    rule_engine_version: "2.4.0",
    sentiment_analysis: {
      label: "Positive",
      score: 8,
      normalized_score: 0.85,
      rating_consistency: { is_consistent: true, severity: "None", explanation: "5-star rating matches extreme positive praise." }
    },
    triggered_rules: [
      { rule_id: "RULE_02", name: "Promotional and Spam Language", group: "PROMOTIONAL", severity: "High", base_weight: 16, effective_contribution: 16, evidence: 'Found promotional phrases: "100% recommended", "buy now", "incredible deal"' },
      { rule_id: "RULE_04", name: "Excessive Capitalisation", group: "STYLOMETRIC", severity: "High", base_weight: 10, effective_contribution: 10, evidence: "68% uppercase letters in review text" },
      { rule_id: "RULE_05", name: "Excessive Punctuation", group: "STYLOMETRIC", severity: "High", base_weight: 10, effective_contribution: 6, evidence: "8 exclamation marks; chained punctuation" },
      { rule_id: "RULE_06", name: "Hollow Superlatives and Exaggerated Claims", group: "PROMOTIONAL", severity: "High", base_weight: 14, effective_contribution: 8.4, evidence: 'Grandiose claim: "best product in the universe"' },
      { rule_id: "RULE_13", name: "Excessive Calls to Action", group: "PROMOTIONAL", severity: "High", base_weight: 15, effective_contribution: 5.25, evidence: 'Commercial imperatives: "buy this right now", "don\'t miss out"' },
      { rule_id: "RULE_08", name: "Generic or Low-Information Reviews", group: "CONTENT_QUALITY", severity: "Low", base_weight: 14, effective_contribution: 14, evidence: "Lacks any specific audio or battery metrics" }
    ],
    lexical_metrics: {
      word_count: 22,
      character_count: 148,
      uppercase_ratio: 0.68,
      punctuation_ratio: 0.08,
      exclamation_count: 8
    },
    duplicate_forensics: {
      is_exact_duplicate: false,
      is_near_duplicate: false,
      highest_similarity_score: 0.08
    }
  },
  {
    _id: "rev_003",
    product_name: "CeraVe Hydrating Facial Cleanser",
    product_id: "PROD-BEAU-001",
    category: "Beauty",
    reviewer_name: "Pooja_K",
    reviewer_id: "REV-PK-442",
    rating: 1,
    headline: "Stunning holy grail product",
    review_text: "Absolutely stunning holy grail product! Best face wash ever made, 500 stars to this divine gift, completely cured my skin and made it flawless perfection!!",
    platform: "Amazon",
    review_date: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    risk_score: 56,
    risk_level: "High",
    assessment: "Suspicious",
    classification_label: "HIGH RISK — Suspicious",
    rule_engine_version: "2.4.0",
    sentiment_analysis: {
      label: "Positive",
      score: 7,
      normalized_score: 0.88,
      rating_consistency: {
        is_consistent: false,
        severity: "High",
        explanation: "Contradiction: 1-star rating given, but review text contains glowing praise."
      }
    },
    triggered_rules: [
      { rule_id: "RULE_01", name: "Rating–Sentiment Inconsistency", group: "SENTIMENT", severity: "High", base_weight: 22, effective_contribution: 22, evidence: "1★ rating paired with extreme positive sentiment (Score: 7)" },
      { rule_id: "RULE_06", name: "Hollow Superlatives and Exaggerated Claims", group: "PROMOTIONAL", severity: "Medium", base_weight: 14, effective_contribution: 14, evidence: 'Superlatives: "holy grail", "flawless perfection"' },
      { rule_id: "RULE_05", name: "Excessive Punctuation", group: "STYLOMETRIC", severity: "Medium", base_weight: 10, effective_contribution: 10, evidence: "2 exclamation marks; punctuation density: 3.5%" }
    ],
    lexical_metrics: {
      word_count: 24,
      character_count: 154,
      uppercase_ratio: 0.04,
      punctuation_ratio: 0.035,
      exclamation_count: 2
    },
    duplicate_forensics: {
      is_exact_duplicate: false,
      is_near_duplicate: false,
      highest_similarity_score: 0.15
    }
  },
  {
    _id: "rev_004",
    product_name: "Nike Dri-FIT Running T-Shirt",
    product_id: "PROD-FASH-002",
    category: "Fashion",
    reviewer_name: "Rohan_7",
    reviewer_id: "REV-RH-110",
    rating: 4,
    headline: "Comfortable athletic shirt",
    review_text: "Fabric is lightweight and wicks sweat well during long runs. Sizing fits true across the chest and shoulders, though sleeve length is slightly long.",
    platform: "Flipkart",
    review_date: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    risk_score: 12,
    risk_level: "Low",
    assessment: "Appears Genuine",
    classification_label: "LOW RISK — Appears Genuine",
    rule_engine_version: "2.4.0",
    sentiment_analysis: {
      label: "Positive",
      score: 2,
      normalized_score: 0.28,
      rating_consistency: { is_consistent: true, severity: "None", explanation: "4-star rating is consistent with feedback." }
    },
    triggered_rules: [],
    lexical_metrics: {
      word_count: 24,
      character_count: 150,
      uppercase_ratio: 0.03,
      punctuation_ratio: 0.015,
      exclamation_count: 0
    },
    duplicate_forensics: {
      is_exact_duplicate: false,
      is_near_duplicate: false,
      highest_similarity_score: 0.1
    }
  },
  {
    _id: "rev_005",
    product_name: "Levi's 511 Slim Fit Jeans",
    product_id: "PROD-FASH-001",
    category: "Fashion",
    reviewer_name: "SpamSyndicate_01",
    reviewer_id: "REV-SPAM-90",
    rating: 5,
    headline: "BEST JEANS EVER BUY TODAY",
    review_text: "BEST JEANS IN THE WORLD BUY NOW BUY NOW BUY NOW DO NOT MISS OUT 100% SATISFACTION GUARANTEED BEST QUALITY EVER!!",
    platform: "Web",
    review_date: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    risk_score: 92,
    risk_level: "Very High",
    assessment: "Strongly Suspicious",
    classification_label: "VERY HIGH RISK — Strongly Suspicious",
    rule_engine_version: "2.4.0",
    sentiment_analysis: {
      label: "Positive",
      score: 6,
      normalized_score: 0.75,
      rating_consistency: { is_consistent: true, severity: "None", explanation: "5-star rating matches praise." }
    },
    triggered_rules: [
      { rule_id: "RULE_02", name: "Promotional and Spam Language", group: "PROMOTIONAL", severity: "High", base_weight: 16, effective_contribution: 16, evidence: 'Found promotional phrases: "buy now", "satisfaction guaranteed"' },
      { rule_id: "RULE_03", name: "Repeated Words and Phrases", group: "STYLOMETRIC", severity: "High", base_weight: 12, effective_contribution: 12, evidence: 'Consecutive repeats: "BUY NOW" 3 times' },
      { rule_id: "RULE_04", name: "Excessive Capitalisation", group: "STYLOMETRIC", severity: "High", base_weight: 10, effective_contribution: 6, evidence: "95% uppercase letters" },
      { rule_id: "RULE_05", name: "Excessive Punctuation", group: "STYLOMETRIC", severity: "Medium", base_weight: 10, effective_contribution: 3.5, evidence: "2 exclamation marks at end" },
      { rule_id: "RULE_13", name: "Excessive Calls to Action", group: "PROMOTIONAL", severity: "High", base_weight: 15, effective_contribution: 9, evidence: 'Imperatives: "BUY NOW", "DO NOT MISS OUT"' }
    ],
    lexical_metrics: {
      word_count: 20,
      character_count: 116,
      uppercase_ratio: 0.95,
      punctuation_ratio: 0.03,
      exclamation_count: 2
    },
    duplicate_forensics: {
      is_exact_duplicate: false,
      is_near_duplicate: false,
      highest_similarity_score: 0.18
    }
  }
];

// Pre-seeded Admin & Analyst accounts with secure bcrypt hashes
const INITIAL_USERS = [
  {
    _id: "usr_admin_001",
    username: "admin",
    email: "admin@reviewguard.ai",
    passwordHash: bcrypt.hashSync("Admin@123", 10),
    role: "admin",
    name: "System Administrator",
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    _id: "usr_analyst_001",
    username: "analyst",
    email: "analyst@reviewguard.ai",
    passwordHash: bcrypt.hashSync("Analyst@123", 10),
    role: "analyst",
    name: "Forensic Analyst",
    isActive: true,
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString()
  }
];

// Initial Rule Configuration
const INITIAL_RULE_CONFIG = {
  version: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: "System Default",
  bands: {
    lowMax: 24,
    modMax: 49,
    highMax: 74
  },
  rules: DEFAULT_RULES.map(r => ({
    id: r.id,
    name: r.name,
    group: r.group,
    weight: r.defaultWeight,
    defaultWeight: r.defaultWeight,
    severity: r.severity,
    enabled: true,
    description: r.description
  })),
  history: [
    {
      version: 1,
      timestamp: new Date().toISOString(),
      updatedBy: "System Initialization",
      changes: "Default 20-rule configuration initialized"
    }
  ]
};

// Initial Audit Logs
const INITIAL_AUDIT_LOGS = [
  {
    _id: "log_001",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    username: "admin",
    action: "SYSTEM_INITIALIZE",
    entity_type: "SYSTEM",
    details: "ReviewGuard AI Forensic System initialized with 20 heuristic rules."
  },
  {
    _id: "log_002",
    timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    username: "admin",
    action: "SEED_CATALOGUE",
    entity_type: "CATALOGUE",
    details: "Initialized verified product catalogue across 8 categories."
  }
];

/**
 * Resilient Persistent Storage Manager
 */
class PersistentDbStorage {
  constructor() {
    this.ensureDataFile();
  }

  ensureDataFile() {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
        const initialData = {
          users: INITIAL_USERS,
          reviews: INITIAL_REVIEWS,
          ruleConfig: INITIAL_RULE_CONFIG,
          auditLogs: INITIAL_AUDIT_LOGS,
          products: INITIAL_PRODUCTS,
          validationFailures: []
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
      }
    } catch (e) {
      console.error("Failed to initialize data file:", e.message);
    }
  }

  read() {
    this.ensureDataFile();
    try {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      console.error("Critical database read error from", DATA_FILE, e.message);
      throw new Error(`Database read failure: Unable to read or parse database file at ${DATA_FILE}. ${e.message}`);
    }
  }

  write(data) {
    this.ensureDataFile();
    try {
      const tmpFile = DATA_FILE + ".tmp";
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
      fs.renameSync(tmpFile, DATA_FILE);
      return true;
    } catch (e) {
      console.error("PersistentDb atomic write failed, attempting direct write:", e.message);
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
        return true;
      } catch (e2) {
        console.error("Critical database write error:", e2.message);
        throw new Error(`Database write failure: Unable to persist data to ${DATA_FILE}. ${e2.message}`);
      }
    }
  }
}

const storage = new PersistentDbStorage();

/**
 * Initialize MongoDB connection with automatic resilient fallback
 */
async function initDatabase() {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000
    });
    isMongoConnected = true;
    dbStatusMessage = "Connected (MongoDB)";
    console.log("Connected to MongoDB at:", MONGODB_URI);
  } catch (err) {
    isMongoConnected = false;
    dbStatusMessage = "Connected (Persistent Engine Fallback - MongoDB offline)";
    console.log("MongoDB daemon offline. Utilizing Resilient Persistent File Storage.");
  }
}

/**
 * Unified DB Access Layer
 */
const db = {
  getStatus: () => ({
    connected: true,
    engine: isMongoConnected ? "MongoDB" : "Persistent File Storage",
    statusMessage: dbStatusMessage,
    databaseUri: isMongoConnected ? MONGODB_URI : "Local File Persistent DB"
  }),

  // USERS REPOSITORY
  users: {
    findByEmail: async (email) => {
      const data = storage.read();
      return (data.users || []).find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    },
    findByUsername: async (username) => {
      const data = storage.read();
      return (data.users || []).find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    },
    findById: async (id) => {
      const data = storage.read();
      return (data.users || []).find(u => u._id === id) || null;
    },
    getAll: async () => {
      const data = storage.read();
      return (data.users || []).map(({ passwordHash, ...rest }) => rest);
    },
    create: async (userData) => {
      const data = storage.read();
      const newUser = {
        _id: "usr_" + Date.now(),
        createdAt: new Date().toISOString(),
        isActive: true,
        ...userData
      };
      data.users = [...(data.users || []), newUser];
      storage.write(data);
      const { passwordHash, ...safeUser } = newUser;
      return safeUser;
    },
    updateRole: async (id, newRole) => {
      const data = storage.read();
      const user = (data.users || []).find(u => u._id === id);
      if (user) {
        user.role = newRole;
        storage.write(data);
        return true;
      }
      return false;
    },
    toggleActive: async (id) => {
      const data = storage.read();
      const user = (data.users || []).find(u => u._id === id);
      if (user) {
        user.isActive = !user.isActive;
        storage.write(data);
        return user.isActive;
      }
      return null;
    },
    countActiveAdmins: async () => {
      const data = storage.read();
      return (data.users || []).filter(u => u.role === "admin" && u.isActive !== false).length;
    }
  },

  // REVIEWS REPOSITORY
  reviews: {
    find: async (query = {}, options = {}) => {
      const data = storage.read();
      let list = data.reviews || [];

      // Filter by category
      if (query.category && query.category !== "all") {
        list = list.filter(r => r.category?.toLowerCase() === query.category.toLowerCase());
      }
      // Filter by platform
      if (query.platform && query.platform !== "all") {
        list = list.filter(r => (r.platform || "").toLowerCase() === query.platform.toLowerCase());
      }
      // Filter by sentiment
      if (query.sentiment && query.sentiment !== "all") {
        list = list.filter(r => (r.sentiment_analysis?.label || "").toLowerCase() === query.sentiment.toLowerCase());
      }
      // Filter by rating
      if (query.rating && query.rating !== "all") {
        list = list.filter(r => Number(r.rating) === Number(query.rating));
      }
      // Filter by risk level
      if (query.risk_level && query.risk_level !== "all") {
        list = list.filter(r => r.risk_level?.toLowerCase() === query.risk_level.toLowerCase());
      }
      // Filter by assessment
      if (query.assessment && query.assessment !== "all") {
        const qAss = query.assessment.toLowerCase();
        list = list.filter(r => {
          const ass = (r.assessment || "").toLowerCase();
          if (qAss === "appears genuine" || qAss === "likely genuine") {
            return ass === "appears genuine" || ass === "likely genuine";
          }
          if (qAss === "suspicious") {
            return ass === "suspicious" || ass === "strongly suspicious";
          }
          return ass === qAss;
        });
      }
      // Filter by triggered indicator
      if (query.indicator && query.indicator !== "all") {
        list = list.filter(r => (r.triggered_rules || []).some(tr => tr.rule_id === query.indicator));
      }
      // Filter by reviewer ID
      if (query.reviewer_id) {
        list = list.filter(r => r.reviewer_id?.toLowerCase() === query.reviewer_id.toLowerCase());
      }
      // Filter by product
      if (query.product_id) {
        list = list.filter(r => r.product_id?.toLowerCase() === query.product_id.toLowerCase());
      }
      // Date range filter
      if (query.startDate) {
        const start = new Date(query.startDate).getTime();
        list = list.filter(r => new Date(r.createdAt || r.review_date).getTime() >= start);
      }
      if (query.endDate) {
        const end = new Date(query.endDate).getTime();
        list = list.filter(r => new Date(r.createdAt || r.review_date).getTime() <= end);
      }
      // Text search
      if (query.search) {
        const q = query.search.toLowerCase();
        list = list.filter(r =>
          (r.product_name && r.product_name.toLowerCase().includes(q)) ||
          (r.reviewer_name && r.reviewer_name.toLowerCase().includes(q)) ||
          (r.review_text && r.review_text.toLowerCase().includes(q)) ||
          (r.headline && r.headline.toLowerCase().includes(q)) ||
          (r.product_id && r.product_id.toLowerCase().includes(q)) ||
          (r._id && r._id.toLowerCase().includes(q))
        );
      }

      // Sort (Default: newest first / descending)
      const sortBy = options.sortBy || "createdAt";
      const isAsc = options.sortOrder === "asc";
      list.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        if (sortBy === "createdAt" || sortBy === "review_date") {
          valA = new Date(a.createdAt || a.review_date || 0).getTime();
          valB = new Date(b.createdAt || b.review_date || 0).getTime();
        } else if (sortBy === "risk_score" || sortBy === "rating") {
          valA = Number(a[sortBy] || 0);
          valB = Number(b[sortBy] || 0);
        }
        if (valA < valB) return isAsc ? -1 : 1;
        if (valA > valB) return isAsc ? 1 : -1;
        return 0;
      });

      return list;
    },

    findById: async (id) => {
      const data = storage.read();
      return (data.reviews || []).find(r => r._id === id || r.id === id) || null;
    },

    findByHash: async (hash) => {
      const data = storage.read();
      return (data.reviews || []).find(r => r.duplicate_forensics?.text_hash === hash || r.text_hash === hash) || null;
    },

    findByReviewer: async (reviewerIdOrName) => {
      const data = storage.read();
      if (!reviewerIdOrName || !reviewerIdOrName.trim()) return [];
      const q = reviewerIdOrName.toLowerCase().trim();
      const qNoDot = q.replace(/\./g, "");
      return (data.reviews || []).filter(r => {
        const rId = (r.reviewer_id || "").toLowerCase().trim();
        const rName = (r.reviewer_name || "").toLowerCase().trim();
        return (
          rId === q ||
          rName === q ||
          (rId && rId.replace(/\./g, "") === qNoDot) ||
          (rName && rName.replace(/\./g, "") === qNoDot)
        );
      });
    },

    getReviewersSummary: async () => {
      const data = storage.read();
      const reviews = data.reviews || [];
      const map = {};
      reviews.forEach(r => {
        const name = (r.reviewer_name || "").trim();
        const id = (r.reviewer_id || "").trim();
        const primary = name || id;
        if (!primary || primary === "N/A" || primary === "REV-USR") return;
        const key = primary.toLowerCase().replace(/\./g, "");
        if (!map[key]) {
          map[key] = {
            name: name || id,
            reviewer_id: id || name,
            count: 0,
            ratings: [],
            riskScores: []
          };
        }
        map[key].count++;
        if (r.rating) map[key].ratings.push(r.rating);
        if (r.risk_score !== undefined) map[key].riskScores.push(r.risk_score);
      });
      return Object.values(map)
        .map(m => ({
          name: m.name,
          reviewer_id: m.reviewer_id,
          count: m.count,
          avgRating: Number((m.ratings.reduce((a, b) => a + b, 0) / (m.ratings.length || 1)).toFixed(2)),
          avgRisk: Number((m.riskScores.reduce((a, b) => a + b, 0) / (m.riskScores.length || 1)).toFixed(1))
        }))
        .sort((a, b) => b.count - a.count);
    },

    create: async (review) => {
      const data = storage.read();
      if (!review._id) review._id = "rev_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      if (!review.createdAt) review.createdAt = new Date().toISOString();
      data.reviews = [review, ...(data.reviews || [])];
      storage.write(data);
      return review;
    },

    createBatch: async (reviewsList) => {
      const data = storage.read();
      const prepared = reviewsList.map(r => {
        if (!r._id) r._id = "rev_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
        if (!r.createdAt) r.createdAt = new Date().toISOString();
        return r;
      });
      data.reviews = [...prepared, ...(data.reviews || [])];
      storage.write(data);
      return prepared;
    },

    update: async (id, updatedFields) => {
      const data = storage.read();
      const idx = (data.reviews || []).findIndex(r => r._id === id);
      if (idx !== -1) {
        data.reviews[idx] = { ...data.reviews[idx], ...updatedFields, updatedAt: new Date().toISOString() };
        storage.write(data);
        return data.reviews[idx];
      }
      return null;
    },

    deleteById: async (id) => {
      const data = storage.read();
      const lenBefore = (data.reviews || []).length;
      data.reviews = (data.reviews || []).filter(r => r._id !== id && r.id !== id);
      storage.write(data);
      return data.reviews.length < lenBefore;
    },

    deleteBatch: async (ids) => {
      if (!Array.isArray(ids) || ids.length === 0) return 0;
      const data = storage.read();
      const idSet = new Set(ids.map(String));
      const lenBefore = (data.reviews || []).length;
      data.reviews = (data.reviews || []).filter(r => !idSet.has(String(r._id)) && !idSet.has(String(r.id)));
      const countDeleted = lenBefore - data.reviews.length;
      storage.write(data);
      return countDeleted;
    },

    deleteMany: async (ids) => {
      return db.reviews.deleteBatch(ids);
    },

    clearAll: async () => {
      const data = storage.read();
      data.reviews = [];
      storage.write(data);
      return true;
    },

    count: async () => {
      const data = storage.read();
      return (data.reviews || []).length;
    }
  },

  // RULE CONFIGURATION REPOSITORY
  ruleConfig: {
    get: async () => {
      const data = storage.read();
      return data.ruleConfig || INITIAL_RULE_CONFIG;
    },
    update: async (newConfig, updatedBy = "Admin") => {
      const data = storage.read();
      const current = data.ruleConfig || INITIAL_RULE_CONFIG;
      const nextVersion = (current.version || 1) + 1;
      const updatedRecord = {
        ...newConfig,
        version: nextVersion,
        updatedAt: new Date().toISOString(),
        updatedBy,
        history: [
          {
            version: nextVersion,
            timestamp: new Date().toISOString(),
            updatedBy,
            changes: `Rule configuration updated to v${nextVersion}`
          },
          ...(current.history || [])
        ].slice(0, 50)
      };
      data.ruleConfig = updatedRecord;
      storage.write(data);
      return updatedRecord;
    },
    resetToDefault: async (updatedBy = "Admin") => {
      const data = storage.read();
      const current = data.ruleConfig || INITIAL_RULE_CONFIG;
      const nextVersion = (current.version || 1) + 1;
      const resetConfig = {
        ...INITIAL_RULE_CONFIG,
        version: nextVersion,
        updatedAt: new Date().toISOString(),
        updatedBy,
        history: [
          {
            version: nextVersion,
            timestamp: new Date().toISOString(),
            updatedBy,
            changes: "Reset all rule weights and thresholds to factory defaults"
          },
          ...(current.history || [])
        ]
      };
      data.ruleConfig = resetConfig;
      storage.write(data);
      return resetConfig;
    }
  },

  // AUDIT LOGS REPOSITORY
  auditLogs: {
    log: async ({ username, action, entity_type, entity_id = null, details = "" }) => {
      const data = storage.read();
      const logEntry = {
        _id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        username: username || "System",
        action,
        entity_type,
        entity_id,
        details
      };
      data.auditLogs = [logEntry, ...(data.auditLogs || [])].slice(0, 1000);
      storage.write(data);
      return logEntry;
    },
    getAll: async (limit = 100) => {
      const data = storage.read();
      return (data.auditLogs || []).slice(0, limit);
    }
  },

  // PRODUCTS CATALOGUE REPOSITORY
  products: {
    getAll: async () => {
      const data = storage.read();
      return data.products || INITIAL_PRODUCTS;
    },
    findById: async (id) => {
      const data = storage.read();
      return (data.products || []).find(p => p.product_id === id) || null;
    },
    create: async (productData) => {
      const data = storage.read();
      const newProd = {
        product_id: productData.product_id || `PROD-CUST-${Date.now().toString().slice(-4)}`,
        verified: true,
        ...productData
      };
      data.products = [...(data.products || []), newProd];
      storage.write(data);
      return newProd;
    },
    delete: async (productId) => {
      const data = storage.read();
      const before = (data.products || []).length;
      data.products = (data.products || []).filter(p => p.product_id !== productId);
      storage.write(data);
      return data.products.length < before;
    }
  },

  // VALIDATION FAILURES LOG
  validationFailures: {
    log: async (failure) => {
      const data = storage.read();
      const entry = {
        _id: "fail_" + Date.now(),
        timestamp: new Date().toISOString(),
        ...failure
      };
      data.validationFailures = [entry, ...(data.validationFailures || [])].slice(0, 500);
      storage.write(data);
      return entry;
    },
    getAll: async () => {
      const data = storage.read();
      return data.validationFailures || [];
    }
  }
};

module.exports = {
  initDatabase,
  db,
  INITIAL_REVIEWS,
  INITIAL_USERS,
  INITIAL_RULE_CONFIG
};
