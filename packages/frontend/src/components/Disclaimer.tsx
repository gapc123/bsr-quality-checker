export default function Disclaimer() {
  return (
    <div style={{
      background: '#FDF6EE',
      borderBottom: '1px solid var(--gold)'
    }}>
      <div style={{
        maxWidth: '1800px',
        margin: '0 auto',
        padding: '12px 5%'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ flexShrink: 0 }}>
            <svg style={{ width: '20px', height: '20px', color: 'var(--gold)' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p style={{
            fontSize: '14px',
            color: 'var(--navy)',
            lineHeight: 1.5
          }}>
            <strong style={{ fontWeight: 600 }}>Not a compliance certificate:</strong>{' '}
            This tool assesses your submission against 55+ deterministic criteria and regulatory requirements using AI analysis.
            It identifies gaps and suggests improvements, but does NOT certify compliance — final approval is the sole responsibility of the{' '}
            <span style={{ fontWeight: 500 }}>Building Safety Regulator (BSR)</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
