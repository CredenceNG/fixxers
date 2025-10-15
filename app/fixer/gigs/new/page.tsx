import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { DashboardLayout, DashboardCard, DashboardButton } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';
import { CreateGigForm } from './CreateGigForm';

export default async function NewGigPage() {
  const user = await getCurrentUser();
  const roles = user?.roles || [];

  if (!user || !roles.includes('FIXER')) {
    redirect('/auth/login');
  }

  if (user.status !== 'ACTIVE') {
    redirect('/fixer/pending');
  }

  // Fetch categories and subcategories
  const categories = await prisma.serviceCategory.findMany({
    include: {
      subcategories: {
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <DashboardLayout
      title="Create New Service Offer"
      subtitle="Create a professional service offer to attract clients"
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
                Tips for creating a great service offer
              </h3>
              <ul style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: '1.6', marginLeft: '20px' }}>
                <li>Use a clear, descriptive title that highlights what you offer</li>
                <li>Write a detailed description explaining your service and process</li>
                <li>Add high-quality images showcasing your work</li>
                <li>Offer 3 package tiers (Basic, Standard, Premium) at different price points</li>
                <li>Set realistic delivery times you can consistently meet</li>
              </ul>
            </div>
          </div>
        </DashboardCard>

        <CreateGigForm categories={categories} />
      </div>
    </DashboardLayout>
  );
}
