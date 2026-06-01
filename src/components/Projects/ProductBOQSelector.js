"use client"

import { useState, useRef, useEffect } from "react"
import {
  FiSearch,
  FiPlus,
  FiTrash2,
  FiX,
  FiEdit2,
  FiSave,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiAlertTriangle,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi"
import { projectService } from "../../services/projectService" // Assuming path is correct
import { storeService } from "../../services/storeService" // Assuming path is correct

function ProductBOQSelector({
  projectId,
  onSave,
  leadProductTypes,
  existingBOQ = null,
  isEditMode = false,
  currentUserId,
  projectSalesTlId,
  onBOQItemStatusUpdateSuccess, // New prop
  onProductCountChange, // New prop to notify parent of product count changes
  gstType,
  setGstType,
  cgstPercent,
  setCgstPercent,
  sgstPercent,
  setSgstPercent,
  igstPercent,
  setIgstPercent,
  // </CHANGE>
}) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([]) // This will hold leadProductTypes as categories
  const [selectedCategories, setSelectedCategories] = useState([]) // Categories (leadProductTypes) selected by the user
  const [selectedProductsByCategory, setSelectedProductsByCategory] = useState({}) // Products grouped by selected category (leadProductType)
  const [expandedCategories, setExpandedCategories] = useState({})
  const [activeProductSearch, setActiveProductSearch] = useState(null) // Stores the categoryId (leadProductTypeId) for which product search is active
  const [filteredProducts, setFilteredProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [selectedCategoryToAdd, setSelectedCategoryToAdd] = useState("") // Declare selectedCategoryToAdd
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)
  const [showApprovalModal, setShowApprovalModal] = useState(null) // State for approval modal
  const [approvalSelectionMode, setApprovalSelectionMode] = useState({})
  const [selectedForApproval, setSelectedForApproval] = useState({})

  const calculateAmounts = (qty, supplyRate, installationRate) => {
    const parsedQty = Number.parseFloat(qty) || 0
    const parsedSupplyRate = Number.parseFloat(supplyRate) || 0
    const parsedInstallationRate = Number.parseFloat(installationRate) || 0
    const supplyAmount = parsedQty * parsedSupplyRate
    const installationAmount = parsedQty * parsedInstallationRate
    const total = supplyAmount + installationAmount
    return { supplyAmount, installationAmount, total }
  }

  const ApprovalStatusBadge = ({ status, type, onUpdate, productId, remarks, approvalDate, readOnly = false }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case "APPROVED":
          return "bg-green-100 text-green-800 border-green-200"
        case "REJECTED":
          return "bg-red-100 text-red-800 border-red-200"
        case "PENDING":
          return "bg-yellow-100 text-yellow-800 border-yellow-200"
        default:
          return "bg-gray-100 text-gray-800 border-gray-200"
      }
    }
    const getStatusIcon = (status) => {
      switch (status) {
        case "APPROVED":
          return <FiCheck size={14} />
        case "REJECTED":
          return <FiX size={14} />
        case "PENDING":
          return <FiClock size={14} />
        default:
          return <FiAlertTriangle size={14} />
      }
    }
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">{type} Approval:</span>
          <button
            type="button" // Added type="button"
            onClick={() => {
              if (readOnly) return
              setShowApprovalModal({
                productId, // This is the BOQItem ID
                type,
                currentStatus: status,
                currentRemarks: remarks,
                projectId: projectId, // Pass projectId here
              })
            }}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
              status,
            )} hover:opacity-80 transition-opacity`}
          >
            {getStatusIcon(status)}
            {status}
          </button>
        </div>
        {remarks && (
          <div className="text-xs text-gray-500">
            <span className="font-medium">Remarks:</span> {remarks}
          </div>
        )}
        {approvalDate && (
          <div className="text-xs text-gray-500">
            <span className="font-medium">Date:</span> {new Date(approvalDate).toLocaleDateString()}
          </div>
        )}
      </div>
    )
  }

  const ApprovalModal = ({
    projectId,
    productId,
    type,
    currentStatus,
    currentRemarks,
    onClose,
    onSaveSuccess,
    onLocalUpdate,
  }) => {
    // Added onLocalUpdate
    const [status, setStatus] = useState(currentStatus)
    const [remarks, setRemarks] = useState(currentRemarks)
    const [modalLoading, setModalLoading] = useState(false)
    const [modalError, setModalError] = useState("")

    const handleSave = async () => {
      setModalLoading(true)
      setModalError("")
      try {
        await projectService.updateBOQItemApprovalStatus(productId, {
          approvalType: type,
          statusValue: status,
          remarks: remarks,
        })

        // Get the current date/time for immediate UI update
        const now = new Date().toISOString() // Use ISO string for consistency with backend

        // Call the local update function to immediately reflect changes in the UI
        onLocalUpdate(productId, type, status, remarks, now)

        onSaveSuccess() // Callback to parent to indicate success (e.g., show success message)
        onClose()
      } catch (error) {
        console.error("Error updating approval status:", error)
        setModalError("Failed to update approval status: " + (error.message || "Unknown error"))
      } finally {
        setModalLoading(false)
      }
    }

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-bold">Update {type} Approval Status</h3>
            <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
              <FiX />
            </button>
          </div>
          <div className="p-4 space-y-4">
            {modalError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 border border-red-100">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{modalError}</span>
              </div>
            )}
            <div>
              <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status-select" // Added id for accessibility
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <label htmlFor="remarks-textarea" className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                id="remarks-textarea" // Added id for accessibility
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter approval remarks..."
                rows="3"
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
              Cancel
            </button>
            <button
              type="button" // Added type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={modalLoading}
            >
              {modalLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </div>
              ) : (
                "Update Status"
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // New function to update local state immediately after approval status change
  const handleLocalBOQItemUpdate = (boqItemId, type, newStatus, newRemarks, newApprovalDate) => {
    setSelectedProductsByCategory((prevCategories) => {
      const updatedCategories = { ...prevCategories }
      for (const categoryId in updatedCategories) {
        updatedCategories[categoryId] = updatedCategories[categoryId].map((item) => {
          if (item.id === boqItemId) {
            const updatedItem = { ...item }
            if (type === "PM") {
              updatedItem.pmApprovalStatus = newStatus
              updatedItem.pmApprovalRemarks = newRemarks
              updatedItem.pmApprovalDate = newApprovalDate
            } else if (type === "SALESTL") {
              updatedItem.salestlApprovalStatus = newStatus
              updatedItem.salestlApprovalRemarks = newRemarks
              updatedItem.salestlApprovalDate = newApprovalDate
            }
            return updatedItem
          }
          return item
        })
      }
      return updatedCategories
    })
  }

  useEffect(() => {
    if (isEditMode && existingBOQ && existingBOQ.items && !isInitialized) {
      console.log("Initializing with existing BOQ data:", existingBOQ)
      const productsByCategory = {}
      const usedCategories = []
      existingBOQ.items.forEach((item) => {
        const categoryId = item.leadProductTypeId || item.product.categoryId?.id || "default"
        const categoryName =
          leadProductTypes.find((lpt) => lpt.id === categoryId)?.label ||
          item.product.categoryId?.label ||
          "Default Category"
        if (!usedCategories.find((cat) => cat.id === categoryId)) {
          usedCategories.push({ id: categoryId, name: categoryName })
        }
        const initialQty = item.qty || 1
        const initialSupplyRate = item.supplyRate || 0
        const initialInstallationRate = item.installationRate || 0
        const { supplyAmount, installationAmount, total } = calculateAmounts(
          initialQty,
          initialSupplyRate,
          initialInstallationRate,
        )
        const product = {
          id: item.id,
          productId: item.product.id,
          productName: item.product.productName || "Unknown Product",
          hsnCode: item.product.hsnCode || "",
          productDescription: item.product.productDescription || "",
          productQty: item.product.productQty || 0,
          uom: item.uom || item.product.uom || "",
          qty: initialQty,
          make: item.make || "",
          remarks: item.remarks || "",
          supplyRate: initialSupplyRate,
          installationRate: initialInstallationRate,
          supplyAmount: supplyAmount,
          installationAmount: installationAmount,
          total: total,
          leadProductTypeId: categoryId,
          categoryInfo: extractCategoryInfo(item.product),
          isExisting: true,
          pmApprovalStatus: item.pmApprovalStatus,
          salestlApprovalStatus: item.salestlApprovalStatus,
          pmApprovalRemarks: item.pmApprovalRemarks,
          salestlApprovalRemarks: item.salestlApprovalRemarks,
          pmApprovalDate: item.pmApprovalDate,
          salestlApprovalDate: item.salestlApprovalDate,
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
  }, [isEditMode, existingBOQ, isInitialized, leadProductTypes, projectId])

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

  useEffect(() => {
    if (onProductCountChange) {
      const count = getTotalProductCount()
      console.log("[v0] ProductBOQSelector - notifying parent of product count:", count)
      onProductCountChange(count, selectedProductsByCategory)
    }
  }, [selectedProductsByCategory, onProductCountChange])
  // </CHANGE>

  const extractCategoryInfo = (product) => {
    if (!product)
      return {
        topCategory: "Uncategorized",
        mainCategory: "Uncategorized",
        subCategory: "Uncategorized",
        fullPath: "Uncategorized",
      }
    const categoryData = product.categoryId
    if (!categoryData) {
      return {
        topCategory: "Uncategorized",
        mainCategory: "Uncategorized",
        subCategory: "Uncategorized",
        fullPath: "Uncategorized",
      }
    }
    const topCategory = categoryData.label || "Uncategorized"
    const mainCategory = categoryData.productCategory?.category_name || "Uncategorized"
    const subCategory = categoryData.category_name || "Uncategorized"
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
          (product.itemCode || "").toLowerCase().includes(lowercasedSearch) ||
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
      const mappedProducts = productsData.map((product) => ({
        ...product,
        productName: product.product_name,
        itemCode: product.item_code,
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
    const { supplyAmount, installationAmount, total } = calculateAmounts(
      1,
      product.supplyRate || 0,
      product.installationRate || 0,
    )
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
      uom: product.uom || "",
      remarks: "",
      supplyRate: product.supplyRate || 0,
      installationRate: product.installationRate || 0,
      supplyAmount: supplyAmount,
      installationAmount: installationAmount,
      total: total,
      leadProductTypeId: activeProductSearch,
      categoryInfo: extractCategoryInfo(product),
      isExisting: false,
      pmApprovalStatus: "PENDING",
      salestlApprovalStatus: "PENDING",
      pmApprovalRemarks: "",
      salestlApprovalRemarks: "",
      pmApprovalDate: null,
      salestlApprovalDate: null,
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
    setSelectedProductsByCategory((prev) => {
      const updatedCategoryProducts = prev[categoryId].map((product) => {
        if (product.id === productId) {
          const updatedProduct = { ...product, [field]: value }
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

  const approveAllInCategory = (categoryId) => {
  const categoryProducts = selectedProductsByCategory[categoryId] || []
  const allSelected = {}
    categoryProducts.forEach(product => {
      if (product.salestlApprovalStatus !== "APPROVED") {
        allSelected[product.id] = true
      }
    })
    setApprovalSelectionMode(prev => ({ ...prev, [categoryId]: true }))
    setSelectedForApproval(prev => ({ ...prev, [categoryId]: allSelected }))
  }

  const cancelApprovalSelection = (categoryId) => {
    setApprovalSelectionMode(prev => ({ ...prev, [categoryId]: false }))
    setSelectedForApproval(prev => ({ ...prev, [categoryId]: {} }))
  }

  const confirmApproveSelected = async (categoryId) => {
    const selected = selectedForApproval[categoryId] || {}
    for (const productId of Object.keys(selected)) {
      if (selected[productId]) {
        await projectService.updateBOQItemApprovalStatus(Number(productId), {
          approvalType: "SALESTL",
          statusValue: "APPROVED",
          remarks: "",
        })
        handleLocalBOQItemUpdate(Number(productId), "SALESTL", "APPROVED", "", new Date().toISOString())
      }
    }
    cancelApprovalSelection(categoryId)
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
      products.map((product) => ({ ...product, leadProductTypeId: Number.parseInt(categoryId) })),
    )
    if (allProducts.length === 0) {
      setError("Please add at least one product to the BOQ")
      return
    }
    const invalidProducts = allProducts.filter(
      (p) => !p.qty || Number.parseFloat(p.qty) <= 0
    )
    if (invalidProducts.length > 0) {
      setError("Please enter valid quantities for all products")
      return
    }
    setSaving(true)
    setError("")
    try {
      const boqData = {
        projectId: projectId,
        items: allProducts.map((p) => ({
          id: p.isExisting ? p.id : null,
          productId: Number.parseInt(p.productId),
          qty: Number.parseFloat(p.qty),
          make: p.make || "",
          uom: p.uom || "",
          remarks: p.remarks || "",
          leadProductTypeId: Number.parseInt(p.leadProductTypeId),
          supplyRate: Number.parseFloat(p.supplyRate),
          installationRate: Number.parseFloat(p.installationRate),
          supplyAmount: Number.parseFloat(p.supplyAmount),
          installationAmount: Number.parseFloat(p.installationAmount),
          total: Number.parseFloat(p.total),
          productName: p.productName || "Unknown Product",
          hsnCode: p.hsnCode || "",
          pmApprovalStatus: p.pmApprovalStatus,
          salestlApprovalStatus: p.salestlApprovalStatus,
          pmApprovalRemarks: p.pmApprovalRemarks,
          salestlApprovalRemarks: p.salestlApprovalRemarks,
          pmApprovalDate: p.pmApprovalDate,
          salestlApprovalDate: p.salestlApprovalDate,
        })),
        gstType: gstType,
        cgstPercent: gstType === "CGST_SGST" ? cgstPercent : null,
        sgstPercent: gstType === "CGST_SGST" ? sgstPercent : null,
        igstPercent: gstType === "IGST" ? igstPercent : null,
        preGstAmount: totalSupplyAmount + totalInstallationAmount,
        gstAmount:
          gstType === "CGST_SGST"
            ? (totalSupplyAmount + totalInstallationAmount) * (cgstPercent / 100) +
              (totalSupplyAmount + totalInstallationAmount) * (sgstPercent / 100)
            : (totalSupplyAmount + totalInstallationAmount) * (igstPercent / 100),
        postGstAmount:
          totalSupplyAmount +
          totalInstallationAmount +
          (gstType === "CGST_SGST"
            ? (totalSupplyAmount + totalInstallationAmount) * (cgstPercent / 100) +
              (totalSupplyAmount + totalInstallationAmount) * (sgstPercent / 100)
            : (totalSupplyAmount + totalInstallationAmount) * (igstPercent / 100)),
      }
      console.log("Saving BOQ data (payload to backend):", boqData)
      
      onSave(boqData, true)
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

  const preGstAmount = grandTotal
  let gstAmount = 0
  let postGstAmount = 0
  let cgstAmount = 0
  let sgstAmount = 0
  let igstAmount = 0

  if (gstType === "CGST_SGST") {
    cgstAmount = preGstAmount * (cgstPercent / 100)
    sgstAmount = preGstAmount * (sgstPercent / 100)
    gstAmount = cgstAmount + sgstAmount
  } else {
    igstAmount = preGstAmount * (igstPercent / 100)
    gstAmount = igstAmount
  }
  postGstAmount = preGstAmount + gstAmount
  // </CHANGE>
  return (
    <div className="space-y-6">
      {showApprovalModal && (
        <ApprovalModal
          projectId={showApprovalModal.projectId}
          productId={showApprovalModal.productId}
          type={showApprovalModal.type}
          currentStatus={showApprovalModal.currentStatus}
          currentRemarks={showApprovalModal.currentRemarks}
          onClose={() => setShowApprovalModal(null)}
          onSaveSuccess={() => {
            console.log("Approval status updated successfully! Triggering parent refresh.")
            setError("")
            onBOQItemStatusUpdateSuccess() // Trigger re-fetch in parent
          }}
          onLocalUpdate={handleLocalBOQItemUpdate} // Pass the new local update handler
        />
      )}
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
            <button type="button" onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
              <FiX />
            </button>
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="category-select" className="block text-sm font-medium text-gray-700">
            Add Categories
          </label>
          <div className="flex gap-2">
            <select
              id="category-select" // Added id for accessibility
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
                    type="button" // Added type="button"
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
                placeholder="Search products by name, Item code ,category, subcategory, HSN code..."
                value={searchTerm}
                onChange={handleSearchChange}
                ref={searchInputRef}
                className="w-full p-2 focus:outline-none"
              />
              <button
                type="button" // Added type="button"
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
                        className="p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-100"
                        onClick={() => handleProductSelect(product)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                            {product.productName || "Unnamed Product"}
                            {isAlreadySelected && <span className="ml-2 text-xs text-blue-500">(Already selected)</span>}
                              
                            </div>
                            <div className="text-xs text-blue-600 mt-1">{categoryInfo.fullPath}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Code: {product.itemCode || "N/A"} | HSN: {product.hsnCode || "N/A"} | UOM: {product.uom || "N/A"} | Qty Available:{" "}
                              {product.productQty || "0"}
                            </div>
                            {product.productDescription && (
                              <div className="text-xs text-gray-400 mt-1 truncate">{product.productDescription}</div>
                            )}
                          </div>
                          { (
                            <button
                              type="button"
                              className="text-blue-600 hover:bg-blue-50 p-1 rounded-full ml-2 flex-shrink-0"
                            >
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
                    {currentUserId === projectSalesTlId && (
                      approvalSelectionMode[category.id] ? (
                        <>
                          <button
                            type="button"
                            onClick={() => confirmApproveSelected(category.id)}
                            className="ml-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            ✓ Confirm Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelApprovalSelection(category.id)}
                            className="ml-2 px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500 transition-colors"
                          >
                            ✗ Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => approveAllInCategory(category.id)}
                          className="ml-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          ✓ Approve All
                        </button>
                      )
                    )}
                    <button
                      type="button" // Added type="button"
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
                              {approvalSelectionMode[category.id] && (
                                <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                                  Select
                                </th>
                              )}
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
                                Supply Cost
                              </th>
                              <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Installation Cost
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
                                PM Approval
                              </th>
                              <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sales TL Approval
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
                                  {approvalSelectionMode[category.id] && (
                                    <td className="px-3 py-2">
                                      <input
                                        type="checkbox"
                                        checked={selectedForApproval[category.id]?.[product.id] || false}
                                        onChange={(e) => {
                                          setSelectedForApproval(prev => ({
                                            ...prev,
                                            [category.id]: {
                                              ...prev[category.id],
                                              [product.id]: e.target.checked
                                            }
                                          }))
                                        }}
                                        className="w-4 h-4"
                                      />
                                    </td>
                                  )}
                                  <td className="px-3 py-2">
                                    <div
                                      className="text-sm font-medium truncate max-w-xs"
                                      title={product.productName || "Unnamed Product"}
                                    >
                                      {product.productName || "Unnamed Product"}
                                    </div>
                                    <div className="text-xs text-gray-500">HSN: {product.hsnCode || "N/A"}</div>
                                    <div className="text-xs text-gray-400">Available: {product.productQty || "0"}</div>
                                    <div className="text-xs text-gray-400">UOM: {product.uom || "N/A"}</div>
                                    <input
                                      type="text"
                                      value={product.remarks || ""}
                                      onChange={(e) =>
                                        handleProductFieldChange(category.id, product.id, "remarks", e.target.value)
                                      }
                                      placeholder="Add remark..."
                                      className="mt-1 w-full p-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
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
                                      placeholder="Supply Cost"
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
                                      placeholder="Installation Cost"
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
                                  <td className="px-3 py-2">
                                    <ApprovalStatusBadge
                                      productId={product.id}
                                      type="PM"
                                      status={product.pmApprovalStatus}
                                      remarks={product.pmApprovalRemarks}
                                      approvalDate={product.pmApprovalDate}
                                      onUpdate={() => {}}
                                      readOnly={true}
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <ApprovalStatusBadge
                                      productId={product.id}
                                      type="SALESTL"
                                      status={product.salestlApprovalStatus}
                                      remarks={product.salestlApprovalRemarks}
                                      approvalDate={product.salestlApprovalDate}
                                      onUpdate={() => {}}
                                      readOnly={currentUserId !== projectSalesTlId}
                                    />
                                    {isEditMode && currentUserId === projectSalesTlId && (
                                      <button
                                        type="button" // Added type="button"
                                        onClick={() =>
                                          setShowApprovalModal({
                                            productId: product.id,
                                            type: "SALESTL",
                                            currentStatus: product.salestlApprovalStatus,
                                            currentRemarks: product.salestlApprovalRemarks,
                                            projectId: projectId,
                                          })
                                        }
                                        className="text-blue-500 hover:underline text-xs mt-1"
                                      >
                                        Edit Status
                                      </button>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    <button
                                      type="button" // Added type="button"
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

            <div className="mt-6 pt-4 border-t border-gray-300">
              <h5 className="font-semibold text-md mb-3">GST Configuration</h5>

              {/* GST Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">GST Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gstType"
                      value="CGST_SGST"
                      checked={gstType === "CGST_SGST"}
                      onChange={(e) => setGstType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">CGST + SGST</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gstType"
                      value="IGST"
                      checked={gstType === "IGST"}
                      onChange={(e) => setGstType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">IGST</span>
                  </label>
                </div>
              </div>

              {/* GST Percentage Inputs */}
              {gstType === "CGST_SGST" ? (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CGST (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={cgstPercent}
                      onChange={(e) => setCgstPercent(Number.parseFloat(e.target.value) || 0)}
                      className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SGST (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={sgstPercent}
                      onChange={(e) => setSgstPercent(Number.parseFloat(e.target.value) || 0)}
                      className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">IGST (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={igstPercent}
                    onChange={(e) => setIgstPercent(Number.parseFloat(e.target.value) || 0)}
                    className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* GST Calculation Display */}
              <div className="bg-white p-4 rounded-lg border border-gray-300">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Amount before GST:</span>
                    <span className="font-semibold">₹{preGstAmount.toFixed(2)}</span>
                  </div>

                  {gstType === "CGST_SGST" ? (
                    <>
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>CGST ({cgstPercent}%):</span>
                        <span>₹{cgstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>SGST ({sgstPercent}%):</span>
                        <span>₹{sgstAmount.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>IGST ({igstPercent}%):</span>
                      <span>₹{igstAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-gray-300">
                    <span className="text-green-700">Grand Total (with GST):</span>
                    <span className="text-green-700">₹{postGstAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* </CHANGE> */}
          </div>
        )}
        {getTotalProductCount() > 0 && (
          <div className="flex justify-end mt-4">
            <button
              type="button" // Added type="button"
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