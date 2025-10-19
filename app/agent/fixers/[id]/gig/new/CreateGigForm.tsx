'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@/lib/theme';

interface Package {
  title: string;
  description: string;
  price: string;
  deliveryDays: string;
}

interface Subcategory {
  id: string;
  name: string;
  category: {
    id: string;
    name: string;
  };
}

export default function CreateGigForm({ fixerId }: { fixerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subcategoryId: '',
    images: [] as string[],
    tags: '',
    faq: '',
  });

  const [packages, setPackages] = useState<Package[]>([
    { title: 'Basic', description: '', price: '', deliveryDays: '' },
  ]);

  useEffect(() => {
    fetchSubcategories();
  }, []);

  const fetchSubcategories = async () => {
    try {
      const res = await fetch('/api/subcategories');
      const data = await res.json();
      setSubcategories(data.subcategories || []);
    } catch (err) {
      console.error('Error fetching subcategories:', err);
    }
  };

  const addPackage = () => {
    if (packages.length < 3) {
      setPackages([
        ...packages,
        { title: '', description: '', price: '', deliveryDays: '' },
      ]);
    }
  };

  const removePackage = (index: number) => {
    if (packages.length > 1) {
      setPackages(packages.filter((_, i) => i !== index));
    }
  };

  const updatePackage = (index: number, field: keyof Package, value: string) => {
    const updated = [...packages];
    updated[index][field] = value;
    setPackages(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate packages
    const validPackages = packages.filter(
      (pkg) => pkg.title && pkg.price && pkg.deliveryDays
    );

    if (validPackages.length === 0) {
      setError('At least one complete package is required');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/agent/gigs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixerId,
          ...formData,
          tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
          packages: validPackages.map((pkg) => ({
            ...pkg,
            price: parseFloat(pkg.price),
            deliveryDays: parseInt(pkg.deliveryDays),
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create gig');
      }

      router.push(`/agent/fixers/${fixerId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: '24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
            Create Gig
          </h1>
          <p style={{ color: colors.textSecondary }}>
            Create a new gig on behalf of the fixer
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: colors.textPrimary }}>
              Gig Details
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="I will..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                Category *
              </label>
              <select
                required
                value={formData.subcategoryId}
                onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                <option value="">Select a subcategory</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.category.name} - {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the service in detail..."
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., plumbing, emergency, repairs"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                FAQ (Optional)
              </label>
              <textarea
                value={formData.faq}
                onChange={(e) => setFormData({ ...formData, faq: e.target.value })}
                placeholder="Frequently asked questions about this service..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* Packages Section */}
          <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary }}>
                Packages
              </h2>
              {packages.length < 3 && (
                <button
                  type="button"
                  onClick={addPackage}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: colors.primary,
                    color: colors.white,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  + Add Package
                </button>
              )}
            </div>

            {packages.map((pkg, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                    Package {index + 1}
                  </h3>
                  {packages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePackage(index)}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: colors.errorLight,
                        color: colors.error,
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={pkg.title}
                    onChange={(e) => updatePackage(index, 'title', e.target.value)}
                    placeholder="e.g., Basic, Standard, Premium"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    Description
                  </label>
                  <textarea
                    value={pkg.description}
                    onChange={(e) => updatePackage(index, 'description', e.target.value)}
                    placeholder="What's included in this package?"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                      Price (₦) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={pkg.price}
                      onChange={(e) => updatePackage(index, 'price', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                      Delivery Days *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={pkg.deliveryDays}
                      onChange={(e) => updatePackage(index, 'deliveryDays', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div style={{ padding: '12px', backgroundColor: colors.errorLight, color: colors.error, borderRadius: '8px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding: '12px 24px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                backgroundColor: colors.white,
                color: colors.textPrimary,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: colors.primary,
                color: colors.white,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {loading ? 'Creating...' : 'Create Gig'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
