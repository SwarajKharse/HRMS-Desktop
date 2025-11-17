"use client"

import React, { useState, useEffect } from "react"
import { dcQtyService } from "../../services/dcQtyService"
import { FiX, FiUpload, FiCheckSquare, FiSquare } from "react-icons/fi"
import { useAuth } from "../../contexts/AuthContext"

const DCChalanUploadModal = ({ dcQty, onClose, onSuccess }) => {
  const [projectDcQties, setProjectDcQties] = useState([])
  const [selectedDcQtyIds, setSelectedDcQtyIds] = useState([dcQty.id])
  const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const { user } = useAuth()
  const [uploadedBy, setUploadedBy] = useState(1) // You should get this from your auth context

  useEffect(() => {
    fetchProjectDcQties()
  }, [])

  const fetchProjectDcQties = async () => {
    try {
      const response = await dcQtyService.getDCQtiesByProject(dcQty.projectId)
      // Filter out already uploaded DC quantities
      const availableDcQties = response.filter(
        (dq) => dq.dcChalanStatus === "NOT_UPLOADED"
      )
      setProjectDcQties(availableDcQties)
    } catch (error) {
      console.error("Error fetching project DC quantities:", error)
      alert("Failed to fetch DC quantities for this project")
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
      if (!allowedTypes.includes(selectedFile.type)) {
        alert("Please select a PDF or image file (JPG, JPEG, PNG)")
        return
      }
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("File size should not exceed 5MB")
        return
      }
      setFile(selectedFile)
    }
  }

  const handleSelectAll = () => {
    if (selectedDcQtyIds.length === projectDcQties.length) {
      setSelectedDcQtyIds([dcQty.id])
    } else {
      setSelectedDcQtyIds(projectDcQties.map((dq) => dq.id))
    }
  }

  const handleToggleSelect = (id) => {
    if (selectedDcQtyIds.includes(id)) {
      // Don't allow deselecting if it's the only one left
      if (selectedDcQtyIds.length > 1) {
        setSelectedDcQtyIds(selectedDcQtyIds.filter((selectedId) => selectedId !== id))
      }
    } else {
      setSelectedDcQtyIds([...selectedDcQtyIds, id])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file to upload")
      return
    }

    if (selectedDcQtyIds.length === 0) {
      alert("Please select at least one DC quantity")
      return
    }

    setLoading(true)
      try {
        var currentUserId = user.userId
      await dcQtyService.uploadDCChalan(file, selectedDcQtyIds, currentUserId)
      alert(`DC Chalan uploaded successfully for ${selectedDcQtyIds.length} DC quantities`)
      onSuccess()
    } catch (error) {
      console.error("Error uploading DC chalan:", error)
      alert("Failed to upload DC chalan. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("en-IN")
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Upload DC Chalan</h3>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          <div className="project-info">
            <div className="info-item">
              <strong>Project:</strong> {dcQty.projectName}
            </div>
            <div className="info-item">
              <strong>Lead Code:</strong> {dcQty.leadCode}
            </div>
          </div>

          <div className="file-upload-section">
            <label className="file-upload-label">
              <FiUpload /> Select DC Chalan File (PDF or Image, max 5MB)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="file-input"
            />
            {file && (
              <div className="selected-file">
                Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>

          <div className="dc-qty-selection">
            <div className="selection-header">
              <h4>Select DC Quantities for this Chalan</h4>
              <button className="select-all-btn" onClick={handleSelectAll}>
                {selectedDcQtyIds.length === projectDcQties.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <div className="dc-qty-list">
              {projectDcQties.length === 0 ? (
                <div className="no-data">No available DC quantities found for this project</div>
              ) : (
                <table className="dc-qty-selection-table">
                  <thead>
                    <tr>
                      <th style={{ width: "50px" }}>Select</th>
                      <th>MTR Code</th>
                      <th>DC Qty</th>
                      <th>DC Date</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectDcQties.map((dq) => (
                      <tr
                        key={dq.id}
                        className={selectedDcQtyIds.includes(dq.id) ? "selected-row" : ""}
                        onClick={() => handleToggleSelect(dq.id)}
                      >
                        <td>
                          <div className="checkbox-cell">
                            {selectedDcQtyIds.includes(dq.id) ? (
                              <FiCheckSquare className="checkbox-icon checked" />
                            ) : (
                              <FiSquare className="checkbox-icon" />
                            )}
                          </div>
                        </td>
                        <td>{dq.mtrCode}</td>
                        <td>{dq.dcQty}</td>
                        <td>{formatDate(dq.dcDate)}</td>
                        <td>{dq.remarks || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="selection-summary">
              <strong>{selectedDcQtyIds.length}</strong> DC{" "}
              {selectedDcQtyIds.length === 1 ? "quantity" : "quantities"} selected
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="upload-btn" onClick={handleUpload} disabled={loading || !file}>
            {loading ? "Uploading..." : "Upload DC Chalan"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e9ecef;
        }

        .modal-header h3 {
          margin: 0;
          color: #333;
          font-size: 20px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.3s;
        }

        .close-btn:hover {
          background: #f8f9fa;
          color: #333;
        }

        .modal-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }

        .project-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .info-item {
          color: #555;
          font-size: 14px;
        }

        .info-item strong {
          color: #333;
          margin-right: 8px;
        }

        .file-upload-section {
          margin-bottom: 20px;
        }

        .file-upload-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          color: #555;
          font-weight: 500;
          font-size: 14px;
        }

        .file-input {
          width: 100%;
          padding: 10px;
          border: 2px dashed #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .file-input:hover {
          border-color: #007bff;
        }

        .selected-file {
          margin-top: 10px;
          padding: 10px;
          background: #e7f3ff;
          border-radius: 4px;
          color: #004085;
          font-size: 14px;
        }

        .dc-qty-selection {
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 15px;
        }

        .selection-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .selection-header h4 {
          margin: 0;
          color: #333;
          font-size: 16px;
        }

        .select-all-btn {
          padding: 6px 12px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.3s;
        }

        .select-all-btn:hover {
          background: #5a6268;
        }

        .dc-qty-list {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #e9ecef;
          border-radius: 4px;
        }

        .dc-qty-selection-table {
          width: 100%;
          border-collapse: collapse;
        }

        .dc-qty-selection-table th,
        .dc-qty-selection-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
          font-size: 14px;
        }

        .dc-qty-selection-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #495057;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .dc-qty-selection-table tbody tr {
          cursor: pointer;
          transition: background 0.2s;
        }

        .dc-qty-selection-table tbody tr:hover {
          background: #f8f9fa;
        }

        .dc-qty-selection-table tbody tr.selected-row {
          background: #e7f3ff;
        }

        .checkbox-cell {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .checkbox-icon {
          font-size: 20px;
          color: #6c757d;
        }

        .checkbox-icon.checked {
          color: #007bff;
        }

        .selection-summary {
          margin-top: 15px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 4px;
          text-align: center;
          color: #555;
          font-size: 14px;
        }

        .selection-summary strong {
          color: #007bff;
        }

        .no-data {
          text-align: center;
          padding: 40px;
          color: #999;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 20px;
          border-top: 1px solid #e9ecef;
        }

        .cancel-btn,
        .upload-btn {
          padding: 10px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
        }

        .cancel-btn {
          background: #6c757d;
          color: white;
        }

        .cancel-btn:hover:not(:disabled) {
          background: #5a6268;
        }

        .upload-btn {
          background: #007bff;
          color: white;
        }

        .upload-btn:hover:not(:disabled) {
          background: #0056b3;
        }

        .cancel-btn:disabled,
        .upload-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .modal-content {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }

          .project-info {
            grid-template-columns: 1fr;
          }

          .selection-header {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }

          .dc-qty-list {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  )
}

export default DCChalanUploadModal
