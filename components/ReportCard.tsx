"use client";

import { useState } from "react";
import { ReviewReportStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import {
    Star,
    Flag,
    CheckCircle,
    XCircle,
    Trash2,
    Loader2,
    AlertTriangle,
    User,
    Calendar,
    MessageSquare,
    Camera,
    Shield,
} from "lucide-react";
import ReviewPhotoGallery from "./ReviewPhotoGallery";

interface Report {
    id: string;
    reason: string;
    status: ReviewReportStatus;
    resolution: string | null;
    createdAt: string;
    resolvedAt: string | null;
    reporter: {
        id: string;
        name: string | null;
        profileImage: string | null;
    };
    review: {
        id: string;
        rating: number;
        comment: string | null;
        photos: string[];
        isVerified: boolean;
        isAnonymous: boolean;
        createdAt: string;
        helpfulCount: number;
        reportCount: number;
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
}

interface ReportCardProps {
    report: Report;
    onUpdate: (reportId: string, updatedReport: Report) => void;
    onDelete: (reportId: string) => void;
}

export default function ReportCard({ report, onUpdate, onDelete }: ReportCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [resolution, setResolution] = useState(report.resolution || "");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const getStatusColor = (status: ReviewReportStatus) => {
        switch (status) {
            case "PENDING":
                return "bg-orange-100 text-orange-800 border-orange-200";
            case "REVIEWING":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "RESOLVED":
                return "bg-green-100 text-green-800 border-green-200";
            case "DISMISSED":
                return "bg-gray-100 text-gray-800 border-gray-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const handleUpdateStatus = async (newStatus: ReviewReportStatus) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/reports/${report.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: newStatus,
                    resolution: resolution.trim() || null,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update report");
            }

            const data = await response.json();
            onUpdate(report.id, {
                ...report,
                status: newStatus,
                resolution: resolution.trim() || null,
                resolvedAt: new Date().toISOString(),
            });
            alert(`Report ${newStatus.toLowerCase()} successfully!`);
        } catch (error) {
            console.error("Error updating report:", error);
            alert(error instanceof Error ? error.message : "Failed to update report");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteReview = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/reports/${report.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete review");
            }

            onDelete(report.id);
            alert("Review deleted successfully!");
        } catch (error) {
            console.error("Error deleting review:", error);
            alert(error instanceof Error ? error.message : "Failed to delete review");
        } finally {
            setIsLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Report Header */}
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <Flag className="w-5 h-5 text-red-600" />
                            <span className="font-semibold text-red-900">Report Details</span>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                    report.status
                                )}`}
                            >
                                {report.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                            <span className="font-medium">Reason:</span> {report.reason}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Reported by: {report.reporter.name || "Unknown"}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDistanceToNow(new Date(report.createdAt), {
                                    addSuffix: true,
                                })}
                            </span>
                            {report.resolvedAt && (
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Resolved {formatDistanceToNow(new Date(report.resolvedAt), {
                                        addSuffix: true,
                                    })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Content */}
            <div className="p-6 bg-white">
                <div className="flex items-start gap-4">
                    {/* Reviewer Avatar */}
                    <div className="flex-shrink-0">
                        {!report.review.isAnonymous && report.review.reviewer.profileImage ? (
                            <Image
                                src={report.review.reviewer.profileImage}
                                alt={report.review.reviewer.name || "Reviewer"}
                                width={48}
                                height={48}
                                className="rounded-full"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-6 h-6 text-gray-500" />
                            </div>
                        )}
                    </div>

                    {/* Review Details */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">
                                {report.review.isAnonymous
                                    ? "Anonymous"
                                    : report.review.reviewer.name || "Unknown"}
                            </span>
                            {report.review.isVerified && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Verified</span>
                                </div>
                            )}
                            <span className="text-sm text-gray-500">
                                reviewed {report.review.reviewee.name || "Unknown"}
                            </span>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-3">
                            {[...Array(5)].map((_, index) => (
                                <Star
                                    key={index}
                                    className={`w-5 h-5 ${index < report.review.rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                />
                            ))}
                            <span className="text-sm text-gray-600 ml-2">
                                {formatDistanceToNow(new Date(report.review.createdAt), {
                                    addSuffix: true,
                                })}
                            </span>
                        </div>

                        {/* Comment */}
                        {report.review.comment && (
                            <div className="mb-3">
                                <p className="text-gray-700 whitespace-pre-wrap">
                                    {report.review.comment}
                                </p>
                            </div>
                        )}

                        {/* Photos */}
                        {report.review.photos.length > 0 && (
                            <div className="mb-3">
                                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                                    <Camera className="w-4 h-4" />
                                    <span>{report.review.photos.length} photo(s)</span>
                                </div>
                                <ReviewPhotoGallery photos={report.review.photos} />
                            </div>
                        )}

                        {/* Review Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                {report.review.helpfulCount} helpful
                            </span>
                            <span className="flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                {report.review.reportCount} report(s)
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Moderator Notes */}
            {(showNotes || report.resolution) && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Moderator Notes
                    </label>
                    <textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="Add notes about this moderation action..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                        rows={3}
                        disabled={isLoading}
                    />
                </div>
            )}

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                    {!showNotes && !report.resolution && (
                        <button
                            onClick={() => setShowNotes(true)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={isLoading}
                        >
                            <Shield className="w-4 h-4 inline mr-1" />
                            Add Notes
                        </button>
                    )}

                    {report.status === "PENDING" && (
                        <>
                            <button
                                onClick={() => handleUpdateStatus(ReviewReportStatus.REVIEWING)}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Shield className="w-4 h-4" />
                                )}
                                Start Review
                            </button>
                        </>
                    )}

                    {(report.status === "PENDING" || report.status === "REVIEWING") && (
                        <>
                            <button
                                onClick={() => handleUpdateStatus(ReviewReportStatus.RESOLVED)}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="w-4 h-4" />
                                )}
                                Resolve (Keep Review)
                            </button>

                            <button
                                onClick={() => handleUpdateStatus(ReviewReportStatus.DISMISSED)}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <XCircle className="w-4 h-4" />
                                )}
                                Dismiss Report
                            </button>

                            {!showDeleteConfirm ? (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Review
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                                    <span className="text-sm text-red-900">Confirm delete?</span>
                                    <button
                                        onClick={handleDeleteReview}
                                        disabled={isLoading}
                                        className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:bg-gray-300"
                                    >
                                        Yes, Delete
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={isLoading}
                                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {(report.status === "RESOLVED" || report.status === "DISMISSED") && (
                        <button
                            onClick={() => handleUpdateStatus(ReviewReportStatus.PENDING)}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Reopen Report
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
