import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardButton, DashboardCard } from '@/components/DashboardLayout';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { colors } from '@/lib/theme';
import BadgeRequestClient from './client';

export default async function BadgeRequestPage({ params }: { params: Promise<{ badgeId: string }> }) {
    // Auth check
    const user = await getCurrentUser();

    if (!user) {
        redirect('/auth/login');
    }

    // Check if user has FIXER role
    const roles = user.roles || [];
    if (!roles.includes('FIXER')) {
        redirect('/dashboard');
    }

    const { badgeId } = await params;

    try {
        // Fetch badge from database directly using Prisma
        const badge = await (prisma as any).badge.findUnique({
            where: { id: badgeId },
        });

        // If badge not found
        if (!badge) {
            return (
                <DashboardLayoutWithHeader title="Badge Not Found">
                    <DashboardCard>
                        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                            <h2 style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: colors.textPrimary,
                                marginBottom: '16px'
                            }}>
                                Badge Not Found
                            </h2>
                            <p style={{
                                fontSize: '15px',
                                color: colors.textSecondary,
                                marginBottom: '24px'
                            }}>
                                The requested badge could not be found.
                            </p>
                            <DashboardButton variant="primary" href="/fixer/badges">
                                ← Back to Badges
                            </DashboardButton>
                        </div>
                    </DashboardCard>
                </DashboardLayoutWithHeader>
            );
        }

        // Render page with client component for form
        return (
            <DashboardLayoutWithHeader
                title={`Request Badge: ${badge.name}`}
                subtitle="Submit your documents for verification"
                actions={
                    <DashboardButton variant="outline" href="/fixer/badges">
                        ← Back to Badges
                    </DashboardButton>
                }
            >
                <BadgeRequestClient badge={{
                    id: badge.id,
                    name: badge.name,
                    description: badge.description,
                    icon: badge.icon,
                    cost: badge.cost,
                    requiredDocuments: badge.requiredDocuments as string[],
                    expiryMonths: badge.expiryMonths
                }} />
            </DashboardLayoutWithHeader>
        );
    } catch (error) {
        console.error("Error fetching badge:", error);
        return (
            <DashboardLayoutWithHeader title="Error">
                <DashboardCard>
                    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: colors.textPrimary,
                            marginBottom: '16px'
                        }}>
                            Something went wrong
                        </h2>
                        <p style={{
                            fontSize: '15px',
                            color: colors.textSecondary,
                            marginBottom: '24px'
                        }}>
                            There was a problem loading this badge. Please try again later.
                        </p>
                        <DashboardButton variant="primary" href="/fixer/badges">
                            ← Back to Badges
                        </DashboardButton>
                    </div>
                </DashboardCard>
            </DashboardLayoutWithHeader>
        );
    }
}
