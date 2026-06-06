"use client"

import { useState, useEffect, useCallback, Fragment } from "react"
import { FiAlertCircle, FiCheck, FiChevronRight, FiEye, FiFileText, FiSettings, FiDownload } from "react-icons/fi"
import { receivableService } from "../../../services/receivableService"
import { useAuth } from "../../../contexts/AuthContext"
import ProjectManagementModal from "./ProjectManagementModal"
import BOQModal from "./BOQModal"

function AccountantRecievable() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [projects, setProjects] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [projectNameFilter, setProjectNameFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [successMessage, setSuccessMessage] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const itemsPerPage = 10

  const [showManagementModal, setShowManagementModal] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(null)

  const [showBOQModal, setShowBOQModal] = useState(false)
  const [selectedBOQProjectId, setSelectedBOQProjectId] = useState(null)

  const [expandedRows, setExpandedRows] = useState({})
  const { user } = useAuth()

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const page = currentPage - 1
      const employeeId = user.userId
      const data = await receivableService.getAssistantProjects(
        page,
        itemsPerPage,
        searchQuery,
        projectNameFilter,
        statusFilter,
        employeeId,
      )
      setProjects(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalResults(data.totalItems || 0)
      setLoading(false)
    } catch (error) {
      setError("Failed to fetch projects")
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, searchQuery, projectNameFilter, statusFilter, user])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, projectNameFilter, statusFilter])

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
    if (window.innerWidth < 768) {
      window.scrollTo(0, 0)
    }
  }

  const handleRowClick = (project) => {
    setExpandedRows((prev) => ({
      ...prev,
      [project.id]: !prev[project.id],
    }))
  }

  const handleManageProject = (e, projectId) => {
    e.stopPropagation()
    setSelectedProjectId(projectId)
    setShowManagementModal(true)
  }

  const handleViewBOQ = (e, projectId) => {
    e.stopPropagation()
    setSelectedBOQProjectId(projectId)
    setShowBOQModal(true)
  }

  const handleManagementSuccess = async () => {
    setSuccessMessage("Project updated successfully!")
    await fetchProjects()
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setProjectNameFilter("")
    setStatusFilter("")
    setCurrentPage(1)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 md:p-4 rounded-lg flex items-center gap-2 md:gap-3 border border-red-100 mx-2 md:mx-0 animate-in fade-in duration-300">
          <FiAlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="text-sm md:font-medium">{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 text-green-600 p-3 md:p-4 rounded-lg border border-green-100 flex items-center shadow-sm mx-2 md:mx-0 animate-in fade-in duration-300">
          <FiCheck className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
          <span className="text-sm md:font-medium">{successMessage}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mx-2 md:mx-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search Project ID, Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Filter by Project Name"
              value={projectNameFilter}
              onChange={(e) => setProjectNameFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="bg-white rounded-xl shadow-sm p-3 md:p-6 mx-2 md:mx-0">
        <div className="md:hidden flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Projects</h2>
        </div>

        {loading && (
          <div className="flex justify-center my-4">
            <div className="relative w-8 h-8">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-gray-200 animate-in fade-in duration-200">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Project ID", "Project Name", "Lead Contact", "Created Date", "PO Copy", "BOQ", "Proposal Copy", "Actions"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500 font-medium">
                      No projects found
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors group animate-in fade-in duration-200"
                      onClick={() => handleRowClick(project)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {project.leadCode || `#${project.id}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {project.projectName || project.project_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {project.leadContactName || "N/A"}
                          {project.leadContactPhone && (
                            <div className="text-xs text-gray-500">{project.leadContactPhone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatDate(project.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {project.poFileUrl ? (
                            <a
                              href={project.poFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FiEye size={14} />
                              <span className="text-xs">View</span>
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">No PO</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {project.hasBOQ ? (
                            <button
                              onClick={(e) => handleViewBOQ(e, project.id)}
                              className="text-green-600 hover:text-green-800 flex items-center gap-1 transition-colors"
                              title="View BOQ Details"
                            >
                              <FiFileText size={14} />
                              <span className="text-xs font-medium">View BOQ</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">No BOQ</span>
                          )}
                          {project.leadDocuments && project.leadDocuments.length > 0 && (
                            <>
                              {(() => {
                                const latestBOQ = project.leadDocuments.find(
                                  (doc) => doc.documentType === "boq_document",
                                )
                                return latestBOQ ? (
                                  <a
                                    href={latestBOQ.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                                    title={latestBOQ.fileName}
                                  >
                                    <FiDownload size={14} />
                                    <span className="text-xs font-medium">PDF</span>
                                  </a>
                                ) : null
                              })()}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {project.leadDocuments && project.leadDocuments.length > 0 ? (
                            <>
                              {(() => {
                                const latestProposal = project.leadDocuments.find(
                                  (doc) => doc.documentType === "proposal" && doc.status === "1",
                                )
                                return latestProposal ? (
                                  <a
                                    href={latestProposal.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    title={latestProposal.fileName}
                                  >
                                    <FiDownload size={14} />
                                    <span className="text-xs font-medium">Proposal</span>
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400">No Proposal</span>
                                )
                              })()}
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">No Proposal</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <button
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors text-sm font-medium flex items-center gap-1"
                          onClick={(e) => handleManageProject(e, project.id)}
                          title="Manage Project"
                        >
                          <FiSettings size={14} />
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {projects.length === 0 ? (
              <div className="p-4 text-center text-gray-500 font-medium">No projects found</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors animate-in fade-in duration-200"
                    onClick={() => handleRowClick(project)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-semibold text-gray-900">{project.leadCode || `#${project.id}`}</div>
                    </div>
                    <div className="grid grid-cols-1 gap-y-1 text-xs">
                      <div>
                        <span className="font-medium">Name:</span> {project.projectName || project.project_name}
                      </div>
                      <div>
                        <span className="font-medium">Contact:</span> {project.leadContactName || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {formatDate(project.createdAt)}
                      </div>
                      <div className="flex gap-4 mt-2">
                        <div>
                          <span className="font-medium">PO:</span>{" "}
                          {project.poFileUrl ? (
                            <a
                              href={project.poFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400">No PO</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">BOQ:</span>{" "}
                          {project.hasBOQ ? (
                            <button onClick={(e) => handleViewBOQ(e, project.id)} className="text-green-600 underline">
                              View BOQ
                            </button>
                          ) : (
                            <span className="text-gray-400">No BOQ</span>
                          )}
                          {project.leadDocuments &&
                            project.leadDocuments.length > 0 &&
                            (() => {
                              const latestBOQ = project.leadDocuments.find((doc) => doc.documentType === "boq_document")
                              return latestBOQ ? (
                                <a href={latestBOQ.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2" onClick={(e) => e.stopPropagation()} title={latestBOQ.fileName}>
                                  PDF
                                </a>
                              ) : null
                            })()}
                        </div>
                        <div>
                          <span className="font-medium">Proposal:</span>{" "}
                          {project.proposalFileUrl ? (
                            <a href={project.proposalFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline" onClick={(e) => e.stopPropagation()}>
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400">No Proposal</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-center">
                      <button
                        className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium flex items-center gap-1"
                        onClick={(e) => handleManageProject(e, project.id)}
                        title="Manage Project"
                      >
                        <FiSettings size={12} />
                        Manage
                      </button>
                    </div>
                    <div className="flex justify-center mt-2">
                      <FiChevronRight
                        className={`text-gray-400 transition-transform ${expandedRows[project.id] ? "rotate-90" : ""}`}
                        size={16}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center items-center gap-2 flex-wrap">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 rounded-md border text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <div className="md:hidden px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <div className="hidden md:flex">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className={`px-3 py-1 rounded-md border text-sm ${currentPage === pageNum ? "bg-indigo-600 text-white" : "bg-white text-gray-600"}`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="px-3 py-1 rounded-md border text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        <div className="mt-2 text-xs md:text-sm text-gray-500 text-center">
          Showing {projects.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
          {Math.min(currentPage * itemsPerPage, totalResults)} of {totalResults} projects
        </div>
      </div>

      <ProjectManagementModal
        isOpen={showManagementModal}
        onClose={() => setShowManagementModal(false)}
        projectId={selectedProjectId}
        onSuccess={handleManagementSuccess}
      />

      <BOQModal isOpen={showBOQModal} onClose={() => setShowBOQModal(false)} projectId={selectedBOQProjectId} />
    </div>
  )
}

export default AccountantRecievable