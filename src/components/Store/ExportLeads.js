"use client"
import { useState } from "react"
import { FiDownload } from "react-icons/fi"
import { leadService } from "../../services/leadService"

const ExportLeads = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleExport = async (format) => {
    setLoading(true)
    setError(null)

    try {
      await leadService.exportAllLeads(format)
      setLoading(false)
    } catch (err) {
      console.error("Error exporting leads:", err)
      setError(err.message || "Failed to export leads.")
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleExport("csv")}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        <FiDownload size={16} />
        {loading ? "Exporting..." : "Export CSV"}
      </button>

      <button
        onClick={() => handleExport("excel")}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        <FiDownload size={16} />
        {loading ? "Exporting..." : "Export Excel"}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  )
}

export default ExportLeads