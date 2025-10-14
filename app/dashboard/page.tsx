import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import UnifiedDashboard from './UnifiedDashboard';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user roles
  const roles = user.roles || [user.role];

  // If user only has one role, redirect to the specific dashboard
  if (roles.length === 1) {
    const role = roles[0];
    if (role === 'ADMIN') {
      redirect('/admin/dashboard');
    } else if (role === 'FIXER') {
      redirect('/fixer/dashboard');
    } else if (role === 'CLIENT') {
      redirect('/client/dashboard');
    }
  }

  // User has multiple roles - show unified dashboard
  return <UnifiedDashboard user={{ id: user.id, name: user.name, email: user.email, roles }} />;
}
