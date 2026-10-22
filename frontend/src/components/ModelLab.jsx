import React, { useState, useEffect } from 'react';
import { Cpu, Award, RefreshCw, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';

export default function ModelLab({ onSelectModel, activeModel }) {
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [error, setError] = useState(null);

  const fetchModelMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/models');
      const json = await res.json();
      if (json.success) {
        setModelData(json.data);
      } else {
        setError(json.error || 'Failed to load model metrics');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelMetrics();
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/retrain', { method: 'POST' });
      await res.json();
      await fetchModelMetrics();
    } catch (e) {
      console.error(e);
    } finally {
      setRetraining(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', animation: 'spinSlow 1s linear infinite', color: 'var(--accent-blue)' }} />
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Loading Real ML Model Benchmarks...</div>
      </div>
    );
  }

  const models = modelData?.models || {};
  const bestModel = modelData?.best_model || 'Naive Bayes';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={24} color="var(--accent-cyan)" />
            Supervised Machine Learning Model Lab
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Empirical benchmarking of TF-IDF supervised classifiers on holdout test data.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="btn-secondary"
          style={{ gap: '8px', fontSize: '0.8rem' }}
        >
          <RefreshCw size={14} className={retraining ? 'animate-spin' : ''} />
          {retraining ? 'Retraining...' : 'Re-evaluate Models'}
        </button>
      </div>

      {/* Best Model Banner */}
      <div style={{
        padding: '16px 20px',
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Award size={22} color="var(--accent-green)" />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
              Automatically Selected Champion: <span style={{ color: 'var(--accent-green)' }}>{bestModel}</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Selected based on highest holdout F1-Score & Accuracy balance. Serving live predictions.
            </div>
          </div>
        </div>

        <span className="badge badge-genuine" style={{ padding: '6px 12px' }}>
          Active Engine
        </span>
      </div>

      {/* 3 Model Cards: Logistic Regression, Naive Bayes, SVM */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {Object.entries(models).map(([name, m]) => {
          const isBest = name === bestModel;
          const cm = m.confusion_matrix || { tn: 0, fp: 0, fn: 0, tp: 0 };

          return (
            <div
              key={name}
              className="glass-panel"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                borderColor: isBest ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)',
                position: 'relative'
              }}
            >
              {isBest && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Award size={11} />
                  Best Performing
                </div>
              )}

              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                  {name}
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  TF-IDF Unigrams + Bigrams Feature Matrix
                </span>
              </div>

              {/* 4 Real Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ backgroundColor: 'rgba(11, 19, 36, 0.7)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Accuracy</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                    {Math.round(m.accuracy * 1000) / 10}%
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(11, 19, 36, 0.7)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>F1-Score</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                    {Math.round(m.f1_score * 1000) / 10}%
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(11, 19, 36, 0.7)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Precision</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                    {Math.round(m.precision * 1000) / 10}%
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(11, 19, 36, 0.7)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Recall</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                    {Math.round(m.recall * 1000) / 10}%
                  </div>
                </div>
              </div>

              {/* Confusion Matrix Interactive Visualizer */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Empirical Confusion Matrix
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace'
                }}>
                  <div style={{
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>True Negative (TN)</div>
                    <div style={{ fontWeight: 800, color: '#34d399', fontSize: '1rem' }}>{cm.tn}</div>
                  </div>

                  <div style={{
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: cm.fp > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${cm.fp > 0 ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-color)'}`,
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>False Positive (FP)</div>
                    <div style={{ fontWeight: 800, color: cm.fp > 0 ? 'var(--accent-red)' : '#94a3b8', fontSize: '1rem' }}>{cm.fp}</div>
                  </div>

                  <div style={{
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: cm.fn > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${cm.fn > 0 ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)'}`,
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>False Negative (FN)</div>
                    <div style={{ fontWeight: 800, color: cm.fn > 0 ? 'var(--accent-amber)' : '#94a3b8', fontSize: '1rem' }}>{cm.fn}</div>
                  </div>

                  <div style={{
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>True Positive (TP)</div>
                    <div style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '1rem' }}>{cm.tp}</div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => onSelectModel && onSelectModel(name)}
                className={activeModel === name ? 'btn-primary' : 'btn-secondary'}
                style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}
              >
                {activeModel === name ? '✓ Active Classifier' : 'Select for Analysis'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
