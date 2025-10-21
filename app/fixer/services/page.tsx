'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { styles, colors } from '@/lib/theme';
import MobileHeader from '@/components/MobileHeader';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
}

interface ServiceForm {
  id: string; // unique ID for React key
  categoryId: string;
  categoryName: string;
  subcategoryIds: string[]; // Multiple subcategories
  subcategoryNames: string[]; // Multiple subcategory names
  yearsExperience: number;
  description: string; // Why should clients hire you
  qualifications: string[]; // Array of selected qualifications
  referencePhone: string; // Optional
  isExisting?: boolean; // Track if this is an existing service
  isEditing?: boolean; // Track if this service is in edit mode
}

export default function FixerServicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [hasExistingServices, setHasExistingServices] = useState(false);

  // Service forms state - dynamic form approach
  const [serviceForms, setServiceForms] = useState<ServiceForm[]>([
    {
      id: crypto.randomUUID(),
      categoryId: '',
      categoryName: '',
      subcategoryIds: [],
      subcategoryNames: [],
      yearsExperience: 0,
      description: '',
      qualifications: [],
      referencePhone: '',
      isExisting: false,
      isEditing: true, // New fixers start in edit mode
    },
  ]);
  const [profileNeighborhoodId, setProfileNeighborhoodId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Service area selection state
  const [countryId, setCountryId] = useState('');
  const [stateId, setStateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [selectedNeighborhoodIds, setSelectedNeighborhoodIds] = useState<string[]>([]);

  // Fetch location data
  const { data: countriesData } = useSWR('/api/locations/countries', fetcher);
  const { data: statesData } = useSWR(
    countryId ? `/api/locations/states?countryId=${countryId}` : null,
    fetcher
  );
  const { data: citiesData } = useSWR(
    stateId ? `/api/locations/cities?stateId=${stateId}` : null,
    fetcher
  );
  const { data: neighborhoodsData } = useSWR(
    cityId ? `/api/neighborhoods?cityId=${cityId}` : null,
    fetcher
  );

  const countries = countriesData?.countries || [];
  const states = statesData?.states || [];
  const cities = citiesData?.cities || [];
  const availableNeighborhoods = neighborhoodsData?.neighborhoods || [];

  // Auto-select Nigeria as default country
  useEffect(() => {
    if (countries.length > 0 && !countryId) {
      const nigeria = countries.find((c: any) => c.code === 'NG');
      if (nigeria) {
        setCountryId(nigeria.id);
      }
    }
  }, [countries, countryId]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, neighborhoodsRes, profileRes, servicesRes, userRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/neighborhoods'),
        fetch('/api/fixer/profile'),
        fetch('/api/fixer/services'),
        fetch('/api/auth/me'),
      ]);

      const categoriesData = await categoriesRes.json();
      const neighborhoodsData = await neighborhoodsRes.json();
      const profileData = await profileRes.json();
      const servicesData = servicesRes.ok ? await servicesRes.json() : [];
      const userData = userRes.ok ? await userRes.json() : null;

      setCategories(categoriesData);
      setNeighborhoods(neighborhoodsData);

      // Set current user
      if (userData?.user) {
        setCurrentUser(userData.user);
      }

      // Check if profile exists
      if (profileData.profile) {
        setHasExistingProfile(true);
      }

      // Get the fixer's neighborhood ID from their profile (for fallback)
      if (profileData.profile && profileData.profile.neighborhoodId) {
        setProfileNeighborhoodId(profileData.profile.neighborhoodId);
      }

      // Load existing services into forms
      // Group services by category for display
      if (servicesData.length > 0) {
        setHasExistingServices(true);
        const groupedByCategory = servicesData.reduce((acc: any, service: any) => {
          const categoryId = service.subcategory.category.id;
          if (!acc[categoryId]) {
            acc[categoryId] = {
              categoryId: service.subcategory.category.id,
              categoryName: service.subcategory.category.name,
              subcategoryIds: [],
              subcategoryNames: [],
              yearsExperience: service.yearsExperience || 0,
              description: service.description || '',
              qualifications: service.qualifications || [],
              referencePhone: service.referencePhone || '',
            };
          }
          acc[categoryId].subcategoryIds.push(service.subcategory.id);
          acc[categoryId].subcategoryNames.push(service.subcategory.name);
          return acc;
        }, {});

        const existingForms: ServiceForm[] = Object.values(groupedByCategory).map((group: any) => ({
          id: crypto.randomUUID(),
          ...group,
          isExisting: true,
          isEditing: false,
        }));
        setServiceForms(existingForms);

        // Load existing service neighborhoods
        const existingNeighborhoodIds = new Set<string>();
        servicesData.forEach((service: any) => {
          if (service.neighborhoods && service.neighborhoods.length > 0) {
            service.neighborhoods.forEach((nb: any) => {
              existingNeighborhoodIds.add(nb.id);
            });
          }
        });
        setSelectedNeighborhoodIds(Array.from(existingNeighborhoodIds));
      }

      setInitialLoad(false);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please refresh the page.');
      setInitialLoad(false);
    }
  };

  // Helper functions for dynamic service forms
  const addServiceForm = () => {
    setServiceForms([
      ...serviceForms,
      {
        id: crypto.randomUUID(),
        categoryId: '',
        categoryName: '',
        subcategoryIds: [],
        subcategoryNames: [],
        yearsExperience: 0,
        description: '',
        qualifications: [],
        referencePhone: '',
        isExisting: false, // New service
        isEditing: true, // New services start in edit mode
      },
    ]);
  };

  const toggleEdit = (id: string) => {
    setServiceForms(
      serviceForms.map((form) =>
        form.id === id ? { ...form, isEditing: !form.isEditing } : form
      )
    );
  };

  const removeServiceForm = (id: string) => {
    setServiceForms(serviceForms.filter((form) => form.id !== id));
  };

  const updateServiceForm = (id: string, field: keyof ServiceForm, value: any) => {
    setServiceForms(
      serviceForms.map((form) =>
        form.id === id ? { ...form, [field]: value } : form
      )
    );
  };

  const handleCategoryChange = (id: string, categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    setServiceForms(
      serviceForms.map((form) =>
        form.id === id
          ? {
              ...form,
              categoryId,
              categoryName: category?.name || '',
              subcategoryIds: [],
              subcategoryNames: [],
            }
          : form
      )
    );
  };

  const toggleQualification = (id: string, qual: string) => {
    setServiceForms(
      serviceForms.map((form) => {
        if (form.id === id) {
          const qualifications = form.qualifications.includes(qual)
            ? form.qualifications.filter((q) => q !== qual)
            : [...form.qualifications, qual];
          return { ...form, qualifications };
        }
        return form;
      })
    );
  };

  const toggleSubcategory = (id: string, subcategoryId: string) => {
    const form = serviceForms.find((f) => f.id === id);
    if (!form) return;

    const category = categories.find((c) => c.id === form.categoryId);
    const subcategory = category?.subcategories.find((s) => s.id === subcategoryId);
    if (!subcategory) return;

    setServiceForms(
      serviceForms.map((f) => {
        if (f.id === id) {
          const isSelected = f.subcategoryIds.includes(subcategoryId);
          if (isSelected) {
            // Remove subcategory
            return {
              ...f,
              subcategoryIds: f.subcategoryIds.filter((sid) => sid !== subcategoryId),
              subcategoryNames: f.subcategoryNames.filter((_, idx) => f.subcategoryIds[idx] !== subcategoryId),
            };
          } else {
            // Add subcategory
            return {
              ...f,
              subcategoryIds: [...f.subcategoryIds, subcategoryId],
              subcategoryNames: [...f.subcategoryNames, subcategory.name],
            };
          }
        }
        return f;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (serviceForms.length === 0) {
      setError('Please add at least one service');
      setLoading(false);
      return;
    }

    // Validate each service form
    for (let i = 0; i < serviceForms.length; i++) {
      const form = serviceForms[i];
      const serviceNum = i + 1;

      if (!form.categoryId) {
        setError(`Service ${serviceNum}: Please select a category`);
        setLoading(false);
        return;
      }

      if (!form.subcategoryIds || form.subcategoryIds.length === 0) {
        setError(`Service ${serviceNum}: Please select at least one subcategory`);
        setLoading(false);
        return;
      }

      if (form.yearsExperience <= 0) {
        setError(`Service ${serviceNum}: Please enter years of experience (must be greater than 0)`);
        setLoading(false);
        return;
      }

      if (!form.description.trim()) {
        setError(`Service ${serviceNum}: Please describe why clients should hire you`);
        setLoading(false);
        return;
      }

      if (form.qualifications.length === 0) {
        setError(`Service ${serviceNum}: Please select at least one qualification`);
        setLoading(false);
        return;
      }
    }

    // Service areas are now optional - user can add them later
    // if (selectedNeighborhoodIds.length === 0) {
    //   setError('Please select at least one service area neighborhood.');
    //   setLoading(false);
    //   return;
    // }

    try {
      // Map service forms to API format - expand multiple subcategories into separate services
      const services: any[] = [];
      serviceForms.forEach((form) => {
        form.subcategoryIds.forEach((subcategoryId, idx) => {
          services.push({
            categoryId: form.categoryId,
            categoryName: form.categoryName,
            subcategoryId: subcategoryId,
            subcategoryName: form.subcategoryNames[idx],
            yearsExperience: form.yearsExperience,
            description: form.description,
            qualifications: form.qualifications,
            referencePhone: form.referencePhone,
          });
        });
      });

      const response = await fetch('/api/fixer/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services,
          neighborhoodIds: selectedNeighborhoodIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save services');
      }

      setSuccess('Services saved successfully! Redirecting to dashboard...');

      // Use router.push and router.refresh to ensure proper navigation without logout
      setTimeout(() => {
        router.push('/fixer/dashboard');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save services');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <>
        <MobileHeader user={currentUser} />
        <div style={{ ...styles.pageContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <p style={{ fontSize: '16px', color: colors.textSecondary }}>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileHeader user={currentUser} />
      <div style={styles.pageContainer}>
        {/* Header */}
        <header style={styles.header}>
        <div style={styles.headerContainer}>
          <div>
            <h1 style={styles.headerTitle}>
              {hasExistingProfile ? 'Edit Services' : 'Complete Your Service Provider Profile'}
            </h1>
            <p style={styles.headerSubtitle}>
              {hasExistingProfile
                ? 'Update your service offerings and details'
                : 'Step 2 of 2: Add your service provider details and services'}
            </p>
          </div>
          {hasExistingProfile && (
            <Link href="/fixer/dashboard" style={styles.buttonSecondary}>
              Back to Dashboard
            </Link>
          )}
        </div>
      </header>

      <main style={styles.mainContent}>
        {/* Messages */}
        {error && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ fontSize: '14px', color: '#991B1B', margin: 0 }}>{error}</p>
          </div>
        )}
        {success && (
          <div style={{ backgroundColor: '#D1FAE5', border: '1px solid #10B981', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ fontSize: '14px', color: '#065F46', margin: 0 }}>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* EXISTING SERVICES SECTION - Only show if fixer has existing services */}
          {hasExistingServices && (
            <div style={{ ...styles.section, marginBottom: '32px' }}>
              <h2 style={styles.sectionTitle}>Your Existing Services</h2>
              <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '20px' }}>
                These are your current services. Click "Edit" to modify or "Add More Service" to add new ones.
              </p>

              {serviceForms.map((form, index) => {
              const selectedCategory = categories.find((c) => c.id === form.categoryId);
              const availableSubcategories = selectedCategory?.subcategories || [];

              return (
                <div
                  key={form.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    marginBottom: '20px',
                    border: '2px solid #E4E6EB',
                  }}
                >
                  {/* Service Form Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                      Service {index + 1}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {form.isExisting && (
                        <button
                          type="button"
                          onClick={() => toggleEdit(form.id)}
                          style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: form.isEditing ? '#6B7280' : colors.primary,
                            backgroundColor: form.isEditing ? '#F3F4F6' : `${colors.primary}15`,
                            border: `1px solid ${form.isEditing ? '#D1D5DB' : colors.primary}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          {form.isEditing ? 'Cancel Edit' : 'Edit'}
                        </button>
                      )}
                      {((serviceForms.length > 1 && !form.isExisting) || (form.isExisting && form.isEditing)) && (
                        <button
                          type="button"
                          onClick={() => removeServiceForm(form.id)}
                          style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#DC2626',
                            backgroundColor: '#FEE2E2',
                            border: '1px solid #DC2626',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          Remove Service
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Service Category Dropdown */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                      Service Category <span style={{ color: colors.error }}>*</span>
                    </label>
                    {form.isEditing ? (
                      <select
                        value={form.categoryId}
                        onChange={(e) => handleCategoryChange(form.id, e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          fontSize: '15px',
                          border: '2px solid #E4E6EB',
                          borderRadius: '12px',
                          outline: 'none',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: '2px solid #E4E6EB',
                        borderRadius: '12px',
                        backgroundColor: '#F9FAFB',
                        color: colors.textPrimary,
                      }}>
                        {form.categoryName || 'N/A'}
                      </div>
                    )}
                  </div>

                  {/* Subcategories - Multiple Selection */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
                      Specific Services (Select all that apply) <span style={{ color: colors.error }}>*</span>
                    </label>
                    {form.isEditing ? (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        padding: form.categoryId && availableSubcategories.length > 0 ? '12px' : '0',
                        border: form.categoryId && availableSubcategories.length > 0 ? '2px solid #E4E6EB' : 'none',
                        borderRadius: '12px',
                        backgroundColor: form.categoryId ? 'white' : '#F9FAFB',
                      }}>
                        {!form.categoryId ? (
                          <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0, padding: '12px' }}>
                            Please select a category first
                          </p>
                        ) : availableSubcategories.length === 0 ? (
                          <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0, padding: '12px' }}>
                            No subcategories available
                          </p>
                        ) : (
                          availableSubcategories.map((subcategory) => (
                            <label
                              key={subcategory.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '10px 16px',
                                border: `2px solid ${form.subcategoryIds.includes(subcategory.id) ? colors.primary : '#E4E6EB'}`,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: form.subcategoryIds.includes(subcategory.id) ? `${colors.primary}15` : 'white',
                                transition: 'all 0.2s',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={form.subcategoryIds.includes(subcategory.id)}
                                onChange={() => toggleSubcategory(form.id, subcategory.id)}
                                style={{ marginRight: '8px', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                                {subcategory.name}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    ) : (
                      <div style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: '2px solid #E4E6EB',
                        borderRadius: '12px',
                        backgroundColor: '#F9FAFB',
                        color: colors.textPrimary,
                      }}>
                        {form.subcategoryNames.length > 0 ? form.subcategoryNames.join(', ') : 'N/A'}
                      </div>
                    )}
                  </div>

                  {/* Years of Experience */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                      Years of Experience (for this service) <span style={{ color: colors.error }}>*</span>
                    </label>
                    {form.isEditing ? (
                      <input
                        type="number"
                        value={form.yearsExperience || ''}
                        onChange={(e) => updateServiceForm(form.id, 'yearsExperience', parseInt(e.target.value) || 0)}
                        required
                        min="1"
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
                    ) : (
                      <div style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: '2px solid #E4E6EB',
                        borderRadius: '12px',
                        backgroundColor: '#F9FAFB',
                        color: colors.textPrimary,
                      }}>
                        {form.yearsExperience} years
                      </div>
                    )}
                  </div>

                  {/* Description - Why should clients hire you */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                      Qualification - Why should clients hire you? <span style={{ color: colors.error }}>*</span>
                    </label>
                    {form.isEditing ? (
                      <textarea
                        value={form.description}
                        onChange={(e) => updateServiceForm(form.id, 'description', e.target.value)}
                        required
                        rows={5}
                        placeholder="Describe your expertise, certifications, and what makes you qualified for this service..."
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          fontSize: '15px',
                          border: '2px solid #E4E6EB',
                          borderRadius: '12px',
                          outline: 'none',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: '2px solid #E4E6EB',
                        borderRadius: '12px',
                        backgroundColor: '#F9FAFB',
                        color: colors.textPrimary,
                        whiteSpace: 'pre-wrap',
                        minHeight: '120px',
                      }}>
                        {form.description}
                      </div>
                    )}
                  </div>

                  {/* Qualifications Checkboxes */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
                      Qualifications <span style={{ color: colors.error }}>*</span>
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {['Licensed', 'Trained', 'Certified', 'Insured'].map((qual) => (
                        <label
                          key={qual}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '10px 16px',
                            border: `2px solid ${form.qualifications.includes(qual) ? colors.primary : '#E4E6EB'}`,
                            borderRadius: '8px',
                            cursor: form.isEditing ? 'pointer' : 'default',
                            backgroundColor: form.qualifications.includes(qual) ? `${colors.primary}10` : 'white',
                            transition: 'all 0.2s',
                            opacity: form.isEditing ? 1 : 0.8,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={form.qualifications.includes(qual)}
                            onChange={() => form.isEditing && toggleQualification(form.id, qual)}
                            disabled={!form.isEditing}
                            style={{ marginRight: '8px', cursor: form.isEditing ? 'pointer' : 'default' }}
                          />
                          <span style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                            {qual}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Previous Customer Reference Phone No (Optional) */}
                  <div style={{ marginBottom: '0' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                      Previous Customer Reference Phone No (Optional)
                    </label>
                    {form.isEditing ? (
                      <input
                        type="tel"
                        value={form.referencePhone}
                        onChange={(e) => updateServiceForm(form.id, 'referencePhone', e.target.value)}
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
                    ) : (
                      <div style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: '2px solid #E4E6EB',
                        borderRadius: '12px',
                        backgroundColor: '#F9FAFB',
                        color: colors.textPrimary,
                      }}>
                        {form.referencePhone || 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add More Service Button */}
            <button
              type="button"
              onClick={addServiceForm}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '600',
                color: colors.primary,
                backgroundColor: 'white',
                border: `2px dashed ${colors.primary}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              + Add More Service
            </button>
          </div>
          )}

          {/* NEW FIXER - ADD SERVICES SECTION */}
          {!hasExistingServices && (
            <div style={{ ...styles.section, marginBottom: '32px' }}>
              <h2 style={styles.sectionTitle}>Add Your Services</h2>
              <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '20px' }}>
                Add each service you offer with specific details. Your application will be reviewed by our admin team.
              </p>

              {serviceForms.map((form, index) => {
              const selectedCategory = categories.find((c) => c.id === form.categoryId);
              const availableSubcategories = selectedCategory?.subcategories || [];

              return (
                <div
                  key={form.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    marginBottom: '20px',
                    border: '2px solid #E4E6EB',
                  }}
                >
                  {/* Service Form Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                      Service {index + 1}
                    </h3>
                    {serviceForms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeServiceForm(form.id)}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#DC2626',
                          backgroundColor: '#FEE2E2',
                          border: '1px solid #DC2626',
                          borderRadius: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        Remove Service
                      </button>
                    )}
                  </div>

                  {/* Service Category Dropdown */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                      Service Category <span style={{ color: colors.error }}>*</span>
                    </label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => handleCategoryChange(form.id, e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: '2px solid #E4E6EB',
                        borderRadius: '12px',
                        outline: 'none',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategories - Multiple Selection */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
                      Specific Services (Select all that apply) <span style={{ color: colors.error }}>*</span>
                    </label>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: form.categoryId && availableSubcategories.length > 0 ? '12px' : '0',
                      border: form.categoryId && availableSubcategories.length > 0 ? '2px solid #E4E6EB' : 'none',
                      borderRadius: '12px',
                      backgroundColor: form.categoryId ? 'white' : '#F9FAFB',
                    }}>
                      {!form.categoryId ? (
                        <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0, padding: '12px' }}>
                          Please select a category first
                        </p>
                      ) : availableSubcategories.length === 0 ? (
                        <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0, padding: '12px' }}>
                          No subcategories available
                        </p>
                      ) : (
                        availableSubcategories.map((subcategory) => (
                          <label
                            key={subcategory.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '10px 16px',
                              border: `2px solid ${form.subcategoryIds.includes(subcategory.id) ? colors.primary : '#E4E6EB'}`,
                              borderRadius: '8px',
                              cursor: 'pointer',
                              backgroundColor: form.subcategoryIds.includes(subcategory.id) ? `${colors.primary}15` : 'white',
                              transition: 'all 0.2s',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={form.subcategoryIds.includes(subcategory.id)}
                              onChange={() => toggleSubcategory(form.id, subcategory.id)}
                              style={{ marginRight: '8px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                              {subcategory.name}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Years of Experience */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                      Years of Experience (for this service) <span style={{ color: colors.error }}>*</span>
                    </label>
                    <input
                      type="number"
                      value={form.yearsExperience || ''}
                      onChange={(e) => updateServiceForm(form.id, 'yearsExperience', parseInt(e.target.value) || 0)}
                      required
                      min="1"
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

                  {/* Description - Why should clients hire you */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                      Qualification - Why should clients hire you? <span style={{ color: colors.error }}>*</span>
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => updateServiceForm(form.id, 'description', e.target.value)}
                      required
                      rows={5}
                      placeholder="Describe your expertise, certifications, and what makes you qualified for this service..."
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: '2px solid #E4E6EB',
                        borderRadius: '12px',
                        outline: 'none',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  {/* Qualifications Checkboxes */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
                      Qualifications <span style={{ color: colors.error }}>*</span>
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {['Licensed', 'Trained', 'Certified', 'Insured'].map((qual) => (
                        <label
                          key={qual}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '10px 16px',
                            border: `2px solid ${form.qualifications.includes(qual) ? colors.primary : '#E4E6EB'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: form.qualifications.includes(qual) ? `${colors.primary}10` : 'white',
                            transition: 'all 0.2s',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={form.qualifications.includes(qual)}
                            onChange={() => toggleQualification(form.id, qual)}
                            style={{ marginRight: '8px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                            {qual}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Previous Customer Reference Phone No (Optional) */}
                  <div style={{ marginBottom: '0' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                      Previous Customer Reference Phone No (Optional)
                    </label>
                    <input
                      type="tel"
                      value={form.referencePhone}
                      onChange={(e) => updateServiceForm(form.id, 'referencePhone', e.target.value)}
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
                </div>
              );
            })}

            {/* Add More Service Button */}
            <button
              type="button"
              onClick={addServiceForm}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '600',
                color: colors.primary,
                backgroundColor: 'white',
                border: `2px dashed ${colors.primary}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              + Add More Service
            </button>
          </div>
          )}

          {/* SERVICE AREA SELECTION */}
          <div style={{ ...styles.section, marginBottom: '32px' }}>
            <h2 style={styles.sectionTitle}>Service Areas <span style={{ fontSize: '14px', fontWeight: '400', color: colors.textSecondary }}>(optional)</span></h2>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '20px' }}>
              Select the neighborhoods where you offer your services. You can select multiple areas or add them later.
            </p>

            {/* Cascading Location Selects */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                Country
              </label>
              <select
                value={countryId}
                onChange={(e) => {
                  setCountryId(e.target.value);
                  setStateId('');
                  setCityId('');
                  setSelectedNeighborhoodIds([]);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  border: '2px solid #E4E6EB',
                  borderRadius: '12px',
                  outline: 'none',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select Country</option>
                {countries.map((country: any) => (
                  <option key={country.id} value={country.id}>{country.name}</option>
                ))}
              </select>
            </div>

            {countryId && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  State
                </label>
                <select
                  value={stateId}
                  onChange={(e) => {
                    setStateId(e.target.value);
                    setCityId('');
                    setSelectedNeighborhoodIds([]);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid #E4E6EB',
                    borderRadius: '12px',
                    outline: 'none',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select State</option>
                  {states.map((state: any) => (
                    <option key={state.id} value={state.id}>{state.name}</option>
                  ))}
                </select>
              </div>
            )}

            {stateId && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  City/LGA <span style={{ color: colors.error }}>*</span>
                </label>
                <select
                  value={cityId}
                  onChange={(e) => {
                    setCityId(e.target.value);
                    setSelectedNeighborhoodIds([]);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '2px solid #E4E6EB',
                    borderRadius: '12px',
                    outline: 'none',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select City/LGA</option>
                  {cities.map((city: any) => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Neighborhood Multi-Select */}
            {cityId && availableNeighborhoods.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
                  Neighborhoods (Select all that apply) <span style={{ color: colors.error }}>*</span>
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '12px',
                    padding: '12px',
                    border: '2px solid #E4E6EB',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }}
                >
                  {availableNeighborhoods.map((neighborhood: any) => (
                    <label
                      key={neighborhood.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px 16px',
                        border: `2px solid ${selectedNeighborhoodIds.includes(neighborhood.id) ? colors.primary : '#E4E6EB'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: selectedNeighborhoodIds.includes(neighborhood.id) ? `${colors.primary}15` : 'white',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedNeighborhoodIds.includes(neighborhood.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNeighborhoodIds([...selectedNeighborhoodIds, neighborhood.id]);
                          } else {
                            setSelectedNeighborhoodIds(selectedNeighborhoodIds.filter(id => id !== neighborhood.id));
                          }
                        }}
                        style={{ marginRight: '8px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                        {neighborhood.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Neighborhoods Summary */}
            {selectedNeighborhoodIds.length > 0 && (
              <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #3B82F6', borderRadius: '12px', padding: '16px' }}>
                <p style={{ fontSize: '14px', color: colors.textPrimary, marginBottom: '4px' }}>
                  <strong>Selected Service Areas:</strong> {selectedNeighborhoodIds.length} neighborhood(s)
                </p>
              </div>
            )}
          </div>

          {/* Submit Button - Show if any service is being edited or if new services added */}
          {serviceForms.some(form => form.isEditing) && (
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
              {loading ? 'Saving...' : hasExistingProfile ? 'Update Services' : 'Complete Setup'}
            </button>
          )}
        </form>
      </main>
      </div>
    </>
  );
}
