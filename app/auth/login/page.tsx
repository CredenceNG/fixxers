'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { colors, borderRadius, typography } from '@/lib/theme';

export default function LoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const isEmail = emailOrPhone.includes('@');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEmail ? { email: emailOrPhone } : { phone: emailOrPhone }),
          redirect: redirect || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setEmailOrPhone('');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.bgSecondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <h1 style={{
                fontSize: '40px',
                fontWeight: '700',
                color: colors.textPrimary,
                marginBottom: '8px'
              }}>
                <span style={{ color: colors.primary }}>fixxers</span>
              </h1>
            </Link>
            <p style={{ fontSize: '18px', color: colors.textSecondary }}>
              Welcome back
            </p>
          </div>

          <div style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.lg,
            padding: '40px',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: colors.textPrimary, marginBottom: '24px' }}>
              Sign in to your account
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: '8px'
                }}>
                  Email or phone number
                </label>
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="Enter your email or phone"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  required
                  disabled={loading}
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = colors.border}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: colors.primary,
                  color: colors.white,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                {loading ? 'Sending magic link...' : 'Continue'}
              </button>
            </form>

            <p style={{
              fontSize: '13px',
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: '16px',
              lineHeight: '1.5'
            }}>
              We'll send you a magic link to sign in without a password
            </p>

            <div style={{
              borderTop: `1px solid ${colors.border}`,
              margin: '32px 0'
            }}></div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '16px' }}>
                Don't have an account?
              </p>
              <Link
                href="/auth/register"
                style={{
                  display: 'inline-block',
                  padding: '12px 32px',
                  color: colors.primary,
                  border: `1px solid ${colors.primary}`,
                  borderRadius: borderRadius.md,
                  fontWeight: '600',
                  fontSize: '16px',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s'
                }}
              >
                Create account
              </Link>
            </div>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Link
              href="/"
              style={{
                fontSize: '14px',
                color: colors.textSecondary,
                textDecoration: 'none'
              }}
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
