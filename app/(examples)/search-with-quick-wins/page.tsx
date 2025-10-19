/**
 * Example: Enhanced Fixer Search Page with Quick Wins
 * 
 * This is a complete example showing how to use all Quick Win badges
 * in a real search/browse page.
 */

import { prisma } from '@/lib/prisma';
import {
    AvailableNowBadge,
    YearsOfService,
    ReviewCount,
    ServiceArea,
    ResponseTimeBadge,
    JobsCompleted
} from '@/components/quick-wins/QuickWinBadges';
import Link from 'next/link';

interface SearchPageProps {
    searchParams: Promise<{
        subcategory?: string;
        city?: string;
        neighbourhood?: string;
    }>;
}

export default async function EnhancedSearchPage({ searchParams: searchParamsPromise }: SearchPageProps) {
    const searchParams = await searchParamsPromise;
    // Fetch fixers with all necessary data
    const fixers = await prisma.user.findMany({
        where: {
            roles: { has: 'FIXER' },
            status: 'ACTIVE',
            fixerProfile: {
                ...(searchParams.city && { city: searchParams.city }),
                ...(searchParams.neighbourhood && { neighbourhood: searchParams.neighbourhood })
            },
            ...(searchParams.subcategory && {
                gigs: {
                    some: {
                        subcategoryId: searchParams.subcategory,
                        status: 'ACTIVE'
                    }
                }
            })
        },
        include: {
            fixerProfile: true,
            gigs: {
                where: { status: 'ACTIVE' },
                include: {
                    subcategory: true
                }
            },
            reviewsReceived: {
                select: {
                    rating: true
                }
            }
        },
        take: 20
    });

    // Calculate review stats
    const fixersWithStats = fixers.map(fixer => {
        const reviews = fixer.reviewsReceived;
        const reviewCount = reviews.length;
        const averageRating = reviewCount > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
            : null;

        return {
            ...fixer,
            reviewCount,
            averageRating
        };
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">
                Find Professional Fixers
            </h1>

            {/* Results Count */}
            <div className="mb-6">
                <p className="text-gray-600">
                    Found {fixersWithStats.length} {fixersWithStats.length === 1 ? 'fixer' : 'fixers'}
                </p>
            </div>

            {/* Fixer Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fixersWithStats.map((fixer) => (
                    <FixerCard key={fixer.id} fixer={fixer} />
                ))}
            </div>

            {/* No Results */}
            {fixersWithStats.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                        No fixers found matching your criteria.
                    </p>
                </div>
            )}
        </div>
    );
}

// Fixer Card Component with All Quick Win Badges
function FixerCard({ fixer }: { fixer: any }) {
    const mainGig = fixer.gigs[0]; // Primary gig

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
            {/* Header with Image */}
            <div className="relative h-48 bg-gradient-to-br from-blue-500 to-blue-600">
                {fixer.profileImage ? (
                    <img
                        src={fixer.profileImage}
                        alt={fixer.name || 'Fixer'}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-6xl font-bold">
                        {(fixer.name || 'F')[0].toUpperCase()}
                    </div>
                )}

                {/* Available Now Badge - Top Right */}
                {mainGig?.allowInstantBooking && (
                    <div className="absolute top-3 right-3">
                        <AvailableNowBadge allowInstantBooking={true} />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Name & Years of Service */}
                <div className="mb-3">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {fixer.name || 'Anonymous Fixer'}
                    </h3>
                    <YearsOfService createdAt={fixer.createdAt} className="text-sm" />
                </div>

                {/* Service/Specialty */}
                {mainGig && (
                    <p className="text-sm text-gray-600 mb-3">
                        {mainGig.subcategory.name}
                    </p>
                )}

                {/* Quick Win Badges Section */}
                <div className="space-y-2 mb-4">
                    {/* Reviews */}
                    {fixer.reviewCount > 0 && (
                        <ReviewCount
                            count={fixer.reviewCount}
                            averageRating={fixer.averageRating}
                        />
                    )}

                    {/* Response Time */}
                    {fixer.fixerProfile?.averageResponseMinutes && (
                        <ResponseTimeBadge
                            averageResponseMinutes={fixer.fixerProfile.averageResponseMinutes}
                        />
                    )}

                    {/* Jobs Completed */}
                    {fixer.fixerProfile?.totalJobsCompleted > 0 && (
                        <JobsCompleted count={fixer.fixerProfile.totalJobsCompleted} />
                    )}

                    {/* Service Area */}
                    <ServiceArea
                        neighbourhood={fixer.fixerProfile.neighbourhood}
                        city={fixer.fixerProfile.city}
                        state={fixer.fixerProfile.state}
                    />
                </div>

                {/* Bio Preview */}
                {fixer.bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {fixer.bio}
                    </p>
                )}

                {/* Price Range (if available) */}
                {mainGig?.packages && mainGig.packages.length > 0 && (
                    <div className="mb-4 text-sm">
                        <span className="text-gray-600">From </span>
                        <span className="text-lg font-bold text-gray-900">
                            ₦{Math.min(...mainGig.packages.map((p: any) => p.price)).toLocaleString()}
                        </span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Link
                        href={`/gigs/${mainGig?.slug || fixer.id}`}
                        className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        {mainGig?.allowInstantBooking ? 'Book Now' : 'Request Quote'}
                    </Link>
                    <Link
                        href={`/fixer/${fixer.id}`}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Profile
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Skeleton Loader (optional, for loading states)
function FixerCardSkeleton() {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-300" />
            <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-300 rounded w-3/4" />
                <div className="h-4 bg-gray-300 rounded w-1/2" />
                <div className="h-4 bg-gray-300 rounded w-full" />
                <div className="h-4 bg-gray-300 rounded w-full" />
                <div className="flex gap-2 mt-4">
                    <div className="flex-1 h-10 bg-gray-300 rounded" />
                    <div className="w-20 h-10 bg-gray-300 rounded" />
                </div>
            </div>
        </div>
    );
}
