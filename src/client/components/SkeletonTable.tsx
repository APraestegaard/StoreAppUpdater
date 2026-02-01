import React from 'react'

interface SkeletonTableProps {
    rows?: number
}

export default function SkeletonTable({ rows = 5 }: SkeletonTableProps) {
    return (
        <div className="skeleton-container">
            {/* Skeleton Header */}
            <div className="skeleton-header">
                <div className="skeleton-info skeleton-pulse"></div>
                <div className="skeleton-controls">
                    <div className="skeleton-filter-group">
                        <div className="skeleton-filter skeleton-pulse"></div>
                        <div className="skeleton-filter skeleton-pulse"></div>
                        <div className="skeleton-filter skeleton-pulse"></div>
                        <div className="skeleton-filter skeleton-pulse"></div>
                    </div>
                    <div className="skeleton-search skeleton-pulse"></div>
                </div>
            </div>

            {/* Skeleton Table */}
            <div className="skeleton-table">
                {/* Table Header */}
                <div className="skeleton-table-header">
                    <div className="skeleton-cell skeleton-checkbox"></div>
                    <div className="skeleton-cell skeleton-name skeleton-pulse"></div>
                    <div className="skeleton-cell skeleton-version skeleton-pulse"></div>
                    <div className="skeleton-cell skeleton-version skeleton-pulse"></div>
                    <div className="skeleton-cell skeleton-vendor skeleton-pulse"></div>
                    <div className="skeleton-cell skeleton-status skeleton-pulse"></div>
                </div>

                {/* Table Rows */}
                {Array.from({ length: rows }).map((_, index) => (
                    <div key={index} className="skeleton-table-row">
                        <div className="skeleton-cell skeleton-checkbox">
                            <div className="skeleton-checkbox-box skeleton-pulse"></div>
                        </div>
                        <div className="skeleton-cell skeleton-name">
                            <div className="skeleton-text skeleton-pulse" style={{ width: `${60 + Math.random() * 30}%` }}></div>
                        </div>
                        <div className="skeleton-cell skeleton-version">
                            <div className="skeleton-text skeleton-pulse" style={{ width: '70%' }}></div>
                        </div>
                        <div className="skeleton-cell skeleton-version">
                            <div className="skeleton-text skeleton-pulse" style={{ width: '70%' }}></div>
                        </div>
                        <div className="skeleton-cell skeleton-vendor">
                            <div className="skeleton-text skeleton-pulse" style={{ width: `${50 + Math.random() * 40}%` }}></div>
                        </div>
                        <div className="skeleton-cell skeleton-status">
                            <div className="skeleton-badge skeleton-pulse"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Skeleton Pagination */}
            <div className="skeleton-pagination">
                <div className="skeleton-page-btn skeleton-pulse"></div>
                <div className="skeleton-page-numbers">
                    <div className="skeleton-page-num skeleton-pulse"></div>
                    <div className="skeleton-page-num skeleton-pulse"></div>
                    <div className="skeleton-page-num skeleton-pulse"></div>
                </div>
                <div className="skeleton-page-btn skeleton-pulse"></div>
            </div>
        </div>
    )
}
