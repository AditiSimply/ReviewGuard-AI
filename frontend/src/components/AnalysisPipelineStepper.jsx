import React from 'react';
import { Check, Loader2 } from 'lucide-react';

export default function AnalysisPipelineStepper({ currentStep }) {
  const steps = [
    { id: 1, name: 'Validation' },
    { id: 2, name: 'Preprocessing' },
    { id: 3, name: 'Feature Extraction' },
    { id: 4, name: 'Sentiment Analysis' },
    { id: 5, name: 'ML Classification' },
    { id: 6, name: 'Explainability' },
    { id: 7, name: 'Final Result' }
  ];

  return (
    <div style={{
      backgroundColor: 'rgba(15, 25, 45, 0.9)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      borderRadius: 'var(--radius-md)',
      padding: '16px 20px',
      margin: '16px 0',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Live Forensic Analysis Pipeline
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        {steps.map((step, idx) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isPending = currentStep < step.id;

          return (
            <React.Fragment key={step.id}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 2 }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  backgroundColor: isDone 
                    ? 'var(--accent-green)' 
                    : isCurrent 
                      ? 'var(--accent-blue)' 
                      : 'rgba(255, 255, 255, 0.05)',
                  border: isCurrent ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  color: '#fff',
                  boxShadow: isCurrent ? '0 0 15px rgba(6, 182, 212, 0.5)' : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  {isDone ? (
                    <Check size={16} strokeWidth={3} />
                  ) : isCurrent ? (
                    <Loader2 size={16} className="animate-spin" style={{ animation: 'spinSlow 1s linear infinite' }} />
                  ) : (
                    step.id
                  )}
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? 'var(--accent-cyan)' : isDone ? '#94a3b8' : 'var(--text-muted)',
                  textAlign: 'center',
                  maxWidth: '75px'
                }}>
                  {step.name}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: isDone ? 'var(--accent-green)' : 'rgba(255, 255, 255, 0.1)',
                  margin: '0 4px',
                  marginBottom: '22px',
                  transition: 'all 0.3s ease'
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
