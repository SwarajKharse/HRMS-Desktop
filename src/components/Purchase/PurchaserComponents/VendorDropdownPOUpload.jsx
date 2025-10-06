"use client"

import { useState, useRef, useEffect } from "react"
import { comparisonSheetService } from "../../../services/comparisonSheetService"

const VendorDropdownPOUpload = ({ value, onChange, placeholder = "Select a vendor..." }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (isOpen && vendors.length === 0) {
      fetchVendors()
    }
  }, [isOpen])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const vendorData = await comparisonSheetService.getAllVendors()
      setVendors(vendorData || [])
    } catch (error) {
      console.error("Error fetching vendors:", error)
      setVendors([])
    } finally {
      setLoading(false)
    }
  }

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.code?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleVendorSelect = (vendor) => {
    onChange(vendor.vendorName) // Pass vendor name to parent
    setIsOpen(false)
    setSearchTerm("")
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={loading}
      >
        {value || placeholder}
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-2 text-gray-500">Loading vendors...</div>
            ) : filteredVendors.length === 0 ? (
              <div className="px-4 py-2 text-gray-500">No vendors found</div>
            ) : (
              filteredVendors.map((vendor) => (
                <button
                  key={vendor.id}
                  onClick={() => handleVendorSelect(vendor)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="font-medium">{vendor.vendorName}</div>
                  {vendor.code && <div className="text-sm text-gray-500">{vendor.code}</div>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorDropdownPOUpload