"use client";

import { useState, useMemo } from "react";
import ReviewCard from "./ReviewCard";
import ReviewFilters, { type ReviewFilters as Filters } from "./ReviewFilters";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  isVerified: boolean;
  isAnonymous: boolean;
  createdAt: Date;
  helpfulCount: number;
  reportCount: number;
  photos: string[]; // Array of photo URLs
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
  responseText: string | null;
  respondedAt: Date | null;
}

interface ReviewListProps {
  reviews: Review[];
  currentUserId?: string;
  showFilters?: boolean;
}

const REVIEWS_PER_PAGE = 10;

export default function ReviewList({
  reviews,
  currentUserId,
  showFilters = true,
}: ReviewListProps) {
  const [filters, setFilters] = useState<Filters>({
    rating: null,
    verified: null,
    hasPhotos: null,
    sortBy: "recent",
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Apply filters and sorting
  const filteredAndSortedReviews = useMemo(() => {
    let filtered = [...reviews];

    // Apply rating filter (e.g., 4+ means >= 4)
    if (filters.rating !== null) {
      filtered = filtered.filter((review) => review.rating >= filters.rating!);
    }

    // Apply verified filter
    if (filters.verified !== null) {
      filtered = filtered.filter((review) => review.isVerified === filters.verified);
    }

    // Apply photos filter
    if (filters.hasPhotos !== null) {
      if (filters.hasPhotos) {
        filtered = filtered.filter((review) => review.photos.length > 0);
      } else {
        filtered = filtered.filter((review) => review.photos.length === 0);
      }
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "recent":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "rating-high":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "rating-low":
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      case "helpful":
        filtered.sort((a, b) => b.helpfulCount - a.helpfulCount);
        break;
    }

    return filtered;
  }, [reviews, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedReviews.length / REVIEWS_PER_PAGE);
  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const endIndex = startIndex + REVIEWS_PER_PAGE;
  const paginatedReviews = filteredAndSortedReviews.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of list
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <ReviewFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalCount={reviews.length}
          filteredCount={filteredAndSortedReviews.length}
        />
      )}

      {/* Review Count */}
      <div className="text-sm text-gray-600">
        Showing {paginatedReviews.length} of {filteredAndSortedReviews.length} reviews
        {filteredAndSortedReviews.length !== reviews.length &&
          ` (filtered from ${reviews.length} total)`}
      </div>

      {/* Reviews */}
      {paginatedReviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg mb-2">No reviews found</p>
          <p className="text-gray-500 text-sm">
            {filteredAndSortedReviews.length === 0 && reviews.length > 0
              ? "Try adjusting your filters"
              : "There are no reviews yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              const showPage =
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1);

              if (!showPage) {
                // Show ellipsis
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="px-2 text-gray-400">
                      ...
                    </span>
                  );
                }
                return null;
              }

              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`min-w-[40px] h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                    page === currentPage
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Page info */}
      {totalPages > 1 && (
        <div className="text-center text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </div>
      )}
    </div>
  );
}
