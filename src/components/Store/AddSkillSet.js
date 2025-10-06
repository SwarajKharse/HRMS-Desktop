"use client"
import React, { useState } from "react"
import { FiX } from "react-icons/fi"
import { storeService } from "../../services/storeService"

const AddSkillSet = ({ onClose, onSuccess }) => {
  const [skillSetName, setSkillSetName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!skillSetName.trim()) {
      setError("Skill Set Name cannot be empty.")
      setLoading(false)
      return
    }

    try {
      await storeService.createSkillSet({ skillset_name: skillSetName })
      setLoading(false)
      onSuccess()
    } catch (err) {
      console.error("Error adding skill set:", err)
      setError(err.message || "Failed to add skill set.")
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Skill Set</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="skillSetName" className="block text-sm font-medium text-gray-700 mb-2">
              Skill Set Name
            </label>
            <input
              type="text"
              id="skillSetName"
              value={skillSetName}
              onChange={(e) => setSkillSetName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Adding..." : "Add Skill Set"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddSkillSet