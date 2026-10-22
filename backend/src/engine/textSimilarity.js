/**
 * ReviewGuard AI - Text Similarity & Forensics Engine
 * Implements:
 * 1. Normalized MD5/SHA256 exact hash indexing
 * 2. TF-IDF Vectorization and Cosine Similarity (using natural + custom vectorizer)
 * 3. Jaccard 3-gram character and token similarity
 * 4. Cluster grouping (Connected Components / DBSCAN-like grouping)
 * 5. Temporal Burst Detection for campaign forensics
 * 6. Common phrase & template extraction
 */

const crypto = require("crypto");
const natural = require("natural");

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

/**
 * Normalizes text for similarity comparison (lowercasing, trimming extra whitespace, stripping non-alphanumeric)
 */
function normalizeText(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Creates SHA256 / MD5 hash of normalized text
 */
function computeTextHash(text) {
  const norm = normalizeText(text);
  return crypto.createHash("md5").update(norm).digest("hex");
}

/**
 * Extracts character n-grams (default 3-grams)
 */
function getNgrams(text, n = 3) {
  const norm = normalizeText(text);
  const ngrams = new Set();
  if (norm.length < n) {
    if (norm.length > 0) ngrams.add(norm);
    return ngrams;
  }
  for (let i = 0; i <= norm.length - n; i++) {
    ngrams.add(norm.substring(i, i + n));
  }
  return ngrams;
}

/**
 * Calculates Jaccard similarity between two n-gram sets
 */
function jaccardSimilarity(textA, textB, n = 3) {
  const setA = getNgrams(textA, n);
  const setB = getNgrams(textB, n);

  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }

  const unionCount = setA.size + setB.size - intersectionCount;
  return Number((intersectionCount / unionCount).toFixed(4));
}

/**
 * Token frequency map
 */
function getTermFrequencies(tokens) {
  const freq = {};
  for (const t of tokens) {
    freq[t] = (freq[t] || 0) + 1;
  }
  return freq;
}

/**
 * Computes TF-IDF vectors for an array of documents and computes Cosine Similarity
 */
class SimilarityEngine {
  constructor() {
    this.stopwords = new Set([
      "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
      "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but",
      "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from",
      "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him",
      "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just",
      "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once",
      "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "s", "same", "she",
      "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves",
      "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until",
      "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom",
      "why", "with", "you", "your", "yours", "yourself", "yourselves"
    ]);
  }

  tokenize(text) {
    if (!text) return [];
    return tokenizer.tokenize(text.toLowerCase())
      .filter(w => w.length > 2 && !this.stopwords.has(w));
  }

  /**
   * Vectorizes a set of documents using TF-IDF
   */
  vectorize(docs) {
    const tfidf = new TfIdf();
    docs.forEach(doc => {
      tfidf.addDocument(this.tokenize(doc));
    });

    // Collect all unique terms
    const allTerms = new Set();
    const docVectors = [];

    docs.forEach((_, idx) => {
      const vec = {};
      tfidf.listTerms(idx).forEach(item => {
        vec[item.term] = item.tfidf;
        allTerms.add(item.term);
      });
      docVectors.push(vec);
    });

    return { docVectors, allTerms: Array.from(allTerms) };
  }

  /**
   * Computes cosine similarity between two TF-IDF vectors
   */
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const term in vecA) {
      const valA = vecA[term];
      normA += valA * valA;
      if (vecB[term] !== undefined) {
        dotProduct += valA * vecB[term];
      }
    }

    for (const term in vecB) {
      const valB = vecB[term];
      normB += valB * valB;
    }

    if (normA === 0 || normB === 0) return 0;
    return Number((dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))).toFixed(4));
  }

  /**
   * Computes pairwise similarity between a query document and an array of target documents
   */
  compareQueryAgainstCorpus(queryText, corpusDocs) {
    if (!corpusDocs || corpusDocs.length === 0) return [];
    const allTexts = [queryText, ...corpusDocs.map(d => d.review_text || d.text || "")];
    const { docVectors } = this.vectorize(allTexts);
    const queryVec = docVectors[0];

    const results = [];
    for (let i = 1; i < docVectors.length; i++) {
      const targetDoc = corpusDocs[i - 1];
      const targetText = targetDoc.review_text || targetDoc.text || "";
      const cosine = this.cosineSimilarity(queryVec, docVectors[i]);
      const jaccard = jaccardSimilarity(queryText, targetText, 3);
      
      // Combined similarity measure: 60% TF-IDF Cosine, 40% 3-gram Jaccard
      const combined = Number((0.6 * cosine + 0.4 * jaccard).toFixed(4));
      const isExact = normalizeText(queryText) === normalizeText(targetText);

      results.push({
        document: targetDoc,
        cosineSimilarity: cosine,
        jaccardSimilarity: jaccard,
        similarityScore: isExact ? 1.0 : combined,
        isExact,
        isNearDuplicate: combined >= 0.70
      });
    }

    return results.sort((a, b) => b.similarityScore - a.similarityScore);
  }

  /**
   * Finds duplicate and near-duplicate clusters among a list of reviews
   */
  findClusters(reviews, threshold = 0.70) {
    if (!reviews || reviews.length < 2) return [];

    const texts = reviews.map(r => r.review_text || "");
    const { docVectors } = this.vectorize(texts);
    const n = reviews.length;

    // Build adjacency matrix
    const adj = Array.from({ length: n }, () => []);
    const pairwiseMatches = [];

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const textA = texts[i];
        const textB = texts[j];
        const isExact = normalizeText(textA) === normalizeText(textB);
        const cosine = this.cosineSimilarity(docVectors[i], docVectors[j]);
        const jaccard = jaccardSimilarity(textA, textB, 3);
        const similarity = isExact ? 1.0 : Number((0.6 * cosine + 0.4 * jaccard).toFixed(4));

        if (similarity >= threshold || isExact) {
          adj[i].push(j);
          adj[j].push(i);
          pairwiseMatches.push({
            sourceId: reviews[i]._id || `item_${i}`,
            targetId: reviews[j]._id || `item_${j}`,
            sourceReviewer: reviews[i].reviewer_name || reviews[i].reviewer_id,
            targetReviewer: reviews[j].reviewer_name || reviews[j].reviewer_id,
            similarity,
            isExact,
            sourceProduct: reviews[i].product_name,
            targetProduct: reviews[j].product_name
          });
        }
      }
    }

    // Connected components traversal for clusters
    const visited = new Set();
    const clusters = [];

    for (let i = 0; i < n; i++) {
      if (!visited.has(i) && adj[i].length > 0) {
        const clusterMembers = [];
        const queue = [i];
        visited.add(i);

        while (queue.length > 0) {
          const curr = queue.shift();
          clusterMembers.push(reviews[curr]);

          for (const neighbor of adj[curr]) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }

        if (clusterMembers.length > 1) {
          // Determine common template or snippets
          const commonWords = this.extractCommonKeywords(clusterMembers.map(m => m.review_text));
          clusters.push({
            clusterId: `cluster_${clusters.length + 1}`,
            size: clusterMembers.length,
            reviews: clusterMembers,
            commonKeywords: commonWords,
            isCrossProduct: new Set(clusterMembers.map(m => m.product_name)).size > 1,
            isCrossReviewer: new Set(clusterMembers.map(m => m.reviewer_name || m.reviewer_id)).size > 1,
            avgRating: Number((clusterMembers.reduce((acc, r) => acc + (r.rating || 0), 0) / clusterMembers.length).toFixed(1))
          });
        }
      }
    }

    return {
      clusters,
      pairwiseMatches,
      totalDuplicates: pairwiseMatches.length
    };
  }

  /**
   * Extracts keywords shared across multiple reviews in a cluster
   */
  extractCommonKeywords(texts) {
    if (!texts || texts.length === 0) return [];
    const wordCounts = {};
    const totalDocs = texts.length;

    texts.forEach(text => {
      const words = new Set(this.tokenize(text));
      words.forEach(w => {
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      });
    });

    return Object.entries(wordCounts)
      .filter(([_, count]) => count >= Math.max(2, Math.floor(totalDocs * 0.6)))
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word)
      .slice(0, 8);
  }

  /**
   * Detects unusual bursts of similar reviews within a given time window (e.g., 24-48 hours)
   */
  detectReviewBursts(reviews, windowHours = 24, minBurstCount = 3) {
    if (!reviews || reviews.length < minBurstCount) return [];

    // Filter reviews that have valid dates
    const withDates = reviews
      .filter(r => r.createdAt || r.review_date)
      .map(r => ({
        ...r,
        time: new Date(r.createdAt || r.review_date).getTime()
      }))
      .sort((a, b) => a.time - b.time);

    const bursts = [];
    const windowMs = windowHours * 60 * 60 * 1000;

    for (let i = 0; i < withDates.length; i++) {
      const windowReviews = [withDates[i]];
      for (let j = i + 1; j < withDates.length; j++) {
        if (withDates[j].time - withDates[i].time <= windowMs) {
          windowReviews.push(withDates[j]);
        } else {
          break;
        }
      }

      if (windowReviews.length >= minBurstCount) {
        // Check if there is high text similarity or same rating spike
        const clusterCheck = this.findClusters(windowReviews, 0.65);
        if (clusterCheck.clusters.length > 0 || windowReviews.filter(r => r.rating === 5).length >= minBurstCount) {
          bursts.push({
            startTime: new Date(withDates[i].time).toISOString(),
            endTime: new Date(windowReviews[windowReviews.length - 1].time).toISOString(),
            reviewCount: windowReviews.length,
            product: windowReviews[0].product_name,
            reviews: windowReviews.map(r => ({ id: r._id, reviewer: r.reviewer_name, rating: r.rating })),
            similarityClustersCount: clusterCheck.clusters.length
          });
          i += windowReviews.length - 1; // Skip ahead
        }
      }
    }

    return bursts;
  }
}

const similarityEngine = new SimilarityEngine();

module.exports = {
  normalizeText,
  computeTextHash,
  jaccardSimilarity,
  SimilarityEngine,
  similarityEngine
};
