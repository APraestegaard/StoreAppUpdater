import React, { useState, useMemo } from 'react'
import { StoreApp } from '../types'

interface AppListTableProps {
    apps: StoreApp[]
    selectedApps: Set<string>
    onSelectApp: (sysId: string, selected: boolean) => void
    onSelectAll: (selected: boolean) => void
}

export default function AppListTable({ apps, selectedApps, onSelectApp, onSelectAll }: AppListTableProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [searchQuery, setSearchQuery] = useState('')

    // Filter apps based on search query
    const filteredApps = useMemo(() => {
        if (!searchQuery.trim()) {
            return apps
        }
        const query = searchQuery.toLowerCase()
        return apps.filter(app => 
            app.name.toLowerCase().includes(query) ||
            app.vendor.toLowerCase().includes(query) ||
            app.version.toLowerCase().includes(query) ||
            app.latest_version.toLowerCase().includes(query)
        )
    }, [apps, searchQuery])

    // Calculate pagination
    const totalPages = Math.ceil(filteredApps.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedApps = useMemo(() => filteredApps.slice(startIndex, endIndex), [filteredApps, startIndex, endIndex])

    // Check if all visible apps on current page are selected
    const allSelected = paginatedApps.length > 0 && paginatedApps.every(app => selectedApps.has(app.sys_id))

    const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Select all apps on current page
            paginatedApps.forEach(app => onSelectApp(app.sys_id, true))
        } else {
            // Deselect all apps on current page
            paginatedApps.forEach(app => onSelectApp(app.sys_id, false))
        }
    }

    const handleSelectChange = (sysId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        onSelectApp(sysId, e.target.checked)
    }

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(Number(e.target.value))
        setCurrentPage(1) // Reset to first page when changing page size
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1) // Reset to first page when searching
    }

    const handleClearSearch = () => {
        setSearchQuery('')
        setCurrentPage(1)
    }

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1))
    }

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(totalPages, prev + 1))
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | string)[] = []
        const maxVisible = 5

        if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }, (_, i) => i + 1)
        }

        // Always show first page
        pages.push(1)

        if (currentPage > 3) {
            pages.push('...')
        }

        // Show pages around current page
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pages.push(i)
        }

        if (currentPage < totalPages - 2) {
            pages.push('...')
        }

        // Always show last page
        if (totalPages > 1) {
            pages.push(totalPages)
        }

        return pages
    }

    if (apps.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">✓</div>
                <h2>All Applications Up to Date</h2>
                <p>All your ServiceNow store applications are running the latest versions.</p>
                <p className="hint">Click "Check for Updates" to refresh from the store.</p>
            </div>
        )
    }

    return (
        <div className="table-container">
            <div className="table-header">
                <div className="table-info">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredApps.length)} of {filteredApps.length} 
                    {searchQuery && ` (filtered from ${apps.length})`} applications
                </div>
                <div className="table-controls">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search applications..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="search-input"
                            aria-label="Search applications"
                        />
                        {searchQuery && (
                            <button
                                onClick={handleClearSearch}
                                className="search-clear"
                                aria-label="Clear search"
                                title="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    <div className="page-size-selector">
                        <label htmlFor="pageSize">Show:</label>
                        <select id="pageSize" value={pageSize} onChange={handlePageSizeChange}>
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <span>per page</span>
                    </div>
                </div>
            </div>

            {filteredApps.length === 0 && searchQuery ? (
                <div className="no-results">
                    <div className="no-results-icon">🔍</div>
                    <h3>No applications found</h3>
                    <p>No applications match your search for "{searchQuery}"</p>
                    <button onClick={handleClearSearch} className="btn btn-secondary">
                        Clear Search
                    </button>
                </div>
            ) : (
                <>
                    <table className="sn-table">
                <thead>
                    <tr>
                        <th className="checkbox-col">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={handleSelectAllChange}
                                aria-label="Select all apps on this page"
                            />
                        </th>
                        <th>Application Name</th>
                        <th>Current Version</th>
                        <th>Latest Version</th>
                        <th>Vendor</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedApps.map((app) => (
                        <tr key={app.sys_id} className={selectedApps.has(app.sys_id) ? 'selected' : ''}>
                            <td className="checkbox-col">
                                <input
                                    type="checkbox"
                                    checked={selectedApps.has(app.sys_id)}
                                    onChange={handleSelectChange(app.sys_id)}
                                    aria-label={`Select ${app.name}`}
                                />
                            </td>
                            <td className="app-name">{app.name}</td>
                            <td className="version">{app.version}</td>
                            <td className="version latest">{app.latest_version}</td>
                            <td className="vendor">{app.vendor}</td>
                            <td className="status">
                                <span className="status-badge update-available">Update Available</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="pagination-btn"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                    >
                        ‹ Previous
                    </button>
                    
                    <div className="page-numbers">
                        {getPageNumbers().map((page, index) => (
                            typeof page === 'number' ? (
                                <button
                                    key={page}
                                    className={`page-number ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => handlePageChange(page)}
                                    aria-label={`Page ${page}`}
                                    aria-current={currentPage === page ? 'page' : undefined}
                                >
                                    {page}
                                </button>
                            ) : (
                                <span key={`ellipsis-${index}`} className="page-ellipsis">
                                    {page}
                                </span>
                            )
                        ))}
                    </div>

                    <button
                        className="pagination-btn"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                    >
                        Next ›
                    </button>
                </div>
            )}
                </>
            )}
        </div>
    )
}
