import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Đang tải...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '220px',
        padding: '32px 16px',
        gap: '16px',
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3.5px solid var(--border-subtle)',
          borderTop: '3.5px solid var(--color-primary)',
          borderRadius: '50%',
          animation: 'sanctuarySpin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        }}
      />
      <span
        style={{
          color: 'var(--text-secondary)',
          fontSize: '14.5px',
          fontFamily: 'var(--sans)',
          fontWeight: 500,
          letterSpacing: '-0.01em',
        }}
      >
        {message}
      </span>
      <style>{`
        @keyframes sanctuarySpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
