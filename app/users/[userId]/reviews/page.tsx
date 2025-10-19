import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReviewList from "@/components/ReviewList";
import { Star, Award, MessageSquare } from "lucide-react";
import Image from "next/image";

interface PageProps {
    params: Promise<{
        userId: string;
    }>;
}

export default async function UserReviewsPage({ params }: PageProps) {
    const { userId } = await params;
    const currentUser = await getCurrentUser();

    // Fetch user details
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            profileImage: true,
        },
    });

    if (!user) {
        notFound();
    }

    // Fetch reviews for this user (where they are the reviewee/fixer)
    const reviews = await prisma.review.findMany({
        where: {
            revieweeId: userId,
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
            ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) /
            totalReviews
            : 0;
    const verifiedReviews = reviews.filter(
        (review: any) => review.isVerified
    ).length;
    const reviewsWithPhotos = reviews.filter(
        (review: any) => review.photos.length > 0
    ).length;
    const reviewsWithResponses = reviews.filter(
        (review: any) => review.responseText
    ).length;

    // Rating distribution
    const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
        stars: rating,
        count: reviews.filter((review: any) => review.rating === rating).length,
        percentage:
            totalReviews > 0
                ? (reviews.filter((review: any) => review.rating === rating).length /
                    totalReviews) *
                100
                : 0,
    }));

    // Transform reviews for ReviewList
    const transformedReviews = reviews.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        photos: review.photos,
        isVerified: review.isVerified,
        isAnonymous: review.isAnonymous,
        responseText: review.responseText,
        respondedAt: review.respondedAt,
        helpfulCount: review.helpfulCount,
        reportCount: review.reportCount,
        createdAt: review.createdAt,
        reviewer: {
            id: review.reviewer.id,
            name: review.reviewer.name,
            profileImage: review.reviewer.profileImage,
        },
        reviewee: {
            id: review.reviewee.id,
            name: review.reviewee.name,
            profileImage: review.reviewee.profileImage,
        },
    }));

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* User Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-4 mb-6">
                        {user.profileImage ? (
                            <Image
                                src={user.profileImage}
                                alt={user.name || "User"}
                                width={80}
                                height={80}
                                className="rounded-full"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-2xl font-semibold text-gray-600">
                                    {user.name?.[0] || "U"}
                                </span>
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                            <p className="text-gray-600">Reviews & Ratings</p>
                        </div>
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Star className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">
                                    Average Rating
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-blue-600">
                                {averageRating.toFixed(1)}
                            </p>
                            <p className="text-xs text-blue-700">
                                from {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                            </p>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Award className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-green-900">
                                    Verified Reviews
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-green-600">
                                {verifiedReviews}
                            </p>
                            <p className="text-xs text-green-700">
                                {totalReviews > 0
                                    ? Math.round((verifiedReviews / totalReviews) * 100)
                                    : 0}
                                % of total
                            </p>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <MessageSquare className="w-5 h-5 text-purple-600" />
                                <span className="text-sm font-medium text-purple-900">
                                    Response Rate
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-purple-600">
                                {totalReviews > 0
                                    ? Math.round((reviewsWithResponses / totalReviews) * 100)
                                    : 0}
                                %
                            </p>
                            <p className="text-xs text-purple-700">
                                {reviewsWithResponses} response
                                {reviewsWithResponses !== 1 ? "s" : ""}
                            </p>
                        </div>

                        <div className="bg-orange-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Star className="w-5 h-5 text-orange-600 fill-orange-600" />
                                <span className="text-sm font-medium text-orange-900">
                                    With Photos
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-orange-600">
                                {reviewsWithPhotos}
                            </p>
                            <p className="text-xs text-orange-700">
                                {totalReviews > 0
                                    ? Math.round((reviewsWithPhotos / totalReviews) * 100)
                                    : 0}
                                % of total
                            </p>
                        </div>
                    </div>
                </div>

                {/* Rating Distribution */}
                {totalReviews > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Rating Distribution
                        </h2>
                        <div className="space-y-2">
                            {ratingDistribution.map(({ stars, count, percentage }) => (
                                <div key={stars} className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 w-20">
                                        <span className="text-sm font-medium text-gray-700">
                                            {stars}
                                        </span>
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    </div>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-yellow-400 h-full rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-600 w-12 text-right">
                                        {count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reviews List */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">
                        All Reviews
                    </h2>
                    <ReviewList
                        reviews={transformedReviews}
                        currentUserId={currentUser?.id}
                        showFilters={true}
                    />
                </div>
            </div>
        </div>
    );
}
