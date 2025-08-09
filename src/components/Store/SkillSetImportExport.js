"use client"
import React, { useState } from "react"
import { FiUpload, FiDownload, FiX } from "react-icons/fi"
import { storeService } from "../../services/storeService"

const SkillSetImportExport = ({ onClose, onSuccess }) => {
  const [importFile, setImportFile] = useState(null)
  const [importMessage, setImportMessage] = useState("")
  const [importError, setImportError] = useState("")
  const [exportMessage, setExportMessage] = useState("")
  const [exportError, setExportError] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleFileChange = (event) => {
    setImportFile(event.target.files[0])
    setImportMessage("")
    setImportError("")
  }

  const handleImport = async () => {
    if (!importFile) {
      setImportError("Please select a file to import.")
      return
    }

    setIsImporting(true)
    setImportMessage("")
    setImportError("")

    try {
      const result = await storeService.importSkillSets(importFile)
      if (result.hasErrors) {
        setImportMessage(
          `Import completed with ${result.successCount} successes and ${result.errors.length} errors.`,
        )
        // Optionally, trigger download of error CSV here if the backend provides a direct download link
        // For now, just show the message.
      } else {
        setImportMessage("Skill Sets imported successfully!")
      }
      onSuccess() // Refresh the list in the parent component
    } catch (error) {
      console.error("Import error:", error)
      setImportError(error.message || "Failed to import skill sets.")
    } finally {
      setIsImporting(false)
      setImportFile(null)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportMessage("")
    setExportError("")

    try {
      const data = await storeService.exportSkillSets()
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "skillsets.xlsx"
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setExportMessage("Skill Sets exported successfully!")
    } catch (error) {
      console.error("Export error:", error)
      setExportError(error.message || "Failed to export skill sets.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div
      className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-auto"
      onClick={(e) => e.stopPropagation()} // Prevent click from closing dialog
    >
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
        <FiX size={24} />
      </button>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Import/Export Skill Sets</h2>

      {/* Import Section */}
      <div className="mb-8 p-4 border border-gray-200 rounded-lg">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <FiUpload /> Import Skill Sets
        </h3>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          onClick={handleImport}
          disabled={isImporting || !importFile}
          className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImporting ? "Importing..." : "Import"}
        </button>
        {importMessage && <p className="mt-3 text-sm text-green-600">{importMessage}</p>}
        {importError && <p className="mt-3 text-sm text-red-600">{importError}</p>}
      </div>

      {/* Export Section */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <FiDownload /> Export Skill Sets
        </h3>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? "Exporting..." : "Export"}
        </button>
        {exportMessage && <p className="mt-3 text-sm text-green-600">{exportMessage}</p>}
        {exportError && <p className="mt-3 text-sm text-red-600">{exportError}</p>}
      </div>
    </div>
  )
}

export default SkillSetImportExport