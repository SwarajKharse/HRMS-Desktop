"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FiX, FiAlertTriangle, FiPlus, FiCheck } from "react-icons/fi"
import { storeService } from "../../services/storeService"
import { useAuth } from "../../contexts/AuthContext"

function ProductEditForm({ product, activeTab, onClose, onSubmit }) {
  const { user } = useAuth()

  let userId = ""
  if (user) {
    userId = user.userId
  }

  // Form state - initialize with product data
  const [formData, setFormData] = useState({
    productName: product?.productName || "",
    productDescription: product?.productDescription || "",
    uom: product?.uom || "",
    hsnCode: product?.hsnCode || "",
    itemCode: product?.itemCode || "",
    mainGroupId: product?.mainGroupId?.toString() || "",
    categoryId: product?.categoryId?.toString() || "",
    make: product?.make || "",
    subcategoryId: product?.subCategoryId?.toString() || "", // Fix: use subCategoryId from product
  })

  // Dropdown data
  const [mainGroups, setMainGroups] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])

  // Loading states
  const [loading, setLoading] = useState({
    mainGroups: false,
    categories: false,
    subcategories: false,
    submit: false,
  })

  // UI states
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [showCreateNew, setShowCreateNew] = useState({
    mainGroup: false,
    category: false,
    subcategory: false,
  })

  // New item creation states
  const [newItems, setNewItems] = useState({
    mainGroup: { name: "" },
    category: { name: "" },
    subcategory: { name: "" },
  })

  // UOM options
  const uomOptions = ["Lot", "Mtrs", "Nos", "Set", "Kg", "Ltr", "Pcs", "Box"]

  // Load main groups on component mount
  useEffect(() => {
    loadMainGroups()
  }, [])

  // Load categories when main group changes or on initial load
  useEffect(() => {
    if (formData.mainGroupId) {
      loadCategories(formData.mainGroupId)
    } else {
      setCategories([])
      setSubcategories([])
    }
  }, [formData.mainGroupId])

  // Load subcategories when category changes or on initial load
  useEffect(() => {
    if (formData.categoryId) {
      loadSubcategories(formData.categoryId)
    } else {
      setSubcategories([])
    }
  }, [formData.categoryId])

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        productName: product.productName || "",
        productDescription: product.productDescription || "",
        uom: product.uom || "",
        hsnCode: product.hsnCode || "",
        itemCode: product.itemCode || "",
        make: product.make || "",
        mainGroupId: product.mainGroupId?.toString() || "",
        categoryId: product.categoryId?.toString() || "",
        subcategoryId: product.subCategoryId?.toString() || "", // Fix: use subCategoryId from product
      })
    }
  }, [product])

  // API calls
  const loadMainGroups = async () => {
    try {
      setLoading((prev) => ({ ...prev, mainGroups: true }))
      const response = await storeService.getAllMainGroups()
      setMainGroups(response)
    } catch (error) {
      console.error("Error loading main groups:", error)
      setError("Failed to load main groups")
    } finally {
      setLoading((prev) => ({ ...prev, mainGroups: false }))
    }
  }

  const loadCategories = async (mainGroupId) => {
    try {
      setLoading((prev) => ({ ...prev, categories: true }))
      const response = await storeService.getCategoriesByMainGroup(mainGroupId)
      if (response) {
        setCategories(response)
      } else {
        throw new Error("Failed to load categories")
      }
    } catch (error) {
      console.error("Error loading categories:", error)
      setError("Failed to load categories")
    } finally {
      setLoading((prev) => ({ ...prev, categories: false }))
    }
  }

  const loadSubcategories = async (categoryId) => {
    try {
      setLoading((prev) => ({ ...prev, subcategories: true }))
      const response = await storeService.getSubcategoriesByCategory(categoryId)
      if (response) {
        setSubcategories(response)
      } else {
        throw new Error("Failed to load subcategories")
      }
    } catch (error) {
      console.error("Error loading subcategories:", error)
      setError("Failed to load subcategories")
    } finally {
      setLoading((prev) => ({ ...prev, subcategories: false }))
    }
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  // Handle new item input changes
  const handleNewItemChange = (type, field, value) => {
    setNewItems((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }))
  }

  // Create new main group
  const createMainGroup = async () => {
    try {
      const response = await storeService.createMainGroup(
        JSON.stringify({
          group_name: newItems.mainGroup.name,
          id: null,
        }),
      )

      if (response) {
        const newMainGroup = response
        setMainGroups((prev) => [...prev, newMainGroup])
        setFormData((prev) => ({ ...prev, mainGroupId: newMainGroup.id.toString() }))
        setShowCreateNew((prev) => ({ ...prev, mainGroup: false }))
        setNewItems((prev) => ({ ...prev, mainGroup: { name: "" } }))
        setSuccessMessage("Main group created successfully!")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        throw new Error("Failed to create main group")
      }
    } catch (error) {
      setError("Failed to create main group: " + error.message)
    }
  }

  // Create new category
  const createCategory = async () => {
    try {
      const response = await storeService.createCategory(
        JSON.stringify({
          category_name: newItems.category.name,
          mainGroupId: formData.mainGroupId,
          id: null,
        }),
      )

      if (response) {
        const newCategory = response
        setCategories((prev) => [...prev, newCategory])
        setFormData((prev) => ({ ...prev, categoryId: newCategory.id.toString() }))
        setShowCreateNew((prev) => ({ ...prev, category: false }))
        setNewItems((prev) => ({ ...prev, category: { name: "" } }))
        setSuccessMessage("Category created successfully!")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        throw new Error("Failed to create category")
      }
    } catch (error) {
      setError("Failed to create category: " + error.message)
    }
  }

  // Create new subcategory
  const createSubcategory = async () => {
    try {
      const response = await storeService.createSubcategory(
        JSON.stringify({
          category_name: newItems.subcategory.name,
          productCategoryId: formData.categoryId,
          id: null,
        }),
      )

      if (response) {
        const newSubcategory = response
        setSubcategories((prev) => [...prev, newSubcategory])
        setFormData((prev) => ({ ...prev, subcategoryId: newSubcategory.id.toString() }))
        setShowCreateNew((prev) => ({ ...prev, subcategory: false }))
        setNewItems((prev) => ({ ...prev, subcategory: { name: "" } }))
        setSuccessMessage("Subcategory created successfully!")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        throw new Error("Failed to create subcategory")
      }
    } catch (error) {
      setError("Failed to create subcategory: " + error.message)
    }
  }

  // Validate form
  const validateForm = () => {
    if (!formData.productName.trim()) {
      setError("Product name is required")
      return false
    }
    if (!formData.uom) {
      setError("UOM is required")
      return false
    }
    if (!formData.hsnCode.trim()) {
      setError("HSN Code is required")
      return false
    }
    if (!formData.subcategoryId) {
      setError("Subcategory is required")
      return false
    }
    return true
  }

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading((prev) => ({ ...prev, submit: true }))
      setError(null)

      const response = await storeService.updateProduct(
        product.id,
        JSON.stringify({
          product_name: formData.productName,
          product_description: formData.productDescription,
          uom: formData.uom,
          hsn_code: formData.hsnCode,
          item_code: formData.itemCode,
          make: formData.make,
          category_id: Number.parseInt(formData.subcategoryId),
          id: product.id,
        }),
      )

      if (response) {
        setSuccessMessage("Product updated successfully!")
        setTimeout(() => {
          if (onSubmit) onSubmit()
          if (onClose) onClose()
        }, 2000)
      } else {
        throw new Error("Failed to update product")
      }
    } catch (error) {
      setError("Failed to update product: " + error.message)
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }))
    }
  }

  // Prevent dialog from closing when clicking inside it
  const handleDialogClick = (e) => {
    e.stopPropagation()
  }

  if (!product) {
    return null
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-[800px] max-h-[90vh] overflow-y-auto relative"
        onClick={handleDialogClick}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading.submit}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <FiAlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
            <FiCheck className="w-5 h-5 text-green-500" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Code</label>
              <input
                type="text"
                name="itemCode"
                value={formData.itemCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter item code"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Description</label>
            <textarea
              name="productDescription"
              value={formData.productDescription}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter product description"
            />
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Make"
              />
          </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">UOM <span className="text-red-500">*</span></label>
              <select
                name="uom"
                value={formData.uom}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select UOM</option>
                {uomOptions.map((uom) => (
                  <option key={uom} value={uom}>
                    {uom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">HSN Code <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="hsnCode"
                value={formData.hsnCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter HSN code"
                required
              />
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800">Category Selection</h3>

            {/* Main Group */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Main Group <span className="text-red-500">*</span></label>
                <button
                  type="button"
                  onClick={() => setShowCreateNew((prev) => ({ ...prev, mainGroup: !prev.mainGroup }))}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <FiPlus size={14} />
                  Create New
                </button>
              </div>

              {showCreateNew.mainGroup && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg space-y-2">
                  <input
                    type="text"
                    placeholder="Main group name"
                    value={newItems.mainGroup.name}
                    onChange={(e) => handleNewItemChange("mainGroup", "name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={createMainGroup}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      disabled={!newItems.mainGroup.name}
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateNew((prev) => ({ ...prev, mainGroup: false }))}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <select
                name="mainGroupId"
                value={formData.mainGroupId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading.mainGroups}
                required
              >
                <option value="">{loading.mainGroups ? "Loading..." : "Select Main Group"}</option>
                {mainGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.group_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Category <span className="text-red-500">*</span></label>
                {formData.mainGroupId && (
                  <button
                    type="button"
                    onClick={() => setShowCreateNew((prev) => ({ ...prev, category: !prev.category }))}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <FiPlus size={14} />
                    Create New
                  </button>
                )}
              </div>

              {showCreateNew.category && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg space-y-2">
                  <input
                    type="text"
                    placeholder="Category name"
                    value={newItems.category.name}
                    onChange={(e) => handleNewItemChange("category", "name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={createCategory}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      disabled={!newItems.category.name}
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateNew((prev) => ({ ...prev, category: false }))}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.mainGroupId || loading.categories}
                required
              >
                <option value="">
                  {!formData.mainGroupId
                    ? "Select Main Group first"
                    : loading.categories
                      ? "Loading..."
                      : "Select Category"}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Subcategory <span className="text-red-500">*</span></label>
                {formData.categoryId && (
                  <button
                    type="button"
                    onClick={() => setShowCreateNew((prev) => ({ ...prev, subcategory: !prev.subcategory }))}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <FiPlus size={14} />
                    Create New
                  </button>
                )}
              </div>

              {showCreateNew.subcategory && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg space-y-2">
                  <input
                    type="text"
                    placeholder="Subcategory name"
                    value={newItems.subcategory.name}
                    onChange={(e) => handleNewItemChange("subcategory", "name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={createSubcategory}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      disabled={!newItems.subcategory.name}
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateNew((prev) => ({ ...prev, subcategory: false }))}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <select
                name="subcategoryId"
                value={formData.subcategoryId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.categoryId || loading.subcategories}
                required
              >
                <option value="">
                  {!formData.categoryId
                    ? "Select Category first"
                    : loading.subcategories
                      ? "Loading..."
                      : "Select Subcategory"}
                </option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.category_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading.submit}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading.submit}
            >
              {loading.submit ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                "Update Product"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default ProductEditForm
