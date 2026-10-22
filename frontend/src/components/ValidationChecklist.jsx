import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ValidationChecklist({ checklist, errors, isBlocked }) {
  const items = [
    { key: 'product', label: 'Product Name', errorKey: 'product_name' },
    { key: 'category', label: 'Product Category', errorKey: 'category' },
    { key: 'reviewer', label: 'Reviewer Name', errorKey: 'reviewer_name' },
    { key: 'rating', label: 'Rating (1-5 Stars)', errorKey: 'rating' },
    { key: 'review_length', label: 'Review Length Bounds', errorKey: 'review_text' },
    { key: 'text_quality', label: 'Text Quality & Syntax', errorKey: 'review_text' },
    { key: 'product_relevance', label: 'Category Relevance', errorKey: 'category_mismatch' },
    { key: 'duplicate_check', label: 'Duplicate Check', errorKey: 'duplicate' },
  ];

  const totalChecks = items.length;
  const passedCount = items.filter(it => checklist?.[it.key]).length;

  return (
    <div style={{
      backgroundColor: 'rgba(11, 19, 36, 0.7)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '16px',
      marginTop: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            Pre-Flight Validation Center
          </span>
        </div>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: '999px',
          backgroundColor: passedCount === totalChecks ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
          color: passedCount === totalChecks ? '#34d399' : '#fbbf24'
        }}>
          {passedCount} / {totalChecks} Passed
        </span>
      </div>

      {/* Grid of 8 Checklist Items */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '8px'
      }}>
        {items.map((item) => {
          const isPassed = checklist ? checklist[item.key] : false;
          return (
            <div
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: isPassed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                border: `1px solid ${isPassed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
                fontSize: '0.78rem',
                fontWeight: 500,
                color: isPassed ? '#e2e8f0' : '#fda4af'
              }}
            >
              {isPassed ? (
                <CheckCircle2 size={16} color="var(--accent-green)" />
              ) : (
                <XCircle size={16} color="var(--accent-red)" />
              )}
              <span style={{ flex: 1 }}>{item.label}</span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: isPassed ? 'var(--accent-green)' : 'var(--accent-red)'
              }}>
                {isPassed ? '✓ Passed' : '✕ Failed'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Blocked Alert Banner if Any Critical Check Failed */}
      {isBlocked && (
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          borderRadius: '8px',
          backgroundColor: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}>
          <AlertTriangle size={18} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', color: '#fecdd3' }}>
            <span style={{ fontWeight: 700 }}>ML Analysis Blocked: </span>
            <span>One or more critical validation constraints failed. Correct the highlighted errors before running the classifier.</span>
          </div>
        </div>
      )}
    </div>
  );
}
