"use client";

import { useState } from "react";
import { Star, CheckCircle, Camera, Filter, X } from "lucide-react";

export interface ReviewFilters {
    rating: number | null;
    verified: boolean | null;
    hasPhotos: boolean | null;
    sortBy: "recent" | "rating-high" | "rating-low" | "helpful";
}

interface ReviewFiltersProps {
    filters: ReviewFilters;
    onFiltersChange: (filters: ReviewFilters) => void;
    totalCount: number;
    filteredCount: number;
}

export default function ReviewFiltersComponent({
    filters,
    onFiltersChange,
    totalCount,
    filteredCount,
}: ReviewFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);

    const hasActiveFilters =
        filters.rating !== null ||
        filters.verified !== null ||
        filters.hasPhotos !== null;

    const activeFilterCount = [
        filters.rating !== null,
        filters.verified !== null,
        filters.hasPhotos !== null,
    ].filter(Boolean).length;

    const updateFilter = (key: keyof ReviewFilters, value: any) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        });
    };

    const clearFilters = () => {
        onFiltersChange({
            rating: null,
            verified: null,
            hasPhotos: null,
            sortBy: "recent",
        });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                    >
                        <Filter className="w-5 h-5" />
                        <span>Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            Clear all
                        </button>
                    )}
                </div>

                <div className="text-sm text-gray-600">
                    Showing {filteredCount} of {totalCount} reviews
                </div>
            </div>

            {/* Filter Options (Collapsible) */}
            {isOpen && (
                <div className="pt-4 border-t border-gray-200 space-y-4">
                    {/* Rating Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Rating
                        </label>
                        <div className="flex gap-2">
                            {[5, 4, 3, 2, 1].map((rating) => (
                                <button
                                    key={rating}
                                    onClick={() =>
                                        updateFilter("rating", filters.rating === rating ? null : rating)
                                    }
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors ${filters.rating === rating
                                            ? "bg-blue-50 border-blue-600 text-blue-700"
                                            : "border-gray-300 text-gray-700 hover:border-gray-400"
                                        }`}
                                >
                                    <Star
                                        className={`w-4 h-4 ${filters.rating === rating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-400"
                                            }`}
                                    />
                                    <span className="text-sm font-medium">{rating}+</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Verified & Photos Filters */}
                    <div className="flex gap-3">
                        <button
                            onClick={() =>
                                updateFilter("verified", filters.verified === true ? null : true)
                            }
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${filters.verified === true
                                    ? "bg-green-50 border-green-600 text-green-700"
                                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                                }`}
                        >
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Verified Only</span>
                        </button>

                        <button
                            onClick={() =>
                                updateFilter("hasPhotos", filters.hasPhotos === true ? null : true)
                            }
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${filters.hasPhotos === true
                                    ? "bg-purple-50 border-purple-600 text-purple-700"
                                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                                }`}
                        >
                            <Camera className="w-4 h-4" />
                            <span className="text-sm font-medium">With Photos</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Sort Options (Always Visible) */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                </label>
                <div className="flex gap-2 flex-wrap">
                    {[
                        { value: "recent", label: "Most Recent" },
                        { value: "rating-high", label: "Highest Rating" },
                        { value: "rating-low", label: "Lowest Rating" },
                        { value: "helpful", label: "Most Helpful" },
                    ].map((option) => (
                        <button
                            key={option.value}
                            onClick={() => updateFilter("sortBy", option.value)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${filters.sortBy === option.value
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
