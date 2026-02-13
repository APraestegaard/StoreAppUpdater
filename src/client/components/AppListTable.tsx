import React, { useState, useMemo, useEffect, memo } from 'react'
import { StoreApp } from '../types'
import { useDebounce } from '../hooks'

interface AppListTableProps {
    apps: StoreApp[]
    selectedApps: Set<string>
    onSelectApp: (sysId: string, selected: boolean) => void
    onSelectAll: (selected: boolean) => void
    showUnavailableApps: boolean
}

const AppListTable = memo(function AppListTable({ apps, selectedApps, onSelectApp, onSelectAll, showUnavailableApps }: AppListTableProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [searchQuery, setSearchQuery] = useState('')
    const [updateTypeFilter, setUpdateTypeFilter] = useState<string>('all')

    // Debounce search query for better performance
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    const getUpdateTypeColor = (updateType: string) => {
        switch (updateType) {
            case 'Major':
                return 'update-major'
            case 'Minor':
                return 'update-minor'
            case 'Patch':
                return 'update-patch'
            default:
                return 'update-unknown'
        }
    }

    const getUpdateTypeLabel = (updateType: string) => {
        switch (updateType) {
            case 'Major':
                return 'Major Update'
            case 'Minor':
                return 'Minor Update'
            case 'Patch':
                return 'Patch Update'
            default:
                return 'Update Available'
        }
    }

    // Filter apps based on search query, update type, and unavailability
    const filteredApps = useMemo(() => {
        let result = apps

        // Filter by unavailability (show only available unless toggled)
        if (!showUnavailableApps) {
            result = result.filter(app => !app.is_unavailable)
        }

        // Filter by update type
        if (updateTypeFilter !== 'all') {
            result = result.filter(app => app.update_type === updateTypeFilter)
        }

        // Filter by search query using debounced value
        if (debouncedSearchQuery.trim()) {
            const query = debouncedSearchQuery.toLowerCase()
            result = result.filter(app => 
                app.name.toLowerCase().includes(query) ||
                app.vendor.toLowerCase().includes(query) ||
                app.version.toLowerCase().includes(query) ||
                app.latest_version.toLowerCase().includes(query) ||
                (app.product_families && app.product_families.some(family => 
                    family.toLowerCase().includes(query)
                ))
            )
        }

        return result
    }, [apps, debouncedSearchQuery, updateTypeFilter, showUnavailableApps])

    // Count apps by update type for filter badges (only available apps)
    const updateTypeCounts = useMemo(() => {
        const availableApps = apps.filter(app => !app.is_unavailable)
        return {
            all: availableApps.length,
            Major: availableApps.filter(app => app.update_type === 'Major').length,
            Minor: availableApps.filter(app => app.update_type === 'Minor').length,
            Patch: availableApps.filter(app => app.update_type === 'Patch').length
        }
    }, [apps])

    // Reset to first page when availability filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [showUnavailableApps])

    // Calculate pagination
    const totalPages = Math.ceil(filteredApps.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedApps = useMemo(() => filteredApps.slice(startIndex, endIndex), [filteredApps, startIndex, endIndex])

    // Check if all visible apps on current page are selected
    const allSelected = paginatedApps.length > 0 && paginatedApps.filter(app => !app.is_unavailable).every(app => selectedApps.has(app.sys_id))

    const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Select all available apps on current page
            paginatedApps.forEach(app => {
                if (!app.is_unavailable) {
                    onSelectApp(app.sys_id, true)
                }
            })
        } else {
            // Deselect all apps on current page
            paginatedApps.forEach(app => onSelectApp(app.sys_id, false))
        }
    }

    const handleSelectChange = (sysId: string, isUnavailable: boolean) => (e: React.ChangeEvent<HTMLInputElement>) => {
        // Don't allow selecting unavailable apps
        if (isUnavailable) {
            e.preventDefault()
            return
        }
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

    const handleUpdateTypeFilterChange = (type: string) => {
        setUpdateTypeFilter(type)
        setCurrentPage(1) // Reset to first page when filtering
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
                    {(searchQuery || updateTypeFilter !== 'all') && ` (filtered from ${apps.length})`} applications
                </div>
                <div className="table-controls">
                    <div className="update-type-filter">
                        <button 
                            type="button"
                            className={`btn btn-sm ${updateTypeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleUpdateTypeFilterChange('all')}
                        >
                            All ({updateTypeCounts.all})
                        </button>
                        <button 
                            type="button"
                            className={`btn btn-sm ${updateTypeFilter === 'Major' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleUpdateTypeFilterChange('Major')}
                            disabled={updateTypeCounts.Major === 0}
                        >
                            Major ({updateTypeCounts.Major})
                        </button>
                        <button 
                            type="button"
                            className={`btn btn-sm ${updateTypeFilter === 'Minor' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleUpdateTypeFilterChange('Minor')}
                            disabled={updateTypeCounts.Minor === 0}
                        >
                            Minor ({updateTypeCounts.Minor})
                        </button>
                        <button 
                            type="button"
                            className={`btn btn-sm ${updateTypeFilter === 'Patch' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleUpdateTypeFilterChange('Patch')}
                            disabled={updateTypeCounts.Patch === 0}
                        >
                            Patch ({updateTypeCounts.Patch})
                        </button>
                    </div>
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
                                type="button"
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
                    <button type="button" onClick={handleClearSearch} className="btn btn-secondary">
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
                        <th>Product Family</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedApps.map((app) => (
                        <tr 
                            key={app.sys_id} 
                            className={`${selectedApps.has(app.sys_id) ? 'selected' : ''} ${app.is_unavailable ? 'app-row--unavailable' : ''}`}
                        >
                            <td className="checkbox-col">
                                <input
                                    type="checkbox"
                                    checked={selectedApps.has(app.sys_id)}
                                    onChange={handleSelectChange(app.sys_id, app.is_unavailable)}
                                    disabled={app.is_unavailable}
                                    aria-label={`Select ${app.name}${app.is_unavailable ? ' (unavailable)' : ''}`}
                                    title={app.is_unavailable ? (app.unavailable_reason || 'This application cannot be updated on this instance') : `Select ${app.name} for batch update`}
                                />
                            </td>
                            <td className="app-name">
                                <div className="app-name-container">
                                    {app.is_unavailable && (
                                        <span 
                                            className="indicator-icon" 
                                            title={app.unavailable_reason || app.indicators.find(ind => ind.id === 'not_available_for_instance_type')?.tooltip || 'This application cannot be updated on this instance'}
                                        >
                                            [Unavailable]
                                        </span>
                                    )}
                                    <a 
                                        href={`/now/app-manager/home/app/id/${app.sys_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="View application in App Manager"
                                    >
                                        {app.name}
                                    </a>
                                </div>
                            </td>
                            <td className="version">{app.version}</td>
                            <td className="version latest">{app.latest_version}</td>
                            <td className="vendor">{app.vendor}</td>
                            <td className="product-families">
                                {app.product_families && app.product_families.length > 0 ? (
                                    <div className="product-families-container">
                                        {app.product_families.map((family, index) => (
                                            <span key={index} className="product-family-badge" title={family}>
                                                {family}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="no-family">-</span>
                                )}
                            </td>
                            <td className="status">
                                <span className={`status-badge ${getUpdateTypeColor(app.update_type)}`}>
                                    {getUpdateTypeLabel(app.update_type)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="pagination">
                <button
                    type="button"
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
                                type="button"
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
                    type="button"
                    className="pagination-btn"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                >
                    Next ›
                </button>
            </div>
                </>
            )}
        </div>
    )
})

export default AppListTable
