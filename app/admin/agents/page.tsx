import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import AdminAgentsClient from './AdminAgentsClient';
import { prisma } from '@/lib/prisma';

export default async function AdminAgentsPage() {
  const user = await getCurrentUser();

  const roles = user?.roles || [];
  if (!user || !roles.includes('ADMIN')) {
    redirect('/');
  }

  // Use prismaAny for tables that might not be in schema yet
  const prismaAny = prisma as any;

  // Fetch pending counts for AdminDashboardWrapper
  const [pendingBadgeRequests, pendingAgentApplications, pendingReports] = await Promise.all([
    prismaAny.badgeRequest?.count({
      where: {
        status: {
          in: ['PENDING', 'PAYMENT_RECEIVED', 'UNDER_REVIEW'],
        },
      },
    }) ?? 0,
    prismaAny.agent?.count({
      where: {
        status: 'PENDING',
      },
    }) ?? 0,
    prismaAny.reviewReport?.count({
      where: {
        status: {
          in: ['PENDING', 'REVIEWING'],
        },
      },
    }) ?? 0,
  ]);

  return (
    <AdminDashboardWrapper
      userName={user.name || undefined}
      userAvatar={user.profileImage || undefined}
      pendingBadgeRequests={pendingBadgeRequests}
      pendingAgentApplications={pendingAgentApplications}
      pendingReports={pendingReports}
    >
      <AdminAgentsClient />
    </AdminDashboardWrapper>
  );
}
