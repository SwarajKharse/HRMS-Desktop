"use client"
import { useState, useEffect, useCallback } from "react"
import { comparisonSheetService } from "../services/comparisonSheetService"
import { useAuth } from "../contexts/AuthContext"

// Helper function to format dates for display
const formatDate = (dateString) => {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export default function POUploadTable({ onUploadPOClick }) {
  const [requisitions, setRequisitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState({
    itemName: "",
    projectName: "",
    status: "All",
    priority: "All",
    mtrDateFrom: "",
    mtrDateTo: "",
  })

  const { user } = useAuth()
  let userId = 1
  if (user) {
    userId = user.userId || user.id
  }

  const [currentUserId] = useState(userId)

  const fetchMaterialRequisitions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const requisitionFilters = {
        page: currentPage,
        size: pageSize,
        assignedPurchaser: currentUserId,
        pmApprovalStatus: "APPROVED",
        ...(filters.itemName && { itemName: filters.itemName }),
        ...(filters.projectName && { projectName: filters.projectName }),
        ...(filters.status !== "All" && { status: filters.status }),
        ...(filters.priority !== "All" && { priority: filters.priority }),
        ...(filters.mtrDateFrom && { mtrDateFrom: filters.mtrDateFrom }),
        ...(filters.mtrDateTo && { mtrDateTo: filters.mtrDateTo }),
      }

      const data = await comparisonSheetService.getPMApprovedMaterialRequisitions(requisitionFilters)
      console.log("API Response Data:", data)

      const formattedRequisitions = (data.content || []).map((req) => {
        return {
          ...req,
          // Ensure numeric fields are numbers for calculations
          mtrQty: Number.parseFloat(req.mtrQty || 0),
          stockAlloted: Number.parseFloat(req.stockAlloted || 0),
          purchaseMTR: Number.parseFloat(req.purchaseMTR || 0),
          dcQty: Number.parseFloat(req.dcQty || 0),
        }
      })

      setRequisitions(formattedRequisitions)
      setTotalPages(data.totalPages || 0)
      setCurrentPage(data.number || 0)
    } catch (e) {
      console.error("Failed to fetch material requisitions:", e)
      setError("Failed to load material requisitions. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, filters, currentUserId])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }))
  }

  const handleSelectFilterChange = (name, value) => {
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }))
  }

  const handleApplyFilters = () => {
    setCurrentPage(0)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const renderPaginationItems = () => {
    const items = []
    const maxPagesToShow = 5
    let startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1)

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1)
    }

    if (startPage > 0) {
      items.push(
        <li key="first">
          <button
            onClick={() => handlePageChange(0)}
            className="flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm transition-colors hover:bg-gray-100"
            aria-label="Go to first page"
          >
            1
          </button>
        </li>,
      )
      if (startPage > 1) {
        items.push(
          <li key="ellipsis-start">
            <span className="flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm">
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
            className={`flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-gray-300 px-3 text-sm shadow-sm transition-colors ${
              i === currentPage ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white hover:bg-gray-100"
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
            <span className="flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm">
              ...
            </span>
          </li>,
        )
      }
      items.push(
        <li key="last">
          <button
            onClick={() => handlePageChange(totalPages - 1)}
            className="flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm transition-colors hover:bg-gray-100"
            aria-label="Go to last page"
          >
            {totalPages}
          </button>
        </li>,
      )
    }
    return items
  }

  useEffect(() => {
    fetchMaterialRequisitions()
  }, [fetchMaterialRequisitions])

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="rounded-xl border border-gray-200 bg-white text-gray-900 shadow-lg">
        <div className="flex flex-col space-y-1.5 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold leading-none tracking-tight text-blue-700">
                Purchase Order Management
              </h2>
              <p className="text-sm text-gray-600">Manage PO uploads for approved MTRs</p>
            </div>
            <button
              onClick={onUploadPOClick}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
            >
              Upload PO
            </button>
          </div>
        </div>
        <div className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <label
                htmlFor="itemName"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-1 text-blue-800"
              >
                Item Name
              </label>
              <input
                id="itemName"
                name="itemName"
                placeholder="Filter by item name"
                value={filters.itemName}
                onChange={handleFilterChange}
                className="flex h-10 w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label
                htmlFor="projectName"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-1 text-blue-800"
              >
                Project Name
              </label>
              <input
                id="projectName"
                name="projectName"
                placeholder="Filter by project name"
                value={filters.projectName}
                onChange={handleFilterChange}
                className="flex h-10 w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label
                htmlFor="status"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-1 text-blue-800"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={(e) => handleSelectFilterChange("status", e.target.value)}
                className="flex h-10 w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="All">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="Partially Filled">Partially Filled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleApplyFilters}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
              >
                Apply Filters
              </button>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading requisitions...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : requisitions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No approved material requisitions found.</div>
          ) : (
            <>
              <div className="relative w-full overflow-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b bg-gray-100">
                    <tr className="border-b transition-colors hover:bg-gray-100">
                      <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">MTR Code</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">Project Name</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">Product Name</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">MTR Qty</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">Purchase MTR</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">Upload PO</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {requisitions.map((req) => (
                      <tr key={req.id} className="border-b transition-colors hover:bg-gray-50">
                        <td className="p-4 align-middle text-gray-700 font-medium">{req.mtrCode || "N/A"}</td>
                        <td className="p-4 align-middle text-gray-700">{req.projectName || "N/A"}</td>
                        <td className="p-4 align-middle text-gray-700">{req.productName || "N/A"}</td>
                        <td className="p-4 align-middle text-gray-700">{req.mtrQty}</td>
                        <td className="p-4 align-middle text-gray-700">{req.purchaseMTR}</td>
                        <td className="p-4 align-middle">
                          <button
                            onClick={() => onUploadPOClick(req)}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 h-9 px-3 py-1"
                            title="Upload PO for this MTR"
                          >
                            Upload PO
                          </button>
                        </td>
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
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:opacity-50 hover:bg-gray-100 h-9 px-4 py-2 gap-1 pr-2.5 text-gray-700"
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
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:opacity-50 hover:bg-gray-100 h-9 px-4 py-2 gap-1 pl-2.5 text-gray-700"
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