"use client"

import { useState, useEffect, useRef } from "react"
import { FiSearch, FiPlus, FiTrash2, FiX, FiEdit2, FiSave } from "react-icons/fi"
import { storeService } from "../../services/storeService"
import { projectService } from "../../services/projectService"

function ProductBOQSelector({ projectId, onSave, existingBOQ = null, isEditMode = false }) {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProducts, setSelectedProducts] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  // Initialize with existing BOQ data if in edit mode
  useEffect(() => {
    if (isEditMode && existingBOQ && existingBOQ.items && !isInitialized) {
      console.log("Initializing with existing BOQ data:", existingBOQ)
      const formattedProducts = existingBOQ.items.map((item) => ({
        id: item.product?.id || item.product_id || item.id,
        product_name: item.product?.product_name || item.product?.productName || item.product_name || "Unknown Product",
        hsn_code: item.product?.hsn_code || item.product?.hsnCode || item.hsn_code || "",
        product_description:
          item.product?.product_description || item.product?.productDescription || item.product_description || "",
        product_qty: item.product?.product_qty || item.product?.productQty || item.product_qty || 0,
        uom: item.uom || item.product?.uom || "",
        qty: item.totalQty || item.qty || 1,
        make: item.make || "",
        category_id: item.product?.category_id || null,
        categoryInfo: extractCategoryInfo(item.product || item),
      }))
      console.log("Formatted products for editing:", formattedProducts)
      setSelectedProducts(formattedProducts)
      setIsInitialized(true)
    } else if (!isEditMode && !isInitialized) {
      // For new BOQ creation, start with empty state
      setSelectedProducts([])
      setIsInitialized(true)
    }
  }, [isEditMode, existingBOQ, isInitialized])

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts()
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Helper function to extract category information from nested structure
  const extractCategoryInfo = (product) => {
    if (!product)
      return {
        topCategory: "Uncategorized",
        mainCategory: "Uncategorized",
        subCategory: "Uncategorized",
        fullPath: "Uncategorized",
      }

    const topCategory = product?.category_id?.productCategory?.leadProductType?.label || "Uncategorized"
    const mainCategory = product?.category_id?.productCategory?.category_name || "Uncategorized"
    const subCategory = product?.category_id?.category_name || "Uncategorized"

    return {
      topCategory,
      mainCategory,
      subCategory,
      fullPath: `${topCategory} > ${mainCategory} > ${subCategory}`,
    }
  }

  // Filter products based on search term
  useEffect(() => {
    if (!Array.isArray(products)) {
      setFilteredProducts([])
      return
    }

    if (searchTerm.trim() === "") {
      setFilteredProducts(products)
    } else {
      const lowercasedSearch = searchTerm.toLowerCase()
      const filtered = products.filter((product) => {
        if (!product) return false

        const categoryInfo = extractCategoryInfo(product)

        return (
          (product.product_name || "").toLowerCase().includes(lowercasedSearch) ||
          categoryInfo.topCategory.toLowerCase().includes(lowercasedSearch) ||
          categoryInfo.mainCategory.toLowerCase().includes(lowercasedSearch) ||
          categoryInfo.subCategory.toLowerCase().includes(lowercasedSearch) ||
          (product.hsn_code || "").toLowerCase().includes(lowercasedSearch) ||
          (product.product_description || "").toLowerCase().includes(lowercasedSearch)
        )
      })
      setFilteredProducts(filtered)
    }
  }, [searchTerm, products])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await storeService.getProductsList()
      console.log("API Response:", response)

      let productsData = []

      if (Array.isArray(response)) {
        productsData = response
      } else if (response && Array.isArray(response.data)) {
        productsData = response.data
      } else if (response && Array.isArray(response.products)) {
        productsData = response.products
      } else if (response && typeof response === "object") {
        const arrayProperty = Object.values(response).find((value) => Array.isArray(value))
        if (arrayProperty) {
          productsData = arrayProperty
        }
      }

      if (!Array.isArray(productsData)) {
        throw new Error("Invalid response format: Expected an array of products")
      }

      setProducts(productsData)
      setFilteredProducts(productsData)
    } catch (err) {
      console.error("Error fetching products:", err)
      setError(`Failed to load products: ${err.message}`)
      setProducts([])
      setFilteredProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleProductSelect = (product) => {
    if (!selectedProducts.some((p) => p.id === product.id)) {
      const categoryInfo = extractCategoryInfo(product)

      setSelectedProducts([
        ...selectedProducts,
        {
          ...product,
          qty: 1,
          make: "",
          categoryInfo,
        },
      ])
    }
    setShowDropdown(false)
    setSearchTerm("")
  }

  const handleQuantityChange = (id, qty) => {
    // Allow empty string for deletion, but convert to number for validation
    const numericQty = qty === "" ? "" : Number.parseInt(qty) || ""

    const updatedProducts = selectedProducts.map((product) => {
      if (product.id === id) {
        return { ...product, qty: numericQty }
      }
      return product
    })
    setSelectedProducts(updatedProducts)
  }

  const handleMakeChange = (id, make) => {
    const updatedProducts = selectedProducts.map((product) => {
      if (product.id === id) {
        return { ...product, make }
      }
      return product
    })
    setSelectedProducts(updatedProducts)
  }

  const handleRemoveProduct = (id) => {
    setSelectedProducts(selectedProducts.filter((product) => product.id !== id))
  }

  const handleSaveBOQ = async () => {
    if (selectedProducts.length === 0) {
      setError("Please add at least one product to the BOQ")
      return
    }

    // Validate quantities - check for empty or invalid quantities
    const invalidProducts = selectedProducts.filter((p) => !p.qty || p.qty === "" || p.qty <= 0)
    if (invalidProducts.length > 0) {
      setError("Please enter valid quantities for all products")
      return
    }

    setSaving(true)
    setError("")

    try {
      const boqData = {
        project_id: projectId,
        items: selectedProducts.map((p) => ({
          product_id: p.id,
          qty: Number.parseInt(p.qty) || 1, // Ensure we have a valid number
          make: p.make || "",
          uom: p.uom || "",
          product_name: p.product_name || "",
          hsn_code: p.hsn_code || "",
        })),
      }

      console.log("Saving BOQ data:", boqData)

      if (isEditMode && projectId) {
        // Save directly to backend if in edit mode
        await projectService.createOrUpdateBOQ(projectId, boqData)
        onSave(boqData, true) // Pass true to indicate it was saved to backend
      } else {
        // Just pass data to parent for project creation
        onSave(boqData, false)
      }
    } catch (err) {
      console.error("Error saving BOQ:", err)
      setError(`Failed to save BOQ: ${err.message || err}`)
    } finally {
      setSaving(false)
    }
  }

  const openDropdown = () => {
    setShowDropdown(true)
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 100)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg bg-white border p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg border-b pb-2 flex-1">{isEditMode ? "Edit BOQ" : "Create BOQ"}</h3>
          {isEditMode && (
            <div className="flex items-center text-sm text-blue-600">
              <FiEdit2 className="mr-1" />
              Edit Mode
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 border border-red-100">
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
              <FiX />
            </button>
          </div>
        )}

        {/* Product search and dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-gray-50">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products by name, category, subcategory, HSN code..."
              value={searchTerm}
              onChange={handleSearchChange}
              onClick={openDropdown}
              ref={searchInputRef}
              className="w-full p-2 focus:outline-none"
            />
          </div>

          {/* Dropdown for product selection */}
          {showDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-80 overflow-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading products...</p>
                </div>
              ) : Array.isArray(filteredProducts) && filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  if (!product || !product.id) return null

                  const categoryInfo = extractCategoryInfo(product)
                  const isAlreadySelected = selectedProducts.some((p) => p.id === product.id)

                  return (
                    <div
                      key={product.id}
                      className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                        isAlreadySelected ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100"
                      }`}
                      onClick={() => !isAlreadySelected && handleProductSelect(product)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {product.product_name || "Unnamed Product"}
                            {isAlreadySelected && <span className="ml-2 text-xs">(Already selected)</span>}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">{categoryInfo.fullPath}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            HSN: {product.hsn_code || "N/A"} | UOM: {product.uom || "N/A"} | Qty Available:{" "}
                            {product.product_qty || "0"}
                          </div>
                          {product.product_description && (
                            <div className="text-xs text-gray-400 mt-1 truncate">{product.product_description}</div>
                          )}
                        </div>
                        {!isAlreadySelected && (
                          <button className="text-blue-600 hover:bg-blue-50 p-1 rounded-full ml-2 flex-shrink-0">
                            <FiPlus />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? "No products found matching your search" : "No products available"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected products table */}
        {selectedProducts.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-2">Selected Products ({selectedProducts.length})</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category Hierarchy
                    </th>
                    <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Make
                    </th>
                    <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UOM
                    </th>
                    <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedProducts.map((product, index) => {
                    const categoryInfo = product.categoryInfo || extractCategoryInfo(product)
                    return (
                      <tr key={product.id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                        <td className="px-3 py-2">
                          <div className="text-sm font-medium">{product.product_name || "Unnamed Product"}</div>
                          <div className="text-xs text-gray-500">HSN: {product.hsn_code || "N/A"}</div>
                          <div className="text-xs text-gray-400">Available: {product.product_qty || "0"}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            <div className="text-blue-600 font-medium">{categoryInfo.topCategory}</div>
                            <div className="text-gray-600">{categoryInfo.mainCategory}</div>
                            <div className="text-gray-500">{categoryInfo.subCategory}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={product.make || ""}
                            onChange={(e) => handleMakeChange(product.id, e.target.value)}
                            placeholder="Enter make"
                            className="w-full p-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm">{product.uom || "N/A"}</td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={product.qty}
                            onChange={(e) => {
                              // Allow only numbers and empty string
                              const value = e.target.value
                              if (value === "" || /^\d+$/.test(value)) {
                                handleQuantityChange(product.id, value)
                              }
                            }}
                            onBlur={(e) => {
                              // If empty on blur, set to 1
                              if (e.target.value === "") {
                                handleQuantityChange(product.id, "1")
                              }
                            }}
                            placeholder="Qty"
                            className="w-20 p-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleRemoveProduct(product.id)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                            title="Remove product"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Save BOQ button */}
        {selectedProducts.length > 0 && (
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSaveBOQ}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  {isEditMode ? "Update BOQ" : "Save BOQ"} ({selectedProducts.length} items)
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductBOQSelector