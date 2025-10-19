import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { UpgradeToFixerForm } from './UpgradeToFixerForm';

export default async function UpgradeToFixerPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user has CLIENT role
  const roles = user.roles || [];
  if (!roles.includes('CLIENT')) {
    redirect('/auth/login');
  }

  // If user already has FIXER role, redirect to fixer dashboard
  if (roles.includes('FIXER')) {
    redirect('/fixer/dashboard');
  }

  return (
    <DashboardLayoutWithHeader
      title="Become a Service Provider"
      subtitle="Expand your opportunities by offering services on our platform"
    >
      <UpgradeToFixerForm />
    </DashboardLayoutWithHeader>
  );
}
