"use client"

import { useState, useEffect, useCallback } from "react"
import { materialRequisitionService } from "../../services/materialRequisitionService" // Ensure this path is correct

// Helper function to format dates for display
const formatDate = (dateString) => {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export default function MaterialRequisition() {
  const [requisitions, setRequisitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(0) // Backend is 0-indexed
  const [totalPages, setTotalPages] = useState(0)
  const [pageSize, setPageSize] = useState(10) // Default page size
  const [filters, setFilters] = useState({
    itemName: "",
    status: "All",
    priority: "All",
    mtrDateFrom: "",
    mtrDateTo: "",
  })

  const fetchMaterialRequisitions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        size: pageSize,
        // Only include filters if they are not "All" or empty
        ...(filters.itemName && { itemName: filters.itemName }),
        ...(filters.status !== "All" && { status: filters.status }),
        ...(filters.priority !== "All" && { priority: filters.priority }),
        ...(filters.mtrDateFrom && { mtrDateFrom: filters.mtrDateFrom }),
        ...(filters.mtrDateTo && { mtrDateTo: filters.mtrDateTo }),
      }).toString()

      // FIX: Add 'await' here
      const data = await materialRequisitionService.fetchMaterialRequisitions(queryParams)

      console.log("API Response Data:", data) // Log the full data object to inspect its structure
      setRequisitions(data.content || [])
      setTotalPages(data.totalPages || 0)
      setCurrentPage(data.number || 0) // Ensure currentPage is in sync with backend response
    } catch (e) {
      console.error("Failed to fetch material requisitions:", e)
      setError("Failed to load material requisitions. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, filters])

  useEffect(() => {
    fetchMaterialRequisitions()
  }, [fetchMaterialRequisitions])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }))
  }

  const handleSelectFilterChange = (name, value) => {
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }))
  }

  const handleApplyFilters = () => {
    setCurrentPage(0) // Reset to first page when applying new filters
    // fetchMaterialRequisitions will be called by useEffect due to currentPage change
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const renderPaginationItems = () => {
    const items = []
    const maxPagesToShow = 5 // Number of page links to show around the current page

    let startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1)

    // Adjust startPage if we are at the end of the page list
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1)
    }

    if (startPage > 0) {
      items.push(
        <li key="first">
          <button
            onClick={() => handlePageChange(0)}
            className="flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Go to first page"
          >
            1
          </button>
        </li>,
      )
      if (startPage > 1) {
        items.push(
          <li key="ellipsis-start">
            <span className="flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm shadow-sm">
              ...
            </span>
          </li>,
        )
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <li key={i}>
          <button
            onClick={() => handlePageChange(i)}
            className={`flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-input px-3 text-sm shadow-sm transition-colors ${
              i === currentPage
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-background hover:bg-accent hover:text-accent-foreground"
            }`}
            aria-current={i === currentPage ? "page" : undefined}
          >
            {i + 1}
          </button>
        </li>,
      )
    }

    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        items.push(
          <li key="ellipsis-end">
            <span className="flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm shadow-sm">
              ...
            </span>
          </li>,
        )
      }
      items.push(
        <li key="last">
          <button
            onClick={() => handlePageChange(totalPages - 1)}
            className="flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Go to last page"
          >
            {totalPages}
          </button>
        </li>,
      )
    }
    return items
  }

  return (
    <div className="container mx-auto p-4">
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="flex flex-col space-y-1.5 p-6">
          <h2 className="text-2xl font-semibold leading-none tracking-tight">Material Requisitions</h2>
        </div>
        <div className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label
                htmlFor="itemName"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-1"
              >
                Item Name
              </label>
              <input
                id="itemName"
                name="itemName"
                placeholder="Filter by item name"
                value={filters.itemName}
                onChange={handleFilterChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label
                htmlFor="status"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-1"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={(e) => handleSelectFilterChange("status", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="All">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="Partially Filled">Partially Filled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="priority"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-1"
              >
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={filters.priority}
                onChange={(e) => handleSelectFilterChange("priority", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="All">All</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="mtrDateFrom"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-1"
              >
                MTR Date From
              </label>
              <input
                id="mtrDateFrom"
                name="mtrDateFrom"
                type="date"
                value={filters.mtrDateFrom}
                onChange={handleFilterChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label
                htmlFor="mtrDateTo"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-1"
              >
                MTR Date To
              </label>
              <input
                id="mtrDateTo"
                name="mtrDateTo"
                type="date"
                value={filters.mtrDateTo}
                onChange={handleFilterChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleApplyFilters}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading requisitions...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : requisitions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No material requisitions found.</div>
          ) : (
            <>
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        ID
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        Product Name
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        MTR Qty
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        Stock Alloted
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        Purchase MTR
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        DC Qty
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        MTR Date
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        Expected Delivery
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        Priority
                      </th>
                      
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {requisitions.map((req) => (
                      <tr
                        key={req.id}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <td className="p-4 align-middle font-medium">{req.id}</td>
                        <td className="p-4 align-middle">{req.boqItem?.product?.product_name || "N/A"}</td>
                        <td className="p-4 align-middle">{req.mtrQty}</td>
                        <td className="p-4 align-middle">{req.stockAlloted}</td>
                        <td className="p-4 align-middle">{req.purchaseMTR}</td>
                        <td className="p-4 align-middle">{req.dcQty}</td>
                        <td className="p-4 align-middle">{formatDate(req.mtrDate)}</td>
                        <td className="p-4 align-middle">{formatDate(req.expectedDeliveryDate)}</td>
                        <td className="p-4 align-middle">{req.priority}</td>
                        <td className="p-4 align-middle max-w-[200px] truncate">{req.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <nav className="mx-auto flex w-full justify-center py-4">
                <ul className="flex flex-row items-center gap-1">
                  <li>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-1 pr-2.5"
                      aria-label="Go to previous page"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="m15 18-6-6 6-6"></path>
                      </svg>
                      <span>Previous</span>
                    </button>
                  </li>
                  {renderPaginationItems()}
                  <li>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-1 pl-2.5"
                      aria-label="Go to next page"
                    >
                      <span>Next</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="m9 18 6-6-6-6"></path>
                      </svg>
                    </button>
                  </li>
                </ul>
              </nav>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
