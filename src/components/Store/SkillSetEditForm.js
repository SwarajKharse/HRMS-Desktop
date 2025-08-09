"use client"
import React, { useState, useEffect } from "react"
import { FiX } from "react-icons/fi"
import { storeService } from "../../services/storeService"

const SkillSetEditForm = ({ skillSet, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    id: skillSet?.id || "",
    skillset_name: skillSet?.skillset_name || "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (skillSet) {
      setFormData({
        id: skillSet.id,
        skillset_name: skillSet.skillset_name,
      })
    }
  }, [skillSet])

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

    if (!formData.skillset_name.trim()) {
      setError("Skill Set Name cannot be empty.")
      setLoading(false)
      return
    }

    try {
      await storeService.updateSkillSet(formData.id, { skillset_name: formData.skillset_name })
      setLoading(false)
      onSubmit() // Call parent's onSubmit to refresh list and close form
    } catch (err) {
      console.error("Error updating skill set:", err)
      setError(err.message || "Failed to update skill set.")
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Skill Set</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="skillset_name" className="block text-sm font-medium text-gray-700 mb-2">
              Skill Set Name
            </label>
            <input
              type="text"
              id="skillset_name"
              name="skillset_name"
              value={formData.skillset_name}
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
            {loading ? "Updating..." : "Update Skill Set"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SkillSetEditForm