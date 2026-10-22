/**
 * ReviewGuard AI - Comprehensive Sentiment & Rating Consistency Engine
 * Analyzes headline + review text together.
 * Supports:
 *  - Fine-grained polarity (Positive, Negative, Neutral, Mixed)
 *  - Negation handling ("not good", "never worked", "didn't like", "hardly recommend", "won't buy again", "no problems")
 *  - Intensifiers ("extremely", "terribly", "incredibly", "very", "barely", "exceptionally")
 *  - Star rating vs Sentiment consistency evaluation (1-star vs positive, 5-star vs negative, neutral/mixed handling)
 */

const Sentiment = require("sentiment");
const sentimentLib = new Sentiment();

// Negation triggers that invert or dampen following sentiment words
const NEGATIONS = new Set([
  "not", "never", "no", "neither", "nor", "barely", "hardly", "scarcely",
  "didn't", "didnt", "don't", "dont", "doesn't", "doesnt", "wasn't", "wasnt",
  "weren't", "werent", "won't", "wont", "wouldn't", "wouldnt", "can't", "cant",
  "cannot", "couldn't", "couldnt", "isn't", "isnt", "aren't", "arent", "without"
]);

// Intensifiers and their multipliers
const INTENSIFIERS = {
  extremely: 2.0,
  incredibly: 2.0,
  absolutely: 1.8,
  exceptionally: 1.8,
  terribly: 1.8,
  hugely: 1.7,
  very: 1.5,
  really: 1.5,
  super: 1.5,
  totally: 1.4,
  completely: 1.4,
  highly: 1.4,
  truly: 1.3,
  quite: 1.2,
  slightly: 0.6,
  somewhat: 0.7,
  barely: 0.4
};

// Domain-specific sentiment booster words for product reviews
const DOMAIN_VOCABULARY = {
  defective: -3,
  broken: -3,
  horrible: -4,
  terrible: -4,
  garbage: -4,
  trash: -4,
  scam: -5,
  "rip-off": -4,
  fraud: -5,
  waste: -3,
  useless: -3,
  flawless: 3,
  superb: 4,
  magnificent: 4,
  sturdy: 3,
  durable: 3,
  reliable: 3,
  counterfeit: -5,
  overheats: -3,
  laggy: -2,
  buggy: -2,
  underwhelmed: -2,
  unusable: -4
};

// Register custom vocabulary with sentiment engine
sentimentLib.registerLanguage("en_reviewguard", {
  labels: DOMAIN_VOCABULARY
});

/**
 * Tokenizes text preserving contractions
 */
function tokenizeWords(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Analyzes text with negation window (up to 3 tokens) and intensifiers
 */
function analyzeTextWithContext(text) {
  if (!text || typeof text !== "string") {
    return { score: 0, comparative: 0, positiveWords: [], negativeWords: [], tokenCount: 0 };
  }

  const baseResult = sentimentLib.analyze(text, { extras: DOMAIN_VOCABULARY });
  const words = tokenizeWords(text);

  let adjustedScore = 0;
  const positiveWords = [...(baseResult.positive || [])];
  const negativeWords = [...(baseResult.negative || [])];

  // Apply intensifiers
  let currentMultiplier = 1.0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    if (INTENSIFIERS[word]) {
      currentMultiplier = INTENSIFIERS[word];
      continue;
    }

    const calcItem = baseResult.calculation.find(c => c[word] !== undefined);
    if (calcItem) {
      const baseWordScore = calcItem[word];
      adjustedScore += baseWordScore * currentMultiplier;
      currentMultiplier = 1.0;
    }
  }

  // If no words were altered by intensifiers, use base score
  if (adjustedScore === 0 && baseResult.score !== 0) {
    adjustedScore = baseResult.score;
  }

  const totalTokens = Math.max(words.length, 1);
  const comparative = Number((adjustedScore / totalTokens).toFixed(3));

  return {
    score: adjustedScore,
    comparative,
    positiveWords: Array.from(new Set(positiveWords)),
    negativeWords: Array.from(new Set(negativeWords)),
    tokenCount: words.length
  };
}

/**
 * Full sentiment analyzer analyzing headline + body together
 */
function analyzeSentiment(headline, reviewText) {
  const combinedText = [headline ? headline.trim() : "", reviewText ? reviewText.trim() : ""].filter(Boolean).join(". ");
  const headlineAnalysis = headline ? analyzeTextWithContext(headline) : null;
  const bodyAnalysis = analyzeTextWithContext(reviewText);

  // Weight headline 1.5x relative to length
  let weightedScore = bodyAnalysis.score;
  if (headlineAnalysis) {
    weightedScore += headlineAnalysis.score * 1.5;
  }

  const allPositives = Array.from(new Set([
    ...(headlineAnalysis ? headlineAnalysis.positiveWords : []),
    ...bodyAnalysis.positiveWords
  ]));

  const allNegatives = Array.from(new Set([
    ...(headlineAnalysis ? headlineAnalysis.negativeWords : []),
    ...bodyAnalysis.negativeWords
  ]));

  const comparative = Number((weightedScore / Math.max(bodyAnalysis.tokenCount + (headlineAnalysis?.tokenCount || 0), 1)).toFixed(3));

  // Determine sentiment label: Positive, Negative, Neutral, Mixed
  let label = "Neutral";
  const posCount = allPositives.length;
  const negCount = allNegatives.length;

  if (posCount >= 2 && negCount >= 2 && Math.abs(posCount - negCount) <= 1) {
    label = "Mixed";
  } else if (weightedScore >= 2 || (comparative > 0.08 && weightedScore > 0)) {
    label = "Positive";
  } else if (weightedScore <= -2 || (comparative < -0.08 && weightedScore < 0)) {
    label = "Negative";
  } else if (weightedScore > 0 && posCount > negCount) {
    label = "Positive";
  } else if (weightedScore < 0 && negCount > posCount) {
    label = "Negative";
  } else {
    label = "Neutral";
  }

  // Normalized sentiment score between -1.0 and +1.0
  const normalizedScore = Number(Math.max(-1.0, Math.min(1.0, comparative * 3)).toFixed(2));

  return {
    combinedText,
    label,
    score: weightedScore,
    comparative,
    normalizedScore,
    positiveWords: allPositives,
    negativeWords: allNegatives,
    headlineSentiment: headlineAnalysis ? headlineAnalysis.score : null
  };
}

/**
 * Evaluates rating vs sentiment consistency
 * Returns detailed evaluation with mismatch flag and explanation
 */
function evaluateRatingSentimentConsistency(rating, sentimentResult) {
  const numRating = Number(rating);
  const { label, score, normalizedScore, positiveWords, negativeWords } = sentimentResult;

  let isConsistent = true;
  let severity = "None"; // 'None' | 'Low' | 'Medium' | 'High'
  let mismatchType = null;
  let explanation = "";

  if (numRating === 5) {
    if (label === "Negative" || score <= -2) {
      isConsistent = false;
      severity = "High";
      mismatchType = "HIGH_RATING_NEGATIVE_SENTIMENT";
      explanation = `Contradiction: 5-star rating given, but review text expresses distinct negative sentiment (Score: ${score}, Negatives: ${negativeWords.slice(0, 3).join(", ")}).`;
    } else if (label === "Mixed") {
      isConsistent = true; // Qualified feedback is possible
      severity = "Low";
      explanation = "5-star rating with mixed feedback; moderate qualification noted.";
    } else {
      explanation = "5-star rating is consistent with positive or neutral sentiment.";
    }
  } else if (numRating === 4) {
    if (label === "Negative" && score <= -3) {
      isConsistent = false;
      severity = "Medium";
      mismatchType = "MODERATE_RATING_NEGATIVE_SENTIMENT";
      explanation = `Mismatch: 4-star rating given, but text contains strongly negative critique (Score: ${score}).`;
    } else {
      explanation = "4-star rating is generally consistent with feedback.";
    }
  } else if (numRating === 1) {
    if (label === "Positive" || score >= 2) {
      isConsistent = false;
      severity = "High";
      mismatchType = "LOW_RATING_POSITIVE_SENTIMENT";
      explanation = `Contradiction: 1-star rating given, but review text contains glowing praise (Score: ${score}, Positives: ${positiveWords.slice(0, 3).join(", ")}).`;
    } else if (label === "Mixed") {
      isConsistent = true;
      severity = "Low";
      explanation = "1-star rating with mixed nuances.";
    } else {
      explanation = "1-star rating is consistent with critical feedback.";
    }
  } else if (numRating === 2) {
    if (label === "Positive" && score >= 3) {
      isConsistent = false;
      severity = "Medium";
      mismatchType = "LOW_RATING_POSITIVE_SENTIMENT";
      explanation = `Mismatch: 2-star rating given, but review text is predominantly positive (Score: ${score}).`;
    } else {
      explanation = "2-star rating is generally consistent with critical feedback.";
    }
  } else if (numRating === 3) {
    // 3 stars is neutral; both mildly positive or negative are acceptable
    explanation = "3-star rating is consistent with neutral, balanced, or moderate sentiment.";
  }

  return {
    isConsistent,
    mismatch: !isConsistent,
    severity,
    mismatchType,
    explanation,
    rating: numRating,
    sentimentLabel: label,
    sentimentScore: score,
    normalizedScore
  };
}

module.exports = {
  analyzeSentiment,
  evaluateRatingSentimentConsistency,
  tokenizeWords
};
