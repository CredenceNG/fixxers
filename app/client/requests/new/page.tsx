'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { styles, gradients, colors } from '@/lib/theme';

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
}

interface Neighborhood {
  id: string;
  name: string;
  city: string;
  state: string;
  country?: string;
}

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const [formData, setFormData] = useState({
    subcategoryId: '',
    neighborhoodId: '',
    title: '',
    description: '',
    address: '',
    urgency: 'flexible',
    preferredDate: '',
    budget: '',
  });

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');

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
    // Fetch categories and neighborhoods
    Promise.all([
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/neighborhoods').then(res => res.json()),
    ]).then(([categoriesData, neighborhoodsData]) => {
      setCategories(categoriesData);
      setNeighborhoods(neighborhoodsData);
    }).catch(err => {
      console.error('Failed to load data:', err);
      setError('Failed to load form data. Please refresh the page.');
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryId(e.target.value);
    setFormData({ ...formData, subcategoryId: '' }); // Reset subcategory when category changes
  };

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.subcategoryId || !formData.neighborhoodId || !formData.title || !formData.description) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/client/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create request');
      }

      console.log('Request created successfully:', data);

      // Redirect to dashboard or request details page
      router.push(`/client/requests/${data.id}`);
    } catch (err: any) {
      console.error('Request creation error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '48px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <h1 style={{ ...styles.headerTitle, margin: 0 }}>
              New Service Request
            </h1>
            <button
              type="button"
              onClick={() => router.push('/client/dashboard')}
              style={{ padding: '8px 16px', fontSize: '14px', color: colors.textSecondary, backgroundColor: 'transparent', border: '1px solid #E4E6EB', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              Cancel
            </button>
          </div>
          <p style={{ fontSize: '15px', color: colors.textSecondary, marginBottom: '32px' }}>
            Describe the service you need and we'll connect you with qualified fixers in your area.
          </p>

          {error && (
            <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#991B1B', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Service Category */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                Service Category <span style={{ color: colors.error }}>*</span>
              </label>
              <select
                value={selectedCategoryId}
                onChange={handleCategoryChange}
                required
                style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Service Subcategory */}
            {selectedCategory && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  Specific Service <span style={{ color: colors.error }}>*</span>
                </label>
                <select
                  name="subcategoryId"
                  value={formData.subcategoryId}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
                >
                  <option value="">Select a specific service</option>
                  {selectedCategory.subcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Title */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                Request Title <span style={{ color: colors.error }}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g., Fix leaking kitchen faucet"
                style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                Description of Work Required <span style={{ color: colors.error }}>*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={5}
                placeholder="Describe the work you need done in detail..."
                style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            {/* Location Fields */}
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
                      setFormData({ ...formData, neighborhoodId: '' });
                    }}
                    required
                    style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
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
                      setFormData({ ...formData, neighborhoodId: '' });
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

              {/* Neighbourhood and Address Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.textSecondary, marginBottom: '6px' }}>
                    Neighbourhood
                  </label>
                  <select
                    name="neighborhoodId"
                    value={formData.neighborhoodId}
                    onChange={handleInputChange}
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
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.textSecondary, marginBottom: '6px' }}>
                    Street Address (optional)
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                    style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Urgency and Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  When do you need this service? <span style={{ color: colors.error }}>*</span>
                </label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
                >
                  <option value="immediate">Immediate (within 24 hours)</option>
                  <option value="within_week">Within a week</option>
                  <option value="flexible">Flexible timing</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  Preferred Date <span style={{ fontSize: '13px', fontWeight: '400', color: colors.textSecondary }}>(optional)</span>
                </label>
                <input
                  type="date"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
                />
              </div>
            </div>

            {/* Budget */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                Budget <span style={{ fontSize: '13px', fontWeight: '400', color: colors.textSecondary }}>(optional, if available)</span>
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                placeholder="Enter your budget in NGN"
                min="0"
                step="100"
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
              {loading ? 'Creating Request...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
