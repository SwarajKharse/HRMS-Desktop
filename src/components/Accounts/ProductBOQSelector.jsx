"use client"

import { useState, useEffect, useRef } from "react"
import { FiSearch, FiPlus, FiTrash2, FiX, FiEdit2, FiSave, FiChevronDown, FiChevronRight } from "react-icons/fi"
import { storeService } from "../../services/storeService"
import { projectService } from "../../services/projectService"

function ProductBOQSelector({
  projectId,
  onSave,
  leadProductTypes,
  existingBOQ = null,
  isEditMode = false,
  currentUserId,
  projectSalesTlId,
  onBOQItemStatusUpdateSuccess,
  onProductCountChange,
}) {
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

  const previousProductCountRef = useRef(0)
  const previousProductsDataRef = useRef(null)

  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  const calculateAmounts = (qty, supplyRate, installationRate) => {
    const parsedQty = Number.parseFloat(qty) || 0
    const parsedSupplyRate = Number.parseFloat(supplyRate) || 0
    const parsedInstallationRate = Number.parseFloat(installationRate) || 0
    const supplyAmount = parsedQty * parsedSupplyRate
    const installationAmount = parsedQty * parsedInstallationRate
    const total = supplyAmount + installationAmount
    return { supplyAmount, installationAmount, total }
  }

  useEffect(() => {
    if (isEditMode && existingBOQ && existingBOQ.items && !isInitialized) {
      console.log("[v0] Initializing with existing BOQ data:", existingBOQ)
      const productsByCategory = {}
      const usedCategories = []
      existingBOQ.items.forEach((item) => {
        const categoryId = item.leadProductTypeId || "default"
        const categoryName = leadProductTypes.find((lpt) => lpt.id === categoryId)?.label || "Default Category"
        if (!usedCategories.find((cat) => cat.id === categoryId)) {
          usedCategories.push({ id: categoryId, name: categoryName })
        }
        const initialQty = Number.parseFloat(item.qty) || 1
        const initialSupplyRate = Number.parseFloat(item.supplyRate) || 0
        const initialInstallationRate = Number.parseFloat(item.installationRate) || 0

        console.log(`[v0] Initializing product ${item.product?.productName}:`, {
          qty: initialQty,
          supplyRate: initialSupplyRate,
          installationRate: initialInstallationRate,
        })

        const { supplyAmount, installationAmount, total } = calculateAmounts(
          initialQty,
          initialSupplyRate,
          initialInstallationRate,
        )
        const product = {
          id: item.id,
          productId: item.productId,
          productName: item.product?.productName || "Unknown Product",
          hsnCode: item.product?.hsnCode || "",
          productDescription: item.product?.productDescription || "",
          productQty: item.product?.productQty || 0,
          uom: item.uom || item.product?.uom || "",
          qty: initialQty,
          make: item.make || "",
          supplyRate: initialSupplyRate,
          installationRate: initialInstallationRate,
          supplyAmount: supplyAmount,
          installationAmount: installationAmount,
          total: total,
          leadProductTypeId: categoryId,
          categoryInfo: extractCategoryInfo(item.product),
          salestlApprovalStatus: item.salestlApprovalStatus || "PENDING",
          salestlApprovalDate: item.salestlApprovalDate,
          salestlApprovalRemarks: item.salestlApprovalRemarks,
          isExisting: true,
        }
        if (!productsByCategory[categoryId]) {
          productsByCategory[categoryId] = []
        }
        productsByCategory[categoryId].push(product)
      })

      console.log("[v0] Final products by category:", productsByCategory)

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

  useEffect(() => {
    const totalCount = getTotalProductCount()
    const currentDataString = JSON.stringify(selectedProductsByCategory)

    // Call onProductCountChange if count changed OR if product data changed
    if (
      (totalCount !== previousProductCountRef.current || currentDataString !== previousProductsDataRef.current) &&
      onProductCountChange
    ) {
      console.log("[v0] ProductBOQSelector - syncing data to parent. Count:", totalCount)
      previousProductCountRef.current = totalCount
      previousProductsDataRef.current = currentDataString
      onProductCountChange(totalCount, selectedProductsByCategory)
    }
  }, [selectedProductsByCategory, onProductCountChange])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

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
          (product.productName || "").toLowerCase().includes(lowercasedSearch) ||
          categoryInfo.topCategory.toLowerCase().includes(lowercasedSearch) ||
          categoryInfo.mainCategory.toLowerCase().includes(lowercasedSearch) ||
          categoryInfo.subCategory.toLowerCase().includes(lowercasedSearch) ||
          (product.hsnCode || "").toLowerCase().includes(lowercasedSearch) ||
          (product.productDescription || "").toLowerCase().includes(lowercasedSearch)
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
      const mappedProducts = productsData.map((product) => ({
        ...product,
        productName: product.product_name,
        hsnCode: product.hsn_code,
        productDescription: product.product_description,
        productQty: product.product_qty,
        supplyRate: product.supply_rate,
        installationRate: product.installation_rate,
      }))
      setProducts(mappedProducts)
      setFilteredProducts(mappedProducts)
    } catch (err) {
      console.error("Error fetching products:", err)
      setError(`Failed to load products: ${err.message}`)
      setProducts([])
      setFilteredProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      setCategories(
        leadProductTypes.map((item) => {
          const newitem = { id: item.id, name: item.label }
          return newitem
        }),
      )
    } catch (err) {
      console.error("Error fetching categories:", err)
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
    if (categoryProducts.some((p) => p.productId === product.id)) {
      return
    }
    const { supplyAmount, installationAmount, total } = calculateAmounts(1, 0, 0)
    const updatedProduct = {
      id: Date.now(),
      productId: product.id,
      productName: product.productName || product.product_name || "Unknown Product",
      hsnCode: product.hsnCode || product.hsn_code || "",
      productDescription: product.productDescription || product.product_description || "",
      productQty: product.productQty || product.product_qty || 0,
      uom: product.uom || "",
      qty: 1,
      make: "",
      supplyRate: 0,
      installationRate: 0,
      supplyAmount: supplyAmount,
      installationAmount: installationAmount,
      total: total,
      leadProductTypeId: activeProductSearch,
      categoryInfo: extractCategoryInfo(product),
      salestlApprovalStatus: "PENDING",
      isExisting: false,
    }
    setSelectedProductsByCategory((prev) => ({
      ...prev,
      [activeProductSearch]: [...(prev[activeProductSearch] || []), updatedProduct],
    }))
    setShowDropdown(false)
    setSearchTerm("")
    setActiveProductSearch(null)
  }

  const handleProductFieldChange = (categoryId, productId, field, value) => {
    console.log("[v0] handleProductFieldChange called:", {
      categoryId,
      productId,
      field,
      value,
      valueType: typeof value,
    })

    setSelectedProductsByCategory((prev) => {
      const updatedCategoryProducts = prev[categoryId].map((product) => {
        if (product.id === productId) {
          let processedValue = value
          if (field === "qty" || field === "supplyRate" || field === "installationRate") {
            // Convert to number for numeric fields
            processedValue = value === "" ? 0 : Number.parseFloat(value) || 0
            console.log("[v0] Converted numeric field:", {
              field,
              originalValue: value,
              processedValue,
              processedType: typeof processedValue,
            })
          }

          const updatedProduct = { ...product, [field]: processedValue }

          // Recalculate amounts if relevant fields change
          if (field === "qty" || field === "supplyRate" || field === "installationRate") {
            const { supplyAmount, installationAmount, total } = calculateAmounts(
              updatedProduct.qty,
              updatedProduct.supplyRate,
              updatedProduct.installationRate,
            )
            updatedProduct.supplyAmount = supplyAmount
            updatedProduct.installationAmount = installationAmount
            updatedProduct.total = total

            console.log("[v0] Recalculated amounts:", {
              qty: updatedProduct.qty,
              supplyRate: updatedProduct.supplyRate,
              installationRate: updatedProduct.installationRate,
              supplyAmount,
              installationAmount,
              total,
            })
          }
          return updatedProduct
        }
        return product
      })

      console.log("[v0] Updated category products:", updatedCategoryProducts)
      return {
        ...prev,
        [categoryId]: updatedCategoryProducts,
      }
    })
  }

  const handleRemoveProduct = (categoryId, productId) => {
    setSelectedProductsByCategory((prev) => {
      const updatedCategory = prev[categoryId].filter((product) => product.id !== productId)
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

  const handleApprovalStatusChange = async (categoryId, productId, newStatus) => {
    try {
      setError("")
      const product = selectedProductsByCategory[categoryId]?.find((p) => p.id === productId)

      if (!product || !product.isExisting) {
        setError("Can only update approval status for saved BOQ items")
        return
      }

      console.log("[v0] Updating approval status for product:", productId, "to:", newStatus)

      // Call backend API
      await projectService.updateBOQItemApprovalStatus(
        productId,
        "SALESTL",
        newStatus,
        `Status changed to ${newStatus} by SalesTL`,
      )

      // Update local state
      setSelectedProductsByCategory((prev) => {
        const updatedCategoryProducts = prev[categoryId].map((p) => {
          if (p.id === productId) {
            return {
              ...p,
              salestlApprovalStatus: newStatus,
              salestlApprovalDate: new Date().toISOString(),
            }
          }
          return p
        })
        return {
          ...prev,
          [categoryId]: updatedCategoryProducts,
        }
      })

      // Notify parent to refresh
      if (onBOQItemStatusUpdateSuccess) {
        await onBOQItemStatusUpdateSuccess()
      }

      console.log("[v0] Successfully updated approval status")
    } catch (err) {
      console.error("Error updating approval status:", err)
      setError(`Failed to update approval status: ${err.message || err}`)
    }
  }

  const handleSaveBOQ = async () => {
    const allProducts = Object.entries(selectedProductsByCategory).flatMap(([categoryId, products]) =>
      products.map((product) => ({ ...product, leadProductTypeId: Number.parseInt(categoryId) })),
    )
    if (allProducts.length === 0) {
      setError("Please add at least one product to the BOQ")
      return
    }
    const invalidProducts = allProducts.filter(
      (p) =>
        !p.qty ||
        Number.parseFloat(p.qty) <= 0 ||
        !p.supplyRate ||
        Number.parseFloat(p.supplyRate) < 0 ||
        !p.installationRate ||
        Number.parseFloat(p.installationRate) < 0,
    )
    if (invalidProducts.length > 0) {
      setError("Please enter valid quantities and non-negative rates for all products")
      return
    }
    setSaving(true)
    setError("")
    try {
      const boqData = {
        projectId: projectId,
        items: allProducts.map((p) => ({
          productId: Number.parseInt(p.productId),
          qty: Number.parseFloat(p.qty),
          make: p.make || "",
          uom: p.uom || "",
          leadProductTypeId: Number.parseInt(p.leadProductTypeId),
          supplyRate: Number.parseFloat(p.supplyRate),
          installationRate: Number.parseFloat(p.installationRate),
          supplyAmount: Number.parseFloat(p.supplyAmount),
          installationAmount: Number.parseFloat(p.installationAmount),
          total: Number.parseFloat(p.total),
        })),
      }
      console.log("Saving BOQ data (payload to backend):", boqData)
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

  const getTotalProductCount = () => {
    return Object.values(selectedProductsByCategory).reduce((total, products) => total + products.length, 0)
  }

  const getSelectedProductsInCategory = (categoryId) => {
    const categoryProducts = selectedProductsByCategory[categoryId] || []
    return categoryProducts.map((p) => p.productId)
  }

  const allProductsFlat = Object.values(selectedProductsByCategory).flat()
  const totalSupplyAmount = allProductsFlat.reduce((sum, product) => sum + (product.supplyAmount || 0), 0)
  const totalInstallationAmount = allProductsFlat.reduce((sum, product) => sum + (product.installationAmount || 0), 0)
  const grandTotal = allProductsFlat.reduce((sum, product) => sum + (product.total || 0), 0)

  const isSalesTL =
    currentUserId && projectSalesTlId && Number.parseInt(currentUserId) === Number.parseInt(projectSalesTlId)

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
                              {product.productName || "Unnamed Product"}
                              {isAlreadySelected && <span className="ml-2 text-xs">(Already selected)</span>}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">{categoryInfo.fullPath}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              HSN: {product.hsnCode || "N/A"} | UOM: {product.uom || "N/A"} | Qty Available:{" "}
                              {product.productQty || "0"}
                            </div>
                            {product.productDescription && (
                              <div className="text-xs text-gray-400 mt-1 truncate">{product.productDescription}</div>
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
                              {isEditMode && isSalesTL && (
                                <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  SalesTL Approval
                                </th>
                              )}
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
                                      className="w-16 p-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                                      onBlur={(e) => {
                                        if (e.target.value === "") {
                                          handleProductFieldChange(category.id, product.id, "supplyRate", "0")
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
                                      onBlur={(e) => {
                                        if (e.target.value === "") {
                                          handleProductFieldChange(category.id, product.id, "installationRate", "0")
                                        }
                                      }}
                                      placeholder="Inst. Rate"
                                      className="w-24 p-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      readOnly
                                      value={product.supplyAmount.toFixed(2)}
                                      placeholder="Supply Amt"
                                      className="w-24 p-1 text-sm border rounded bg-gray-100 text-gray-700"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      readOnly
                                      value={product.installationAmount.toFixed(2)}
                                      placeholder="Inst. Amt"
                                      className="w-24 p-1 text-sm border rounded bg-gray-100 text-gray-700"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      readOnly
                                      value={product.total.toFixed(2)}
                                      placeholder="Total"
                                      className="w-24 p-1 text-sm border rounded bg-gray-100 text-gray-700 font-semibold"
                                    />
                                  </td>
                                  {isEditMode && isSalesTL && (
                                    <td className="px-3 py-2">
                                      {product.isExisting ? (
                                        <select
                                          value={product.salestlApprovalStatus || "PENDING"}
                                          onChange={(e) =>
                                            handleApprovalStatusChange(category.id, product.id, e.target.value)
                                          }
                                          className={`w-28 p-1 text-xs border rounded focus:outline-none focus:ring-1 ${
                                            product.salestlApprovalStatus === "APPROVED"
                                              ? "border-green-500 bg-green-50 text-green-700"
                                              : product.salestlApprovalStatus === "REJECTED"
                                                ? "border-red-500 bg-red-50 text-red-700"
                                                : "border-yellow-500 bg-yellow-50 text-yellow-700"
                                          }`}
                                        >
                                          <option value="PENDING">Pending</option>
                                          <option value="APPROVED">Approved</option>
                                          <option value="REJECTED">Rejected</option>
                                        </select>
                                      ) : (
                                        <span className="text-xs text-gray-400">Save first</span>
                                      )}
                                    </td>
                                  )}
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

        {getTotalProductCount() > 0 && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-lg mb-3">Overall BOQ Totals</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-medium text-purple-700 text-md">
                  Total Supply Amount: ₹{totalSupplyAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-amber-600 text-md">
                  Total Installation Amount: ₹{totalInstallationAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-700 text-lg">Grand Total: ₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

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