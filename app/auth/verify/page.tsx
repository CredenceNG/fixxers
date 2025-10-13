'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const hasRedirected = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (token && !hasRedirected.current) {
      hasRedirected.current = true;
      // Redirect to API route which will handle verification and redirect
      window.location.href = `/api/auth/verify?token=${token}`;
    }
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '48px',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #E4E6EB',
          borderTopColor: '#667eea',
          borderRadius: '50%',
          margin: '0 auto 24px',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#1C1E21' }}>
          Verifying...
        </h2>
        <p style={{ fontSize: '15px', color: '#65676B' }}>
          Please wait while we verify your account
        </p>
      </div>
    </div>
  );
}
