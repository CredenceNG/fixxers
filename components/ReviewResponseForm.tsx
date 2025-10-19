"use client";

import { useState } from "react";
import { MessageSquare, X, Loader2, Trash2 } from "lucide-react";

interface ReviewResponseFormProps {
    reviewId: string;
    existingResponse?: string | null;
    fixerName?: string;
    onResponseSubmitted?: () => void;
}

export default function ReviewResponseForm({
    reviewId,
    existingResponse,
    fixerName = "You",
    onResponseSubmitted,
}: ReviewResponseFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [responseText, setResponseText] = useState(existingResponse || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    const [charCount, setCharCount] = useState(existingResponse?.length || 0);

    const hasExistingResponse = !!existingResponse;
    const isValid = responseText.trim().length >= 10 && responseText.trim().length <= 1000;

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setResponseText(text);
        setCharCount(text.length);
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValid) {
            setError("Response must be between 10 and 1000 characters");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const response = await fetch(`/api/reviews/${reviewId}/respond`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ responseText: responseText.trim() }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to submit response");
            }

            // Success!
            setIsOpen(false);
            if (onResponseSubmitted) {
                onResponseSubmitted();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit response");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete your response?")) {
            return;
        }

        setIsDeleting(true);
        setError("");

        try {
            const response = await fetch(`/api/reviews/${reviewId}/respond`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete response");
            }

            // Success!
            setResponseText("");
            setCharCount(0);
            setIsOpen(false);
            if (onResponseSubmitted) {
                onResponseSubmitted();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete response");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
        setResponseText(existingResponse || "");
        setCharCount(existingResponse?.length || 0);
        setError("");
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
                <MessageSquare className="w-4 h-4" />
                {hasExistingResponse ? "Edit Response" : "Respond to Review"}
            </button>
        );
    }

    return (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {hasExistingResponse ? "Edit Your Response" : "Respond as a Professional"}
                </h4>
                <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isSubmitting || isDeleting}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <textarea
                        value={responseText}
                        onChange={handleTextChange}
                        placeholder="Share your perspective professionally. Thank the client, address any concerns, or provide additional context..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-shadow"
                        rows={4}
                        disabled={isSubmitting || isDeleting}
                        maxLength={1000}
                    />
                    <div className="flex items-center justify-between mt-1">
                        <span
                            className={`text-xs ${charCount < 10
                                    ? "text-red-600"
                                    : charCount > 1000
                                        ? "text-red-600"
                                        : charCount > 900
                                            ? "text-yellow-600"
                                            : "text-gray-500"
                                }`}
                        >
                            {charCount}/1000 characters {charCount < 10 && "(minimum 10)"}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                        {error}
                    </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-xs text-blue-800 font-medium mb-1">💡 Response Tips:</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Thank the client for their feedback</li>
                        <li>• Be professional and courteous</li>
                        <li>• Address any concerns constructively</li>
                        <li>• Keep it brief and genuine (2-3 sentences is perfect)</li>
                    </ul>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        disabled={!isValid || isSubmitting || isDeleting}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <MessageSquare className="w-4 h-4" />
                                {hasExistingResponse ? "Update Response" : "Post Response"}
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isSubmitting || isDeleting}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors font-medium text-sm"
                    >
                        Cancel
                    </button>

                    {hasExistingResponse && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isSubmitting || isDeleting}
                            className="ml-auto flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    Delete Response
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
