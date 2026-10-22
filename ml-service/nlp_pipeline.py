"""
ReviewGuard AI - NLP Forensics & Feature Extraction Engine
Calculates real individual parameters:
- Review length, word count, character count
- Sentiment polarity & intensity
- Promotional language score
- Repeated words & phrases
- Excessive punctuation & capitalization
- Product specificity & domain relevance
- Rating-sentiment consistency
- Text quality & suspicious indicators
- Explanations & highlight spans
"""

import re
import math
from collections import Counter
from typing import Dict, Any, List, Tuple

# Domain vocabulary for Product-Category relevance verification
CATEGORY_VOCABULARIES = {
    "Electronics": {
        "keywords": {
            "battery", "charge", "charger", "screen", "display", "audio", "sound", "volume",
            "bluetooth", "wifi", "wireless", "usb", "port", "cable", "laptop", "phone",
            "headphones", "earbuds", "keyboard", "mouse", "monitor", "speaker", "processor",
            "camera", "gb", "storage", "ram", "power", "plug", "device", "specs", "speed",
            "firmware", "app", "connection", "pixels", "hz", "oled", "led", "smart", "tech"
        },
        "negative_signals": {"flavor", "taste", "delicious", "edible", "spicy", "chewy", "recipe", "baking", "wear", "fabric", "inseam", "shoe", "sole"}
    },
    "Footwear": {
        "keywords": {
            "shoe", "shoes", "sneaker", "sneakers", "boots", "heel", "sole", "traction",
            "arch", "support", "insole", "outsole", "cushion", "cushioning", "laces",
            "fit", "size", "sizing", "tight", "loose", "blister", "ankle", "toe", "run",
            "running", "walk", "walking", "tread", "foot", "feet", "wear", "leather"
        },
        "negative_signals": {"battery", "screen", "wifi", "firmware", "delicious", "tasting", "sugar", "recipe"}
    },
    "Grocery": {
        "keywords": {
            "taste", "tastes", "flavor", "flavors", "fresh", "expiration", "smell", "scent",
            "sweet", "salty", "sour", "bitter", "organic", "ingredient", "ingredients",
            "milk", "snack", "coffee", "tea", "cook", "cooking", "eat", "eating", "food",
            "delicious", "nutrition", "calories", "protein", "bottle", "package", "can"
        },
        "negative_signals": {"battery", "bluetooth", "firmware", "hdmi", "screen", "sole", "traction", "laces"}
    },
    "Beauty & Personal Care": {
        "keywords": {
            "skin", "skincare", "serum", "lotion", "moisturizer", "cream", "cleanser",
            "face", "hair", "dry", "oily", "acne", "wrinkles", "pores", "scent", "fragrance",
            "spf", "sunscreen", "lipstick", "makeup", "mascara", "pigment", "hydrating",
            "glow", "gentle", "irritation", "sensitive", "formula", "dermatologist"
        },
        "negative_signals": {"hdmi", "bluetooth", "router", "cpu", "sole", "tire", "engine", "snack", "chewy"}
    },
    "Home & Living": {
        "keywords": {
            "furniture", "desk", "chair", "table", "bed", "mattress", "pillow", "sheet",
            "blanket", "cushion", "wood", "metal", "sturdy", "room", "kitchen", "living",
            "assembly", "assemble", "screw", "curtain", "lamp", "light", "decor", "home",
            "durable", "storage", "shelf", "sofa", "rug", "vacuum", "clean"
        },
        "negative_signals": {"bluetooth", "wireless", "edible", "sugar", "lipstick", "skincare"}
    },
    "Sports & Fitness": {
        "keywords": {
            "workout", "exercise", "gym", "fitness", "training", "weights", "dumbbell",
            "mat", "yoga", "running", "jogging", "sweat", "grip", "rep", "muscle",
            "cardio", "hydration", "strap", "resistant", "durable", "athletic", "gear"
        },
        "negative_signals": {"recipe", "pastry", "makeup", "mascara", "hdmi", "sofa"}
    },
    "Fashion & Apparel": {
        "keywords": {
            "shirt", "t-shirt", "pants", "jeans", "jacket", "coat", "hoodie", "fabric",
            "cotton", "wool", "denim", "fit", "sizing", "stitch", "stitching", "color",
            "wash", "shrink", "sleeve", "zipper", "collar", "waist", "soft", "comfortable"
        },
        "negative_signals": {"battery", "charger", "tastes", "tasting", "edible", "recipe", "firmware"}
    }
}

# Positive and Negative Lexicons with sentiment weights
POSITIVE_WORDS = {
    "great": 1.0, "excellent": 1.4, "amazing": 1.5, "good": 0.8, "love": 1.2,
    "best": 1.3, "awesome": 1.2, "perfect": 1.5, "fantastic": 1.4, "recommend": 1.0,
    "superb": 1.4, "satisfied": 0.9, "happy": 0.9, "nice": 0.7, "solid": 0.8,
    "sturdy": 0.8, "smooth": 0.8, "flawless": 1.5, "outstanding": 1.5, "wonderful": 1.3
}

NEGATIVE_WORDS = {
    "bad": -1.0, "terrible": -1.5, "horrible": -1.6, "awful": -1.5, "worst": -1.7,
    "poor": -1.0, "waste": -1.5, "broken": -1.3, "useless": -1.4, "disappointed": -1.2,
    "disappointing": -1.1, "defect": -1.2, "defective": -1.3, "garbage": -1.6,
    "trash": -1.6, "cheap": -0.8, "fails": -1.2, "failed": -1.2, "scam": -1.8,
    "hate": -1.4, "refund": -1.2, "return": -0.8
}

PROMOTIONAL_PATTERNS = [
    r"\bbuy\s+now\b", r"\bbuy\s+immediately\b", r"\b100%\s+satisfaction\b",
    r"\bmust\s+buy\b", r"\bcheck\s+out\b", r"\bpromo\s+code\b", r"\bdiscount\s+code\b",
    r"\baffiliate\b", r"\bsponsored\b", r"\bfree\s+gift\b", r"\blifetime\s+warranty\b",
    r"\bmiracle\b", r"\blife\s+changing\b", r"\bbit\.ly\b", r"\blink\s+in\s+bio\b",
    r"\b10/10\b", r"\b5/5\b", r"\b500\s+stars\b", r"\b100\s+stars\b", r"\b1000%\b",
    r"\bholy\s+grail\b", r"\bdo\s+not\s+hesitate\b", r"\bbuy\s+this\s+now\b"
]

def analyze_review_features(
    review_text: str,
    rating: int = 5,
    category: str = "Electronics",
    product_name: str = ""
) -> Dict[str, Any]:
    """
    Computes all forensic review parameters comprehensively.
    """
    text = review_text.strip()
    char_count = len(text)
    words = re.findall(r"\b[A-Za-z0-9'-]+\b", text)
    word_count = len(words)
    lower_words = [w.lower() for w in words]

    # 1. Capitalization Ratio
    alpha_chars = [c for c in text if c.isalpha()]
    upper_chars = [c for c in text if c.isupper()]
    cap_ratio = round(len(upper_chars) / max(len(alpha_chars), 1), 3)

    # 2. Excessive Punctuation
    exclamations = text.count("!")
    questions = text.count("?")
    total_punct = len(re.findall(r"[!?,.:;\"'()\-—]", text))
    punct_ratio = round(total_punct / max(char_count, 1), 3)

    # 3. Repeated Words & Phrases
    word_counts = Counter(lower_words)
    repeated_words_count = sum(1 for w, c in word_counts.items() if c >= 3 and len(w) > 3)
    
    # 2-gram and 3-gram repeated phrases
    bigrams = [f"{lower_words[i]} {lower_words[i+1]}" for i in range(len(lower_words) - 1)]
    bigram_counts = Counter(bigrams)
    repeated_phrases = [bg for bg, cnt in bigram_counts.items() if cnt >= 2]
    repeated_phrases_count = len(repeated_phrases)

    # 4. Sentiment & Sentiment Intensity
    pos_score = 0.0
    neg_score = 0.0
    negation_active = False

    for i, w in enumerate(lower_words):
        if w in {"not", "no", "never", "hardly", "barely", "scarcely", "without"}:
            negation_active = True
            continue

        weight = 1.0
        # Check prior word for intensifiers
        if i > 0 and lower_words[i-1] in {"very", "extremely", "incredibly", "truly", "really", "so"}:
            weight = 1.5

        if w in POSITIVE_WORDS:
            val = POSITIVE_WORDS[w] * weight
            if negation_active:
                neg_score += val
            else:
                pos_score += val
            negation_active = False
        elif w in NEGATIVE_WORDS:
            val = abs(NEGATIVE_WORDS[w]) * weight
            if negation_active:
                pos_score += val
            else:
                neg_score += val
            negation_active = False
        else:
            # reset negation if more than 2 tokens away
            if negation_active and i > 2:
                negation_active = False

    total_sentiment_tokens = pos_score + neg_score
    if total_sentiment_tokens == 0:
        sentiment_polarity = 0.0
        sentiment_label = "Neutral"
        sentiment_intensity = 0.1
    else:
        sentiment_polarity = round((pos_score - neg_score) / (total_sentiment_tokens + 1.0), 3)
        sentiment_intensity = round(min(total_sentiment_tokens / max(word_count, 5), 1.0), 3)
        if sentiment_polarity > 0.15:
            sentiment_label = "Positive"
        elif sentiment_polarity < -0.15:
            sentiment_label = "Negative"
        else:
            sentiment_label = "Neutral"

    # 5. Promotional Language Detection
    promo_matches = []
    for pattern in PROMOTIONAL_PATTERNS:
        found = re.findall(pattern, text, re.IGNORECASE)
        if found:
            promo_matches.extend(found)
    promo_score = min(100, int(len(promo_matches) * 28 + (15 if "discount" in text.lower() or "deal" in text.lower() else 0)))

    # 6. Rating-Sentiment Consistency
    rating_sentiment_mismatch = False
    mismatch_description = "Rating aligns with review tone."

    if rating >= 4 and sentiment_polarity < -0.2:
        rating_sentiment_mismatch = True
        mismatch_description = f"Critical contradiction: High rating ({rating} stars) paired with strongly negative sentiment ({sentiment_label}, polarity {sentiment_polarity})."
    elif rating <= 2 and sentiment_polarity > 0.3:
        rating_sentiment_mismatch = True
        mismatch_description = f"Critical contradiction: Low rating ({rating} stars) paired with highly positive praise ({sentiment_label}, polarity {sentiment_polarity})."

    # 7. Product & Category Relevance
    cat_info = CATEGORY_VOCABULARIES.get(category, CATEGORY_VOCABULARIES["Electronics"])
    category_keywords = cat_info["keywords"]
    category_negatives = cat_info["negative_signals"]

    matching_keywords = [w for w in lower_words if w in category_keywords]
    negative_hits = [w for w in lower_words if w in category_negatives]

    relevance_ratio = round(len(matching_keywords) / max(math.sqrt(word_count), 2.0), 2)
    # Check for acute mismatch: review has multiple explicit off-topic signals and ZERO category keywords
    is_category_mismatch = False
    mismatch_reason = ""
    relevance_score = 50
    if len(negative_hits) >= 2 and len(matching_keywords) == 0:
        is_category_mismatch = True
        relevance_score = 0
        mismatch_reason = f"Content-Category Mismatch: Review discusses concepts ({', '.join(negative_hits[:3])}) that belong outside the '{category}' domain."
    elif len(matching_keywords) == 0 and word_count >= 12:
        # Check if generic or off-topic
        relevance_score = 45 # somewhat generic
    else:
        relevance_score = min(100, int(relevance_ratio * 35 + 50))

    # 8. Product Specificity
    # Measures whether concrete specifications/details are provided
    specific_patterns = [r"\d+\s*(hours|hrs|gb|tb|mm|cm|oz|lb|days|weeks|months|fps|hz|w|v|mah)", r"\bmodel\b", r"\bsize\b", r"\bcolor\b", r"\bport\b", r"\bcable\b", r"\bweight\b"]
    spec_matches = sum(len(re.findall(p, text, re.IGNORECASE)) for p in specific_patterns)
    specificity_score = min(100, int(spec_matches * 22 + min(word_count, 40) * 1.2))

    # 9. Text Quality Score (0-100)
    # Penalizes excessive caps, wild punctuation, spam words; rewards balanced vocabulary
    unique_ratio = len(set(lower_words)) / max(word_count, 1)
    quality_score = 100
    if cap_ratio > 0.4:
        quality_score -= int(cap_ratio * 40)
    if punct_ratio > 0.15:
        quality_score -= 25
    if exclamations >= 5:
        quality_score -= 20
    if repeated_words_count >= 2:
        quality_score -= 15
    if word_count < 8:
        quality_score -= 25
    quality_score = max(10, min(100, int(quality_score * (0.5 + 0.5 * unique_ratio))))

    # 10. Suspicious Indicators Collection
    suspicious_indicators = []
    if promo_score >= 40:
        suspicious_indicators.append({
            "title": "Excessive promotional language",
            "description": f"Detected promotional phrasing ({', '.join(promo_matches[:3])}).",
            "severity": "High"
        })
    if repeated_phrases_count >= 1:
        suspicious_indicators.append({
            "title": "Repeated repetitive phrases",
            "description": f"Contains repeated sequences: {', '.join(repeated_phrases[:2])}.",
            "severity": "High" if repeated_phrases_count >= 2 else "Medium"
        })
    if rating_sentiment_mismatch:
        suspicious_indicators.append({
            "title": "Rating-sentiment mismatch",
            "description": mismatch_description,
            "severity": "Medium"
        })
    if cap_ratio >= 0.35:
        suspicious_indicators.append({
            "title": "Abnormal capitalization ratio",
            "description": f"{int(cap_ratio * 100)}% of characters are uppercase, typical of aggressive astroturfing.",
            "severity": "Medium"
        })
    if exclamations >= 4:
        suspicious_indicators.append({
            "title": "Excessive punctuation hype",
            "description": f"Contains {exclamations} exclamation marks creating artificial urgency.",
            "severity": "Low"
        })
    if specificity_score <= 25 and word_count >= 8:
        suspicious_indicators.append({
            "title": "Low product specificity",
            "description": "Vague generic praise lacking mention of concrete features, dimensions, or usage details.",
            "severity": "Low"
        })

    # 11. Text Highlight Spans for Forensic UI
    highlight_spans = []
    for pattern in PROMOTIONAL_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            highlight_spans.append({
                "start": match.start(),
                "end": match.end(),
                "type": "promotional",
                "label": "Promotional Phrase"
            })
    # Exclamation clusters
    for match in re.finditer(r"!{2,}|\?{2,}", text):
        highlight_spans.append({
            "start": match.start(),
            "end": match.end(),
            "type": "punctuation",
            "label": "Excessive Punctuation"
        })
    # Uppercase words of 4+ characters
    for match in re.finditer(r"\b[A-Z]{4,}\b", text):
        highlight_spans.append({
            "start": match.start(),
            "end": match.end(),
            "type": "capitalization",
            "label": "All Caps Token"
        })

    return {
        "review_length": char_count,
        "word_count": word_count,
        "character_count": char_count,
        "sentiment": sentiment_label,
        "sentiment_intensity": sentiment_intensity,
        "sentiment_polarity": sentiment_polarity,
        "promotional_language_score": promo_score,
        "promotional_phrases": promo_matches,
        "repeated_words_count": repeated_words_count,
        "repeated_phrases_count": repeated_phrases_count,
        "repeated_phrases": repeated_phrases,
        "excessive_punctuation_ratio": punct_ratio,
        "exclamation_count": exclamations,
        "capitalization_ratio": cap_ratio,
        "product_specificity_score": specificity_score,
        "product_relevance_score": relevance_score,
        "is_category_mismatch": is_category_mismatch,
        "category_mismatch_reason": mismatch_reason,
        "rating_sentiment_consistency": not rating_sentiment_mismatch,
        "rating_sentiment_details": mismatch_description,
        "text_quality_score": quality_score,
        "suspicious_indicators": suspicious_indicators,
        "highlight_spans": highlight_spans
    }
