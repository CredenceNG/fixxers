'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('Invalid verification link');
      setIsVerifying(false);
      return;
    }

    // Call the verify API
    fetch(`/api/auth/verify?token=${token}`, {
      credentials: 'include', // Important: Include cookies in the request
      cache: 'no-store'
    })
      .then(async (res) => {
        const data = await res.json();
        console.log('[Verify Page] API Response:', { status: res.status, data });

        if (res.ok && data.success && data.redirectUrl) {
          console.log('[Verify Page] Success! Cookie should be set. Redirecting to:', data.redirectUrl);

          // Test if cookie was actually set
          fetch('/api/auth/test-cookie', { credentials: 'include' })
            .then(r => r.json())
            .then(cookieTest => {
              console.log('[Verify Page] Cookie test after API call:', cookieTest);

              // Force a hard redirect to ensure cookie is recognized
              window.location.replace(data.redirectUrl);
            });
        } else {
          console.error('[Verify Page] Verification failed:', data);
          setError(data.error || 'Verification failed');
          setIsVerifying(false);
        }
      })
      .catch((err) => {
        console.error('[Verify Page] Fetch error:', err);
        setError('Something went wrong. Please try again.');
        setIsVerifying(false);
      });
  }, [searchParams, router]);

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
        {isVerifying ? (
          <>
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
          </>
        ) : (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#FEE2E2',
              borderRadius: '50%',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              ❌
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#1C1E21' }}>
              Verification Failed
            </h2>
            <p style={{ fontSize: '15px', color: '#65676B', marginBottom: '24px' }}>
              {error}
            </p>
            <a
              href="/auth/login"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              Back to Login
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
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
            Loading...
          </h2>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
