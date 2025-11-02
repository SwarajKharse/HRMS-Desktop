"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { FiX, FiUpload, FiFile, FiExternalLink, FiAlertCircle } from "react-icons/fi"
import { leadService } from "../../services/leadService"

function POManagement({ lead, onClose, onSubmit }) {
  const fileInputRef = useRef(null)
  const [poFile, setPoFile] = useState(null)
  const [poFileName, setPoFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploadedPOs, setUploadedPOs] = useState([])
  const [isLoadingPOs, setIsLoadingPOs] = useState(false)

  // Fetch existing POs on mount
  useEffect(() => {
    fetchUploadedPOs()
  }, [])

  const fetchUploadedPOs = async () => {
    if (lead && lead.id) {
      try {
        setIsLoadingPOs(true)
        const response = await leadService.getLeadDocuments(lead.id, "po_document")
        setUploadedPOs(response || [])
      } catch (error) {
        console.error("Error fetching PO documents:", error)
      } finally {
        setIsLoadingPOs(false)
      }
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPoFile(file)
      setPoFileName(file.name)
    }
  }

  const handleUploadPO = async () => {
    if (!poFile) {
      setError("Please select a PO file to upload")
      return
    }

    setLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("po_document", poFile)
      formData.append("flag", "salestl-won-leads")

      await leadService.updatePOorRejectionReason(lead.id, formData)

      // Refresh PO list
      await fetchUploadedPOs()

      // Reset form
      setPoFile(null)
      setPoFileName("")

      await onSubmit()
    } catch (err) {
      console.error("Error uploading PO:", err)
      setError(err.message || "Failed to upload PO")
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePO = () => {
    onClose()
    // Trigger parent to open Create PO form
    if (window.openCreatePOForm) {
      window.openCreatePOForm(lead)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">PO Management</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 border border-red-100">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Existing POs */}
          <div className="space-y-4 rounded-lg bg-white border p-4">
            <h3 className="font-semibold text-lg border-b pb-2">Existing PO Documents</h3>
            <div className="mt-4">
              {isLoadingPOs ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading documents...</p>
                </div>
              ) : uploadedPOs.length > 0 ? (
                <div className="space-y-2">
                  {uploadedPOs.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <FiFile className="mr-2 text-blue-600" />
                        <span className="text-sm font-medium">{`PO ${index + 1}`}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 mr-3">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FiExternalLink />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-2">No PO documents uploaded yet.</p>
              )}
            </div>
          </div>

          {/* Upload PO Section */}
          <div className="space-y-4 rounded-lg bg-white border p-4">
            <h3 className="font-semibold text-lg border-b pb-2">Upload PO</h3>
            <div className="mt-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />
              <div className="flex flex-col space-y-2">
                <label className="block text-sm font-medium text-gray-700">Upload PO Document</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <FiUpload className="mr-2" />
                    Choose File
                  </button>
                  <span className="text-sm text-gray-500">{poFileName || "No file chosen"}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleUploadPO}
                disabled={loading || !poFile}
                className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Uploading...
                  </div>
                ) : (
                  "Upload PO"
                )}
              </button>
            </div>
          </div>

          {/* Create PO Section */}
          <div className="space-y-4 rounded-lg bg-white border p-4">
            <h3 className="font-semibold text-lg border-b pb-2">Create PO from BOQ</h3>
            <p className="text-sm text-gray-600">
              Generate a Purchase Order document from the Bill of Quantities with GST calculations.
            </p>
            <button
              type="button"
              onClick={handleCreatePO}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Create PO
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default POManagement