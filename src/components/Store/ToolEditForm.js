"use client"
import React, { useState, useEffect } from "react"
import { FiX } from "react-icons/fi"
import { storeService } from "../../services/storeService"

const ToolEditForm = ({ tool, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    id: tool?.id || "",
    tool_name: tool?.tool_name || "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (tool) {
      setFormData({
        id: tool.id,
        tool_name: tool.tool_name,
      })
    }
  }, [tool])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.tool_name.trim()) {
      setError("Tool Name cannot be empty.")
      setLoading(false)
      return
    }

    try {
      await storeService.updateTool(formData.id, { tool_name: formData.tool_name })
      setLoading(false)
      onSubmit() // Call parent's onSubmit to refresh list and close form
    } catch (err) {
      console.error("Error updating tool:", err)
      setError(err.message || "Failed to update tool.")
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <FiX size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Tool</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="tool_name" className="block text-sm font-medium text-gray-700 mb-2">
              Tool Name
            </label>
            <input
              type="text"
              id="tool_name"
              name="tool_name"
              value={formData.tool_name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Updating..." : "Update Tool"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ToolEditForm