"use client"

import { useState, useEffect } from "react"
import { storeService } from "../../services/storeService"

const ToolsSelector = ({ isOpen, onClose, onSave, selectedTools = [], projectId, currentUserId }) => {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItems, setSelectedItems] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadTools()
      setSelectedItems(selectedTools.map((t) => t.id))
    }
  }, [isOpen, selectedTools])

  const loadTools = async (searchQuery = "", pageNum = 0) => {
    try {
      setLoading(true)
      const response = await storeService.getTools(pageNum, 20, searchQuery)

      if (pageNum === 0) {
        setTools(response.data.content || [])
      } else {
        setTools((prev) => [...prev, ...(response.data.content || [])])
      }

      setHasMore(!response.data.last)
      setPage(pageNum)
    } catch (error) {
      console.error("Error loading tools:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    await loadTools(searchTerm, page + 1)
  }

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setPage(0)
    loadTools(value, 0)
  }

  const handleToolSelect = (toolId) => {
    setSelectedItems((prev) => {
      if (prev.includes(toolId)) {
        return prev.filter((id) => id !== toolId)
      } else {
        return [...prev, toolId]
      }
    })
  }

  const handleSave = () => {
    const selectedToolsData = tools.filter((t) => selectedItems.includes(t.id))
    const formattedTools = selectedToolsData.map((tool) => ({
      id: tool.id,
      tool_name: tool.tool_name,
      tool_code: tool.tool_code,
      uom: tool.uom,
      quantity: 1,
      rate: tool.rate || 0,
      categoryType: "tools",
      pmApprovalStatus: "PENDING",
      pmApprovalDate: null,
      pmApprovalRemarks: "",
    }))

    onSave(formattedTools)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Select Tools</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="overflow-y-auto max-h-96 mb-4">
          {loading && page === 0 ? (
            <div className="text-center py-4">Loading tools...</div>
          ) : (
            <div className="space-y-2">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedItems.includes(tool.id)
                      ? "bg-green-50 border-green-300"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => handleToolSelect(tool.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{tool.tool_name}</div>
                      <div className="text-sm text-gray-600">ID: {tool.id}</div>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(tool.id)}
                        onChange={() => handleToolSelect(tool.id)}
                        className="w-4 h-4 text-green-600"
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
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
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
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            disabled={selectedItems.length === 0}
          >
            Save Selection ({selectedItems.length})
          </button>
        </div>
      </div>
    </div>
  )
}

export default ToolsSelector
