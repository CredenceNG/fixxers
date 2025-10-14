'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { colors, borderRadius } from '@/lib/theme';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    emailOrPhone: '',
    roles: ['CLIENT'] as ('CLIENT' | 'FIXER')[],
  });
  const [loading, setLoading] = useState(false);

  const isEmail = formData.emailOrPhone.includes('@');

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
        roles: formData.roles,
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
        setFormData({ name: '', emailOrPhone: '', roles: ['CLIENT'] });
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
                fontSize: '48px',
                fontWeight: '800',
                color: colors.textPrimary,
                marginBottom: '8px',
                letterSpacing: '-0.02em'
              }}>
                <span style={{ color: colors.primary }}>FIXI</span>
                <span style={{ color: colors.textPrimary }}>-NG</span>
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
    </>
  );
}
