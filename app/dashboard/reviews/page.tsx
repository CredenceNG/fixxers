import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ReviewCard from "@/components/ReviewCard";
import DashboardLayoutWithHeader from "@/components/DashboardLayoutWithHeader";
import { DashboardCard, DashboardStat } from "@/components/DashboardLayout";
import { colors } from "@/lib/theme";

export default async function FixerReviewsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/auth/login");
    }

    // Fetch reviews for the current user (as reviewee/fixer)
    const reviews = await prisma.review.findMany({
        where: {
            revieweeId: user.id,
        },
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
        orderBy: {
            createdAt: "desc",
        },
    });

    // Calculate statistics
    const totalReviews = reviews.length;
    const averageRating =
        totalReviews > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
    const responseCount = reviews.filter((r) => r.responseText).length;
    const responseRate = totalReviews > 0 ? (responseCount / totalReviews) * 100 : 0;

    return (
        <DashboardLayoutWithHeader
            title="Your Reviews"
            subtitle="Manage and respond to reviews from your clients"
        >
            {/* Statistics Grid */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                }}>
                    <DashboardStat
                        label="Total Reviews"
                        value={totalReviews.toString()}
                        color={colors.primary}
                    />
                    <DashboardStat
                        label="Average Rating"
                        value={averageRating.toFixed(1)}
                        color="#f59e0b"
                    />
                    <DashboardStat
                        label="Response Rate"
                        value={`${responseRate.toFixed(0)}%`}
                        color={colors.success}
                    />
                </div>
            </div>

            {/* Reviews List */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}>
                {reviews.length === 0 ? (
                    <DashboardCard>
                        <div style={{
                            textAlign: 'center',
                            padding: '48px 24px'
                        }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                margin: '0 auto 16px',
                                color: colors.gray300
                            }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                            </div>
                            <h3 style={{
                                fontSize: '20px',
                                fontWeight: '600',
                                color: colors.textPrimary,
                                marginBottom: '8px'
                            }}>
                                No reviews yet
                            </h3>
                            <p style={{
                                fontSize: '14px',
                                color: colors.textSecondary
                            }}>
                                Reviews from your clients will appear here once they complete orders.
                            </p>
                        </div>
                    </DashboardCard>
                ) : (
                    <>
                        {/* Unanswered Reviews Section */}
                        {reviews.some((r) => !r.responseText) && (
                            <div>
                                <h2 style={{
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    color: colors.textPrimary,
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span style={{ color: '#f97316' }}>●</span>
                                    Needs Response ({reviews.filter((r) => !r.responseText).length})
                                </h2>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px'
                                }}>
                                    {reviews
                                        .filter((r) => !r.responseText)
                                        .map((review) => (
                                            <ReviewCard
                                                key={review.id}
                                                review={review}
                                                currentUserId={user.id}
                                            />
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Responded Reviews Section */}
                        {reviews.some((r) => r.responseText) && (
                            <div style={{
                                marginTop: reviews.some((r) => !r.responseText) ? '32px' : '0'
                            }}>
                                <h2 style={{
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    color: colors.textPrimary,
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span style={{ color: colors.success }}>●</span>
                                    Responded ({reviews.filter((r) => r.responseText).length})
                                </h2>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px'
                                }}>
                                    {reviews
                                        .filter((r) => r.responseText)
                                        .map((review) => (
                                            <ReviewCard
                                                key={review.id}
                                                review={review}
                                                currentUserId={user.id}
                                            />
                                        ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayoutWithHeader>
    );
}
