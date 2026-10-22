"""
ReviewGuard AI - FastAPI Machine Learning Microservice
Exposes:
- /health: Service health and model status
- /predict: Complete forensic pipeline with supervised ML inference
- /models: Comparative metrics (Accuracy, Precision, Recall, F1, Confusion Matrix)
- /retrain: Retrain and compare models dynamically
"""

import os
import time
import json
import pickle
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from nlp_pipeline import analyze_review_features
from train import train_and_evaluate_models

app = FastAPI(
    title="ReviewGuard AI - ML Forensics Engine",
    description="Supervised Machine Learning Forensics Service for Fake Review Detection",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
vectorizer = None
trained_models = {}
metrics_data = {}
best_model_name = "Logistic Regression"

def load_artifacts():
    global vectorizer, trained_models, metrics_data, best_model_name
    vec_path = os.path.join(MODELS_DIR, "vectorizer.pkl")
    models_path = os.path.join(MODELS_DIR, "models.pkl")
    metrics_path = os.path.join(MODELS_DIR, "metrics.json")

    if not os.path.exists(vec_path) or not os.path.exists(models_path) or not os.path.exists(metrics_path):
        from train import train_and_evaluate_models
        metrics_data = train_and_evaluate_models()

    with open(vec_path, "rb") as f:
        vectorizer = pickle.load(f)

    with open(models_path, "rb") as f:
        trained_models = pickle.load(f)

    with open(metrics_path, "r") as f:
        metrics_data = json.load(f)

    best_model_name = metrics_data.get("best_model", "Naive Bayes")
    print(f"Loaded ML artifacts successfully. Active Best Model: {best_model_name}")

@app.on_event("startup")
def startup_event():
    load_artifacts()

class PredictRequest(BaseModel):
    product_name: str
    category: str
    reviewer_name: str
    rating: int = Field(ge=1, le=5)
    review_text: str
    selected_model: Optional[str] = None

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ReviewGuard AI ML Engine",
        "models_loaded": list(trained_models.keys()),
        "active_best_model": best_model_name,
        "dataset_samples": metrics_data.get("dataset_size", 0)
    }

@app.get("/models")
def get_model_metrics():
    """Returns real comparative metrics and confusion matrices for all models."""
    if not metrics_data:
        load_artifacts()
    return metrics_data

@app.post("/retrain")
def retrain_models():
    """Triggers ML model re-training and re-evaluation."""
    from train import train_and_evaluate_models
    results = train_and_evaluate_models()
    load_artifacts()
    return {
        "status": "success",
        "message": "Models successfully retrained and evaluated.",
        "results": results
    }

@app.post("/predict")
def predict_review(req: PredictRequest):
    t_start = time.time()
    
    # 1. NLP and Forensic Feature Analysis
    features = analyze_review_features(
        review_text=req.review_text,
        rating=req.rating,
        category=req.category,
        product_name=req.product_name
    )

    # 2. Check Content-Category Mismatch (Blocks if clearly unrelated)
    if features.get("is_category_mismatch", False):
        return {
            "success": False,
            "blocked": True,
            "error_type": "Content-Category Mismatch",
            "message": features.get("category_mismatch_reason", "Review text does not match the product domain."),
            "features": features
        }

    # 3. Model Selection
    model_name = req.selected_model if req.selected_model and req.selected_model in trained_models else best_model_name
    model = trained_models.get(model_name)
    if not model:
        raise HTTPException(status_code=500, detail=f"Model '{model_name}' not available.")

    # 4. Feature Extraction & ML Classification
    X_vec = vectorizer.transform([req.review_text])
    
    # Predict real probabilities
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(X_vec)[0]
        prob_genuine = float(probabilities[0])
        prob_fake = float(probabilities[1])
    else:
        # Calibrated decision function
        dec = model.decision_function(X_vec)[0]
        prob_fake = 1.0 / (1.0 + np.exp(-dec))
        prob_genuine = 1.0 - prob_fake

    # Prediction outcome
    is_fake = prob_fake >= 0.5
    prediction_label = "Fake" if is_fake else "Genuine"
    confidence_score = round(max(prob_fake, prob_genuine) * 100, 2)

    # 5. Risk Level Calculation
    if is_fake:
        if confidence_score >= 85 or features["promotional_language_score"] >= 60:
            risk_level = "High"
        elif confidence_score >= 65:
            risk_level = "High"
        else:
            risk_level = "Medium"
    else:
        if features["rating_sentiment_consistency"] is False or features["promotional_language_score"] > 30:
            risk_level = "Medium"
        else:
            risk_level = "Low"

    # 6. Extract Top TF-IDF Contributing N-Grams for Explainability
    feature_names = vectorizer.get_feature_names_out()
    nonzero_indices = X_vec.nonzero()[1]
    activated_terms = []
    for idx in nonzero_indices:
        tfidf_val = X_vec[0, idx]
        term = feature_names[idx]
        activated_terms.append({"term": term, "tfidf_weight": round(float(tfidf_val), 3)})
    # Sort by tfidf weight descending
    activated_terms = sorted(activated_terms, key=lambda x: x["tfidf_weight"], reverse=True)[:8]

    # 7. Generate Holistic Forensic Explanation
    explanation_parts = []
    if is_fake:
        explanation_parts.append(f"The supervised {model_name} model classified this review as Fake with {confidence_score}% statistical confidence.")
        if features["promotional_language_score"] > 25:
            explanation_parts.append("Elevated promotional and hyper-enthusiastic phrasing was detected.")
        if features["repeated_phrases_count"] > 0:
            explanation_parts.append("Repetitive structural phrasing patterns were observed.")
        if features["capitalization_ratio"] > 0.3:
            explanation_parts.append("Disproportionate uppercase lettering indicates artificial emphasis.")
        if not features["rating_sentiment_consistency"]:
            explanation_parts.append("There is an internal contradiction between the numerical rating and textual sentiment.")
        if features["product_specificity_score"] < 25:
            explanation_parts.append("Text relies on vague generic claims rather than concrete product attributes.")
    else:
        explanation_parts.append(f"The supervised {model_name} model classified this review as Genuine with {confidence_score}% confidence.")
        explanation_parts.append("Natural linguistic variety, balanced sentiment, and concrete contextual descriptions were present.")
        if not features["rating_sentiment_consistency"]:
            explanation_parts.append("Note: A subtle sentiment-rating divergence was noted, but core syntax remains natural.")

    explanation_parts.append("This diagnosis is produced by multi-parameter TF-IDF ML feature representation and behavioral forensics; no single keyword alone dictates the final classification.")
    full_explanation = " ".join(explanation_parts)

    duration_sec = round(time.time() - t_start, 3)

    return {
        "success": True,
        "blocked": False,
        "prediction": prediction_label,
        "is_fake": is_fake,
        "confidence": confidence_score,
        "probabilities": {
            "genuine": round(prob_genuine * 100, 2),
            "fake": round(prob_fake * 100, 2)
        },
        "risk_level": risk_level,
        "model_used": model_name,
        "is_best_model": model_name == best_model_name,
        "analysis_time_seconds": duration_sec,
        "review_quality_score": features["text_quality_score"],
        "explanation": full_explanation,
        "features": features,
        "activated_terms": activated_terms,
        "metadata": {
            "product_name": req.product_name,
            "category": req.category,
            "reviewer_name": req.reviewer_name,
            "rating": req.rating,
            "timestamp": time.time()
        }
    }
