/**
 * ReviewGuard AI - Comprehensive 20-Rule Heuristic Detection Engine
 * 
 * Transparent, explainable, rule-based forensic analysis engine.
 * Evaluates all 20 specified heuristic indicators, implements anti-double-counting
 * correlation dampening, and produces a complete forensic report.
 */

const {
  DEFAULT_RULES,
  PROMOTIONAL_PHRASES,
  HOLLOW_SUPERLATIVES,
  CALL_TO_ACTION_PATTERNS,
  GENERIC_FLUFF_PHRASES,
  CATEGORY_TERMS,
  INCOMPATIBLE_INDICATORS,
  extractLexicalMetrics
} = require("./rules");

const { analyzeSentiment, evaluateRatingSentimentConsistency } = require("./sentimentAnalyzer");
const { normalizeText, computeTextHash, similarityEngine } = require("./textSimilarity");

const RULE_ENGINE_VERSION = "2.4.0";

class HeuristicEngine {
  constructor(customConfig = null) {
    this.rules = (customConfig && customConfig.rules) ? customConfig.rules : DEFAULT_RULES.map(r => ({ ...r, enabled: true, weight: r.defaultWeight }));
    this.bands = customConfig?.bands || {
      lowMax: 24,
      modMax: 49,
      highMax: 74
    };
  }

  /**
   * Main forensic analysis function
   * @param {Object} reviewData - { product_name, category, reviewer_name, reviewer_id, rating, headline, review_text, platform, review_date }
   * @param {Object} context - { storedReviews: [], reviewerHistory: [], batchReviews: [] }
   */
  async analyze(reviewData, context = {}) {
    const startTime = Date.now();
    const {
      product_name = "",
      product_id = "",
      category = "Other",
      reviewer_name = "Anonymous",
      reviewer_id = "",
      rating = 5,
      headline = "",
      review_text = "",
      platform = "Web",
      review_date = new Date().toISOString()
    } = reviewData;

    const trimmedText = review_text.trim();
    const trimmedHeadline = headline ? headline.trim() : "";
    const combinedFullText = [trimmedHeadline, trimmedText].filter(Boolean).join(". ");

    // 1. Lexical & Stylometric Extraction
    const lexical = extractLexicalMetrics(combinedFullText);
    const textHash = computeTextHash(trimmedText);

    // 2. Sentiment Analysis
    const sentiment = analyzeSentiment(trimmedHeadline, trimmedText);
    const ratingConsistency = evaluateRatingSentimentConsistency(rating, sentiment);

    // 3. Stored Corpus & Context Retrieval
    const storedReviews = context.storedReviews || [];
    const reviewerHistory = context.reviewerHistory || [];
    const batchReviews = context.batchReviews || [];
    const allExistingReviews = [...storedReviews, ...batchReviews];

    // Check duplicates against corpus
    const duplicateMatches = similarityEngine.compareQueryAgainstCorpus(trimmedText, allExistingReviews);
    const topMatch = duplicateMatches.length > 0 ? duplicateMatches[0] : null;

    // Track suspicious highlight tokens for forensic rendering
    const highlightedPhrases = [];

    // 4. Evaluate each of the 20 rules
    const triggeredRules = [];

    // Helper to test if a rule is active
    const getRule = (id) => this.rules.find(r => r.id === id && r.enabled !== false);

    // --- RULE 01: Rating-Sentiment Inconsistency ---
    const rule01 = getRule("RULE_01");
    if (rule01 && !ratingConsistency.isConsistent) {
      triggeredRules.push({
        id: rule01.id,
        name: rule01.name,
        group: rule01.group,
        baseWeight: rule01.weight || rule01.defaultWeight,
        severity: ratingConsistency.severity === "High" ? "High" : "Medium",
        evidence: `Star Rating: ${rating}★ vs Sentiment: ${sentiment.label} (Score: ${sentiment.score})`,
        explanation: ratingConsistency.explanation
      });
    }

    // --- RULE 02: Promotional and Spam Language ---
    const rule02 = getRule("RULE_02");
    if (rule02) {
      const lower = combinedFullText.toLowerCase();
      const matchedPromotional = PROMOTIONAL_PHRASES.filter(phrase => lower.includes(phrase));
      if (matchedPromotional.length > 0) {
        matchedPromotional.forEach(p => highlightedPhrases.push({ phrase: p, type: "promotional" }));
        triggeredRules.push({
          id: rule02.id,
          name: rule02.name,
          group: rule02.group,
          baseWeight: rule02.weight || rule02.defaultWeight,
          severity: matchedPromotional.length >= 2 ? "High" : "Medium",
          evidence: `Found ${matchedPromotional.length} promotional phrase(s): "${matchedPromotional.slice(0, 3).join('", "')}"`,
          explanation: "Commercial advertising terms and affiliate marketing buzzwords are common markers of paid fake reviews."
        });
      }
    }

    // --- RULE 03: Repeated Words and Phrases ---
    const rule03 = getRule("RULE_03");
    if (rule03) {
      if (lexical.consecutiveRepeats >= 2 || lexical.repeatedWords.length >= 2 || lexical.repeatedTrigrams.length >= 1) {
        const evidenceItems = [];
        if (lexical.consecutiveRepeats >= 2) evidenceItems.push(`${lexical.consecutiveRepeats} consecutive identical words`);
        if (lexical.repeatedWords.length >= 2) evidenceItems.push(`Frequent words: ${lexical.repeatedWords.map(([w, c]) => `"${w}" (${c}x)`).join(", ")}`);
        if (lexical.repeatedTrigrams.length >= 1) evidenceItems.push(`Repeated phrase: "${lexical.repeatedTrigrams[0][0]}" (${lexical.repeatedTrigrams[0][1]}x)`);

        lexical.repeatedWords.forEach(([w]) => highlightedPhrases.push({ phrase: w, type: "repetition" }));
        lexical.repeatedTrigrams.forEach(([t]) => highlightedPhrases.push({ phrase: t, type: "repetition" }));

        triggeredRules.push({
          id: rule03.id,
          name: rule03.name,
          group: rule03.group,
          baseWeight: rule03.weight || rule03.defaultWeight,
          severity: lexical.consecutiveRepeats >= 3 ? "High" : "Medium",
          evidence: evidenceItems.join("; "),
          explanation: "Artificial lexical repetition is typical of spam bots and low-effort keyword stuffing."
        });
      }
    }

    // --- RULE 04: Excessive Capitalisation ---
    const rule04 = getRule("RULE_04");
    if (rule04) {
      if (lexical.charCount >= 25 && lexical.uppercaseRatio >= 0.35) {
        triggeredRules.push({
          id: rule04.id,
          name: rule04.name,
          group: rule04.group,
          baseWeight: rule04.weight || rule04.defaultWeight,
          severity: lexical.uppercaseRatio >= 0.65 ? "High" : "Medium",
          evidence: `${Math.round(lexical.uppercaseRatio * 100)}% uppercase letters in review text`,
          explanation: "All-caps or shout-style capitalization is statistically correlated with hype astroturfing and promotional shouting."
        });
      }
    }

    // --- RULE 05: Excessive Punctuation ---
    const rule05 = getRule("RULE_05");
    if (rule05) {
      const hasChainedPunctuation = /([!?]){3,}/.test(combinedFullText);
      if (lexical.exclamationCount >= 4 || hasChainedPunctuation || lexical.punctuationRatio >= 0.12) {
        triggeredRules.push({
          id: rule05.id,
          name: rule05.name,
          group: rule05.group,
          baseWeight: rule05.weight || rule05.defaultWeight,
          severity: lexical.exclamationCount >= 6 ? "High" : "Medium",
          evidence: `${lexical.exclamationCount} exclamation mark(s); punctuation density: ${Math.round(lexical.punctuationRatio * 100)}%`,
          explanation: "Unusual density of dramatic punctuation chains (e.g. '!!!!!') is characteristic of manufactured emotional enthusiasm."
        });
      }
    }

    // --- RULE 06: Hollow Superlatives and Exaggerated Claims ---
    const rule06 = getRule("RULE_06");
    if (rule06) {
      const lower = combinedFullText.toLowerCase();
      const matchedHollow = HOLLOW_SUPERLATIVES.filter(h => lower.includes(h));
      if (matchedHollow.length > 0) {
        matchedHollow.forEach(h => highlightedPhrases.push({ phrase: h, type: "superlative" }));
        triggeredRules.push({
          id: rule06.id,
          name: rule06.name,
          group: rule06.group,
          baseWeight: rule06.weight || rule06.defaultWeight,
          severity: matchedHollow.length >= 2 ? "High" : "Medium",
          evidence: `Ungrounded superlative(s): "${matchedHollow.slice(0, 3).join('", "')}"`,
          explanation: "Grandiose claims devoid of verifiable product experiences frequently indicate compensated endorsement."
        });
      }
    }

    // --- RULE 07: Keyword Stuffing ---
    const rule07 = getRule("RULE_07");
    if (rule07 && product_name.trim().length >= 3) {
      const prodTokens = product_name.toLowerCase().split(/\s+/).filter(t => t.length > 3);
      const lower = combinedFullText.toLowerCase();
      let stuffedCount = 0;
      prodTokens.forEach(token => {
        const matches = (lower.match(new RegExp(`\\b${token}\\b`, "g")) || []).length;
        if (matches >= 3) stuffedCount += matches;
      });

      if (stuffedCount >= 4) {
        triggeredRules.push({
          id: rule07.id,
          name: rule07.name,
          group: rule07.group,
          baseWeight: rule07.weight || rule07.defaultWeight,
          severity: "Medium",
          evidence: `Product brand/model tokens repeated ${stuffedCount} times in short span`,
          explanation: "Artificially high repetition of product brand keywords indicates search engine manipulation rather than authentic user commentary."
        });
      }
    }

    // --- RULE 08: Generic or Low-Information Reviews ---
    const rule08 = getRule("RULE_08");
    if (rule08) {
      const lower = combinedFullText.toLowerCase();
      const isShort = lexical.wordCount <= 12;
      const matchedFluff = GENERIC_FLUFF_PHRASES.some(f => lower.includes(f));
      
      // Check if text lacks any category-specific domain terms
      const domainTerms = CATEGORY_TERMS[category] || [];
      const hasDomainTerm = domainTerms.some(t => lower.includes(t));

      if (isShort && (matchedFluff || (!hasDomainTerm && category !== "Other"))) {
        triggeredRules.push({
          id: rule08.id,
          name: rule08.name,
          group: rule08.group,
          baseWeight: rule08.weight || rule08.defaultWeight,
          severity: "Low",
          evidence: `Word count: ${lexical.wordCount} words; matches generic phrases without product-specific attributes`,
          explanation: "Low-information praise that can be copy-pasted to any arbitrary product carries weak authenticity credentials."
        });
      }
    }

    // --- RULE 09: Unusual Text Patterns ---
    const rule09 = getRule("RULE_09");
    if (rule09) {
      const consecutiveConsonants = /[bcdfghjklmnpqrstvwxyz]{6,}/i.test(trimmedText);
      const irregularSymbols = /([@#$%^&*~+=<>/\\|]){3,}/.test(trimmedText);
      const excessiveSpaces = /\s{4,}/.test(trimmedText);

      if (consecutiveConsonants || irregularSymbols || excessiveSpaces) {
        triggeredRules.push({
          id: rule09.id,
          name: rule09.name,
          group: rule09.group,
          baseWeight: rule09.weight || rule09.defaultWeight,
          severity: "Low",
          evidence: "Irregular symbol chains or abnormal whitespace detected",
          explanation: "Unusual typographical patterns suggest template interpolation bugs or automated string generators."
        });
      }
    }

    // --- RULE 10: Reviewer Behaviour Indicators ---
    const rule10 = getRule("RULE_10");
    if (rule10 && reviewerHistory.length >= 3) {
      // Check reviewer frequency and submission velocity
      const recentCount = reviewerHistory.length;
      const allFiveStars = reviewerHistory.every(r => r.rating === 5);
      const isHighVelocity = recentCount >= 5;

      if (isHighVelocity || allFiveStars) {
        triggeredRules.push({
          id: rule10.id,
          name: rule10.name,
          group: rule10.group,
          baseWeight: rule10.weight || rule10.defaultWeight,
          severity: isHighVelocity ? "High" : "Medium",
          evidence: `Reviewer history contains ${recentCount} recent reviews with ${allFiveStars ? '100% 5-star ratings' : 'high velocity'}`,
          explanation: "Abnormal submission velocity and uncalibrated perfect ratings are classic signals of paid professional reviewers."
        });
      }
    }

    // --- RULE 11: Product/Category Relevance Mismatch ---
    const rule11 = getRule("RULE_11");
    if (rule11 && category && category !== "Other") {
      const lower = combinedFullText.toLowerCase();
      const incompatibleRules = INCOMPATIBLE_INDICATORS[category] || [];
      let mismatchTriggered = false;
      let matchedTerm = "";

      for (const regex of incompatibleRules) {
        const match = lower.match(regex);
        if (match) {
          mismatchTriggered = true;
          matchedTerm = match[0];
          break;
        }
      }

      if (mismatchTriggered) {
        triggeredRules.push({
          id: rule11.id,
          name: rule11.name,
          group: rule11.group,
          baseWeight: rule11.weight || rule11.defaultWeight,
          severity: "High",
          evidence: `Term "${matchedTerm}" is functionally incompatible with category "${category}"`,
          explanation: "Review content discusses functional dimensions (e.g., taste, fabric, audio) that do not belong to this product class."
        });
      }
    }

    // --- RULE 12: Repeated Sentence Structures ---
    const rule12 = getRule("RULE_12");
    if (rule12) {
      const sentences = combinedFullText.split(/[.!?]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 5);
      if (sentences.length >= 3) {
        const starts = sentences.map(s => s.split(" ").slice(0, 2).join(" "));
        const startFreq = {};
        starts.forEach(st => { startFreq[st] = (startFreq[st] || 0) + 1; });
        const repetitiveStarts = Object.entries(startFreq).find(([_, count]) => count >= 3);

        if (repetitiveStarts) {
          triggeredRules.push({
            id: rule12.id,
            name: rule12.name,
            group: rule12.group,
            baseWeight: rule12.weight || rule12.defaultWeight,
            severity: "Medium",
            evidence: `Repeated structural sentence opener: "${repetitiveStarts[0]}..." used ${repetitiveStarts[1]} times`,
            explanation: "Repetitive syntactic sentence cadence indicates robotic template generation."
          });
        }
      }
    }

    // --- RULE 13: Excessive Calls to Action ---
    const rule13 = getRule("RULE_13");
    if (rule13) {
      const matchedCta = [];
      CALL_TO_ACTION_PATTERNS.forEach(pattern => {
        const match = combinedFullText.match(pattern);
        if (match) {
          matchedCta.push(match[0]);
          highlightedPhrases.push({ phrase: match[0], type: "call_to_action" });
        }
      });

      if (matchedCta.length >= 1) {
        triggeredRules.push({
          id: rule13.id,
          name: rule13.name,
          group: rule13.group,
          baseWeight: rule13.weight || rule13.defaultWeight,
          severity: matchedCta.length >= 2 ? "High" : "Medium",
          evidence: `Commercial call-to-action directive(s): "${matchedCta.join('", "')}"`,
          explanation: "Authentic customer reviews reflect personal experience; commercial imperatives ('buy now', 'don't hesitate') indicate astroturfed marketing."
        });
      }
    }

    // --- RULE 14: Unusual Review-Length Patterns ---
    const rule14 = getRule("RULE_14");
    if (rule14) {
      if (lexical.charCount < 20 || lexical.charCount > 2500) {
        triggeredRules.push({
          id: rule14.id,
          name: rule14.name,
          group: rule14.group,
          baseWeight: rule14.weight || rule14.defaultWeight,
          severity: "Low",
          evidence: `Unusual text length: ${lexical.charCount} characters (${lexical.wordCount} words)`,
          explanation: "Review length sits on extreme statistical tails compared to normative consumer feedback."
        });
      }
    }

    // --- RULE 15: Exact Duplicate Reviews ---
    const rule15 = getRule("RULE_15");
    if (rule15 && topMatch && topMatch.isExact) {
      const matchDoc = topMatch.document;
      triggeredRules.push({
        id: rule15.id,
        name: rule15.name,
        group: rule15.group,
        baseWeight: rule15.weight || rule15.defaultWeight,
        severity: "Critical",
        evidence: `Exact 100% duplicate of review [${matchDoc._id || 'Existing'}] for "${matchDoc.product_name || 'Product'}" by "${matchDoc.reviewer_name || 'Reviewer'}"`,
        explanation: "Verbatim identical text across multiple submissions indicates syndicated copy-pasting or automated duplication."
      });
    }

    // --- RULE 16: Near-Duplicate Reviews ---
    const rule16 = getRule("RULE_16");
    if (rule16 && topMatch && !topMatch.isExact && topMatch.isNearDuplicate) {
      const matchDoc = topMatch.document;
      triggeredRules.push({
        id: rule16.id,
        name: rule16.name,
        group: rule16.group,
        baseWeight: rule16.weight || rule16.defaultWeight,
        severity: "High",
        evidence: `${Math.round(topMatch.similarityScore * 100)}% TF-IDF & n-gram similarity with review [${matchDoc._id || 'Existing'}]`,
        explanation: "High textual similarity with superficial variations is indicative of spin-rewriting or review spinning tools."
      });
    }

    // --- RULE 17: Repeated Templates Across Products ---
    const rule17 = getRule("RULE_17");
    if (rule17 && reviewerHistory.length >= 1) {
      // Compare current text against reviewer's past reviews for different products
      let templateFound = false;
      let matchedOtherProduct = "";
      for (const past of reviewerHistory) {
        if (past.product_name && past.product_name !== product_name) {
          const sim = similarityEngine.compareQueryAgainstCorpus(trimmedText, [past]);
          if (sim.length > 0 && sim[0].similarityScore >= 0.70) {
            templateFound = true;
            matchedOtherProduct = past.product_name;
            break;
          }
        }
      }

      if (templateFound) {
        triggeredRules.push({
          id: rule17.id,
          name: rule17.name,
          group: rule17.group,
          baseWeight: rule17.weight || rule17.defaultWeight,
          severity: "High",
          evidence: `Reviewer reused near-identical template previously used for "${matchedOtherProduct}"`,
          explanation: "Posting the same boilerplate text across unrelated products is a hallmark of paid incentivized reviews."
        });
      }
    }

    // --- RULE 18: Unusual Reviewer Rating Distributions ---
    const rule18 = getRule("RULE_18");
    if (rule18 && reviewerHistory.length >= 4) {
      const ratings = reviewerHistory.map(r => r.rating || 5);
      const isAllExtreme = ratings.every(r => r === 5) || ratings.every(r => r === 1);
      if (isAllExtreme) {
        triggeredRules.push({
          id: rule18.id,
          name: rule18.name,
          group: rule18.group,
          baseWeight: rule18.weight || rule18.defaultWeight,
          severity: "Medium",
          evidence: `Reviewer historical rating standard deviation is 0.0 (${ratings.length} consecutive ${ratings[0]}★ reviews)`,
          explanation: "Organic consumers experience varied product quality; zero-variance extreme ratings point toward biased or paid activity."
        });
      }
    }

    // --- RULE 19: Bursts of Similar Reviews ---
    const rule19 = getRule("RULE_19");
    if (rule19 && storedReviews.length >= 3) {
      const sameProductReviews = storedReviews.filter(r => r.product_name === product_name);
      if (sameProductReviews.length >= 3) {
        const bursts = similarityEngine.detectReviewBursts([reviewData, ...sameProductReviews], 24, 3);
        if (bursts.length > 0) {
          triggeredRules.push({
            id: rule19.id,
            name: rule19.name,
            group: rule19.group,
            baseWeight: rule19.weight || rule19.defaultWeight,
            severity: "High",
            evidence: `Detected cluster burst of ${bursts[0].reviewCount} reviews for "${product_name}" within 24 hours`,
            explanation: "A sudden influx of positive reviews in a narrow timeframe strongly correlates with astroturfed marketing campaigns."
          });
        }
      }
    }

    // --- RULE 20: Cross-Reviewer High-Similarity Language ---
    const rule20 = getRule("RULE_20");
    if (rule20 && topMatch && topMatch.isNearDuplicate) {
      const matchDoc = topMatch.document;
      const otherReviewer = matchDoc.reviewer_name || matchDoc.reviewer_id;
      const currentReviewer = reviewer_name || reviewer_id;

      if (otherReviewer && currentReviewer && otherReviewer.toLowerCase() !== currentReviewer.toLowerCase()) {
        triggeredRules.push({
          id: rule20.id,
          name: rule20.name,
          group: rule20.group,
          baseWeight: rule20.weight || rule20.defaultWeight,
          severity: "High",
          evidence: `High similarity (${Math.round(topMatch.similarityScore * 100)}%) with review by distinct reviewer account "${otherReviewer}"`,
          explanation: "Multiple separate user accounts publishing nearly identical reviews points toward sockpuppet farms or coordinated syndication."
        });
      }
    }

    // 5. Anti-Double-Counting Weighted Scoring Calculation
    // Group triggered rules by category to apply correlation dampening
    const groupedTriggered = {};
    triggeredRules.forEach(tr => {
      if (!groupedTriggered[tr.group]) groupedTriggered[tr.group] = [];
      groupedTriggered[tr.group].push(tr);
    });

    let rawScore = 0;
    const ruleContributions = [];

    // Dampening multipliers for consecutive rules within the same thematic family:
    // 1st rule: 100% weight, 2nd: 60%, 3rd: 35%, 4th+: 20%
    const DAMPENING_FACTORS = [1.0, 0.60, 0.35, 0.20];

    Object.keys(groupedTriggered).forEach(groupName => {
      const rulesInGroup = groupedTriggered[groupName];
      // Sort descending by baseWeight
      rulesInGroup.sort((a, b) => b.baseWeight - a.baseWeight);

      rulesInGroup.forEach((r, idx) => {
        const factor = DAMPENING_FACTORS[Math.min(idx, DAMPENING_FACTORS.length - 1)];
        const effectiveContribution = Number((r.baseWeight * factor).toFixed(1));
        rawScore += effectiveContribution;

        ruleContributions.push({
          rule_id: r.id,
          name: r.name,
          group: r.group,
          severity: r.severity,
          base_weight: r.baseWeight,
          damping_factor: factor,
          effective_contribution: effectiveContribution,
          evidence: r.evidence,
          explanation: r.explanation
        });
      });
    });

    // Bound heuristic risk score between 0 and 100
    const riskScore = Math.min(100, Math.round(rawScore));

    // Determine Risk Band & Assessment according to documented thresholds
    let riskLevel = "Low";
    let assessment = "Appears Genuine";

    if (riskScore <= this.bands.lowMax) {
      riskLevel = "Low";
      assessment = "Appears Genuine";
    } else if (riskScore <= this.bands.modMax) {
      riskLevel = "Moderate";
      assessment = "Needs Review";
    } else if (riskScore <= this.bands.highMax) {
      riskLevel = "High";
      assessment = "Suspicious";
    } else {
      riskLevel = "Very High";
      assessment = "Strongly Suspicious";
    }

    const classificationLabel = `${riskLevel.toUpperCase()} RISK — ${assessment}`;

    let assessmentExplanation = "";
    if (riskScore === 0 && triggeredRules.length === 0) {
      assessmentExplanation = "No suspicious indicators were detected across empirical heuristic rules. The review exhibits organic language patterns, though heuristic evaluation cannot definitively prove authenticity.";
    } else if (riskScore <= this.bands.lowMax) {
      assessmentExplanation = "Low risk heuristic score. Content exhibits organic feedback patterns with minimal risk signals, appearing genuine under empirical rule tests.";
    } else if (riskScore <= this.bands.modMax) {
      assessmentExplanation = "Moderate risk signals or mild stylistic anomalies detected. Human verification is recommended.";
    } else if (riskScore <= this.bands.highMax) {
      assessmentExplanation = "Suspicious patterns detected across multiple forensic rules. Heightened probability of coordinated or inauthentic feedback.";
    } else {
      assessmentExplanation = "Strongly suspicious patterns detected across critical heuristic indicators. High likelihood of automated, incentivized, or syndicated astroturfing.";
    }

    const elapsedSeconds = Number(((Date.now() - startTime) / 1000).toFixed(2));

      // Build complete 20-rule forensic audit (both triggered and non-triggered rules)
      const triggeredMap = new Map();
      ruleContributions.forEach(rc => triggeredMap.set(rc.rule_id, rc));

      const allRulesAudit = this.rules.map(r => {
        const trig = triggeredMap.get(r.id);
        if (trig) {
          return {
            rule_id: r.id,
            name: r.name,
            group: r.group,
            severity: r.severity,
            base_weight: r.weight || r.defaultWeight,
            enabled: r.enabled !== false,
            triggered: true,
            effective_contribution: trig.effective_contribution,
            damping_factor: trig.damping_factor,
            evidence: trig.evidence,
            explanation: trig.explanation
          };
        } else {
          return {
            rule_id: r.id,
            name: r.name,
            group: r.group,
            severity: r.severity,
            base_weight: r.weight || r.defaultWeight,
            enabled: r.enabled !== false,
            triggered: false,
            effective_contribution: 0,
            damping_factor: 1.0,
            evidence: "No anomalous pattern observed; review characteristics meet baseline organic standards.",
            explanation: r.description || "Empirical heuristic test passed."
          };
        }
      });

      return {
      review_details: {
        product_name,
        product_id: product_id || "PROD-GEN",
        category,
        reviewer_name,
        reviewer_id: reviewer_id || "REV-USR",
        rating: Number(rating),
        headline: trimmedHeadline,
        review_text: trimmedText,
        platform,
        review_date
      },
      forensic_assessment: {
        risk_score: riskScore,
        risk_level: riskLevel,
        assessment,
        classification_label: classificationLabel,
        assessment_explanation: assessmentExplanation,
        rule_engine_version: RULE_ENGINE_VERSION,
        analysis_timestamp: new Date().toISOString(),
        analysis_duration_seconds: elapsedSeconds
      },
      sentiment_analysis: {
        label: sentiment.label,
        score: sentiment.score,
        normalized_score: sentiment.normalizedScore,
        positive_words: sentiment.positiveWords,
        negative_words: sentiment.negativeWords,
        rating_consistency: {
          is_consistent: ratingConsistency.isConsistent,
          mismatch: ratingConsistency.mismatch,
          severity: ratingConsistency.severity,
          explanation: ratingConsistency.explanation
        }
      },
      triggered_rules: ruleContributions,
      triggered_rules_count: ruleContributions.length,
      all_rules_audit: allRulesAudit,
      lexical_metrics: {
        word_count: lexical.wordCount,
        character_count: lexical.charCount,
        avg_word_length: lexical.avgWordLength,
        uppercase_ratio: lexical.uppercaseRatio,
        punctuation_ratio: lexical.punctuationRatio,
        exclamation_count: lexical.exclamationCount,
        question_count: lexical.questionCount,
        repeated_words: lexical.repeatedWords,
        repeated_trigrams: lexical.repeatedTrigrams
      },
      highlighted_phrases: highlightedPhrases,
      duplicate_forensics: {
        text_hash: textHash,
        is_exact_duplicate: topMatch ? topMatch.isExact : false,
        is_near_duplicate: topMatch ? topMatch.isNearDuplicate : false,
        highest_similarity_score: topMatch ? topMatch.similarityScore : 0,
        matched_review: topMatch ? {
          id: topMatch.document._id,
          product_name: topMatch.document.product_name,
          reviewer_name: topMatch.document.reviewer_name,
          rating: topMatch.document.rating,
          similarity: topMatch.similarityScore
        } : null
      },
      reviewer_forensics: {
        has_sufficient_history: reviewerHistory.length >= 2,
        history_count: reviewerHistory.length,
        avg_historical_rating: reviewerHistory.length > 0 
          ? Number((reviewerHistory.reduce((a, r) => a + (r.rating || 0), 0) / reviewerHistory.length).toFixed(1)) 
          : Number(rating),
        status_note: reviewerHistory.length >= 2 
          ? "Historical reviewer pattern integrated into forensic scoring." 
          : "Insufficient reviewer history on record; analysis evaluated on text forensics alone."
      },
      methodology_notes: {
        anti_double_counting_applied: true,
        disclaimer: "ReviewGuard AI uses an explainable, weighted heuristic risk assessment system. The risk score (0-100) measures heuristic suspicion based on documented indicators and is not a statistical or calibrated probability of fraud. A low score does not guarantee authenticity."
      }
    };
  }
}

const defaultEngine = new HeuristicEngine();

module.exports = {
  HeuristicEngine,
  defaultEngine,
  RULE_ENGINE_VERSION
};
