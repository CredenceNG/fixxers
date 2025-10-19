"use client";

import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import Image from "next/image";

interface ReviewResponseDisplayProps {
    responseText: string;
    respondedAt: Date | string;
    fixerName: string;
    fixerImage?: string | null;
}

export default function ReviewResponseDisplay({
    responseText,
    respondedAt,
    fixerName,
    fixerImage,
}: ReviewResponseDisplayProps) {
    const responseDate = typeof respondedAt === "string" ? new Date(respondedAt) : respondedAt;
    const timeAgo = formatDistanceToNow(responseDate, { addSuffix: true });

    return (
        <div className="mt-4 pl-4 border-l-4 border-blue-200 bg-blue-50 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
                {/* Fixer Avatar */}
                <div className="flex-shrink-0">
                    {fixerImage ? (
                        <Image
                            src={fixerImage}
                            alt={fixerName}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                                {fixerName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Response Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-900 text-sm">
                            Response from {fixerName}
                        </span>
                        <span className="text-xs text-gray-500">• {timeAgo}</span>
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {responseText}
                    </p>
                </div>
            </div>
        </div>
    );
}
