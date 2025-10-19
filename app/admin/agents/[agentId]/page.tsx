import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminAgentDetailClient from './AdminAgentDetailClient';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';

export default async function AdminAgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const user = await getCurrentUser();
  const roles = user?.roles || [];

  if (!user || !roles.includes('ADMIN')) {
    redirect('/');
  }

  const { agentId } = await params;

  // Fetch pending counts for badges
  const prismaAny = prisma as any;
  const [pendingBadgeRequests, pendingAgentApplications, pendingReports] = await Promise.all([
    prismaAny.badgeRequest?.count({
      where: { status: { in: ['PENDING', 'PAYMENT_RECEIVED', 'UNDER_REVIEW'] } }
    }) ?? 0,
    prismaAny.agent?.count({ where: { status: 'PENDING' } }) ?? 0,
    prismaAny.reviewReport?.count({
      where: { status: { in: ['PENDING', 'REVIEWING'] } }
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
      <AdminAgentDetailClient agentId={agentId} />
    </AdminDashboardWrapper>
  );
}
