'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { colors, borderRadius } from '@/lib/theme';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    emailOrPhone: '',
    role: 'CLIENT' as 'CLIENT' | 'FIXER',
  });
  const [loading, setLoading] = useState(false);

  const isEmail = formData.emailOrPhone.includes('@');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        role: formData.role,
      };

      if (isEmail) {
        payload.email = formData.emailOrPhone;
      } else {
        payload.phone = formData.emailOrPhone;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setFormData({ name: '', emailOrPhone: '', role: 'CLIENT' });
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
        <div style={{ width: '100%', maxWidth: '560px' }}>
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
              Create your account
            </p>
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
                  Email or phone number
                </label>
                <input
                  type="text"
                  value={formData.emailOrPhone}
                  onChange={(e) => setFormData({ ...formData, emailOrPhone: e.target.value })}
                  placeholder="Enter your email or phone"
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
                  I want to:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'CLIENT' })}
                    style={{
                      padding: '20px 16px',
                      border: formData.role === 'CLIENT' ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                      borderRadius: borderRadius.md,
                      background: formData.role === 'CLIENT' ? colors.primaryLight : colors.white,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    disabled={loading}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '14px',
                      color: formData.role === 'CLIENT' ? colors.primary : colors.textPrimary
                    }}>
                      Find Services
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                      I need help
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'FIXER' })}
                    style={{
                      padding: '20px 16px',
                      border: formData.role === 'FIXER' ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                      borderRadius: borderRadius.md,
                      background: formData.role === 'FIXER' ? colors.primaryLight : colors.white,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    disabled={loading}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔧</div>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '14px',
                      color: formData.role === 'FIXER' ? colors.primary : colors.textPrimary
                    }}>
                      Offer Services
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                      I'm a provider
                    </div>
                  </button>
                </div>
              </div>

              {formData.role === 'FIXER' && (
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
    </>
  );
}
