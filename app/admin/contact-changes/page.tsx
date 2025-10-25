import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius } from '@/lib/theme';
import ContactChangesClient from './ContactChangesClient';

export default async function AdminContactChangesPage() {
  const user = await getCurrentUser();
  const roles = user?.roles || [];

  if (!user || !roles.includes('ADMIN')) {
    redirect('/auth/login');
  }

  // Fetch pending counts for AdminDashboardWrapper
  const prismaAny = prisma as any;
  const pendingBadgeRequests = await prismaAny.badgeRequest.count({
    where: {
      status: {
        in: ['PENDING', 'PAYMENT_RECEIVED', 'UNDER_REVIEW'],
      },
    },
  });

  const pendingAgentApplications = await prismaAny.agent.count({
    where: {
      status: 'PENDING',
    },
  });

  const pendingReports = await prismaAny.reviewReport.count({
    where: {
      status: {
        in: ['PENDING', 'REVIEWING'],
      },
    },
  });

  // Fetch users with pending contact changes
  const usersWithPendingChanges = await prisma.user.findMany({
    where: {
      OR: [
        { emailChangeRequested: true },
        { phoneChangeRequested: true },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      pendingEmail: true,
      pendingPhone: true,
      emailChangeRequested: true,
      phoneChangeRequested: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  const pendingContactChanges = usersWithPendingChanges.length;

  return (
    <AdminDashboardWrapper
      pendingBadgeRequests={pendingBadgeRequests}
      pendingAgentApplications={pendingAgentApplications}
      pendingReports={pendingReports}
      pendingContactChanges={pendingContactChanges}
    >
      <div style={{ padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: '8px'
          }}>
            Contact Change Requests
          </h1>
          <p style={{ fontSize: '16px', color: colors.textSecondary }}>
            Review and approve user requests to change their email or phone number
          </p>
        </div>

        {usersWithPendingChanges.length === 0 ? (
          <div style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.lg,
            padding: '48px',
            textAlign: 'center',
            border: `1px solid ${colors.border}`
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              ✅
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: colors.textPrimary,
              marginBottom: '8px'
            }}>
              No Pending Requests
            </h3>
            <p style={{ fontSize: '16px', color: colors.textSecondary }}>
              There are no contact change requests at this time.
            </p>
          </div>
        ) : (
          <ContactChangesClient users={usersWithPendingChanges} />
        )}
      </div>
    </AdminDashboardWrapper>
  );
}
