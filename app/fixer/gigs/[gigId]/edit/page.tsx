import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton } from '@/components/DashboardLayout';
import { colors } from '@/lib/theme';
import { EditGigForm } from './EditGigForm';

export default async function EditGigPage({ params }: { params: Promise<{ gigId: string }> }) {
  const user = await getCurrentUser();
  const roles = user?.roles || [];

  if (!user || !roles.includes('FIXER')) {
    redirect('/auth/login');
  }

  const { gigId } = await params;

  // Fetch the gig
  const gig = await prisma.gig.findUnique({
    where: { id: gigId },
    include: {
      packages: {
        orderBy: { price: 'asc' },
      },
      subcategory: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!gig) {
    redirect('/fixer/gigs');
  }

  // Verify ownership
  if (gig.sellerId !== user.id) {
    redirect('/fixer/gigs');
  }

  // Fetch categories for the form
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
      title="Edit Service Offer"
      subtitle="Update your service offer details"
      actions={
        <Link href="/fixer/gigs">
          <DashboardButton variant="outline">← Back to My Gigs</DashboardButton>
        </Link>
      }
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Info Banner */}
        <DashboardCard style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
            <span style={{ fontSize: '32px' }}>💡</span>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
                Editing your service offer
              </h3>
              <ul style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: '1.6', marginLeft: '20px' }}>
                <li>Changes to active gigs will require admin review before going live</li>
                <li>Update package prices carefully - existing orders won't be affected</li>
                <li>Make sure to save your changes before leaving the page</li>
              </ul>
            </div>
          </div>
        </DashboardCard>

        <EditGigForm gig={gig} categories={categories} />
      </div>
    </DashboardLayoutWithHeader>
  );
}
