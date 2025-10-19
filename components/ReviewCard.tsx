"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Star, CheckCircle, Camera, ThumbsUp, Flag, Loader2, X } from "lucide-react";
import Image from "next/image";
import ReviewResponseDisplay from "./ReviewResponseDisplay";
import ReviewResponseForm from "./ReviewResponseForm";
import ReviewPhotoGallery from "./ReviewPhotoGallery";

interface ReviewCardProps {
    review: {
        id: string;
        rating: number;
        comment: string | null;
        photos: string[];
        isVerified: boolean;
        isAnonymous: boolean;
        responseText: string | null;
        respondedAt: Date | string | null;
        helpfulCount: number;
        createdAt: Date | string;
        reviewer: {
            id: string;
            name: string | null;
            profileImage: string | null;
        };
        reviewee: {
            id: string;
            name: string | null;
            profileImage: string | null;
        };
    };
    currentUserId?: string;
    onResponseUpdated?: () => void;
}

export default function ReviewCard({
    review,
    currentUserId,
    onResponseUpdated,
}: ReviewCardProps) {
    const [key, setKey] = useState(0); // Force re-render after response update
    const [isHelpful, setIsHelpful] = useState(false);
    const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
    const [isHelpfulLoading, setIsHelpfulLoading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [isReportLoading, setIsReportLoading] = useState(false);
    const [reportError, setReportError] = useState("");
    const [reportSuccess, setReportSuccess] = useState(false);

    const isReviewee = currentUserId === review.reviewee.id;
    const createdAt = typeof review.createdAt === "string" ? new Date(review.createdAt) : review.createdAt;
    const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

    // Check if current user marked as helpful
    useEffect(() => {
        if (!currentUserId) return;

        fetch(`/api/reviews/${review.id}/helpful`)
            .then((res) => res.json())
            .then((data) => setIsHelpful(data.isHelpful))
            .catch(console.error);
    }, [review.id, currentUserId]);

    // Render star rating
    const renderStars = () => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-5 h-5 ${star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                    />
                ))}
            </div>
        );
    };

    const handleResponseUpdated = () => {
        setKey((prev) => prev + 1); // Force re-render
        if (onResponseUpdated) {
            onResponseUpdated();
        }
    };

    const handleHelpfulClick = async () => {
        if (!currentUserId) {
            alert("Please log in to mark reviews as helpful");
            return;
        }

        setIsHelpfulLoading(true);
        try {
            const response = await fetch(`/api/reviews/${review.id}/helpful`, {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Failed to update helpful status");
            }

            const data = await response.json();
            setIsHelpful(data.action === "added");
            setHelpfulCount(data.helpfulCount);
        } catch (error) {
            console.error("Error toggling helpful:", error);
            alert("Failed to update. Please try again.");
        } finally {
            setIsHelpfulLoading(false);
        }
    };

    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUserId) {
            alert("Please log in to report reviews");
            return;
        }

        if (reportReason.trim().length < 10) {
            setReportError("Please provide a reason (at least 10 characters)");
            return;
        }

        setIsReportLoading(true);
        setReportError("");

        try {
            const response = await fetch(`/api/reviews/${review.id}/report`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reason: reportReason }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit report");
            }

            setReportSuccess(true);
            setTimeout(() => {
                setShowReportModal(false);
                setReportReason("");
                setReportSuccess(false);
            }, 2000);
        } catch (error) {
            setReportError(error instanceof Error ? error.message : "Failed to submit report");
        } finally {
            setIsReportLoading(false);
        }
    };

    return (
        <div key={key} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            {/* Review Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                    {/* Reviewer Avatar */}
                    {!review.isAnonymous && review.reviewer.profileImage ? (
                        <Image
                            src={review.reviewer.profileImage}
                            alt={review.reviewer.name || "Reviewer"}
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-600 font-semibold">
                                {review.isAnonymous ? "A" : (review.reviewer.name?.charAt(0).toUpperCase() || "?")}
                            </span>
                        </div>
                    )}

                    {/* Reviewer Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                                {review.isAnonymous ? "Anonymous" : (review.reviewer.name || "Client")}
                            </h3>
                            {review.isVerified && (
                                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                    <CheckCircle className="w-3 h-3" />
                                    Verified
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {renderStars()}
                            <span className="text-xs text-gray-500">• {timeAgo}</span>
                        </div>
                    </div>
                </div>

                {/* Review for label */}
                <div className="text-xs text-gray-500 ml-4">
                    Review for {review.reviewee.name}
                </div>
            </div>

            {/* Review Comment */}
            {review.comment && (
                <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {review.comment}
                    </p>
                </div>
            )}

            {/* Review Photos */}
            {review.photos && review.photos.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Camera className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                            {review.photos.length} {review.photos.length === 1 ? "Photo" : "Photos"}
                        </span>
                    </div>
                    <ReviewPhotoGallery photos={review.photos} />
                </div>
            )}

            {/* Fixer Response */}
            {review.responseText && review.respondedAt && (
                <ReviewResponseDisplay
                    responseText={review.responseText}
                    respondedAt={review.respondedAt}
                    fixerName={review.reviewee.name || "Service Provider"}
                    fixerImage={review.reviewee.profileImage}
                />
            )}

            {/* Response Form (only for reviewee/fixer) */}
            {isReviewee && (
                <div className="mt-4">
                    <ReviewResponseForm
                        reviewId={review.id}
                        existingResponse={review.responseText}
                        fixerName={review.reviewee.name || "You"}
                        onResponseSubmitted={handleResponseUpdated}
                    />
                </div>
            )}

            {/* Review Actions */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                <button
                    onClick={handleHelpfulClick}
                    disabled={isHelpfulLoading}
                    className={`flex items-center gap-2 text-sm transition-colors ${isHelpful
                            ? "text-blue-600 font-medium"
                            : "text-gray-600 hover:text-blue-600"
                        }`}
                >
                    {isHelpfulLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <ThumbsUp className={`w-4 h-4 ${isHelpful ? "fill-blue-600" : ""}`} />
                    )}
                    <span>
                        {isHelpful ? "Helpful" : "Mark as Helpful"} ({helpfulCount})
                    </span>
                </button>
                <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                    <Flag className="w-4 h-4" />
                    <span>Report</span>
                </button>
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Report Review</h3>
                            <button
                                onClick={() => {
                                    setShowReportModal(false);
                                    setReportReason("");
                                    setReportError("");
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {reportSuccess ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <p className="text-green-600 font-medium">Report submitted successfully!</p>
                                <p className="text-sm text-gray-600 mt-1">We'll review it shortly.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleReportSubmit}>
                                <p className="text-sm text-gray-600 mb-4">
                                    Help us understand what's wrong with this review. Your report will be
                                    reviewed by our moderation team.
                                </p>

                                <textarea
                                    value={reportReason}
                                    onChange={(e) => {
                                        setReportReason(e.target.value);
                                        setReportError("");
                                    }}
                                    placeholder="Please describe the issue (minimum 10 characters)..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                    rows={4}
                                    maxLength={500}
                                    disabled={isReportLoading}
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    {reportReason.length}/500 characters
                                </div>

                                {reportError && (
                                    <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                                        {reportError}
                                    </div>
                                )}

                                <div className="flex gap-3 mt-4">
                                    <button
                                        type="submit"
                                        disabled={isReportLoading || reportReason.trim().length < 10}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                                    >
                                        {isReportLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Flag className="w-4 h-4" />
                                                Submit Report
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowReportModal(false);
                                            setReportReason("");
                                            setReportError("");
                                        }}
                                        disabled={isReportLoading}
                                        className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
