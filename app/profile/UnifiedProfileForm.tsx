'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { styles, colors, borderRadius } from '@/lib/theme';
import { FormGrid } from '@/components/ResponsiveLayout';

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
    yearsOfService: existingData.yearsOfService || 0,
    qualifications: existingData.qualifications || [],
  });

  // Location state
  const [selectedCountry, setSelectedCountry] = useState(existingData.country || '');
  const [selectedState, setSelectedState] = useState(existingData.state || '');
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState('');

  // Service state (for FIXER role)
  const [selectedCategories, setSelectedCategories] = useState<{ categoryId: string; subcategoryIds: string[] }[]>([]);
  const [selectedServiceNeighborhoods, setSelectedServiceNeighborhoods] = useState<string[]>([]);

  // Find neighborhood ID from existing data
  useEffect(() => {
    if (existingData.neighbourhood && existingData.city && existingData.state) {
      const neighborhood = neighborhoods.find(
        (n) =>
          n.name === existingData.neighbourhood &&
          n.city === existingData.city &&
          n.state === existingData.state
      );
      if (neighborhood) {
        setSelectedNeighborhoodId(neighborhood.id);
      }
    }
  }, [existingData, neighborhoods]);

  const countries = Array.from(new Set(neighborhoods.map((n) => n.country || 'Nigeria')));
  const states = selectedCountry
    ? Array.from(
        new Set(
          neighborhoods.filter((n) => (n.country || 'Nigeria') === selectedCountry).map((n) => n.state)
        )
      ).sort()
    : [];

  const filteredNeighborhoods = neighborhoods.filter((n) => {
    const matchesCountry = !selectedCountry || (n.country || 'Nigeria') === selectedCountry;
    const matchesState = !selectedState || n.state === selectedState;
    return matchesCountry && matchesState;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQualificationToggle = (qual: string) => {
    const qualifications = formData.qualifications.includes(qual)
      ? formData.qualifications.filter((q) => q !== qual)
      : [...formData.qualifications, qual];
    setFormData({ ...formData, qualifications });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.name || !formData.primaryPhone || !selectedNeighborhoodId) {
      setError('Please fill in all required fields (Name, Primary Phone, Location)');
      setLoading(false);
      return;
    }

    // Additional validation for fixers
    if (hasFixerRole && (!formData.yearsOfService || formData.qualifications.length === 0)) {
      setError('Please provide Years of Service and at least one Qualification');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          neighbourhoodId: selectedNeighborhoodId,
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
        if (hasFixerRole && !hasFixerProfile) {
          // New fixer - redirect to services setup
          window.location.href = '/fixer/services';
        } else if (user.roles.length > 1) {
          // Dual-role users go to unified dashboard
          window.location.href = '/dashboard';
        } else if (hasClientRole) {
          window.location.href = '/client/dashboard';
        } else if (hasFixerRole) {
          window.location.href = '/fixer/dashboard';
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

              {/* Country and State */}
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
                    Country <span style={{ color: colors.error }}>*</span>
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => {
                      setSelectedCountry(e.target.value);
                      setSelectedState('');
                      setSelectedNeighborhoodId('');
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '2px solid #E4E6EB',
                      borderRadius: '12px',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
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
                    State <span style={{ color: colors.error }}>*</span>
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      setSelectedNeighborhoodId('');
                    }}
                    required
                    disabled={!selectedCountry}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '2px solid #E4E6EB',
                      borderRadius: '12px',
                      outline: 'none',
                      backgroundColor: !selectedCountry ? '#F9FAFB' : 'white',
                      cursor: !selectedCountry ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <option value="">Select state</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </FormGrid>

              {/* Neighbourhood */}
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
                  Neighbourhood <span style={{ color: colors.error }}>*</span>
                </label>
                <select
                  value={selectedNeighborhoodId}
                  onChange={(e) => setSelectedNeighborhoodId(e.target.value)}
                  required
                  disabled={!selectedState}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid #E4E6EB',
                    borderRadius: '12px',
                    outline: 'none',
                    backgroundColor: !selectedState ? '#F9FAFB' : 'white',
                    cursor: !selectedState ? 'not-allowed' : 'pointer',
                  }}
                >
                  <option value="">Select neighbourhood</option>
                  {filteredNeighborhoods.map((nb) => (
                    <option key={nb.id} value={nb.id}>
                      {nb.name}, {nb.city}
                    </option>
                  ))}
                </select>
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

            {/* SERVICE PROVIDER DETAILS SECTION (FIXER only) */}
            {hasFixerRole && (
              <div style={{ marginBottom: '40px' }}>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: colors.textPrimary,
                    marginBottom: '8px',
                    paddingBottom: '12px',
                    borderBottom: `2px solid ${colors.border}`,
                  }}
                >
                  Service Provider Details
                </h2>
                <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '20px' }}>
                  Required for offering services. Your application will be reviewed by our admin team.
                </p>

                {/* Years of Service */}
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
                    Years of Service Experience <span style={{ color: colors.error }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="yearsOfService"
                    value={formData.yearsOfService}
                    onChange={handleInputChange}
                    required={hasFixerRole}
                    min="0"
                    placeholder="e.g., 5"
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

                {/* Qualifications */}
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
                    Qualifications <span style={{ color: colors.error }}>*</span>
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {['Certified', 'Licensed', 'Insured', 'Trained', 'Experienced'].map((qual) => (
                      <label
                        key={qual}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px 16px',
                          border: `2px solid ${
                            formData.qualifications.includes(qual) ? colors.primary : '#E4E6EB'
                          }`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: formData.qualifications.includes(qual)
                            ? `${colors.primary}10`
                            : 'white',
                          transition: 'all 0.2s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.qualifications.includes(qual)}
                          onChange={() => handleQualificationToggle(qual)}
                          style={{ marginRight: '8px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                          {qual}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #F59E0B',
                    borderRadius: '12px',
                    padding: '16px',
                    marginTop: '20px',
                  }}
                >
                  <p style={{ fontSize: '14px', color: '#92400E', margin: 0 }}>
                    <strong>Note:</strong> You'll need to complete your service categories and service areas
                    after your profile is saved. This will be available in your dashboard.
                  </p>
                </div>
              </div>
            )}

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
