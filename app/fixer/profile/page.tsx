'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { styles, gradients, colors, borderRadius } from '@/lib/theme';

interface Category {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
}

interface Neighborhood {
  id: string;
  name: string;
  city: string;
  state: string;
  country?: string;
}

export default function FixerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<{ categoryId: string; subcategoryIds: string[] }[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    yearsOfService: '',
    qualifications: '',
    primaryPhone: '',
    secondaryPhone: '',
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
    // Fetch categories, neighborhoods, and existing profile
    Promise.all([
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/neighborhoods').then(res => res.json()),
      fetch('/api/fixer/profile').then(res => res.ok ? res.json() : null),
    ]).then(([categoriesData, neighborhoodsData, profileData]) => {
      setCategories(categoriesData);
      setNeighborhoods(neighborhoodsData);

      // Populate form with existing profile data if it exists
      if (profileData && profileData.profile) {
        const profile = profileData.profile;

        // Set basic form data
        setFormData({
          name: profile.name || '',
          yearsOfService: profile.yearsOfService?.toString() || '',
          qualifications: profile.qualifications?.join('\n') || '',
          primaryPhone: profile.primaryPhone || '',
          secondaryPhone: profile.secondaryPhone || '',
        });

        // Set location data
        if (profile.services && profile.services.length > 0) {
          // Get first service's neighborhood to set country and state
          const firstNeighborhood = profile.services[0].neighborhoods[0];
          if (firstNeighborhood) {
            setSelectedCountry(firstNeighborhood.country || 'Nigeria');
            setSelectedState(firstNeighborhood.state);
          }

          // Set all selected neighborhoods
          const allNeighborhoods = profile.services.flatMap((s: any) =>
            s.neighborhoods.map((n: any) => n.id as string)
          );
          setSelectedNeighborhoods(Array.from(new Set(allNeighborhoods)) as string[]);

          // Set selected categories and subcategories
          const categoryMap = new Map<string, Set<string>>();
          profile.services.forEach((service: any) => {
            const categoryId = service.subcategory.categoryId;
            if (!categoryMap.has(categoryId)) {
              categoryMap.set(categoryId, new Set());
            }
            categoryMap.get(categoryId)!.add(service.subcategoryId);
          });

          const selectedCats = Array.from(categoryMap.entries()).map(([categoryId, subcategoryIds]) => ({
            categoryId,
            subcategoryIds: Array.from(subcategoryIds),
          }));

          setSelectedCategories(selectedCats);
        }
      }
    }).catch(err => {
      console.error('Failed to load data:', err);
      setError('Failed to load form data. Please refresh the page.');
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addService = () => {
    setSelectedCategories([...selectedCategories, { categoryId: '', subcategoryIds: [] }]);
  };

  const removeService = (index: number) => {
    setSelectedCategories(selectedCategories.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index: number, categoryId: string) => {
    setSelectedCategories(prev =>
      prev.map((cat, i) => (i === index ? { categoryId, subcategoryIds: [] } : cat))
    );
  };

  const handleSubcategoryChange = (index: number, subcategoryIds: string[]) => {
    setSelectedCategories(prev =>
      prev.map((cat, i) => (i === index ? { ...cat, subcategoryIds } : cat))
    );
  };

  const toggleNeighborhood = (neighborhoodId: string) => {
    setSelectedNeighborhoods(prev =>
      prev.includes(neighborhoodId)
        ? prev.filter(id => id !== neighborhoodId)
        : [...prev, neighborhoodId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.name || !formData.yearsOfService || !formData.primaryPhone) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (selectedNeighborhoods.length === 0) {
      setError('Please select at least one service neighborhood');
      setLoading(false);
      return;
    }

    if (selectedCategories.length === 0 || selectedCategories.every(c => c.subcategoryIds.length === 0)) {
      setError('Please select at least one service category and subcategory');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/fixer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          yearsOfService: parseInt(formData.yearsOfService),
          qualifications: formData.qualifications.split('\n').filter(q => q.trim()),
          selectedCategories: selectedCategories.filter(c => c.subcategoryIds.length > 0),
          neighborhoodIds: selectedNeighborhoods,
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
        window.location.href = '/fixer/pending';
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
              Your profile has been submitted for review. Redirecting...
            </p>
          </div>
        </div>
      )}

      <div style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '48px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <h1 style={{ ...styles.headerTitle, margin: 0 }}>
              Complete Your Profile
            </h1>
            <button
              type="button"
              onClick={() => router.push('/fixer/pending')}
              style={{ padding: '8px 16px', fontSize: '14px', color: colors.textSecondary, backgroundColor: 'transparent', border: '1px solid #E4E6EB', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              Skip for now
            </button>
          </div>
          <p style={{ fontSize: '15px', color: colors.textSecondary, marginBottom: '32px' }}>
            To be approved as a fixer, please provide the following information about your services and qualifications.
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

            {/* Years of Service */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                Years of Service <span style={{ color: colors.error }}>*</span>
              </label>
              <input
                type="number"
                name="yearsOfService"
                value={formData.yearsOfService}
                onChange={handleInputChange}
                min="0"
                required
                placeholder="How many years have you been providing services?"
                style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
              />
            </div>

            {/* Qualifications */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                Qualifications & Certifications <span style={{ fontSize: '13px', fontWeight: '400', color: colors.textSecondary }}>(one per line, optional)</span>
              </label>
              <textarea
                name="qualifications"
                value={formData.qualifications}
                onChange={handleInputChange}
                rows={4}
                placeholder="e.g.,&#10;Licensed Electrician&#10;OSHA Certified&#10;10+ years experience"
                style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            {/* Service Categories */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                Service Categories <span style={{ color: colors.error }}>*</span>
              </label>
              <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '12px' }}>
                Select the categories and specific services you provide
              </p>

              {selectedCategories.map((selected, index) => {
                const category = categories.find(c => c.id === selected.categoryId);
                return (
                  <div key={index} style={{ marginBottom: '16px', padding: '16px', border: '2px solid #E4E6EB', borderRadius: '12px', backgroundColor: colors.bgSecondary }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      {/* Category Dropdown */}
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.textPrimary, marginBottom: '6px' }}>
                          Category
                        </label>
                        <select
                          value={selected.categoryId}
                          onChange={(e) => handleCategoryChange(index, e.target.value)}
                          required
                          style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #E4E6EB', borderRadius: '8px', outline: 'none', cursor: 'pointer', backgroundColor: 'white' }}
                        >
                          <option value="">Select a category...</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Remove Button */}
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          style={{ padding: '10px 16px', fontSize: '14px', color: colors.error, backgroundColor: 'white', border: '1px solid #E4E6EB', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Subcategories Multi-Select */}
                    {category && category.subcategories.length > 0 && (
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.textPrimary, marginBottom: '6px' }}>
                          Specific Services
                        </label>
                        <div style={{ border: '1px solid #E4E6EB', borderRadius: '8px', padding: '12px', maxHeight: '200px', overflowY: 'auto', backgroundColor: 'white' }}>
                          {category.subcategories.map(subcat => (
                            <label key={subcat.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '8px' }}>
                              <input
                                type="checkbox"
                                checked={selected.subcategoryIds.includes(subcat.id)}
                                onChange={(e) => {
                                  const newIds = e.target.checked
                                    ? [...selected.subcategoryIds, subcat.id]
                                    : selected.subcategoryIds.filter(id => id !== subcat.id);
                                  handleSubcategoryChange(index, newIds);
                                }}
                                style={{ marginRight: '8px', width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '14px', color: colors.textPrimary }}>
                                {subcat.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Service Button */}
              <button
                type="button"
                onClick={addService}
                style={{ width: '100%', padding: '12px', fontSize: '14px', color: colors.primary, backgroundColor: 'transparent', border: '2px dashed #E4E6EB', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}
              >
                + Add Service Category
              </button>
            </div>

            {/* Service Neighborhoods */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                Service Areas <span style={{ color: colors.error }}>*</span>
              </label>
              <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '12px' }}>
                Select the neighborhoods where you provide services
              </p>

              {/* Country and State Filters */}
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
                    }}
                    style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '2px solid #E4E6EB', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="">All countries</option>
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
                    onChange={(e) => setSelectedState(e.target.value)}
                    disabled={!selectedCountry}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '14px',
                      border: '2px solid #E4E6EB',
                      borderRadius: '8px',
                      outline: 'none',
                      backgroundColor: !selectedCountry ? '#F9FAFB' : 'white',
                      cursor: !selectedCountry ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">All states</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Neighborhoods Multi-Select */}
              <div style={{ border: '2px solid #E4E6EB', borderRadius: '12px', padding: '16px', maxHeight: '300px', overflowY: 'auto', backgroundColor: colors.bgSecondary }}>
                {filteredNeighborhoods.length === 0 ? (
                  <p style={{ fontSize: '14px', color: colors.textSecondary, textAlign: 'center', padding: '20px' }}>
                    {selectedCountry || selectedState ? 'No neighborhoods found in this area' : 'Please select a country to view neighborhoods'}
                  </p>
                ) : (
                  filteredNeighborhoods.map(neighborhood => (
                    <label key={neighborhood.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '12px', padding: '10px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E4E6EB' }}>
                      <input
                        type="checkbox"
                        checked={selectedNeighborhoods.includes(neighborhood.id)}
                        onChange={() => toggleNeighborhood(neighborhood.id)}
                        style={{ marginRight: '12px', width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                          {neighborhood.name}
                        </div>
                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                          {neighborhood.city}, {neighborhood.state}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
              {selectedNeighborhoods.length > 0 && (
                <p style={{ fontSize: '13px', color: colors.primary, marginTop: '8px', fontWeight: '600' }}>
                  {selectedNeighborhoods.length} neighborhood{selectedNeighborhoods.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Phone Numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
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
              {loading ? 'Saving...' : 'Complete Profile & Submit for Approval'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
