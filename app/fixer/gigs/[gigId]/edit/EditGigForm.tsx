'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardCard } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';

type Category = {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
};

type PackageData = {
  id?: string;
  name: string;
  description: string;
  price: string;
  deliveryDays: string;
  revisions: string;
  features: string[];
};

type Gig = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  requirements: string[];
  subcategory: {
    id: string;
    category: {
      id: string;
    };
  };
  packages: {
    id: string;
    name: string;
    description: string;
    price: number;
    deliveryDays: number;
    revisions: number;
    features: string[];
  }[];
};

export function EditGigForm({ gig, categories }: { gig: Gig; categories: Category[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Basic Info
  const [title, setTitle] = useState(gig.title);
  const [categoryId, setCategoryId] = useState(gig.subcategory.category.id);
  const [subcategoryId, setSubcategoryId] = useState(gig.subcategory.id);
  const [description, setDescription] = useState(gig.description);
  const [tags, setTags] = useState(gig.tags.join(', '));
  const [requirements, setRequirements] = useState(gig.requirements.length > 0 ? gig.requirements : ['']);

  // Packages - convert existing packages to form format
  const [packages, setPackages] = useState<PackageData[]>(
    gig.packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      price: pkg.price.toString(),
      deliveryDays: pkg.deliveryDays.toString(),
      revisions: pkg.revisions.toString(),
      features: pkg.features.length > 0 ? pkg.features : [''],
    }))
  );

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/fixer/gigs/${gig.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subcategoryId,
          description,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          requirements: requirements.filter(Boolean),
          packages: packages.map((pkg) => ({
            id: pkg.id,
            name: pkg.name,
            description: pkg.description,
            price: parseFloat(pkg.price),
            deliveryDays: parseInt(pkg.deliveryDays),
            revisions: parseInt(pkg.revisions),
            features: pkg.features.filter(Boolean),
          })),
          status: isDraft ? 'DRAFT' : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update gig');
      }

      router.push('/fixer/gigs');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePackage = (index: number, field: keyof PackageData, value: any) => {
    const updated = [...packages];
    updated[index] = { ...updated[index], [field]: value };
    setPackages(updated);
  };

  const addFeature = (packageIndex: number) => {
    const updated = [...packages];
    updated[packageIndex].features.push('');
    setPackages(updated);
  };

  const updateFeature = (packageIndex: number, featureIndex: number, value: string) => {
    const updated = [...packages];
    updated[packageIndex].features[featureIndex] = value;
    setPackages(updated);
  };

  const removeFeature = (packageIndex: number, featureIndex: number) => {
    const updated = [...packages];
    updated[packageIndex].features.splice(featureIndex, 1);
    setPackages(updated);
  };

  const addRequirement = () => {
    setRequirements([...requirements, '']);
  };

  const updateRequirement = (index: number, value: string) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    fontSize: '14px',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: '8px',
  };

  return (
    <form>
      {error && (
        <DashboardCard style={{ marginBottom: '24px', backgroundColor: colors.errorLight, borderColor: colors.error }}>
          <p style={{ color: colors.error, fontSize: '14px' }}>{error}</p>
        </DashboardCard>
      )}

      {/* Basic Information */}
      <DashboardCard title="Basic Information" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Service Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., I will fix your plumbing issues professionally"
              required
              style={inputStyle}
            />
            <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
              {title.length}/80 characters
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Category *</label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId('');
                }}
                required
                style={inputStyle}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Subcategory *</label>
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                required
                disabled={!categoryId}
                style={inputStyle}
              >
                <option value="">Select subcategory</option>
                {selectedCategory?.subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your service in detail. What do you offer? What makes you stand out? What's your process?"
              required
              rows={8}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Search Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="plumbing, repair, emergency, 24/7 (comma separated)"
              style={inputStyle}
            />
          </div>
        </div>
      </DashboardCard>

      {/* Pricing & Packages */}
      <DashboardCard title="Pricing & Packages" style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '20px' }}>
          Offer 3 package tiers to give clients options. Each package should provide increasing value.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {packages.map((pkg, pkgIndex) => (
            <div
              key={pkgIndex}
              style={{
                border: `2px solid ${pkgIndex === 0 ? colors.border : pkgIndex === 1 ? colors.primary : '#F59E0B'}`,
                borderRadius: borderRadius.lg,
                padding: '16px',
                backgroundColor: pkgIndex === 1 ? colors.primaryLight : colors.white,
              }}
            >
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
                {pkg.name}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: '12px' }}>Description</label>
                  <textarea
                    value={pkg.description}
                    onChange={(e) => updatePackage(pkgIndex, 'description', e.target.value)}
                    placeholder="Brief package description"
                    rows={2}
                    style={{ ...inputStyle, fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ ...labelStyle, fontSize: '12px' }}>Price (₦)</label>
                  <input
                    type="number"
                    value={pkg.price}
                    onChange={(e) => updatePackage(pkgIndex, 'price', e.target.value)}
                    placeholder="10000"
                    min="0"
                    style={{ ...inputStyle, fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>Delivery (days)</label>
                    <input
                      type="number"
                      value={pkg.deliveryDays}
                      onChange={(e) => updatePackage(pkgIndex, 'deliveryDays', e.target.value)}
                      placeholder="7"
                      min="1"
                      style={{ ...inputStyle, fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>Revisions</label>
                    <input
                      type="number"
                      value={pkg.revisions}
                      onChange={(e) => updatePackage(pkgIndex, 'revisions', e.target.value)}
                      placeholder="1"
                      min="0"
                      style={{ ...inputStyle, fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ ...labelStyle, fontSize: '12px' }}>Features</label>
                  {pkg.features.map((feature, featureIndex) => (
                    <div key={featureIndex} style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(pkgIndex, featureIndex, e.target.value)}
                        placeholder="Feature"
                        style={{ ...inputStyle, fontSize: '13px', padding: '8px' }}
                      />
                      {pkg.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(pkgIndex, featureIndex)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: colors.errorLight,
                            color: colors.error,
                            border: 'none',
                            borderRadius: borderRadius.md,
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addFeature(pkgIndex)}
                    style={{
                      marginTop: '4px',
                      padding: '6px 12px',
                      backgroundColor: colors.bgTertiary,
                      color: colors.textPrimary,
                      border: 'none',
                      borderRadius: borderRadius.md,
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    + Add Feature
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Requirements from Buyers */}
      <DashboardCard title="Requirements from Buyers (Optional)" style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '16px' }}>
          What information do you need from buyers to get started?
        </p>

        {requirements.map((req, index) => (
          <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              value={req}
              onChange={(e) => updateRequirement(index, e.target.value)}
              placeholder="E.g., Please provide photos of the issue"
              style={{ ...inputStyle, flex: 1 }}
            />
            {requirements.length > 1 && (
              <button
                type="button"
                onClick={() => removeRequirement(index)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: colors.errorLight,
                  color: colors.error,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addRequirement}
          style={{
            marginTop: '8px',
            padding: '8px 16px',
            backgroundColor: colors.bgTertiary,
            color: colors.textPrimary,
            border: 'none',
            borderRadius: borderRadius.md,
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          + Add Requirement
        </button>
      </DashboardCard>

      {/* Submit Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: colors.white,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.md,
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          Save as Draft
        </button>

        <button
          type="button"
          onClick={(e) => handleSubmit(e, false)}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: colors.primary,
            color: colors.white,
            border: 'none',
            borderRadius: borderRadius.md,
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
