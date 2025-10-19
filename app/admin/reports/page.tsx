import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReportQueueClient from "@/components/ReportQueueClient";
import { ReviewReportStatus } from "@prisma/client";
import AdminDashboardWrapper from "@/components/layouts/AdminDashboardWrapper";
import { colors } from "@/lib/theme";

export const dynamic = "force-dynamic";

const prismaAny = prisma as any;

export default async function AdminReportsPage() {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    if (!user || !roles.includes('ADMIN')) {
        redirect('/auth/login');
    }

    // Fetch pending counts for badges
    const pendingBadgeRequests = await prismaAny.badgeRequest.count({
        where: {
            status: {
                in: ['PENDING', 'PAYMENT_RECEIVED', 'UNDER_REVIEW']
            }
        },
    });

    const pendingAgentApplications = await prismaAny.agent.count({
        where: {
            status: 'PENDING'
        },
    });

    const pendingReports = await prisma.reviewReport.count({
        where: {
            status: {
                in: ['PENDING', 'REVIEWING']
            }
        },
    });

    // Fetch all reports with related data
    const reports = await prisma.reviewReport.findMany({
        include: {
            review: {
                include: {
                    reviewer: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true,
                        },
                    },
                    reviewee: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true,
                        },
                    },
                },
            },
            reporter: {
                select: {
                    id: true,
                    name: true,
                    profileImage: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // Calculate statistics
    const stats = {
        total: reports.length,
        pending: reports.filter((r) => r.status === ReviewReportStatus.PENDING)
            .length,
        reviewing: reports.filter((r) => r.status === ReviewReportStatus.REVIEWING)
            .length,
        resolved: reports.filter((r) => r.status === ReviewReportStatus.RESOLVED)
            .length,
        dismissed: reports.filter((r) => r.status === ReviewReportStatus.DISMISSED)
            .length,
    };

    // Transform reports for client
    const transformedReports = reports.map((report) => ({
        id: report.id,
        reason: report.reason,
        status: report.status,
        resolution: report.resolution,
        createdAt: report.createdAt.toISOString(),
        resolvedAt: report.resolvedAt?.toISOString() || null,
        reporter: {
            id: report.reporter.id,
            name: report.reporter.name,
            profileImage: report.reporter.profileImage,
        },
        review: {
            id: report.review.id,
            rating: report.review.rating,
            comment: report.review.comment,
            photos: report.review.photos,
            isVerified: report.review.isVerified,
            isAnonymous: report.review.isAnonymous,
            createdAt: report.review.createdAt.toISOString(),
            helpfulCount: report.review.helpfulCount,
            reportCount: report.review.reportCount,
            reviewer: {
                id: report.review.reviewer.id,
                name: report.review.reviewer.name,
                profileImage: report.review.reviewer.profileImage,
            },
            reviewee: {
                id: report.review.reviewee.id,
                name: report.review.reviewee.name,
                profileImage: report.review.reviewee.profileImage,
            },
        },
    }));

    const cardStyle = {
        backgroundColor: colors.white,
        padding: '24px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    };

    const statCardStyle = {
        ...cardStyle,
        borderLeft: `4px solid ${colors.primary}`,
    };

    return (
        <AdminDashboardWrapper
            userName={user.name || 'Admin'}
            userAvatar={user.profileImage || undefined}
            pendingBadgeRequests={pendingBadgeRequests}
            pendingAgentApplications={pendingAgentApplications}
            pendingReports={pendingReports}
        >
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
                    Review Moderation
                </h1>
                <p style={{ fontSize: '16px', color: colors.textLight }}>
                    Review and manage reported reviews to maintain community standards
                </p>
            </div>

            {/* Statistics Grid */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
                    Report Statistics
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
                    <div style={statCardStyle}>
                        <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
                            Total Reports
                        </p>
                        <p style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
                            {stats.total}
                        </p>
                        <p style={{ fontSize: '13px', color: colors.textLight }}>
                            All time
                        </p>
                    </div>

                    <div style={{ ...statCardStyle, borderLeftColor: '#f97316' }}>
                        <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
                            Pending
                        </p>
                        <p style={{ fontSize: '32px', fontWeight: '700', color: '#f97316', marginBottom: '4px' }}>
                            {stats.pending}
                        </p>
                        <p style={{ fontSize: '13px', color: colors.textLight }}>
                            Awaiting review
                        </p>
                    </div>

                    <div style={{ ...statCardStyle, borderLeftColor: '#007bff' }}>
                        <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
                            Reviewing
                        </p>
                        <p style={{ fontSize: '32px', fontWeight: '700', color: '#007bff', marginBottom: '4px' }}>
                            {stats.reviewing}
                        </p>
                        <p style={{ fontSize: '13px', color: colors.textLight }}>
                            In progress
                        </p>
                    </div>

                    <div style={{ ...statCardStyle, borderLeftColor: '#28a745' }}>
                        <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
                            Resolved
                        </p>
                        <p style={{ fontSize: '32px', fontWeight: '700', color: '#28a745', marginBottom: '4px' }}>
                            {stats.resolved}
                        </p>
                        <p style={{ fontSize: '13px', color: colors.textLight }}>
                            Action taken
                        </p>
                    </div>

                    <div style={{ ...statCardStyle, borderLeftColor: '#6c757d' }}>
                        <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
                            Dismissed
                        </p>
                        <p style={{ fontSize: '32px', fontWeight: '700', color: '#6c757d', marginBottom: '4px' }}>
                            {stats.dismissed}
                        </p>
                        <p style={{ fontSize: '13px', color: colors.textLight }}>
                            No action needed
                        </p>
                    </div>
                </div>
            </div>

            {/* Report Queue */}
            <div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
                    Report Queue
                </h2>
                <div style={cardStyle}>
                    <ReportQueueClient reports={transformedReports} />
                </div>
            </div>
        </AdminDashboardWrapper>
    );
}
