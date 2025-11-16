"use client"

import React, { useState, useEffect } from "react"
import { dcQtyService } from "../../services/dcQtyService"
import DCChalanUploadModal from "./DCChalanUploadModal"
import { FiUpload, FiDownload, FiFilter } from "react-icons/fi"

const DCQtyList = () => {
  const [dcQties, setDcQties] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  })
  
  const [filters, setFilters] = useState({
    leadCode: "",
    projectName: "",
    dcChalanStatus: "",
  })
  
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDcQty, setSelectedDcQty] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    fetchDCQties()
  }, [pagination.page, pagination.size])

  const fetchDCQties = async () => {
    setLoading(true)
    try {
      const requestData = {
        ...filters,
        page: pagination.page,
        size: pagination.size,
        sortBy: "createdAt",
        sortOrder: "DESC",
      }
      
      const response = await dcQtyService.getDCQtyList(requestData)
      setDcQties(response.content)
      setPagination({
        page: response.page,
        size: response.size,
        totalElements: response.totalElements,
        totalPages: response.totalPages,
      })
    } catch (error) {
      console.error("Error fetching DC quantities:", error)
      alert("Failed to fetch DC quantities")
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 0 }))
    fetchDCQties()
  }

  const handleClearFilters = () => {
    setFilters({
      leadCode: "",
      projectName: "",
      dcChalanStatus: "",
    })
    setPagination(prev => ({ ...prev, page: 0 }))
    setTimeout(fetchDCQties, 100)
  }

  const handleUploadClick = (dcQty) => {
    setSelectedDcQty(dcQty)
    setShowUploadModal(true)
  }

  const handleUploadSuccess = () => {
    setShowUploadModal(false)
    setSelectedDcQty(null)
    fetchDCQties()
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const formatDate = (date) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("en-IN")
  }

  return (
    <div className="dc-qty-container">
      <div className="header-section">
        <h2>DC Quantity Management</h2>
        <button
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FiFilter /> {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {showFilters && (
        <div className="filter-section">
          <div className="filter-row">
            <div className="filter-field">
              <label>Lead Code</label>
              <input
                type="text"
                placeholder="Search by lead code"
                value={filters.leadCode}
                onChange={(e) => handleFilterChange("leadCode", e.target.value)}
              />
            </div>

            <div className="filter-field">
              <label>Project Name</label>
              <input
                type="text"
                placeholder="Search by project name"
                value={filters.projectName}
                onChange={(e) => handleFilterChange("projectName", e.target.value)}
              />
            </div>

            <div className="filter-field">
              <label>DC Chalan Status</label>
              <select
                value={filters.dcChalanStatus}
                onChange={(e) => handleFilterChange("dcChalanStatus", e.target.value)}
              >
                <option value="">All</option>
                <option value="UPLOADED">Uploaded</option>
                <option value="NOT_UPLOADED">Not Uploaded</option>
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button className="apply-btn" onClick={handleApplyFilters}>
              Apply Filters
            </button>
            <button className="clear-btn" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <table className="dc-qty-table">
            <thead>
              <tr>
                <th>MTR Code</th>
                <th>Lead Code</th>
                <th>Project Name</th>
                <th>DC Qty</th>
                <th>DC Date</th>
                <th>DC Chalan Status</th>
                <th>Uploaded By</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dcQties.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    No DC quantities found
                  </td>
                </tr>
              ) : (
                dcQties.map((dcQty) => (
                  <tr key={dcQty.id}>
                    <td>{dcQty.mtrCode}</td>
                    <td>{dcQty.leadCode}</td>
                    <td>{dcQty.projectName}</td>
                    <td>{dcQty.dcQty}</td>
                    <td>{formatDate(dcQty.dcDate)}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          dcQty.dcChalanStatus === "UPLOADED"
                            ? "status-uploaded"
                            : "status-not-uploaded"
                        }`}
                      >
                        {dcQty.dcChalanStatus === "UPLOADED" ? "Uploaded" : "Not Uploaded"}
                      </span>
                    </td>
                    <td>{dcQty.dcChalanUploadedByName || "-"}</td>
                    <td>{formatDate(dcQty.dcChalanUploadedAt)}</td>
                    <td>
                      <div className="action-buttons">
                        {dcQty.dcChalanStatus === "UPLOADED" ? (
                          <a
                            href={dcQty.dcChalanPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="download-btn"
                            title="Download DC Chalan"
                          >
                            <FiDownload />
                          </a>
                        ) : (
                          <button
                            className="upload-btn"
                            onClick={() => handleUploadClick(dcQty)}
                            title="Upload DC Chalan"
                          >
                            <FiUpload />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="pagination">
        <div className="pagination-info">
          Showing {pagination.page * pagination.size + 1} to{" "}
          {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} of{" "}
          {pagination.totalElements} entries
        </div>
        <div className="pagination-controls">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 0}
          >
            Previous
          </button>
          <span className="page-number">
            Page {pagination.page + 1} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages - 1}
          >
            Next
          </button>
        </div>
      </div>

      {showUploadModal && (
        <DCChalanUploadModal
          dcQty={selectedDcQty}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      <style jsx>{`
        .dc-qty-container {
          padding: 20px;
          background: #f5f5f5;
          min-height: 100vh;
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        h2 {
          margin: 0;
          color: #333;
          font-size: 24px;
        }

        .filter-toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        }

        .filter-toggle-btn:hover {
          background: #0056b3;
        }

        .filter-section {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .filter-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .filter-field label {
          display: block;
          margin-bottom: 8px;
          color: #555;
          font-weight: 500;
          font-size: 14px;
        }

        .filter-field input,
        .filter-field select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .filter-field input:focus,
        .filter-field select:focus {
          outline: none;
          border-color: #007bff;
        }

        .filter-actions {
          display: flex;
          gap: 10px;
        }

        .apply-btn,
        .clear-btn {
          padding: 10px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
        }

        .apply-btn {
          background: #28a745;
          color: white;
        }

        .apply-btn:hover {
          background: #218838;
        }

        .clear-btn {
          background: #6c757d;
          color: white;
        }

        .clear-btn:hover {
          background: #5a6268;
        }

        .table-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow-x: auto;
        }

        .dc-qty-table {
          width: 100%;
          border-collapse: collapse;
        }

        .dc-qty-table thead {
          background: #f8f9fa;
        }

        .dc-qty-table th,
        .dc-qty-table td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
          font-size: 14px;
        }

        .dc-qty-table th {
          font-weight: 600;
          color: #495057;
          white-space: nowrap;
        }

        .dc-qty-table tbody tr:hover {
          background: #f8f9fa;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
        }

        .status-uploaded {
          background: #d4edda;
          color: #155724;
        }

        .status-not-uploaded {
          background: #f8d7da;
          color: #721c24;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .upload-btn,
        .download-btn {
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          text-decoration: none;
        }

        .upload-btn {
          background: #007bff;
          color: white;
        }

        .upload-btn:hover {
          background: #0056b3;
        }

        .download-btn {
          background: #28a745;
          color: white;
        }

        .download-btn:hover {
          background: #218838;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .no-data {
          text-align: center;
          padding: 40px;
          color: #999;
        }

        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .pagination-info {
          color: #666;
          font-size: 14px;
        }

        .pagination-controls {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .pagination-controls button {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        }

        .pagination-controls button:hover:not(:disabled) {
          background: #0056b3;
        }

        .pagination-controls button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .page-number {
          color: #333;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .header-section {
            flex-direction: column;
            gap: 15px;
          }

          .filter-row {
            grid-template-columns: 1fr;
          }

          .pagination {
            flex-direction: column;
            gap: 15px;
          }

          .table-container {
            overflow-x: scroll;
          }
        }
      `}</style>
    </div>
  )
}

export default DCQtyList
