/**
 * ReviewGuard AI - 20 Heuristic Rules Definition & Evaluators
 * Every rule has a unique ID, default weight, category group, severity, triggering logic, evidence, and explanation.
 */

const { normalizeText, jaccardSimilarity } = require("./textSimilarity");

// Default rule registry for ReviewGuard AI
const DEFAULT_RULES = [
  {
    id: "RULE_01",
    name: "Rating–Sentiment Inconsistency",
    group: "SENTIMENT",
    defaultWeight: 22,
    severity: "High",
    description: "Detects stark contradiction between numerical star rating and textual sentiment polarity."
  },
  {
    id: "RULE_02",
    name: "Promotional and Spam Language",
    group: "PROMOTIONAL",
    defaultWeight: 16,
    severity: "High",
    description: "Detects aggressive marketing phrases, coupon/affiliate codes, and commercial spam vernacular."
  },
  {
    id: "RULE_03",
    name: "Repeated Words and Phrases",
    group: "STYLOMETRIC",
    defaultWeight: 12,
    severity: "Medium",
    description: "Flags unnatural lexical repetition and chant-like repetition of specific phrases."
  },
  {
    id: "RULE_04",
    name: "Excessive Capitalisation",
    group: "STYLOMETRIC",
    defaultWeight: 10,
    severity: "Medium",
    description: "Detects shout-style all-caps text or abnormal uppercase ratio typical of astroturfed hype."
  },
  {
    id: "RULE_05",
    name: "Excessive Punctuation",
    group: "STYLOMETRIC",
    defaultWeight: 10,
    severity: "Medium",
    description: "Flags excessive exclamation marks, repeated question marks, and dramatic punctuation chains."
  },
  {
    id: "RULE_06",
    name: "Hollow Superlatives and Exaggerated Claims",
    group: "PROMOTIONAL",
    defaultWeight: 14,
    severity: "Medium",
    description: "Identifies grandiose, ungrounded superlatives without specific experiential backing."
  },
  {
    id: "RULE_07",
    name: "Keyword Stuffing",
    group: "CONTENT_QUALITY",
    defaultWeight: 12,
    severity: "Medium",
    description: "Detects artificial over-repetition of the exact product title or category terms."
  },
  {
    id: "RULE_08",
    name: "Generic or Low-Information Reviews",
    group: "CONTENT_QUALITY",
    defaultWeight: 14,
    severity: "Medium",
    description: "Flags vague filler text lacking tangible features, sensory feedback, or operational specifics."
  },
  {
    id: "RULE_09",
    name: "Unusual Text Patterns",
    group: "STYLOMETRIC",
    defaultWeight: 10,
    severity: "Low",
    description: "Identifies abnormal symbol usage, irregular whitespace, or machine-generated filler artefacts."
  },
  {
    id: "RULE_10",
    name: "Reviewer Behaviour Indicators",
    group: "REVIEWER_BEHAVIOR",
    defaultWeight: 18,
    severity: "High",
    description: "Flags rapid-fire burst velocity or abnormal volume from the same reviewer ID."
  },
  {
    id: "RULE_11",
    name: "Product/Category Relevance Mismatch",
    group: "CONTENT_QUALITY",
    defaultWeight: 16,
    severity: "High",
    description: "Detects reviews referencing attributes irrelevant to the product's actual functional category."
  },
  {
    id: "RULE_12",
    name: "Repeated Sentence Structures",
    group: "STYLOMETRIC",
    defaultWeight: 10,
    severity: "Medium",
    description: "Identifies repetitive syntactic patterns ('It is very X. It is very Y. It is very Z.')."
  },
  {
    id: "RULE_13",
    name: "Excessive Calls to Action",
    group: "PROMOTIONAL",
    defaultWeight: 15,
    severity: "High",
    description: "Detects direct commercial imperatives urging the reader to purchase, click, or act now."
  },
  {
    id: "RULE_14",
    name: "Unusual Review-Length Patterns",
    group: "CONTENT_QUALITY",
    defaultWeight: 10,
    severity: "Low",
    description: "Flags abnormal review length (extremely terse or artificially elongated copy-paste)."
  },
  {
    id: "RULE_15",
    name: "Exact Duplicate Reviews",
    group: "SIMILARITY",
    defaultWeight: 25,
    severity: "Critical",
    description: "Identifies byte-for-byte exact matches with other existing reviews in the catalogue or batch."
  },
  {
    id: "RULE_16",
    name: "Near-Duplicate Reviews",
    group: "SIMILARITY",
    defaultWeight: 20,
    severity: "High",
    description: "Detects high cosine / Jaccard similarity (>= 75%) with existing submissions."
  },
  {
    id: "RULE_17",
    name: "Repeated Templates Across Products",
    group: "SIMILARITY",
    defaultWeight: 18,
    severity: "High",
    description: "Detects identical structural templates reused across different products with minor substitutions."
  },
  {
    id: "RULE_18",
    name: "Unusual Reviewer Rating Distributions",
    group: "REVIEWER_BEHAVIOR",
    defaultWeight: 15,
    severity: "Medium",
    description: "Identifies reviewers whose historical distribution consists entirely of unvarying 5-star or 1-star ratings."
  },
  {
    id: "RULE_19",
    name: "Bursts of Similar Reviews",
    group: "SIMILARITY",
    defaultWeight: 18,
    severity: "High",
    description: "Identifies abnormal spikes of coordinated similar reviews within narrow time windows."
  },
  {
    id: "RULE_20",
    name: "Cross-Reviewer High-Similarity Language",
    group: "SIMILARITY",
    defaultWeight: 20,
    severity: "High",
    description: "Detects different reviewer accounts using identical or near-identical text (sockpuppet syndicate)."
  }
];

// Lexical Lexicons for Pattern Matching
const PROMOTIONAL_PHRASES = [
  "100% recommended", "100% guarantee", "satisfaction guaranteed", "buy now", "order now",
  "order today", "discount code", "promo code", "special deal", "incredible deal",
  "limited time", "don't miss out", "must buy", "click the link", "hurry up",
  "affiliate link", "free sample", "sponsored post", "unbeatable price", "best offer",
  "run and buy", "worth every single penny", "grab yours", "highly recommended to everyone"
];

const HOLLOW_SUPERLATIVES = [
  "best ever", "greatest of all time", "miracle", "holy grail", "life changing",
  "game changer", "godsend", "perfection in a bottle", "best product in the universe",
  "world's best", "flawless perfection", "heavenly", "blown away", "mind blowing",
  "masterpiece", "no words can describe", "changed my life forever"
];

const CALL_TO_ACTION_PATTERNS = [
  /\b(buy (this|it|now|today))\b/i,
  /\b(order (this|it|now|today))\b/i,
  /\b(don'?t (hesitate|miss out|wait))\b/i,
  /\b(click (here|link|below))\b/i,
  /\b(get (yours|one) (now|today))\b/i,
  /\b(go for it)\b/i,
  /\b(run (don'?t walk))\b/i,
  /\b(add to cart (now|immediately))\b/i
];

const GENERIC_FLUFF_PHRASES = [
  "good product", "very nice", "nice product", "loved it", "very good",
  "awesome product", "superb product", "as expected", "nice one", "good quality",
  "value for money", "it works", "fine product", "ok ok", "simply the best"
];

// Category Relevance Keywords
const CATEGORY_TERMS = {
  Electronics: ["battery", "sound", "screen", "charging", "display", "bluetooth", "noise", "audio", "device", "specs", "usb", "processor", "connection"],
  Fashion: ["fit", "fabric", "size", "cotton", "stitching", "waist", "wear", "color", "wash", "material", "comfort", "seams", "stretch"],
  Beauty: ["skin", "moisture", "scent", "fragrance", "texture", "pores", "face", "hair", "formula", "absorption", "wrinkles", "dermatologist"],
  "Home/Kitchen": ["kitchen", "cooking", "clean", "durable", "sturdy", "room", "assemble", "lid", "wash", "heat", "handle", "cabinet", "appliance"],
  Grocery: ["taste", "flavor", "aroma", "fresh", "sweet", "organic", "package", "roast", "beans", "expiry", "ingredients", "tasty", "delicious"],
  Books: ["book", "read", "author", "story", "plot", "character", "writing", "chapter", "concept", "insight", "pages", "paperback"],
  Sports: ["workout", "grip", "weights", "exercise", "durable", "gym", "cushion", "sweat", "mat", "heavy", "stretching", "movement"],
  Other: []
};

// Incompatible Category Mismatches (e.g. eating an electronic device or plugging in a shirt)
const INCOMPATIBLE_INDICATORS = {
  Electronics: [/\b(tasty|delicious|flavor|flavorful|creamy|sweet|bitter|edible|savory)\b/i, /\b(fabric|seam|hem|waistline|soft cotton)\b/i],
  Fashion: [/\b(battery life|bluetooth pairing|hdmi|usb-c charging|firmware update|megapixels)\b/i, /\b(tasty|flavor|crunchy|delicious)\b/i],
  Beauty: [/\b(screen resolution|refresh rate|optical zoom|gigabytes|battery charge)\b/i],
  Grocery: [/\b(screen resolution|leather strap|bluetooth audio|fits my feet|size large pants)\b/i],
  Books: [/\b(battery life|bluetooth audio|tasty crunch|soft fabric|wash cycle)\b/i],
  Sports: [/\b(tasty soup|delicious flavor|creamy texture|skin serum|facial wash)\b/i]
};

/**
 * Computes stylistic and lexical metrics for a given review text
 */
function extractLexicalMetrics(text) {
  if (!text) text = "";
  const trimmed = text.trim();
  const charCount = trimmed.length;
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Uppercase ratio (excluding spaces)
  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  const uppercaseLetters = trimmed.replace(/[^A-Z]/g, "");
  const uppercaseRatio = letters.length > 0 ? uppercaseLetters.length / letters.length : 0;

  // Punctuation metrics
  const punctuation = trimmed.replace(/[^!?,.:;'"\-()]/g, "");
  const punctuationRatio = charCount > 0 ? punctuation.length / charCount : 0;
  const exclamationCount = (trimmed.match(/!/g) || []).length;
  const questionCount = (trimmed.match(/\?/g) || []).length;

  // Repeated words count
  const lowerWords = words.map(w => w.toLowerCase().replace(/[^\w]/g, "")).filter(Boolean);
  const wordFreq = {};
  lowerWords.forEach(w => {
    wordFreq[w] = (wordFreq[w] || 0) + 1;
  });
  const repeatedWords = Object.entries(wordFreq).filter(([w, c]) => c >= 3 && w.length > 3);

  // Consecutive repeating words e.g. "great great great"
  let consecutiveRepeats = 0;
  for (let i = 1; i < lowerWords.length; i++) {
    if (lowerWords[i] === lowerWords[i - 1]) consecutiveRepeats++;
  }

  // N-gram phrase repetition (3-words)
  const trigramFreq = {};
  for (let i = 0; i <= lowerWords.length - 3; i++) {
    const tri = `${lowerWords[i]} ${lowerWords[i + 1]} ${lowerWords[i + 2]}`;
    trigramFreq[tri] = (trigramFreq[tri] || 0) + 1;
  }
  const repeatedTrigrams = Object.entries(trigramFreq).filter(([_, c]) => c >= 2);

  return {
    charCount,
    wordCount,
    avgWordLength: wordCount > 0 ? Number((letters.length / wordCount).toFixed(1)) : 0,
    uppercaseRatio: Number(uppercaseRatio.toFixed(3)),
    punctuationRatio: Number(punctuationRatio.toFixed(3)),
    exclamationCount,
    questionCount,
    repeatedWords,
    consecutiveRepeats,
    repeatedTrigrams
  };
}

module.exports = {
  DEFAULT_RULES,
  PROMOTIONAL_PHRASES,
  HOLLOW_SUPERLATIVES,
  CALL_TO_ACTION_PATTERNS,
  GENERIC_FLUFF_PHRASES,
  CATEGORY_TERMS,
  INCOMPATIBLE_INDICATORS,
  extractLexicalMetrics
};
