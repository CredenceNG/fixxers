"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReviewPhotoUpload from "./ReviewPhotoUpload";
import { Star } from "lucide-react";

interface ReviewSubmissionFormProps {
    orderId: string;
    fixerId: string;
    fixerName: string;
}

export default function ReviewSubmissionForm({
    orderId,
    fixerId,
    fixerName,
}: ReviewSubmissionFormProps) {
    const router = useRouter();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [photos, setPhotos] = useState<string[]>([]);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (rating === 0) {
            setError("Please select a star rating");
            return;
        }

        if (comment.trim().length < 50) {
            setError("Review comment must be at least 50 characters");
            return;
        }

        if (comment.trim().length > 2000) {
            setError("Review comment must be less than 2000 characters");
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch("/api/reviews/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId,
                    fixerId,
                    rating,
                    comment: comment.trim(),
                    photos,
                    isAnonymous,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit review");
            }

            // Success! Redirect to order page or success page
            router.push(`/dashboard?reviewSubmitted=true`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit review");
            setSubmitting(false);
        }
    };

    const charCount = comment.length;
    const charMin = 50;
    const charMax = 2000;

    return (
        <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
                <div
                    style={{
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        padding: "16px",
                        marginBottom: "24px",
                    }}
                >
                    <p style={{ margin: 0, color: "#991b1b", fontSize: "14px" }}>
                        {error}
                    </p>
                </div>
            )}

            {/* Star Rating */}
            <div style={{ marginBottom: "32px" }}>
                <label
                    style={{
                        display: "block",
                        marginBottom: "12px",
                        fontSize: "16px",
                        fontWeight: 600,
                    }}
                >
                    Rating <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#6b7280" }}>
                    How would you rate your experience with {fixerName}?
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                            }}
                        >
                            <Star
                                size={40}
                                fill={
                                    star <= (hoverRating || rating) ? "#fbbf24" : "transparent"
                                }
                                stroke={
                                    star <= (hoverRating || rating) ? "#fbbf24" : "#d1d5db"
                                }
                                strokeWidth={2}
                            />
                        </button>
                    ))}
                </div>
                {rating > 0 && (
                    <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#6b7280" }}>
                        {rating === 5 && "Excellent!"}
                        {rating === 4 && "Very Good"}
                        {rating === 3 && "Good"}
                        {rating === 2 && "Fair"}
                        {rating === 1 && "Poor"}
                    </p>
                )}
            </div>

            {/* Comment */}
            <div style={{ marginBottom: "32px" }}>
                <label
                    htmlFor="comment"
                    style={{
                        display: "block",
                        marginBottom: "12px",
                        fontSize: "16px",
                        fontWeight: 600,
                    }}
                >
                    Your Review <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#6b7280" }}>
                    Share details about your experience to help others
                </p>
                <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you like? What could be improved? Be specific and helpful..."
                    rows={8}
                    style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontFamily: "inherit",
                        resize: "vertical",
                    }}
                />
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "8px",
                        fontSize: "12px",
                        color: "#6b7280",
                    }}
                >
                    <span>
                        {charCount < charMin
                            ? `${charMin - charCount} more characters needed`
                            : "✓ Minimum met"}
                    </span>
                    <span
                        style={{
                            color: charCount > charMax ? "#dc2626" : "#6b7280",
                        }}
                    >
                        {charCount} / {charMax}
                    </span>
                </div>
            </div>

            {/* Photos */}
            <div style={{ marginBottom: "32px" }}>
                <label
                    style={{
                        display: "block",
                        marginBottom: "12px",
                        fontSize: "16px",
                        fontWeight: 600,
                    }}
                >
                    Photos (Optional)
                </label>
                <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#6b7280" }}>
                    Add up to 5 photos to showcase the work
                </p>
                <ReviewPhotoUpload value={photos} onChange={setPhotos} maxFiles={5} />
            </div>

            {/* Anonymous Option */}
            <div style={{ marginBottom: "32px" }}>
                <label
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                    }}
                >
                    <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        style={{
                            width: "18px",
                            height: "18px",
                            cursor: "pointer",
                        }}
                    />
                    <span style={{ fontSize: "14px", color: "#374151" }}>
                        Post this review anonymously
                    </span>
                </label>
                <p style={{ margin: "8px 0 0 28px", fontSize: "12px", color: "#6b7280" }}>
                    Your name will be hidden, but the review will still be verified
                </p>
            </div>

            {/* Submit Button */}
            <div
                style={{
                    display: "flex",
                    gap: "12px",
                    paddingTop: "24px",
                    borderTop: "1px solid #e5e7eb",
                }}
            >
                <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={submitting}
                    style={{
                        padding: "12px 24px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        backgroundColor: "white",
                        color: "#374151",
                        fontSize: "16px",
                        fontWeight: 500,
                        cursor: submitting ? "not-allowed" : "pointer",
                        opacity: submitting ? 0.5 : 1,
                    }}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting || rating === 0 || charCount < charMin || charCount > charMax}
                    style={{
                        padding: "12px 24px",
                        border: "none",
                        borderRadius: "8px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        fontSize: "16px",
                        fontWeight: 500,
                        cursor:
                            submitting || rating === 0 || charCount < charMin || charCount > charMax
                                ? "not-allowed"
                                : "pointer",
                        opacity:
                            submitting || rating === 0 || charCount < charMin || charCount > charMax
                                ? 0.5
                                : 1,
                    }}
                >
                    {submitting ? "Submitting..." : "Submit Review"}
                </button>
            </div>
        </form>
    );
}
