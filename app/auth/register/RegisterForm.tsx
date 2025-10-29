'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { colors, borderRadius } from '@/lib/theme';

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roles: ['CLIENT'] as ('CLIENT' | 'FIXER')[],
    referralCode: referralCode || '', // Quick Wins - Capture referral code from URL
  });
  const [loading, setLoading] = useState(false);

  // Update referral code if URL param changes
  useEffect(() => {
    if (referralCode) {
      setFormData(prev => ({ ...prev, referralCode }));
    }
  }, [referralCode]);

  const toggleRole = (role: 'CLIENT' | 'FIXER') => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.roles.length === 0) {
      toast.error('Please select at least one role');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        roles: formData.roles,
      };

      // Quick Wins - Include referral code if present
      if (formData.referralCode) {
        payload.referralCode = formData.referralCode;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setFormData({ name: '', email: '', phone: '', roles: ['CLIENT'], referralCode: referralCode || '' });
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bgSecondary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: 'bold',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
              color: colors.primary,
              marginBottom: '8px',
              letterSpacing: '-0.5px'
            }}>
              fixers
            </h1>
          </Link>
          <p style={{ fontSize: '18px', color: colors.textSecondary }}>
            Create your account
          </p>

          {/* Quick Wins - Show referral code indicator */}
          {formData.referralCode && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: colors.primary + '10',
              border: `1px solid ${colors.primary}30`,
              borderRadius: borderRadius.md,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span style={{ fontSize: '14px', color: colors.primary, fontWeight: '500' }}>
                Referred by code: <strong>{formData.referralCode}</strong>
              </span>
            </div>
          )}
        </div>

        <div style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          padding: '40px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: '8px'
              }}>
                Full name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  fontSize: '16px',
                  outline: 'none'
                }}
                required
                disabled={loading}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.border}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: '8px'
              }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  fontSize: '16px',
                  outline: 'none'
                }}
                required
                disabled={loading}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.border}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: '8px'
              }}>
                Phone number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone number"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  fontSize: '16px',
                  outline: 'none'
                }}
                required
                disabled={loading}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = colors.border}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: '12px'
              }}>
                I want to: <span style={{ fontSize: '13px', fontWeight: '400', color: colors.textSecondary }}>(Select one or both)</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => toggleRole('CLIENT')}
                  style={{
                    padding: '20px 16px',
                    border: formData.roles.includes('CLIENT') ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    background: formData.roles.includes('CLIENT') ? colors.primaryLight : colors.white,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    textAlign: 'left'
                  }}
                  disabled={loading}
                >
                  <input
                    type="checkbox"
                    checked={formData.roles.includes('CLIENT')}
                    readOnly
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      accentColor: colors.primary,
                    }}
                  />
                  <div style={{ fontSize: '32px', flexShrink: 0 }}>🔍</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '16px',
                      color: formData.roles.includes('CLIENT') ? colors.primary : colors.textPrimary,
                      marginBottom: '4px'
                    }}>
                      Find Services
                    </div>
                    <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                      I need help with repairs and services
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => toggleRole('FIXER')}
                  style={{
                    padding: '20px 16px',
                    border: formData.roles.includes('FIXER') ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    background: formData.roles.includes('FIXER') ? colors.primaryLight : colors.white,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    textAlign: 'left'
                  }}
                  disabled={loading}
                >
                  <input
                    type="checkbox"
                    checked={formData.roles.includes('FIXER')}
                    readOnly
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      accentColor: colors.primary,
                    }}
                  />
                  <div style={{ fontSize: '32px', flexShrink: 0 }}>🔧</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '16px',
                      color: formData.roles.includes('FIXER') ? colors.primary : colors.textPrimary,
                      marginBottom: '4px'
                    }}>
                      Offer Services
                    </div>
                    <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                      I'm a service provider looking for clients
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {formData.roles.includes('FIXER') && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#FEF5E7',
                border: `1px solid ${colors.warning}`,
                borderRadius: borderRadius.md,
                marginBottom: '24px'
              }}>
                <p style={{ fontSize: '13px', color: '#95620D', margin: 0 }}>
                  <strong>Note:</strong> Service provider accounts require admin approval before you can start receiving requests.
                </p>
              </div>
            )}

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
              {loading ? 'Creating account...' : 'Continue'}
            </button>
          </form>

          <p style={{
            fontSize: '13px',
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: '16px',
            lineHeight: '1.5'
          }}>
            We'll send you a magic link to complete registration
          </p>

          <div style={{
            borderTop: `1px solid ${colors.border}`,
            margin: '32px 0'
          }}></div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '0' }}>
              Already have an account?{' '}
              <Link
                href="/auth/login"
                style={{
                  color: colors.primary,
                  fontWeight: '600',
                  textDecoration: 'none'
                }}
              >
                Sign in
              </Link>
            </p>
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
  );
}
