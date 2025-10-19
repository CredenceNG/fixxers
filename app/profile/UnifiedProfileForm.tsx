'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { styles, colors, borderRadius } from '@/lib/theme';
import { FormGrid } from '@/components/ResponsiveLayout';
import LocationCascadeSelect from '@/components/LocationCascadeSelect';

interface Neighborhood {
  id: string;
  name: string;
  city: string;
  state: string;
  country?: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  subcategories: {
    id: string;
    name: string;
  }[];
}

interface UnifiedProfileFormProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    roles: string[];
  };
  existingData: any;
  neighborhoods: Neighborhood[];
  categories: ServiceCategory[];
  hasClientProfile: boolean;
  hasFixerProfile: boolean;
}

export default function UnifiedProfileForm({
  user,
  existingData,
  neighborhoods,
  categories,
  hasClientProfile,
  hasFixerProfile,
}: UnifiedProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const hasClientRole = user.roles.includes('CLIENT');
  const hasFixerRole = user.roles.includes('FIXER');

  // Form state
  const [formData, setFormData] = useState({
    name: existingData.name || '',
    primaryPhone: existingData.primaryPhone || '',
    secondaryPhone: existingData.secondaryPhone || '',
    alternateEmail: existingData.alternateEmail || '',
    streetAddress: existingData.streetAddress || '',
  });

  // Location state - use neighborhoodId from API response if available
  const [neighborhoodId, setNeighborhoodId] = useState(existingData.neighborhoodId || '');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.name || !formData.primaryPhone || !neighborhoodId) {
      setError('Please fill in all required fields (Name, Primary Phone, Location)');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          neighbourhoodId: neighborhoodId,
          roles: user.roles,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      setShowSuccess(true);

      // Redirect based on role
      setTimeout(() => {
        if (hasFixerRole) {
          // All fixers go to services setup to complete Step 2
          window.location.href = '/fixer/services';
        } else if (user.roles.length > 1) {
          // Dual-role users go to unified dashboard
          window.location.href = '/dashboard';
        } else if (hasClientRole) {
          window.location.href = '/client/dashboard';
        }
      }, 2000);
    } catch (err: any) {
      console.error('Profile save error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Success Modal */}
      {showSuccess && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '400px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: colors.textPrimary,
                marginBottom: '12px',
              }}
            >
              Profile Saved!
            </h2>
            <p style={{ fontSize: '16px', color: colors.textSecondary }}>
              Your profile has been updated successfully. Redirecting...
            </p>
          </div>
        </div>
      )}

      <div style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '48px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px',
            }}
          >
            <h1 style={{ ...styles.headerTitle, margin: 0 }}>Complete Your Profile</h1>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: colors.textSecondary,
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Skip
              </button>
              <button
                type="button"
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/';
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: '#DC2626',
                  backgroundColor: 'transparent',
                  border: '1px solid #DC2626',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Logout
              </button>
            </div>
          </div>

          <p style={{ fontSize: '15px', color: colors.textSecondary, marginBottom: '32px' }}>
            {hasFixerRole && hasClientRole
              ? 'Complete your profile for both client and service provider access.'
              : hasFixerRole
              ? 'Complete your profile to start offering services (requires admin approval).'
              : 'Complete your profile to start requesting services.'}
          </p>

          {error && (
            <div
              style={{
                backgroundColor: '#FEE2E2',
                border: '1px solid #EF4444',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
              }}
            >
              <p style={{ fontSize: '14px', color: '#991B1B', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* BASIC INFORMATION SECTION */}
            <div style={{ marginBottom: '40px' }}>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: colors.textPrimary,
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: `2px solid ${colors.border}`,
                }}
              >
                Basic Information
              </h2>

              {/* Full Name */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: colors.textPrimary,
                    marginBottom: '8px',
                  }}
                >
                  Full Name <span style={{ color: colors.error }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid #E4E6EB',
                    borderRadius: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Phone Numbers */}
              <FormGrid>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: colors.textPrimary,
                      marginBottom: '8px',
                    }}
                  >
                    Primary Phone <span style={{ color: colors.error }}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="primaryPhone"
                    value={formData.primaryPhone}
                    onChange={handleInputChange}
                    required
                    placeholder="+234 XXX XXX XXXX"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '2px solid #E4E6EB',
                      borderRadius: '12px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: colors.textPrimary,
                      marginBottom: '8px',
                    }}
                  >
                    Secondary Phone{' '}
                    <span style={{ fontSize: '13px', fontWeight: '400', color: colors.textSecondary }}>
                      (optional)
                    </span>
                  </label>
                  <input
                    type="tel"
                    name="secondaryPhone"
                    value={formData.secondaryPhone}
                    onChange={handleInputChange}
                    placeholder="+234 XXX XXX XXXX"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '2px solid #E4E6EB',
                      borderRadius: '12px',
                      outline: 'none',
                    }}
                  />
                </div>
              </FormGrid>

              {/* Alternate Email (CLIENT only) */}
              {hasClientRole && (
                <div style={{ marginBottom: '24px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: colors.textPrimary,
                      marginBottom: '8px',
                    }}
                  >
                    Alternate Email{' '}
                    <span style={{ fontSize: '13px', fontWeight: '400', color: colors.textSecondary }}>
                      (optional)
                    </span>
                  </label>
                  <input
                    type="email"
                    name="alternateEmail"
                    value={formData.alternateEmail}
                    onChange={handleInputChange}
                    placeholder="alternate@example.com"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '2px solid #E4E6EB',
                      borderRadius: '12px',
                      outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>

            {/* LOCATION SECTION */}
            <div style={{ marginBottom: '40px' }}>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: colors.textPrimary,
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: `2px solid ${colors.border}`,
                }}
              >
                Location
              </h2>

              {/* Location Cascade Select */}
              <div style={{ marginBottom: '24px' }}>
                <LocationCascadeSelect
                  value={neighborhoodId}
                  onChange={setNeighborhoodId}
                  required
                  label=""
                />
              </div>

              {/* Street Address */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: colors.textPrimary,
                    marginBottom: '8px',
                  }}
                >
                  Street Address{' '}
                  <span style={{ fontSize: '13px', fontWeight: '400', color: colors.textSecondary }}>
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleInputChange}
                  placeholder="Enter your street address"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid #E4E6EB',
                    borderRadius: '12px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.buttonPrimary,
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
