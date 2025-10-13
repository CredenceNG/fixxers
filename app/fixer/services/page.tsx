'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { styles, colors } from '@/lib/theme';

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

interface FixerService {
  id: string;
  subcategoryId: string;
  subcategory: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
  neighborhoods: Neighborhood[];
  description?: string;
  basePrice?: number;
  priceUnit?: string;
  isActive: boolean;
}

export default function FixerServicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [services, setServices] = useState<FixerService[]>([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [formData, setFormData] = useState({
    subcategoryId: '',
    neighborhoodIds: [] as string[],
    description: '',
    basePrice: '',
    priceUnit: 'per_job',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, neighborhoodsRes, servicesRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/neighborhoods'),
        fetch('/api/fixer/services'),
      ]);

      const categoriesData = await categoriesRes.json();
      const neighborhoodsData = await neighborhoodsRes.json();
      const servicesData = await servicesRes.json();

      setCategories(categoriesData);
      setNeighborhoods(neighborhoodsData);
      setServices(servicesData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please refresh the page.');
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryId(e.target.value);
    setFormData({ ...formData, subcategoryId: '' });
  };

  const handleNeighborhoodToggle = (neighborhoodId: string) => {
    setFormData({
      ...formData,
      neighborhoodIds: formData.neighborhoodIds.includes(neighborhoodId)
        ? formData.neighborhoodIds.filter(id => id !== neighborhoodId)
        : [...formData.neighborhoodIds, neighborhoodId],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.subcategoryId || formData.neighborhoodIds.length === 0) {
      setError('Please select a service and at least one neighborhood');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/fixer/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add service');
      }

      setSuccess('Service added successfully!');
      setShowAddForm(false);
      setFormData({
        subcategoryId: '',
        neighborhoodIds: [],
        description: '',
        basePrice: '',
        priceUnit: 'per_job',
      });
      setSelectedCategoryId('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to add service');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (serviceId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/fixer/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update service');
      }

      await loadData();
    } catch (err) {
      setError('Failed to update service status');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`/api/fixer/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete service');
      }

      setSuccess('Service deleted successfully');
      await loadData();
    } catch (err) {
      setError('Failed to delete service');
    }
  };

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          <div>
            <h1 style={styles.headerTitle}>My Services</h1>
            <p style={styles.headerSubtitle}>Manage the services you offer and areas you serve</p>
          </div>
          <div style={styles.buttonGroup}>
            <Link href="/fixer/dashboard" style={styles.buttonSecondary}>
              Back to Dashboard
            </Link>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={styles.buttonPrimary}
            >
              {showAddForm ? 'Cancel' : '+ Add Service'}
            </button>
          </div>
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

        {/* Add Service Form */}
        {showAddForm && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Add New Service</h2>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <form onSubmit={handleSubmit}>
                {/* Category Selection */}
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

                {/* Subcategory Selection */}
                {selectedCategory && (
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                      Specific Service <span style={{ color: colors.error }}>*</span>
                    </label>
                    <select
                      value={formData.subcategoryId}
                      onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
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

                {/* Neighborhoods */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                    Service Areas <span style={{ color: colors.error }}>*</span>
                  </label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '2px solid #E4E6EB', borderRadius: '12px', padding: '16px' }}>
                    {neighborhoods.map(nb => (
                      <label key={nb.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.neighborhoodIds.includes(nb.id)}
                          onChange={() => handleNeighborhoodToggle(nb.id)}
                          style={{ marginRight: '12px', width: '18px', height: '18px' }}
                        />
                        <span style={{ fontSize: '14px', color: colors.textPrimary }}>
                          {nb.name}, {nb.city}, {nb.state}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                    Description <span style={{ fontSize: '13px', fontWeight: '400', color: colors.textSecondary }}>(optional)</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Describe your expertise and what sets you apart..."
                    style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>

                {/* Pricing */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                      Base Price <span style={{ fontSize: '13px', fontWeight: '400', color: colors.textSecondary }}>(optional)</span>
                    </label>
                    <input
                      type="number"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      placeholder="Enter price in NGN"
                      min="0"
                      step="100"
                      style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                      Unit
                    </label>
                    <select
                      value={formData.priceUnit}
                      onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
                    >
                      <option value="per_job">Per Job</option>
                      <option value="per_hour">Per Hour</option>
                      <option value="per_sqft">Per Sq Ft</option>
                      <option value="per_day">Per Day</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.buttonPrimary,
                    width: '100%',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Adding Service...' : 'Add Service'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* My Services List */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>My Service Offerings ({services.length})</h2>
          {services.length === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <p style={{ fontSize: '15px', color: colors.textSecondary }}>
                You haven't added any services yet. Click "Add Service" to get started!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {services.map((service) => (
                <div
                  key={service.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    opacity: service.isActive ? 1 : 0.6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                        {service.subcategory.name}
                      </h3>
                      <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                        {service.subcategory.category.name}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleToggleActive(service.id, service.isActive)}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          backgroundColor: service.isActive ? '#FEF3C7' : '#D1FAE5',
                          color: service.isActive ? '#92400E' : '#065F46',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                        }}
                      >
                        {service.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          backgroundColor: '#FEE2E2',
                          color: '#991B1B',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {service.description && (
                    <p style={{ fontSize: '14px', color: colors.textPrimary, marginBottom: '16px', lineHeight: '1.6' }}>
                      {service.description}
                    </p>
                  )}

                  {service.basePrice && (
                    <p style={{ fontSize: '16px', fontWeight: '600', color: colors.primary, marginBottom: '16px' }}>
                      ₦{service.basePrice.toLocaleString()} {service.priceUnit?.replace('_', ' ')}
                    </p>
                  )}

                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginBottom: '8px' }}>
                      Service Areas:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {service.neighborhoods.map(nb => (
                        <span
                          key={nb.id}
                          style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            backgroundColor: '#F3F4F6',
                            color: colors.textPrimary,
                            borderRadius: '20px',
                          }}
                        >
                          {nb.name}, {nb.city}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
