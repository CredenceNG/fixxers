import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';

interface PageProps {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function AdminCategoriesPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  if (!user || !user.roles?.includes('ADMIN')) {
    redirect('/auth/login');
  }

  const { success, error } = await searchParams;

  // Fetch all categories with subcategories
  const categories = await prisma.serviceCategory.findMany({
    include: {
      subcategories: {
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <DashboardLayoutWithHeader
      title="Manage Service Categories"
      subtitle="Add and organize service categories and subcategories"
      actions={
        <DashboardButton variant="outline" href="/admin/dashboard">
          ← Back to Dashboard
        </DashboardButton>
      }
    >
        {/* Success/Error Messages */}
        {success === 'category_added' && (
          <DashboardCard style={{ marginBottom: '24px', padding: '20px', backgroundColor: colors.primaryLight, border: `1px solid ${colors.primary}` }}>
            <p style={{ fontSize: '15px', color: colors.primaryDark, fontWeight: '600', margin: 0 }}>
              ✓ Category added successfully!
            </p>
          </DashboardCard>
        )}
        {success === 'subcategory_added' && (
          <DashboardCard style={{ marginBottom: '24px', padding: '20px', backgroundColor: colors.primaryLight, border: `1px solid ${colors.primary}` }}>
            <p style={{ fontSize: '15px', color: colors.primaryDark, fontWeight: '600', margin: 0 }}>
              ✓ Subcategory added successfully!
            </p>
          </DashboardCard>
        )}
        {error && (
          <DashboardCard style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#FDEDEC', border: `1px solid ${colors.error}` }}>
            <p style={{ fontSize: '15px', color: '#922B21', fontWeight: '600', margin: 0 }}>
              ✗ Error: {error === 'duplicate' ? 'Category or subcategory already exists' : 'Failed to add category'}
            </p>
          </DashboardCard>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Add New Category */}
          <DashboardCard>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
              Add New Category
            </h2>
            <form action="/api/admin/categories" method="POST">
              <input type="hidden" name="type" value="category" />
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  Category Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g., Plumbing, Electrical"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: `1px solid ${colors.border}`, borderRadius: borderRadius.md, outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Brief description of this category"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: `1px solid ${colors.border}`, borderRadius: borderRadius.md, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
              <DashboardButton
                variant="primary"
                type="submit"
                style={{ width: '100%' }}
              >
                Add Category
              </DashboardButton>
            </form>
          </DashboardCard>

          {/* Add New Subcategory */}
          <DashboardCard>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
              Add New Subcategory
            </h2>
            <form action="/api/admin/categories" method="POST">
              <input type="hidden" name="type" value="subcategory" />
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  Parent Category
                </label>
                <select
                  name="categoryId"
                  required
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: `1px solid ${colors.border}`, borderRadius: borderRadius.md, outline: 'none', cursor: 'pointer' }}
                >
                  <option value="">Select a category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  Subcategory Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g., Drain Cleaning, Pipe Repair"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: `1px solid ${colors.border}`, borderRadius: borderRadius.md, outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Brief description"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: `1px solid ${colors.border}`, borderRadius: borderRadius.md, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
              <DashboardButton
                variant="primary"
                type="submit"
                style={{ width: '100%' }}
              >
                Add Subcategory
              </DashboardButton>
            </form>
          </DashboardCard>
        </div>

        {/* Existing Categories */}
        <div style={{ marginTop: '48px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: colors.textPrimary, marginBottom: '24px' }}>Existing Categories</h2>
          {categories.length === 0 ? (
            <DashboardCard>
              <p style={{ fontSize: '15px', color: colors.textSecondary, textAlign: 'center' }}>
                No categories yet. Add your first category above.
              </p>
            </DashboardCard>
          ) : (
            <div style={{ display: 'grid', gap: '24px' }}>
              {categories.map(category => (
                <DashboardCard key={category.id}>
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
                      {category.name}
                    </h3>
                    {category.description && (
                      <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                        {category.description}
                      </p>
                    )}
                  </div>
                  {category.subcategories.length === 0 ? (
                    <p style={{ fontSize: '14px', color: colors.textSecondary, fontStyle: 'italic' }}>
                      No subcategories yet
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {category.subcategories.map(subcat => (
                        <span
                          key={subcat.id}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: colors.gray100,
                            borderRadius: borderRadius.md,
                            fontSize: '14px',
                            color: colors.textPrimary
                          }}
                        >
                          {subcat.name}
                        </span>
                      ))}
                    </div>
                  )}
                </DashboardCard>
              ))}
            </div>
          )}
        </div>
    </DashboardLayoutWithHeader>
  );
}
