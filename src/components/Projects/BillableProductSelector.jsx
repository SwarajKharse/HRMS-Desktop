"use client"

import { useState, useEffect, useRef } from "react"
import { FiSearch, FiPlus, FiTrash2, FiX, FiEdit2, FiSave, FiChevronDown, FiChevronRight } from "react-icons/fi"
import { storeService } from "../../services/storeService" // Assuming this path is correct

function BillableProductSelector({ projectId, onSave, leadProductTypes, existingBOQ = null, isEditMode = false }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedProductsByCategory, setSelectedProductsByCategory] = useState({})
  const [expandedCategories, setExpandedCategories] = useState({})
  const [activeProductSearch, setActiveProductSearch] = useState(null)
  const [filteredProducts, setFilteredProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [selectedCategoryToAdd, setSelectedCategoryToAdd] = useState("")
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  const calculateAmounts = (qty, supplyRate, installationRate) => {
    const parsedQty = Number.parseFloat(qty) || 0
    const parsedSupplyRate = Number.parseFloat(supplyRate) || 0
    const parsedInstallationRate = Number.parseFloat(installationRate) || 0
    const supplyAmount = parsedQty * parsedSupplyRate
    const installationAmount = parsedQty * parsedInstallationRate
    const total = supplyAmount + installationAmount
    return { supplyAmount: supplyAmount, installationAmount: installationAmount, total: total } // Changed to camelCase
  }

  // Helper function to extract category information from nested structure
  // Updated to correctly use product.categoryId.label as per provided payload structure for products list
  const extractCategoryInfo = (product) => {
    if (product && product.categoryId && product.categoryId.label) {
      const topCategory = product.categoryId.label
      return {
        topCategory,
        mainCategory: topCategory, // Assuming no deeper hierarchy from this source
        subCategory: topCategory, // Assuming no deeper hierarchy from this source
        fullPath: topCategory,
      }
    }
    // Fallback for other structures or if category info is missing
    return {
      topCategory: "Uncategorized",
      mainCategory: "Uncategorized",
      subCategory: "Uncategorized",
      fullPath: "Uncategorized",
    }
  }

  // Initialize with existing BOQ data if in edit mode
  useEffect(() => {
    if (isEditMode && existingBOQ && existingBOQ.items && Array.isArray(existingBOQ.items) && !isInitialized) {
      console.log("Initializing with existing BOQ data in BillableProductSelector:", existingBOQ)
      const productsByCategory = {}
      const usedCategories = []
      existingBOQ.items.forEach((item) => {
        // Use item.product.categoryId.id for categoryId and item.product.categoryId.label for categoryName
        const categoryId = item.product?.categoryId?.id || "unassigned"
        const categoryName = item.product?.categoryId?.label || "Unassigned"

        if (!usedCategories.find((cat) => cat.id === categoryId)) {
          usedCategories.push({ id: categoryId, name: categoryName })
        }
        const initialQty = item.totalQty || 1 // Use item.totalQty from BOQEditComponent's formatted item
        const initialSupplyRate = item.supplyRate || 0
        const initialInstallationRate = item.installationRate || 0
        const { supplyAmount, installationAmount, total } = calculateAmounts(
          initialQty,
          initialSupplyRate,
          initialInstallationRate,
        )
        const product = {
          id: item.id, // This is the BOQItem ID from backend, use as stable ID for selector's state
          productId: item.product?.id, // This is the ProductsMaster ID
          productName: item.product?.productName || "Unknown Product",
          hsnCode: item.product?.hsnCode || "",
          productDescription: item.product?.productDescription || "",
          productQty: item.product?.productQty || 0, // Available quantity from store
          uom: item.uom || item.product?.uom || "",
          qty: initialQty, // This is the BOQ quantity
          make: item.make || "",
          supplyRate: initialSupplyRate,
          installationRate: initialInstallationRate,
          supplyAmount: supplyAmount,
          installationAmount: installationAmount,
          total: total,
          leadProductTypeId: categoryId, // This is the leadProductTypeId
          categoryInfo: extractCategoryInfo(item.product), // Pass item.product to extractCategoryInfo
          isExisting: true, // Flag to mark as an existing item
          isNewBoqItem: false, // Flag for BOQEditComponent
        }
        if (!productsByCategory[categoryId]) {
          productsByCategory[categoryId] = []
        }
        productsByCategory[categoryId].push(product)
      })
      setSelectedCategories(usedCategories)
      setSelectedProductsByCategory(productsByCategory)
      const expanded = {}
      usedCategories.forEach((category) => {
        expanded[category.id] = true
      })
      setExpandedCategories(expanded)
      setIsInitialized(true)
    } else if (!isEditMode && !isInitialized) {
      setSelectedProductsByCategory({})
      setSelectedCategories([])
      setIsInitialized(true)
    }
  }, [isEditMode, existingBOQ, isInitialized, leadProductTypes])

  // Fetch products and categories on component mount
  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
        setActiveProductSearch(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Filter products based on search term (no category filtering)
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
      console.log("API Response (BillableProductSelector):", response)
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
      console.error("Error fetching products (BillableProductSelector):", err)
      setError(`Failed to load products: ${err.message}`)
      setProducts([])
      setFilteredProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      // Categories are now passed via leadProductTypes prop
      setCategories(
        leadProductTypes.map((item) => {
          const newitem = { id: item.id, name: item.label }
          return newitem
        }),
      )
    } catch (err) {
      console.error("Error fetching categories (BillableProductSelector):", err)
      setError(`Failed to load categories: ${err.message}`)
    }
  }

  const handleCategorySelect = (categoryId) => {
    const category = categories.find((cat) => cat.id === Number.parseInt(categoryId))
    if (category && !selectedCategories.find((cat) => cat.id === category.id)) {
      setSelectedCategories([...selectedCategories, category])
      setExpandedCategories((prev) => ({ ...prev, [category.id]: true }))
    }
  }

  const handleRemoveCategory = (categoryId) => {
    setSelectedCategories(selectedCategories.filter((cat) => cat.id !== categoryId))
    setSelectedProductsByCategory((prev) => {
      const { [categoryId]: removed, ...rest } = prev
      return rest
    })
    setExpandedCategories((prev) => {
      const { [categoryId]: removed, ...rest } = prev
      return rest
    })
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleProductSelect = (product) => {
    if (!activeProductSearch) return
    const categoryProducts = selectedProductsByCategory[activeProductSearch] || []
    // Check if product is already selected in this category by its actual product ID
    if (categoryProducts.some((p) => p.productId === product.id)) {
      return
    }
    // For new products, rates and amounts are set to 0
    const { supplyAmount, installationAmount, total } = calculateAmounts(1, 0, 0)
    const updatedProduct = {
      id: Date.now(), // Temporary unique ID for this new BOQ item entry in frontend state
      productId: product.id, // This is the actual ProductsMaster ID
      productName: product.product_name || product.productName || product.name || "Unknown Product",
      hsnCode: product.hsn_code || product.hsnCode || "",
      productDescription: product.product_description || product.productDescription || "",
      productQty: product.product_qty || product.productQty || 0, // Available quantity
      uom: product.uom || "",
      qty: 1, // Default BOQ quantity
      make: "",
      supplyRate: 0,
      installationRate: 0,
      supplyAmount: supplyAmount,
      installationAmount: installationAmount,
      total: total,
      leadProductTypeId: activeProductSearch, // This is the leadProductTypeId
      categoryInfo: extractCategoryInfo(product),
      isExisting: false, // New product
      isNewBoqItem: true, // Flag for BOQEditComponent
    }
    setSelectedProductsByCategory((prev) => ({
      ...prev,
      [activeProductSearch]: [...(prev[activeProductSearch] || []), updatedProduct],
    }))
    setShowDropdown(false)
    setSearchTerm("")
    setActiveProductSearch(null)
  }

  const handleProductFieldChange = (categoryId, id, field, value) => {
    // id here is BOQItem ID or temporary ID
    setSelectedProductsByCategory((prev) => {
      const updatedCategoryProducts = prev[categoryId].map((product) => {
        if (product.id === id) {
          // Match by product.id (BOQItem ID or temporary ID)
          const updatedProduct = { ...product, [field]: value }
          // Recalculate amounts only if qty changes, using existing (or 0) rates
          if (field === "qty" || field === "supplyRate" || field === "installationRate") {
            const { supplyAmount, installationAmount, total } = calculateAmounts(
              updatedProduct.qty,
              updatedProduct.supplyRate,
              updatedProduct.installationRate,
            )
            updatedProduct.supplyAmount = supplyAmount
            updatedProduct.installationAmount = installationAmount
            updatedProduct.total = total
          }
          return updatedProduct
        }
        return product
      })
      return {
        ...prev,
        [categoryId]: updatedCategoryProducts,
      }
    })
  }

  const handleRemoveProduct = (categoryId, id) => {
    // id here is BOQItem ID or temporary ID
    setSelectedProductsByCategory((prev) => {
      const updatedCategory = prev[categoryId].filter((product) => product.id !== id) // Match by product.id
      if (updatedCategory.length === 0) {
        const { [categoryId]: removed, ...rest } = prev
        return rest
      }
      return {
        ...prev,
        [categoryId]: updatedCategory,
      }
    })
  }

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  const openProductSearch = (categoryId) => {
    setActiveProductSearch(categoryId)
    setShowDropdown(true)
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 100)
  }

  const handleSaveBOQ = async () => {
    const allProducts = Object.entries(selectedProductsByCategory).flatMap(([categoryId, products]) =>
      products.map((p) => ({
        id: p.isExisting ? p.id : null, // Send BOQItem ID if existing, null if new
        productId: p.productId, // This is ProductsMaster.id
        productName: p.productName,
        hsnCode: p.hsnCode,
        qty: Number.parseFloat(p.qty) || 1,
        make: p.make || "",
        uom: p.uom || "",
        leadProductTypeId: Number.parseInt(categoryId),
        supplyRate: Number.parseFloat(p.supplyRate) || 0,
        installationRate: Number.parseFloat(p.installationRate) || 0,
        supplyAmount: p.supplyAmount,
        installationAmount: p.installationAmount,
        total: p.total,
        categoryInfo: p.categoryInfo,
        isExisting: p.isExisting, // Pass this flag to BOQEditComponent
        isNewBoqItem: p.isNewBoqItem, // Pass this flag to BOQEditComponent
      })),
    )
    if (allProducts.length === 0) {
      setError("Please add at least one product to the BOQ")
      return
    }
    const invalidProducts = allProducts.filter((p) => !p.qty || Number.parseFloat(p.qty) <= 0)
    if (invalidProducts.length > 0) {
      setError("Please enter valid quantities for all products")
      return
    }
    setSaving(true)
    setError("")
    try {
      const boqData = {
        projectId: projectId,
        items: allProducts, // Send the mapped products directly
      }
      console.log("Saving BOQ data from BillableProductSelector:", boqData)
      // Call the onSave prop passed from BOQEditComponent
      onSave(boqData, isEditMode)
    } catch (err) {
      console.error("Error saving BOQ (BillableProductSelector):", err)
      setError(`Failed to save BOQ: ${err.message || err}`)
    } finally {
      setSaving(false)
    }
  }

  const getTotalProductCount = () => {
    return Object.values(selectedProductsByCategory).reduce((total, products) => total + products.length, 0)
  }

  const getSelectedProductsInCategory = (categoryId) => {
    const categoryProducts = selectedProductsByCategory[categoryId] || []
    return categoryProducts.map((p) => p.productId) // Return productId for checking
  }

  return (
    <div className="space-y-6 w-full h-full flex flex-col">
      <div className="space-y-4 rounded-lg bg-white border p-4 flex-1 overflow-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg border-b pb-2 flex-1">
            {isEditMode ? "Edit Billable BOQ Items2222222222" : "Select Billable BOQ Items"}
          </h3>
          {isEditMode && (
            <div className="flex items-center text-sm text-blue-600">
              <FiEdit2 className="mr-1" />
              Edit Mode
            </div>
          )}
        </div>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 border border-red-100">
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
              <FiX />
            </button>
          </div>
        )}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Add Categories</label>
          <div className="flex gap-2">
            <select
              value={selectedCategoryToAdd}
              onChange={(e) => {
                const value = e.target.value
                setSelectedCategoryToAdd(value)
                if (value) {
                  handleCategorySelect(value)
                  setSelectedCategoryToAdd("")
                }
              }}
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category to add</option>
              {categories
                .filter((cat) => !selectedCategories.find((selected) => selected.id === cat.id))
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{category.name}</span>
                  <button
                    onClick={() => handleRemoveCategory(category.id)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {activeProductSearch && (
          <div className="relative" ref={dropdownRef}>
            <div className="mb-2 text-sm text-gray-600">
              Adding products to:{" "}
              <strong>{selectedCategories.find((cat) => cat.id === activeProductSearch)?.name}</strong>
            </div>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-50">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products by name, category, subcategory, HSN code..."
                value={searchTerm}
                onChange={handleSearchChange}
                ref={searchInputRef}
                className="w-full p-2 focus:outline-none"
              />
              <button
                onClick={() => {
                  setActiveProductSearch(null)
                  setShowDropdown(false)
                  setSearchTerm("")
                }}
                className="px-3 py-2 text-gray-400 hover:text-gray-600"
              >
                <FiX />
              </button>
            </div>
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
                    const selectedInCategory = getSelectedProductsInCategory(activeProductSearch)
                    const isAlreadySelected = selectedInCategory.includes(product.id)
                    return (
                      <div
                        key={product.id}
                        className={
                          "p-3 cursor-pointer border-b border-gray-100 last:border-b-0 " +
                          (isAlreadySelected ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100")
                        }
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
        )}
        {selectedCategories.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-4">
              BOQ Categories ({selectedCategories.length} categories, {getTotalProductCount()} total items)
            </h4>
            {selectedCategories.map((category) => {
              const categoryProducts = selectedProductsByCategory[category.id] || []
              return (
                <div key={category.id} className="mb-4 border rounded-lg">
                  {/* Category header */}
                  <div className="flex items-center justify-between p-3 bg-gray-50">
                    <div
                      className="flex items-center cursor-pointer hover:bg-gray-100 transition-colors flex-1 -m-3 p-3"
                      onClick={() => toggleCategoryExpansion(category.id)}
                    >
                      {expandedCategories[category.id] ? (
                        <FiChevronDown className="mr-2 text-gray-500" />
                      ) : (
                        <FiChevronRight className="mr-2 text-gray-500" />
                      )}
                      <h5 className="font-medium text-gray-900">{category.name}</h5>
                      <span className="ml-2 text-sm text-gray-500">({categoryProducts.length} items)</span>
                    </div>
                    <button
                      onClick={() => openProductSearch(category.id)}
                      className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <FiPlus className="mr-1" size={14} />
                      Add Product
                    </button>
                  </div>
                  {/* Category products table */}
                  {expandedCategories[category.id] && (
                    <div className="overflow-x-auto">
                      {categoryProducts.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No products added to this category yet.</div>
                      ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Make
                              </th>
                              <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Supply Rate
                              </th>
                              <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Installation Rate
                              </th>
                              <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Supply Amount
                              </th>
                              <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Installation Amount
                              </th>
                              <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                              </th>
                              <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {categoryProducts.map((product, index) => {
                              const categoryInfo = product.categoryInfo || extractCategoryInfo(product)
                              return (
                                <tr key={product.id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                                  <td className="px-3 py-2">
                                    <div className="text-sm font-medium">
                                      {product.productName || "Unnamed Product"}
                                    </div>
                                    <div className="text-xs text-gray-500">HSN: {product.hsnCode || "N/A"}</div>
                                    <div className="text-xs text-gray-400">Available: {product.productQty || "0"}</div>
                                    <div className="text-xs text-gray-400">UOM: {product.uom || "N/A"}</div>
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      value={product.make || ""}
                                      onChange={(e) =>
                                        handleProductFieldChange(category.id, product.id, "make", e.target.value)
                                      }
                                      placeholder="Enter make"
                                      className="w-20 p-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*\.?[0-9]*"
                                      value={product.qty}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                          handleProductFieldChange(category.id, product.id, "qty", value)
                                        }
                                      }}
                                      onBlur={(e) => {
                                        if (e.target.value === "") {
                                          handleProductFieldChange(category.id, product.id, "qty", "1")
                                        }
                                      }}
                                      placeholder="Qty"
                                      className={`w-16 p-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${product.isExisting ? "bg-gray-100 text-gray-700 cursor-not-allowed" : ""}`}
                                      readOnly={product.isExisting} // Make qty read-only for existing items
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*\.?[0-9]*"
                                      value={product.supplyRate}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                          handleProductFieldChange(category.id, product.id, "supplyRate", value)
                                        }
                                      }}
                                      placeholder="Supply Rate"
                                      className="w-24 p-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*\.?[0-9]*"
                                      value={product.installationRate}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                          handleProductFieldChange(category.id, product.id, "installationRate", value)
                                        }
                                      }}
                                      placeholder="Install Rate"
                                      className="w-24 p-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-700">{product.supplyAmount.toFixed(2)}</td>
                                  <td className="px-3 py-2 text-sm text-gray-700">
                                    {product.installationAmount.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 text-sm font-semibold text-gray-800">
                                    {product.total.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2">
                                    <button
                                      onClick={() => handleRemoveProduct(category.id, product.id)}
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
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      {getTotalProductCount() > 0 && (
        <div className="flex justify-end mt-4 p-4 border-t bg-gray-50">
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
  )
}

export default BillableProductSelector