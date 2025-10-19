import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canLeaveReview } from "@/lib/utils/review-window";
import { prisma } from "@/lib/prisma";
import ReviewSubmissionForm from "@/components/ReviewSubmissionForm";

interface PageProps {
    params: Promise<{
        orderId: string;
    }>;
}

export default async function ReviewPage({ params }: PageProps) {
    const { orderId } = await params;
    const user = await getCurrentUser();

    // Redirect if not logged in
    if (!user) {
        redirect(`/auth/login?redirect=/orders/${orderId}/review`);
    }

    // Check if user can leave a review
    const reviewStatus = await canLeaveReview(orderId, user.id);

    if (!reviewStatus.canLeaveReview) {
        return (
            <div style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto" }}>
                <div
                    style={{
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        padding: "20px",
                        marginBottom: "20px",
                    }}
                >
                    <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#991b1b" }}>
                        Cannot Leave Review
                    </h2>
                    <p style={{ margin: 0, color: "#7f1d1d" }}>
                        {reviewStatus.reason}
                    </p>
                </div>
                <a
                    href="/dashboard"
                    style={{
                        display: "inline-block",
                        padding: "10px 20px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "6px",
                    }}
                >
                    Back to Dashboard
                </a>
            </div>
        );
    }

    // Fetch order details
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            fixer: {
                select: {
                    id: true,
                    name: true,
                    profileImage: true,
                },
            },
            request: {
                select: {
                    title: true,
                    description: true,
                },
            },
            gig: {
                select: {
                    title: true,
                    description: true,
                },
            },
        },
    });

    if (!order) {
        redirect("/dashboard");
    }

    return (
        <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ margin: "0 0 8px 0", fontSize: "28px", fontWeight: "bold" }}>
                    Leave a Review
                </h1>
                <p style={{ margin: 0, color: "#6b7280", fontSize: "16px" }}>
                    Share your experience to help others make informed decisions
                </p>
            </div>

            {/* Review Window Alert */}
            {reviewStatus.daysRemaining !== undefined && reviewStatus.daysRemaining <= 7 && (
                <div
                    style={{
                        backgroundColor: "#fffbeb",
                        border: "1px solid #fcd34d",
                        borderRadius: "8px",
                        padding: "16px",
                        marginBottom: "24px",
                    }}
                >
                    <p style={{ margin: 0, color: "#92400e", fontSize: "14px" }}>
                        ⏰ <strong>{reviewStatus.daysRemaining} days remaining</strong> to leave
                        your review
                    </p>
                </div>
            )}

            {/* Order Info */}
            <div
                style={{
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "20px",
                    marginBottom: "32px",
                }}
            >
                <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: 600 }}>
                    Order Details
                </h3>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                    {order.fixer.profileImage && (
                        <img
                            src={order.fixer.profileImage}
                            alt={order.fixer.name || "Fixer"}
                            style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "50%",
                                objectFit: "cover",
                            }}
                        />
                    )}
                    <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>
                            {order.fixer.name || "Fixer"}
                        </p>
                        <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                            Service Provider
                        </p>
                    </div>
                </div>
                <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#374151" }}>
                    <strong>Service:</strong> {order.request?.title || order.gig?.title || "Service"}
                </p>
            </div>

            {/* Review Form */}
            <ReviewSubmissionForm
                orderId={orderId}
                fixerId={order.fixer.id}
                fixerName={order.fixer.name || "this fixer"}
            />
        </div>
    );
}
