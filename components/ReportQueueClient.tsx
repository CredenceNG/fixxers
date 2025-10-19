"use client";

import { useState, useMemo } from "react";
import { ReviewReportStatus } from "@prisma/client";
import ReportCard from "./ReportCard";
import { colors, borderRadius } from "@/lib/theme";
import { DashboardButton } from "@/components/DashboardLayout";

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

interface ReportQueueClientProps {
    reports: Report[];
}

export default function ReportQueueClient({ reports: initialReports }: ReportQueueClientProps) {
    const [reports, setReports] = useState(initialReports);
    const [statusFilter, setStatusFilter] = useState<ReviewReportStatus | "ALL">("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    // Filter and search reports
    const filteredReports = useMemo(() => {
        let filtered = [...reports];

        // Apply status filter
        if (statusFilter !== "ALL") {
            filtered = filtered.filter((report) => report.status === statusFilter);
        }

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (report) =>
                    report.reason.toLowerCase().includes(query) ||
                    report.review.comment?.toLowerCase().includes(query) ||
                    report.reporter.name?.toLowerCase().includes(query) ||
                    report.review.reviewee.name?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [reports, statusFilter, searchQuery]);

    const handleReportUpdate = (reportId: string, updatedReport: Report) => {
        setReports((prev) =>
            prev.map((report) => (report.id === reportId ? updatedReport : report))
        );
    };

    const handleReportDelete = (reportId: string) => {
        setReports((prev) => prev.filter((report) => report.id !== reportId));
    };

    return (
        <div style={{ padding: '24px' }}>
            {/* Filters */}
            <div style={{ marginBottom: '24px' }}>
                {/* Status Filter */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: colors.textPrimary,
                        marginBottom: '12px'
                    }}>
                        Filter by Status
                    </label>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                    }}>
                        {["ALL", "PENDING", "REVIEWING", "RESOLVED", "DISMISSED"].map(
                            (status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status as ReviewReportStatus | "ALL")}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: borderRadius.medium,
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        border: 'none',
                                        cursor: 'pointer',
                                        backgroundColor: statusFilter === status ? colors.error : colors.gray100,
                                        color: statusFilter === status ? colors.white : colors.textPrimary,
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (statusFilter !== status) {
                                            e.currentTarget.style.backgroundColor = colors.gray200;
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (statusFilter !== status) {
                                            e.currentTarget.style.backgroundColor = colors.gray100;
                                        }
                                    }}
                                >
                                    {status}
                                    {status !== "ALL" &&
                                        ` (${reports.filter((r) => r.status === status).length
                                        })`}
                                    {status === "ALL" && ` (${reports.length})`}
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* Search */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: colors.textPrimary,
                        marginBottom: '12px'
                    }}>
                        Search Reports
                    </label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by reason, comment, reporter, or reviewee..."
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: `1px solid ${colors.gray300}`,
                            borderRadius: borderRadius.medium,
                            fontSize: '14px',
                            color: colors.textPrimary,
                            outline: 'none',
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = colors.primary;
                            e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primaryLight}`;
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = colors.gray300;
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>
            </div>

            {/* Results Count */}
            <div style={{
                marginBottom: '16px',
                fontSize: '14px',
                color: colors.textSecondary
            }}>
                Showing {filteredReports.length} of {reports.length} reports
            </div>

            {/* Report List */}
            {filteredReports.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '48px 0'
                }}>
                    <p style={{
                        color: colors.textSecondary,
                        fontSize: '18px',
                        marginBottom: '8px',
                        fontWeight: '600'
                    }}>
                        No reports found
                    </p>
                    <p style={{
                        color: colors.textTertiary,
                        fontSize: '14px'
                    }}>
                        {searchQuery || statusFilter !== "ALL"
                            ? "Try adjusting your filters"
                            : "All clear! No reports to review."}
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    {filteredReports.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onUpdate={handleReportUpdate}
                            onDelete={handleReportDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
