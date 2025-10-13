'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { styles, gradients, colors, borderRadius } from '@/lib/theme';

interface Neighborhood {
  id: string;
  name: string;
  city: string;
  state: string;
  country?: string;
}

export default function ClientProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    primaryPhone: '',
    secondaryPhone: '',
    alternateEmail: '',
  });

  // Get unique countries and states from neighborhoods
  const countries = Array.from(new Set(neighborhoods.map(n => n.country || 'Nigeria')));
  const states = selectedCountry
    ? Array.from(new Set(neighborhoods.filter(n => (n.country || 'Nigeria') === selectedCountry).map(n => n.state))).sort()
    : [];

  // Filter neighborhoods based on country and state
  const filteredNeighborhoods = neighborhoods.filter(n => {
    const matchesCountry = !selectedCountry || (n.country || 'Nigeria') === selectedCountry;
    const matchesState = !selectedState || n.state === selectedState;
    return matchesCountry && matchesState;
  });

  useEffect(() => {
    // Fetch neighborhoods and existing profile data
    Promise.all([
      fetch('/api/neighborhoods').then(async res => {
        if (!res.ok) throw new Error('Failed to fetch neighborhoods');
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response format from neighborhoods API');
        }
        return res.json();
      }),
      fetch('/api/client/profile').then(async res => {
        if (!res.ok) return null; // Profile might not exist yet
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return null;
        }
        return res.json();
      }),
    ]).then(([neighborhoodsData, profileData]) => {
      console.log('[Client Profile] Neighborhoods loaded:', neighborhoodsData?.length || 0);
      if (!neighborhoodsData || neighborhoodsData.length === 0) {
        console.warn('[Client Profile] No neighborhoods found in database');
        setError('No neighborhoods available. Please contact support.');
      }
      setNeighborhoods(neighborhoodsData || []);

      // Populate form with existing profile data if it exists
      if (profileData) {
        setFormData({
          name: profileData.name || '',
          primaryPhone: profileData.primaryPhone || '',
          secondaryPhone: profileData.secondaryPhone || '',
          alternateEmail: profileData.alternateEmail || '',
        });

        // Set location data
        if (profileData.neighbourhoodId) {
          setSelectedNeighborhoodId(profileData.neighbourhoodId);

          // Find the neighborhood to set country and state
          const neighborhood = neighborhoodsData.find((n: Neighborhood) => n.id === profileData.neighbourhoodId);
          if (neighborhood) {
            setSelectedCountry(neighborhood.country || 'Nigeria');
            setSelectedState(neighborhood.state);
          }
        } else if (profileData.country && profileData.state) {
          // Legacy data - set country and state
          setSelectedCountry(profileData.country);
          setSelectedState(profileData.state);
        }
      }
    }).catch(err => {
      console.error('Failed to load data:', err);
      setError('Failed to load form data. Please refresh the page.');
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.name || !formData.primaryPhone || !selectedNeighborhoodId) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/client/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          neighbourhoodId: selectedNeighborhoodId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      console.log('Profile saved successfully:', data);

      // Show success modal
      setShowSuccess(true);

      // Redirect after showing success
      setTimeout(() => {
        window.location.href = '/client/dashboard';
      }, 2000);
    } catch (err: any) {
      console.error('Profile save error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
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
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.textPrimary, marginBottom: '12px' }}>
              Profile Saved!
            </h2>
            <p style={{ fontSize: '16px', color: colors.textSecondary }}>
              Your profile has been updated successfully. Redirecting...
            </p>
          </div>
        </div>
      )}

      <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '48px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <h1 style={{ ...styles.headerTitle, margin: 0 }}>
              Complete Your Profile
            </h1>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => router.push('/client/dashboard')}
                style={{ padding: '8px 16px', fontSize: '14px', color: colors.textSecondary, backgroundColor: 'transparent', border: '1px solid #E4E6EB', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/';
                }}
                style={{ padding: '8px 16px', fontSize: '14px', color: '#DC2626', backgroundColor: 'transparent', border: '1px solid #DC2626', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                Logout
              </button>
            </div>
          </div>
          <p style={{ fontSize: '15px', color: colors.textSecondary, marginBottom: '32px' }}>
            To create service requests, please provide the following information.
          </p>

          {error && (
            <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#991B1B', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                Full Name <span style={{ color: colors.error }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
                style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
              />
            </div>

            {/* Location Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
                Location <span style={{ color: colors.error }}>*</span>
              </label>

              {/* Country and State Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.textSecondary, marginBottom: '6px' }}>
                    Country
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => {
                      setSelectedCountry(e.target.value);
                      setSelectedState('');
                      setSelectedNeighborhoodId('');
                    }}
                    required
                    style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="">Select country</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.textSecondary, marginBottom: '6px' }}>
                    State
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
                      cursor: !selectedCountry ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">Select state</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Neighbourhood */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.textSecondary, marginBottom: '6px' }}>
                  Neighbourhood
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
                    cursor: !selectedState ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">Select neighbourhood</option>
                  {filteredNeighborhoods.map(nb => (
                    <option key={nb.id} value={nb.id}>
                      {nb.name}, {nb.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Phone Numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  Primary Phone <span style={{ color: colors.error }}>*</span>
                </label>
                <input
                  type="tel"
                  name="primaryPhone"
                  value={formData.primaryPhone}
                  onChange={handleInputChange}
                  required
                  placeholder="+234 XXX XXX XXXX"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  Secondary Phone <span style={{ fontSize: '13px', fontWeight: '400', color: colors.textSecondary }}>(optional)</span>
                </label>
                <input
                  type="tel"
                  name="secondaryPhone"
                  value={formData.secondaryPhone}
                  onChange={handleInputChange}
                  placeholder="+234 XXX XXX XXXX"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
                />
              </div>
            </div>

            {/* Alternate Email */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                Alternate Email <span style={{ fontSize: '13px', fontWeight: '400', color: colors.textSecondary }}>(optional)</span>
              </label>
              <input
                type="email"
                name="alternateEmail"
                value={formData.alternateEmail}
                onChange={handleInputChange}
                placeholder="alternate@example.com"
                style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
              />
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
    </div>
  );
}
