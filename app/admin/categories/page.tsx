import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
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

  // Fetch pending counts for AdminDashboardWrapper
  const prismaAny = prisma as any;

  const pendingBadgeRequests = await prismaAny.badgeRequest.count({
    where: {
      status: { in: ['PENDING', 'PAYMENT_RECEIVED', 'UNDER_REVIEW'] }
    }
  });

  const pendingAgentApplications = await prismaAny.agent.count({
    where: {
      status: 'PENDING'
    }
  });

  const pendingReports = await prismaAny.reviewReport.count({
    where: {
      status: { in: ['PENDING', 'REVIEWING'] }
    }
  });

  return (
    <AdminDashboardWrapper
      userName={user.name || undefined}
      userAvatar={user.profileImage || undefined}
      pendingBadgeRequests={pendingBadgeRequests}
      pendingAgentApplications={pendingAgentApplications}
      pendingReports={pendingReports}
    >
      {/* Page Header */}
      <div className="admin-categories-header">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
            Manage Service Categories
          </h1>
          <p style={{ fontSize: '15px', color: colors.textSecondary }}>
            Add and organize service categories and subcategories
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          style={{
            padding: '10px 20px',
            fontSize: '15px',
            fontWeight: '600',
            color: colors.primary,
            backgroundColor: 'white',
            border: `1px solid ${colors.primary}`,
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>
      {/* Success/Error Messages */}
      {success === 'category_added' && (
        <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: colors.primaryLight, border: `1px solid ${colors.primary}`, borderRadius: borderRadius.md }}>
          <p style={{ fontSize: '15px', color: colors.primaryDark, fontWeight: '600', margin: 0 }}>
            ✓ Category added successfully!
          </p>
        </div>
      )}
      {success === 'subcategory_added' && (
        <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: colors.primaryLight, border: `1px solid ${colors.primary}`, borderRadius: borderRadius.md }}>
          <p style={{ fontSize: '15px', color: colors.primaryDark, fontWeight: '600', margin: 0 }}>
            ✓ Subcategory added successfully!
          </p>
        </div>
      )}
      {error && (
        <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#FDEDEC', border: `1px solid ${colors.error}`, borderRadius: borderRadius.md }}>
          <p style={{ fontSize: '15px', color: '#922B21', fontWeight: '600', margin: 0 }}>
            ✗ Error: {error === 'duplicate' ? 'Category or subcategory already exists' : 'Failed to add category'}
          </p>
        </div>
      )}

      <div className="admin-categories-grid">
        {/* Add New Category */}
        <div style={{ padding: '24px', backgroundColor: 'white', border: `1px solid ${colors.border}`, borderRadius: borderRadius.lg, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: colors.primary,
                border: 'none',
                borderRadius: borderRadius.md,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Add Category
            </button>
          </form>
        </div>

        {/* Add New Subcategory */}
        <div style={{ padding: '24px', backgroundColor: 'white', border: `1px solid ${colors.border}`, borderRadius: borderRadius.lg, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: colors.primary,
                border: 'none',
                borderRadius: borderRadius.md,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Add Subcategory
            </button>
          </form>
        </div>
      </div>

      {/* Existing Categories */}
      <div style={{ marginTop: '48px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: colors.textPrimary, marginBottom: '24px' }}>Existing Categories</h2>
        {categories.length === 0 ? (
          <div style={{ padding: '24px', backgroundColor: 'white', border: `1px solid ${colors.border}`, borderRadius: borderRadius.lg, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '15px', color: colors.textSecondary, textAlign: 'center' }}>
              No categories yet. Add your first category above.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '24px' }}>
            {categories.map(category => (
              <div key={category.id} style={{ padding: '24px', backgroundColor: 'white', border: `1px solid ${colors.border}`, borderRadius: borderRadius.lg, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminDashboardWrapper>
  );
}
