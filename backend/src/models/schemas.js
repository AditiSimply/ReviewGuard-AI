/**
 * ReviewGuard AI - Mongoose Database Schemas
 * Enterprise Mongoose schema definitions for MongoDB persistence:
 * Reviews, Users, RuleConfig, AuditLogs, and Products.
 */

const mongoose = require("mongoose");

// 1. Review Schema
const ReviewSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    product_name: { type: String, required: true, trim: true },
    product_id: { type: String, default: "PROD-GEN", trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Electronics", "Fashion", "Beauty", "Home/Kitchen", "Grocery", "Books", "Sports", "Other"],
      default: "Other"
    },
    reviewer_name: { type: String, required: true, trim: true },
    reviewer_id: { type: String, default: "REV-USR", trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    headline: { type: String, default: "", trim: true },
    review_text: { type: String, required: true, trim: true },
    platform: {
      type: String,
      default: "Web",
      enum: ["Amazon", "Flipkart", "Google Reviews", "Trustpilot", "App Store", "Direct E-Commerce", "Web", "CSV Batch"]
    },
    review_date: { type: String, default: () => new Date().toISOString() },
    risk_score: { type: Number, required: true, min: 0, max: 100 },
    risk_level: { type: String, required: true, enum: ["Low", "Moderate", "High", "Very High"] },
    assessment: { type: String, required: true },
    classification_label: { type: String, required: true },
    assessment_explanation: { type: String, default: "" },
    rule_engine_version: { type: String, default: "2.4.0" },
    sentiment_analysis: {
      label: { type: String, enum: ["Positive", "Negative", "Neutral", "Mixed"], default: "Neutral" },
      score: { type: Number, default: 0 },
      normalized_score: { type: Number, default: 0 },
      positive_words: [String],
      negative_words: [String],
      rating_consistency: {
        is_consistent: { type: Boolean, default: true },
        mismatch: { type: Boolean, default: false },
        severity: { type: String, default: "None" },
        explanation: { type: String, default: "" }
      }
    },
    triggered_rules: [
      {
        rule_id: { type: String, required: true },
        name: { type: String, required: true },
        group: { type: String, required: true },
        severity: { type: String, required: true },
        base_weight: { type: Number, required: true },
        damping_factor: { type: Number, default: 1.0 },
        effective_contribution: { type: Number, required: true },
        evidence: { type: String, default: "" },
        explanation: { type: String, default: "" }
      }
    ],
    triggered_rules_count: { type: Number, default: 0 },
    text_hash: { type: String, index: true },
    lexical_metrics: {
      word_count: { type: Number, default: 0 },
      character_count: { type: Number, default: 0 },
      avg_word_length: { type: Number, default: 0 },
      uppercase_ratio: { type: Number, default: 0 },
      punctuation_ratio: { type: Number, default: 0 },
      exclamation_count: { type: Number, default: 0 },
      question_count: { type: Number, default: 0 }
    },
    duplicate_forensics: {
      text_hash: { type: String },
      is_exact_duplicate: { type: Boolean, default: false },
      is_near_duplicate: { type: Boolean, default: false },
      highest_similarity_score: { type: Number, default: 0 },
      matched_review: {
        id: String,
        product_name: String,
        reviewer_name: String,
        rating: Number,
        similarity: Number
      }
    },
    reviewer_forensics: {
      has_sufficient_history: { type: Boolean, default: false },
      history_count: { type: Number, default: 0 },
      avg_historical_rating: { type: Number, default: 0 },
      status_note: { type: String, default: "" }
    },
    all_rules_audit: [
      {
        rule_id: String,
        name: String,
        group: String,
        severity: String,
        base_weight: Number,
        enabled: Boolean,
        triggered: Boolean,
        effective_contribution: Number,
        evidence: String,
        explanation: String
      }
    ],
    methodology_notes: {
      anti_double_counting_applied: { type: Boolean, default: true },
      disclaimer: { type: String, default: "" }
    }
  },
  {
    timestamps: true,
    _id: false
  }
);

// 2. User Schema
const UserSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["admin", "analyst"], default: "analyst" },
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    _id: false
  }
);

// 3. Rule Config Schema
const RuleConfigSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true, default: 1 },
    updatedAt: { type: String, default: () => new Date().toISOString() },
    updatedBy: { type: String, default: "System" },
    bands: {
      lowMax: { type: Number, default: 24 },
      modMax: { type: Number, default: 49 },
      highMax: { type: Number, default: 74 }
    },
    rules: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        group: { type: String, required: true },
        weight: { type: Number, required: true, min: 1, max: 50 },
        defaultWeight: { type: Number, required: true },
        severity: { type: String, required: true },
        enabled: { type: Boolean, default: true },
        description: { type: String, default: "" }
      }
    ],
    history: [
      {
        version: Number,
        timestamp: String,
        updatedBy: String,
        changes: String
      }
    ]
  },
  {
    timestamps: true
  }
);

// 4. Audit Log Schema
const AuditLogSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toISOString() },
    username: { type: String, required: true },
    action: { type: String, required: true },
    entity_type: { type: String, required: true },
    entity_id: { type: String, default: null },
    details: { type: String, default: "" }
  },
  {
    timestamps: true,
    _id: false
  }
);

// 5. Product Catalogue Schema
const ProductSchema = new mongoose.Schema(
  {
    product_id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    keywords: [String],
    verified: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

module.exports = {
  ReviewSchema,
  UserSchema,
  RuleConfigSchema,
  AuditLogSchema,
  ProductSchema
};
