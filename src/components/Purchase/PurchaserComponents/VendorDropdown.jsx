"use client"

import { useState, useEffect } from "react"
import { FiChevronDown, FiPlus } from "react-icons/fi"
import { comparisonSheetService } from "../../../services/comparisonSheetService"

export default function VendorDropdown({ value, onChange, placeholder = "Select vendor" }) {
  const [isOpen, setIsOpen] = useState(false)
  const [vendors, setVendors] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    try {
      setLoading(true)
      const vendorList = await comparisonSheetService.getAllVendors()
      setVendors(vendorList || [])
    } catch (error) {
      console.error("Error loading vendors:", error)
      setVendors([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (term) => {
    setSearchTerm(term)
    if (term.trim()) {
      try {
        const searchResults = await comparisonSheetService.searchVendors(term)
        setVendors(searchResults || [])
      } catch (error) {
        console.error("Error searching vendors:", error)
      }
    } else {
      loadVendors()
    }
  }

  const handleCreateVendor = async () => {
    if (!searchTerm.trim()) return

    try {
      const newVendor = await comparisonSheetService.createVendor(searchTerm.trim())
      setVendors((prev) => [...prev, newVendor])
      onChange(newVendor.vendorName)
      setIsOpen(false)
      setSearchTerm("")
    } catch (error) {
      console.error("Error creating vendor:", error)
    }
  }

  const handleSelectVendor = (vendorName) => {
    onChange(vendorName)
    setIsOpen(false)
    setSearchTerm("")
  }

  const filteredVendors = vendors.filter((vendor) =>
    vendor.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="relative">
      <div
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>{value || placeholder}</span>
        <FiChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 border-b">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search or add new vendor..."
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {loading ? (
            <div className="p-3 text-center text-gray-500">Loading vendors...</div>
          ) : (
            <>
              {filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => handleSelectVendor(vendor.vendorName)}
                  >
                    {vendor.vendorName}
                  </div>
                ))
              ) : (
                <div className="p-3 text-gray-500 text-sm">No vendors found</div>
              )}

              {searchTerm.trim() &&
                !filteredVendors.some((v) => v.vendorName.toLowerCase() === searchTerm.toLowerCase()) && (
                  <div
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-t flex items-center gap-2 text-blue-600"
                    onClick={handleCreateVendor}
                  >
                    <FiPlus className="w-3 h-3" />
                    Add "{searchTerm}" as new vendor
                  </div>
                )}
            </>
          )}
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}
