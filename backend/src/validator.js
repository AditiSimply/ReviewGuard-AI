/**
 * ReviewGuard AI - Comprehensive Input Validation Layer
 * 
 * Enforces strict validation across required input fields before forensic analysis.
 * Rejects empty, short, malformed, non-natural, or contradictory inputs with clear field-level errors.
 * Ensures invalid inputs never receive a fake prediction.
 */

const { validateProductCategory, VALID_CATEGORIES } = require("./productCategoryDb");

const EMOJI_REGEX = /^[\p{Extended_Pictographic}\s\uFE0F]+$/u;
const NUMBERS_ONLY_REGEX = /^[\d\s.,\-+*/=()]+$/;
const SPECIAL_CHARS_ONLY_REGEX = /^[^a-zA-Z0-9\s]+$/;

/**
 * Checks for unreadable gibberish, extreme consonant clusters, or synthetic noise
 */
function isGibberish(text) {
  if (!text) return false;
  const clean = text.toLowerCase().replace(/[^a-z]/g, "");
  if (clean.length < 8) return false;

  // 1. Extreme consonant clusters (7+ consecutive consonants e.g. "zkrtplwqsd")
  if (/[bcdfghjklmnpqrstvwxyz]{7,}/i.test(clean)) {
    return true;
  }

  // 2. Unnatural vowel ratio in words >= 10 chars
  const vowels = (clean.match(/[aeiou]/g) || []).length;
  const vowelRatio = vowels / clean.length;
  if (clean.length >= 10 && vowelRatio < 0.08) {
    return true;
  }

  // 3. Repeating 1-character spam e.g. "aaaaaaaaaaaa"
  if (/^(.)\1{6,}$/.test(clean)) {
    return true;
  }

  return false;
}

/**
 * Validates a single review submission payload
 */
function validateReviewPayload(payload) {
  const errors = {};
  const checklist = {
    product: false,
    category: false,
    reviewer: false,
    rating: false,
    review_length: false,
    text_quality: false,
    product_relevance: false,
    duplicate_check: true
  };

  const {
    product_name,
    product_id,
    category,
    reviewer_name,
    rating,
    review_text
  } = payload || {};

  // 1. PRODUCT NAME VALIDATION
  if (!product_name || typeof product_name !== "string" || !product_name.trim()) {
    errors.product_name = "Product name is required.";
  } else {
    const trimmedProd = product_name.trim();
    if (trimmedProd.length < 2) {
      errors.product_name = "Product name must be at least 2 characters long.";
    } else if (trimmedProd.length > 150) {
      errors.product_name = "Product name cannot exceed 150 characters.";
    } else if (SPECIAL_CHARS_ONLY_REGEX.test(trimmedProd)) {
      errors.product_name = "Product name cannot consist solely of special characters.";
    } else {
      checklist.product = true;
    }
  }

  // 2. PRODUCT CATEGORY VALIDATION & CATALOGUE CROSS-CHECK
  if (!category || typeof category !== "string" || !category.trim()) {
    errors.category = "Product category is required.";
  } else {
    const trimmedCat = category.trim();
    if (!VALID_CATEGORIES.includes(trimmedCat)) {
      errors.category = `Invalid category '${trimmedCat}'. Supported: ${VALID_CATEGORIES.join(", ")}.`;
    } else if (checklist.product) {
      const catCheck = validateProductCategory(product_name, trimmedCat, product_id);
      if (!catCheck.valid) {
        errors.category = catCheck.message || "Product and category selection mismatch.";
        errors.category_mismatch = true;
        errors.expected_category = catCheck.expectedCategory;
      } else {
        checklist.category = true;
      }
    } else {
      checklist.category = true;
    }
  }

  // OPTIONAL FIELD: PRODUCT ID / SKU
  if (product_id !== undefined && product_id !== null && product_id !== "") {
    if (typeof product_id !== "string") {
      errors.product_id = "Product ID / SKU must be a string.";
    } else if (product_id.trim().length > 100) {
      errors.product_id = "Product ID / SKU cannot exceed 100 characters.";
    }
  }

  // OPTIONAL FIELD: ORIGIN PLATFORM
  if (payload && payload.platform !== undefined && payload.platform !== null && payload.platform !== "") {
    if (typeof payload.platform !== "string") {
      errors.platform = "Origin platform must be a string.";
    } else if (payload.platform.trim().length > 50) {
      errors.platform = "Origin platform cannot exceed 50 characters.";
    }
  }

  // 3. REVIEWER NAME VALIDATION
  if (!reviewer_name || typeof reviewer_name !== "string" || !reviewer_name.trim()) {
    errors.reviewer_name = "Reviewer name or ID is required.";
  } else {
    const trimmedRev = reviewer_name.trim();
    if (trimmedRev.length < 2) {
      errors.reviewer_name = "Reviewer name must be at least 2 characters.";
    } else if (trimmedRev.length > 100) {
      errors.reviewer_name = "Reviewer name cannot exceed 100 characters.";
    } else if (SPECIAL_CHARS_ONLY_REGEX.test(trimmedRev)) {
      errors.reviewer_name = "Reviewer name cannot consist solely of special characters.";
    } else {
      checklist.reviewer = true;
    }
  }

  // 4. RATING VALIDATION (Strict integer between 1 and 5)
  if (rating === undefined || rating === null || rating === "") {
    errors.rating = "Star rating is required.";
  } else {
    const numRating = Number(rating);
    if (isNaN(numRating) || !Number.isInteger(numRating)) {
      errors.rating = "Rating must be a whole integer number between 1 and 5.";
    } else if (numRating < 1 || numRating > 5) {
      errors.rating = `Invalid rating (${numRating}). Allowed values are strictly integers 1 to 5.`;
    } else {
      checklist.rating = true;
    }
  }

  // 5. REVIEW TEXT VALIDATION
  if (!review_text || typeof review_text !== "string") {
    errors.review_text = "Review text is required.";
  } else {
    const trimmedText = review_text.trim();
    const len = trimmedText.length;

    if (len === 0) {
      errors.review_text = "Review text cannot be empty or whitespace only.";
    } else if (len < 12) {
      errors.review_text = `Review text is too short (${len} chars). Minimum 12 characters required for forensic analysis.`;
    } else if (len > 4000) {
      errors.review_text = `Review text exceeds maximum allowed limit (${len}/4000 characters).`;
    } else if (NUMBERS_ONLY_REGEX.test(trimmedText)) {
      errors.review_text = "Review contains only numbers without descriptive text.";
    } else if (EMOJI_REGEX.test(trimmedText)) {
      errors.review_text = "Review contains only emojis without any descriptive text.";
    } else if (isGibberish(trimmedText)) {
      errors.review_text = "Review contains unnatural gibberish or random consonant strings.";
    } else {
      checklist.review_length = true;
      checklist.text_quality = true;
      checklist.product_relevance = true;
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    checklist,
    errorSummary: Object.values(errors).join(" | ")
  };
}

module.exports = {
  validateReviewPayload,
  isGibberish,
  VALID_CATEGORIES
};
