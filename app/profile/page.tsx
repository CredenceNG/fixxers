import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import UnifiedProfileForm from './UnifiedProfileForm';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';

export default async function UnifiedProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user roles
  const roles = user.roles || [];

  // Fetch existing profiles if they exist
  const clientProfile = roles.includes('CLIENT')
    ? await prisma.clientProfile.findUnique({
        where: { clientId: user.id },
      })
    : null;

  const fixerProfile = roles.includes('FIXER')
    ? await prisma.fixerProfile.findUnique({
        where: { fixerId: user.id },
      })
    : null;

  // Fetch neighborhoods for location dropdown
  const neighborhoods = await prisma.neighborhood.findMany({
    orderBy: [{ state: 'asc' }, { city: 'asc' }, { name: 'asc' }],
  });

  // Fetch service categories and subcategories for fixer section
  const categories = roles.includes('FIXER')
    ? await prisma.serviceCategory.findMany({
        include: {
          subcategories: {
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      })
    : [];

  // Prepare existing data for form pre-population
  const existingData = {
    // Use fixer profile data as primary source if both exist, otherwise use client
    name: user.name || '',
    primaryPhone: fixerProfile?.primaryPhone || clientProfile?.primaryPhone || '',
    secondaryPhone: fixerProfile?.secondaryPhone || clientProfile?.secondaryPhone || '',
    alternateEmail: clientProfile?.alternateEmail || '',
    streetAddress: fixerProfile?.streetAddress || clientProfile?.streetAddress || '',
    neighbourhood: fixerProfile?.neighbourhood || clientProfile?.neighbourhood || '',
    city: fixerProfile?.city || clientProfile?.city || '',
    state: fixerProfile?.state || clientProfile?.state || '',
    country: fixerProfile?.country || clientProfile?.country || '',
    // Fixer-specific fields
    yearsOfService: fixerProfile?.yearsOfService || 0,
    qualifications: fixerProfile?.qualifications || [],
  };

  return (
    <DashboardLayoutWithHeader>
      <UnifiedProfileForm
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          roles,
        }}
        existingData={existingData}
        neighborhoods={neighborhoods}
        categories={categories}
        hasClientProfile={!!clientProfile}
        hasFixerProfile={!!fixerProfile}
      />
    </DashboardLayoutWithHeader>
  );
}
