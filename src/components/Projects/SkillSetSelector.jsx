"use client"

import { useState, useEffect } from "react"
import { storeService } from "../../services/storeService"

const SkillSetSelector = ({ isOpen, onClose, onSave, selectedSkillSets = [], projectId, currentUserId }) => {
  const [skillSets, setSkillSets] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItems, setSelectedItems] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const loadMore = () => {
    loadSkillSets(searchTerm, page + 1)
  }

  useEffect(() => {
    if (isOpen) {
      loadSkillSets()
      setSelectedItems(selectedSkillSets.map((s) => s.id))
    }
  }, [isOpen, selectedSkillSets])

  const loadSkillSets = async (searchQuery = "", pageNum = 0) => {
    try {
      setLoading(true)
      const response = await storeService.getSkillSets(pageNum, 20, searchQuery)

      if (pageNum === 0) {
        setSkillSets(response.data.content || [])
      } else {
        setSkillSets((prev) => [...prev, ...(response.data.content || [])])
      }

      setHasMore(!response.data.last)
      setPage(pageNum)
    } catch (error) {
      console.error("Error loading skill sets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setPage(0)
    loadSkillSets(value, 0)
  }

  const handleSkillSetSelect = (skillSetId) => {
    setSelectedItems((prev) => {
      if (prev.includes(skillSetId)) {
        return prev.filter((id) => id !== skillSetId)
      } else {
        return [...prev, skillSetId]
      }
    })
  }

  const handleSave = () => {
    const selectedSkillSetsData = skillSets.filter((s) => selectedItems.includes(s.id))
    const formattedSkillSets = selectedSkillSetsData.map((skillSet) => ({
      id: skillSet.id,
      skill_name: skillSet.skillset_name,
      skill_code: skillSet.skill_code,
      uom: skillSet.uom,
      quantity: 1,
      rate: skillSet.rate || 0,
      categoryType: "skillSet",
      pmApprovalStatus: "PENDING",
      pmApprovalDate: null,
      pmApprovalRemarks: "",
    }))

    onSave(formattedSkillSets)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Select Skill Sets</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search skill sets..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="overflow-y-auto max-h-96 mb-4">
          {loading && page === 0 ? (
            <div className="text-center py-4">Loading skill sets...</div>
          ) : (
            <div className="space-y-2">
              {skillSets.map((skillSet) => (
                <div
                  key={skillSet.id}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedItems.includes(skillSet.id)
                      ? "bg-purple-50 border-purple-300"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => handleSkillSetSelect(skillSet.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{skillSet.skillset_name}</div>
                      <div className="text-sm text-gray-600">ID: {skillSet.id}</div>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(skillSet.id)}
                        onChange={() => handleSkillSetSelect(skillSet.id)}
                        className="w-4 h-4 text-purple-600"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
            disabled={selectedItems.length === 0}
          >
            Save Selection ({selectedItems.length})
          </button>
        </div>
      </div>
    </div>
  )
}

export default SkillSetSelector
