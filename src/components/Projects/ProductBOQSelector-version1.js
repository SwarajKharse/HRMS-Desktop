"use client"

import { useState, useEffect, useRef } from "react"
import { FiSearch, FiPlus, FiTrash2, FiX, FiEdit2, FiSave, FiChevronDown, FiChevronRight } from "react-icons/fi"
import { storeService } from "../../services/storeService"
import { projectService } from "../../services/projectService"

function ProductBOQSelector({ projectId, onSave, existingBOQ = null, isEditMode = false }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [filteredProducts, setFilteredProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProductsByCategory, setSelectedProductsByCategory] = useState({})
  const [expandedCategories, setExpandedCategories] = useState({})
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
      const productsByCategory = {}

      existingBOQ.items.forEach((item) => {
        const product = {
          id: item.product?.id || item.product_id || item.id,
          product_name:
            item.product?.product_name || item.product?.productName || item.product_name || "Unknown Product",
          hsn_code: item.product?.hsn_code || item.product?.hsnCode || item.hsn_code || "",
          product_description:
            item.product?.product_description || item.product?.productDescription || item.product_description || "",
          product_qty: item.product?.product_qty || item.product?.productQty || item.product_qty || 0,
          uom: item.uom || item.product?.uom || "",
          qty: item.totalQty || item.qty || 1,
          make: item.make || "",
          category_id: item.product?.category_id || null,
          categoryInfo: extractCategoryInfo(item.product || item),
        }

        const categoryKey = product.categoryInfo.topCategory
        if (!productsByCategory[categoryKey]) {
          productsByCategory[categoryKey] = []
        }
        productsByCategory[categoryKey].push(product)
      })

      setSelectedProductsByCategory(productsByCategory)
      // Expand all categories that have products
      const expanded = {}
      Object.keys(productsByCategory).forEach((category) => {
        expanded[category] = true
      })
      setExpandedCategories(expanded)
      setIsInitialized(true)
    } else if (!isEditMode && !isInitialized) {
      setSelectedProductsByCategory({})
      setIsInitialized(true)
    }
  }, [isEditMode, existingBOQ, isInitialized])

  // Fetch products and extract categories on component mount
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

  // Filter products based on search term and selected category
  useEffect(() => {
    if (!Array.isArray(products)) {
      setFilteredProducts([])
      return
    }

    let filtered = products

    // Filter by selected category if one is selected
    if (selectedCategory && selectedCategory !== "") {
      filtered = filtered.filter((product) => {
        const categoryInfo = extractCategoryInfo(product)
        return categoryInfo.topCategory === selectedCategory
      })
    }

    // Filter by search term
    if (searchTerm.trim() !== "") {
      const lowercasedSearch = searchTerm.toLowerCase()
      filtered = filtered.filter((product) => {
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
    }

    setFilteredProducts(filtered)
  }, [searchTerm, products, selectedCategory])

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

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(
          productsData.map((product) => {
            const categoryInfo = extractCategoryInfo(product)
            return categoryInfo.topCategory
          }),
        ),
      ]
        .filter((category) => category !== "Uncategorized")
        .sort()

      setCategories(uniqueCategories)
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

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value)
    setSearchTerm("")
  }

  const handleProductSelect = (product) => {
    const categoryInfo = extractCategoryInfo(product)
    const categoryKey = categoryInfo.topCategory

    // Check if product is already selected in this category
    const categoryProducts = selectedProductsByCategory[categoryKey] || []
    if (categoryProducts.some((p) => p.id === product.id)) {
      return
    }

    const updatedProduct = {
      ...product,
      qty: 1,
      make: "",
      categoryInfo,
    }

    setSelectedProductsByCategory((prev) => ({
      ...prev,
      [categoryKey]: [...(prev[categoryKey] || []), updatedProduct],
    }))

    // Expand the category if it's not already expanded
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryKey]: true,
    }))

    setShowDropdown(false)
    setSearchTerm("")
  }

  const handleQuantityChange = (categoryKey, productId, qty) => {
    const numericQty = qty === "" ? "" : Number.parseInt(qty) || ""

    setSelectedProductsByCategory((prev) => ({
      ...prev,
      [categoryKey]: prev[categoryKey].map((product) =>
        product.id === productId ? { ...product, qty: numericQty } : product,
      ),
    }))
  }

  const handleMakeChange = (categoryKey, productId, make) => {
    setSelectedProductsByCategory((prev) => ({
      ...prev,
      [categoryKey]: prev[categoryKey].map((product) => (product.id === productId ? { ...product, make } : product)),
    }))
  }

  const handleRemoveProduct = (categoryKey, productId) => {
    setSelectedProductsByCategory((prev) => {
      const updatedCategory = prev[categoryKey].filter((product) => product.id !== productId)
      if (updatedCategory.length === 0) {
        const { [categoryKey]: removed, ...rest } = prev
        return rest
      }
      return {
        ...prev,
        [categoryKey]: updatedCategory,
      }
    })
  }

  const toggleCategoryExpansion = (categoryKey) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }))
  }

  const handleSaveBOQ = async () => {
    const allProducts = Object.values(selectedProductsByCategory).flat()

    if (allProducts.length === 0) {
      setError("Please add at least one product to the BOQ")
      return
    }

    // Validate quantities
    const invalidProducts = allProducts.filter((p) => !p.qty || p.qty === "" || p.qty <= 0)
    if (invalidProducts.length > 0) {
      setError("Please enter valid quantities for all products")
      return
    }

    setSaving(true)
    setError("")

    try {
      const boqData = {
        project_id: projectId,
        items: allProducts.map((p) => ({
          product_id: p.id,
          qty: Number.parseInt(p.qty) || 1,
          make: p.make || "",
          uom: p.uom || "",
          product_name: p.product_name || "",
          hsn_code: p.hsn_code || "",
        })),
      }

      console.log("Saving BOQ data:", boqData)

      if (isEditMode && projectId) {
        await projectService.createOrUpdateBOQ(projectId, boqData)
        onSave(boqData, true)
      } else {
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

  const getTotalProductCount = () => {
    return Object.values(selectedProductsByCategory).reduce((total, products) => total + products.length, 0)
  }

  const getSelectedProductsInCategory = (categoryKey) => {
    const categoryProducts = selectedProductsByCategory[categoryKey] || []
    return categoryProducts.map((p) => p.id)
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

        {/* Category selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Select Category</label>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {/* {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))} */}
            <option key="1" value={1}>Cate1</option>
            <option key="2" value={2}>Cate2</option>
            <option key="3" value={3}>Cate3</option>
            <option key="4" value={4}>Cate4</option>
            <option key="5" value={5}>Cate5</option>
          </select>
        </div>

        {/* Product search and dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-gray-50">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={`Search products${selectedCategory ? ` in ${selectedCategory}` : " by name, category, subcategory, HSN code..."}`}
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
                  const selectedInCategory = getSelectedProductsInCategory(categoryInfo.topCategory)
                  const isAlreadySelected = selectedInCategory.includes(product.id)

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

        {/* Selected products by category */}
        {Object.keys(selectedProductsByCategory).length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-4">Selected Products by Category ({getTotalProductCount()} total items)</h4>

            {Object.entries(selectedProductsByCategory).map(([categoryKey, products]) => (
              <div key={categoryKey} className="mb-4 border rounded-lg">
                {/* Category header */}
                <div
                  className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleCategoryExpansion(categoryKey)}
                >
                  <div className="flex items-center">
                    {expandedCategories[categoryKey] ? (
                      <FiChevronDown className="mr-2 text-gray-500" />
                    ) : (
                      <FiChevronRight className="mr-2 text-gray-500" />
                    )}
                    <h5 className="font-medium text-gray-900">{categoryKey}</h5>
                    <span className="ml-2 text-sm text-gray-500">({products.length} items)</span>
                  </div>
                </div>

                {/* Category products table */}
                {expandedCategories[categoryKey] && (
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
                        {products.map((product, index) => {
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
                                  onChange={(e) => handleMakeChange(categoryKey, product.id, e.target.value)}
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
                                    const value = e.target.value
                                    if (value === "" || /^\d+$/.test(value)) {
                                      handleQuantityChange(categoryKey, product.id, value)
                                    }
                                  }}
                                  onBlur={(e) => {
                                    if (e.target.value === "") {
                                      handleQuantityChange(categoryKey, product.id, "1")
                                    }
                                  }}
                                  placeholder="Qty"
                                  className="w-20 p-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  onClick={() => handleRemoveProduct(categoryKey, product.id)}
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
                )}
              </div>
            ))}
          </div>
        )}

        {/* Save BOQ button */}
        {getTotalProductCount() > 0 && (
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
                  {isEditMode ? "Update BOQ" : "Save BOQ"} ({getTotalProductCount()} items)
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