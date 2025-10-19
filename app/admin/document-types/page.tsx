import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import DocumentTypesManager from './DocumentTypesManager';

export default async function DocumentTypesPage() {
  const user = await getCurrentUser();

  if (!user || !user.roles?.includes('ADMIN')) {
    redirect('/auth/login');
  }

  return (
    <AdminDashboardWrapper>
      <DocumentTypesManager />
    </AdminDashboardWrapper>
  );
}
