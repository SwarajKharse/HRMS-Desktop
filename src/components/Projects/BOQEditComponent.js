"use client"

import { useState, useEffect, useRef } from "react"
import { FiSearch, FiPlus, FiX, FiSave, FiEdit3, FiPackage, FiTool, FiUsers } from "react-icons/fi"
import { AiOutlineArrowDown, AiOutlineArrowUp } from "react-icons/ai"
import { motion, AnimatePresence } from "framer-motion"
import ProductBOQSelector from "./ProductBOQSelector"
import { storeService } from "../../services/storeService"

function BOQEditComponent({ projectId, projectName, existingBOQ, onSave, onClose }) {
  const [showAddProductSection, setShowAddProductSection] = useState(false)
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [boqProducts, setBOQProducts] = useState([])
  const [availableProducts, setAvailableProducts] = useState([])
  const [availableSkillsets, setAvailableSkillsets] = useState([])
  const [availableTools, setAvailableTools] = useState([])
  const [expandedProducts, setExpandedProducts] = useState({})
  const [selectedProductTab, setSelectedProductTab] = useState({})
  const [expandedMTRForms, setExpandedMTRForms] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerms, setSearchTerms] = useState({})
  const [showProductSearch, setShowProductSearch] = useState({})
  const [showChangesSummary, setShowChangesSummary] = useState(false)
  const [changesSummary, setChangesSummary] = useState([])
  const [editingProductModal, setEditingProductModal] = useState(null)

  // Initialize BOQ data
  useEffect(() => {
    console.log("Existing BOQ:", existingBOQ)
    if (existingBOQ && existingBOQ.items && Array.isArray(existingBOQ.items)) {
      try {
        const formattedProducts = existingBOQ.items.map((item) => {
          const product = item.product || {}

          return {
            id: item.id || 0,
            product_id: product.id || 0,
            product_name: product.productName || product.product_name || product.name || "Unknown Product",
            hsn_code: product.hsnCode || product.hsn_code || "",
            product_description: product.productDescription || product.product_description || "",
            qty: item.totalQty || 0,
            make: item.make || "",
            uom: item.uom || "",
            nonBillable: (item.nonBillable || []).map((nb) => ({
              ...nb,
              materialRequisitions: nb.materialRequisitions || nb.installments || [],
            })),
            skillSet: (item.skillSet || []).map((ss) => ({
              ...ss,
              materialRequisitions: ss.materialRequisitions || ss.installments || [],
            })),
            tools: (item.tools || []).map((t) => ({
              ...t,
              materialRequisitions: t.materialRequisitions || t.installments || [],
            })),
            materialRequisitions: item.materialRequisitions || item.installments || [],
          }
        })
        setBOQProducts(formattedProducts)
        console.log("Formatted products:", formattedProducts)

        if (formattedProducts.length > 0) {
          setExpandedProducts({ [formattedProducts[0].id]: true })
          setSelectedProductTab({ [formattedProducts[0].id]: "billable" })
        }
      } catch (err) {
        console.error("Error processing BOQ data:", err)
        setError("Error processing BOQ data: " + err.message)
        setBOQProducts([])
      }
    } else {
      console.log("No BOQ items found or invalid structure")
      setBOQProducts([])
    }

    fetchProducts()
    fetchSkillsets()
    fetchTools()
  }, [existingBOQ])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await storeService.getProductsList()
      console.log("Products API Response:", response)

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

      // Ensure product names are properly mapped
      productsData = productsData.map((product) => ({
        ...product,
        product_name: product.product_name || product.productName || product.name || "Unknown Product",
      }))

      setAvailableProducts(productsData)
    } catch (err) {
      console.error("Error fetching products:", err)
      setError(`Failed to load products: ${err.message}`)
      setAvailableProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSkillsets = async () => {
    try {
      const response = await storeService.getSkillSetList()
      console.log("Skillsets API Response:", response)

      let skillsetsData = []

      if (Array.isArray(response)) {
        skillsetsData = response
      } else if (response && Array.isArray(response.data)) {
        skillsetsData = response.data
      } else if (response && typeof response === "object") {
        const arrayProperty = Object.values(response).find((value) => Array.isArray(value))
        if (arrayProperty) {
          skillsetsData = arrayProperty
        }
      }

      setAvailableSkillsets(skillsetsData)
    } catch (err) {
      console.error("Error fetching skillsets:", err)
      setError(`Failed to load skillsets: ${err.message}`)
      setAvailableSkillsets([])
    }
  }

  const fetchTools = async () => {
    try {
      const response = await storeService.getToolsList()
      console.log("Tools API Response:", response)

      let toolsData = []

      if (Array.isArray(response)) {
        toolsData = response
      } else if (response && Array.isArray(response.data)) {
        toolsData = response.data
      } else if (response && typeof response === "object") {
        const arrayProperty = Object.values(response).find((value) => Array.isArray(value))
        if (arrayProperty) {
          toolsData = arrayProperty
        }
      }

      setAvailableTools(toolsData)
    } catch (err) {
      console.error("Error fetching tools:", err)
      setError(`Failed to load tools: ${err.message}`)
      setAvailableTools([])
    }
  }

  const toggleProductExpansion = (productId) => {
    setExpandedProducts((prev) => {
      const newState = { ...prev, [productId]: !prev[productId] }
      if (newState[productId] && !selectedProductTab[productId]) {
        setSelectedProductTab((prevTab) => ({ ...prevTab, [productId]: "billable" }))
      }
      return newState
    })
  }

  const selectProductTab = (productId, tab) => {
    setSelectedProductTab((prev) => ({ ...prev, [productId]: tab }))
  }

  const toggleMTRForm = (key) => {
    setExpandedMTRForms((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const addProductToCategory = (mainProductId, category, product) => {
    setBOQProducts((prev) =>
      prev.map((p) => {
        if (p.id === mainProductId) {
          return {
            ...p,
            [category]: [
              ...(p[category] || []),
              {
                ...product,
                qty: "",
                make: "",
                materialRequisitions: [],
              },
            ],
          }
        }
        return p
      }),
    )

    setShowProductSearch((prev) => ({
      ...prev,
      [`${mainProductId}-${category}`]: false,
    }))
    setSearchTerms((prev) => ({
      ...prev,
      [`${mainProductId}-${category}`]: "",
    }))
  }

  const addSkillsetToProduct = (mainProductId, skillset) => {
    setBOQProducts((prev) =>
      prev.map((p) => {
        if (p.id === mainProductId) {
          return {
            ...p,
            skillSet: [
              ...(p.skillSet || []),
              {
                ...skillset,
                qty: "",
                make: "",
                materialRequisitions: [],
              },
            ],
          }
        }
        return p
      }),
    )
  }

  const addToolToProduct = (mainProductId, tool) => {
    setBOQProducts((prev) =>
      prev.map((p) => {
        if (p.id === mainProductId) {
          return {
            ...p,
            tools: [
              ...(p.tools || []),
              {
                ...tool,
                qty: "",
                make: "",
                materialRequisitions: [],
              },
            ],
          }
        }
        return p
      }),
    )
  }

  const removeProductFromCategory = (mainProductId, category, productIndex) => {
    setBOQProducts((prev) =>
      prev.map((p) => {
        if (p.id === mainProductId) {
          const updatedCategory = [...(p[category] || [])]
          updatedCategory.splice(productIndex, 1)
          return {
            ...p,
            [category]: updatedCategory,
          }
        }
        return p
      }),
    )
  }

  const updateCategoryProduct = (mainProductId, category, productIndex, field, value) => {
    setBOQProducts((prev) =>
      prev.map((p) => {
        if (p.id === mainProductId) {
          const updatedCategory = [...(p[category] || [])]
          updatedCategory[productIndex] = {
            ...updatedCategory[productIndex],
            [field]: value,
          }
          return {
            ...p,
            [category]: updatedCategory,
          }
        }
        return p
      }),
    )
  }

  const addMTRToProduct = (mainProductId, category, productIndex, mtrData) => {
    setBOQProducts((prev) =>
      prev.map((p) => {
        if (p.id === mainProductId) {
          if (category === "billable") {
            return {
              ...p,
              materialRequisitions: [
                ...(p.materialRequisitions || []),
                {
                  id: Date.now(),
                  ...mtrData,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          } else {
            const updatedCategory = [...(p[category] || [])]
            updatedCategory[productIndex] = {
              ...updatedCategory[productIndex],
              materialRequisitions: [
                ...(updatedCategory[productIndex].materialRequisitions || []),
                {
                  id: Date.now(),
                  ...mtrData,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
            return {
              ...p,
              [category]: updatedCategory,
            }
          }
        }
        return p
      }),
    )
  }

  const removeMTRFromProduct = (mainProductId, category, productIndex, mtrId) => {
    setBOQProducts((prev) =>
      prev.map((p) => {
        if (p.id === mainProductId) {
          if (category === "billable") {
            return {
              ...p,
              materialRequisitions: p.materialRequisitions.filter((mtr) => mtr.id !== mtrId),
            }
          } else {
            const updatedCategory = [...(p[category] || [])]
            updatedCategory[productIndex] = {
              ...updatedCategory[productIndex],
              materialRequisitions: updatedCategory[productIndex].materialRequisitions.filter(
                (mtr) => mtr.id !== mtrId,
              ),
            }
            return {
              ...p,
              [category]: updatedCategory,
            }
          }
        }
        return p
      }),
    )
  }

  const getFilteredProducts = (searchKey) => {
    const searchTerm = searchTerms[searchKey] || ""
    if (!searchTerm.trim()) return availableProducts

    return availableProducts.filter(
      (product) =>
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.hsn_code.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  const calculateRemainingQty = (product) => {
    const totalMTRQty = (product.materialRequisitions || []).reduce(
      (sum, mtr) => sum + Number.parseFloat(mtr.mtrQty || 0),
      0,
    )
    const remainingQty = Math.max(0, Number.parseFloat(product.qty || 0) - totalMTRQty).toFixed(2)
    return remainingQty
  }

  const MaterialRequisitionForm = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      mtrQty: "",
      stockAlloted: "",
      purchaseMTR: "0",
      dcQty: "",
      remarks: "",
    })

    useEffect(() => {
      if (formData.mtrQty && formData.stockAlloted) {
        const mtrQty = Number.parseFloat(formData.mtrQty) || 0
        const stockAlloted = Number.parseFloat(formData.stockAlloted) || 0
        const purchaseMTR = Math.max(0, mtrQty - stockAlloted).toFixed(2)
        setFormData((prev) => ({ ...prev, purchaseMTR }))
      }
    }, [formData.mtrQty, formData.stockAlloted])

    const handleSubmit = (e) => {
      e.preventDefault()
      onSubmit(formData)
      setFormData({
        mtrQty: "",
        stockAlloted: "",
        purchaseMTR: "0",
        dcQty: "",
        remarks: "",
      })
    }

    return (
      <form onSubmit={handleSubmit} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h5 className="font-medium mb-3 text-blue-800">Add New Material Requisition</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MTR Qty</label>
            <input
              type="number"
              step="0.01"
              value={formData.mtrQty}
              onChange={(e) => setFormData((prev) => ({ ...prev, mtrQty: e.target.value }))}
              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Alloted</label>
            <input
              type="number"
              step="0.01"
              value={formData.stockAlloted}
              onChange={(e) => setFormData((prev) => ({ ...prev, stockAlloted: e.target.value }))}
              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase MTR</label>
            <input
              type="number"
              step="0.01"
              value={formData.purchaseMTR}
              readOnly
              className="w-full p-2 border rounded bg-gray-50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DC Qty</label>
            <input
              type="number"
              step="0.01"
              value={formData.dcQty}
              onChange={(e) => setFormData((prev) => ({ ...prev, dcQty: e.target.value }))}
              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea
            value={formData.remarks}
            onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
            placeholder="Enter remarks for this material requisition..."
            rows="2"
            className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Material Requisition
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  const MaterialRequisitionList = ({ materialRequisitions, onRemove }) => {
    if (!materialRequisitions || materialRequisitions.length === 0) {
      return <div className="text-center text-gray-500 py-2 text-sm">No material requisitions added yet</div>
    }

    return (
      <div className="space-y-2 mb-4">
        <h5 className="font-medium text-gray-800">Previous Material Requisitions ({materialRequisitions.length})</h5>
        {materialRequisitions.map((mtr, index) => (
          <div key={mtr.id} className="bg-gray-50 p-3 rounded border">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">MTR #{index + 1}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">MTR: {mtr.mtrQty}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Stock:</span>
                    <span className="ml-1 font-medium">{mtr.stockAlloted}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Purchase:</span>
                    <span className="ml-1 font-medium">{mtr.purchaseMTR}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">DC Qty:</span>
                    <span className="ml-1 font-medium">{mtr.dcQty}</span>
                  </div>
                </div>
                {mtr.remarks && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Remarks:</span>
                    <span className="ml-1">{mtr.remarks}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => onRemove(mtr.id)}
                className="text-red-500 hover:bg-red-50 p-1 rounded ml-2"
                title="Remove material requisition"
              >
                <FiX size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Updated Modal Component with Proper Local State Management
  const CategoryProductModal = ({ product, productId, category, productIndex, onClose, onSave }) => {
    const getCurrentProduct = () => {
      const mainProduct = boqProducts.find((p) => p.id === productId)
      if (!mainProduct || !mainProduct[category]) return product
      return mainProduct[category][productIndex] || product
    }

    const [localData, setLocalData] = useState(() => {
      const currentProduct = getCurrentProduct()
      return {
        qty: currentProduct?.qty || "",
        make: currentProduct?.make || "",
      }
    })

    const debouncedSyncRef = useRef(null)

    const syncToMainState = (field, value) => {
      if (debouncedSyncRef.current) {
        clearTimeout(debouncedSyncRef.current)
      }

      debouncedSyncRef.current = setTimeout(() => {
        updateCategoryProduct(productId, category, productIndex, field, value)
      }, 300)
    }

    const handleQtyChange = (value) => {
      setLocalData((prev) => ({ ...prev, qty: value }))
      syncToMainState("qty", value)
    }

    const handleMakeChange = (value) => {
      setLocalData((prev) => ({ ...prev, make: value }))
      syncToMainState("make", value)
    }

    const handleClose = () => {
      if (debouncedSyncRef.current) {
        clearTimeout(debouncedSyncRef.current)
        updateCategoryProduct(productId, category, productIndex, "qty", localData.qty)
        updateCategoryProduct(productId, category, productIndex, "make", localData.make)
      }
      onClose()
    }

    useEffect(() => {
      return () => {
        if (debouncedSyncRef.current) {
          clearTimeout(debouncedSyncRef.current)
        }
      }
    }, [])

    const calculateCategoryProductRemainingQty = (qty) => {
      const currentProduct = getCurrentProduct()
      const totalMTRQty = (currentProduct?.materialRequisitions || []).reduce(
        (sum, mtr) => sum + Number.parseFloat(mtr.mtrQty || 0),
        0,
      )
      const remainingQty = Math.max(0, Number.parseFloat(qty || 0) - totalMTRQty).toFixed(2)
      return remainingQty
    }

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-xl font-bold">Edit {product?.product_name}</h3>
            <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
              <FiX />
            </button>
          </div>

          <div className="p-6 overflow-auto flex-1">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={localData.qty}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                  <input
                    type="text"
                    value={localData.make}
                    onChange={(e) => handleMakeChange(e.target.value)}
                    placeholder="Enter make"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-blue-800">
                  Remaining: {calculateCategoryProductRemainingQty(localData.qty)}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium">Material Requisitions</h5>
                  <button
                    onClick={() => toggleMTRForm(`${productId}-${category}-${productIndex}`)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    <FiPlus size={14} />
                    Add Material Requisition
                  </button>
                </div>

                <MaterialRequisitionList
                  materialRequisitions={getCurrentProduct()?.materialRequisitions || []}
                  onRemove={(mtrId) => {
                    removeMTRFromProduct(productId, category, productIndex, mtrId)
                  }}
                />

                <AnimatePresence>
                  {expandedMTRForms[`${productId}-${category}-${productIndex}`] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <MaterialRequisitionForm
                        onSubmit={(mtrData) => {
                          updateCategoryProduct(productId, category, productIndex, "qty", localData.qty)
                          updateCategoryProduct(productId, category, productIndex, "make", localData.make)
                          addMTRToProduct(productId, category, productIndex, mtrData)
                          toggleMTRForm(`${productId}-${category}-${productIndex}`)
                        }}
                        onCancel={() => toggleMTRForm(`${productId}-${category}-${productIndex}`)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
            <button onClick={handleClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
              Close
            </button>
            <div className="text-sm text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Auto-saving changes
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Dropdown Selector Components
  const SkillsetDropdown = ({ productId, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    const filteredSkillsets = availableSkillsets.filter(
      (skillset) =>
        skillset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skillset.skillset_name?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const handleSelect = (skillset) => {
      onSelect(skillset)
      setIsOpen(false)
      setSearchTerm("")
    }

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          <FiUsers size={16} />
          Add Skillset
        </button>

        {isOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            {/* Dropdown positioned in center */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 w-80 bg-white border rounded-md shadow-xl">
              <div className="p-3 border-b bg-red-50">
                <h4 className="font-medium text-red-800 mb-2">Select Skillset</h4>
                <input
                  type="text"
                  placeholder="Search skillsets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-auto">
                {filteredSkillsets.map((skillset) => (
                  <div
                    key={skillset.id}
                    className="p-3 hover:bg-red-50 cursor-pointer border-b"
                    onClick={() => handleSelect(skillset)}
                  >
                    <div className="font-medium">{skillset.name || skillset.skillset_name}</div>
                    <div className="text-sm text-gray-500">
                      {skillset.description || skillset.skillset_description || "No description"}
                    </div>
                  </div>
                ))}
                {filteredSkillsets.length === 0 && (
                  <div className="p-3 text-gray-500 text-center">No skillsets found</div>
                )}
              </div>
              <div className="p-2 border-t bg-gray-50 text-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  const ToolsDropdown = ({ productId, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    const filteredTools = availableTools.filter(
      (tool) =>
        tool.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.tool_name?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const handleSelect = (tool) => {
      onSelect(tool)
      setIsOpen(false)
      setSearchTerm("")
    }

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
        >
          <FiTool size={16} />
          Add Tool
        </button>

        {isOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            {/* Dropdown positioned in center */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 w-80 bg-white border rounded-md shadow-xl">
              <div className="p-3 border-b bg-purple-50">
                <h4 className="font-medium text-purple-800 mb-2">Select Tool</h4>
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-auto">
                {filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-3 hover:bg-purple-50 cursor-pointer border-b"
                    onClick={() => handleSelect(tool)}
                  >
                    <div className="font-medium">{tool.name || tool.tool_name}</div>
                    <div className="text-sm text-gray-500">
                      {tool.description || tool.tool_description || "No description"}
                    </div>
                  </div>
                ))}
                {filteredTools.length === 0 && <div className="p-3 text-gray-500 text-center">No tools found</div>}
              </div>
              <div className="p-2 border-t bg-gray-50 text-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Updated Tab-based Category Content Component
  const CategoryTabContent = ({ productId, category, categoryName, products = [], icon: Icon }) => {
    const searchKey = `${productId}-${category}`

    if (category === "skillSet") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-red-800">Skillset Selection</h4>
            <SkillsetDropdown
              productId={productId}
              onSelect={(skillset) => addSkillsetToProduct(productId, skillset)}
            />
          </div>

          {products.length > 0 ? (
            <div className="space-y-3">
              {products.map((product, index) => (
                <div key={index} className="bg-red-50 rounded-lg border border-red-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{product.name || product.skillset_name}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Qty: {product.qty || 0} | Make: {product.make || "N/A"}
                      </div>
                      <div className="text-sm text-red-600 mt-1">
                        Material Requisitions: {(product.materialRequisitions || []).length}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingProductModal({ productId, category, productIndex: index, product })}
                        className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        <FiEdit3 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => removeProductFromCategory(productId, category, index)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                      >
                        <FiX />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8 border-2 border-dashed border-red-200 rounded-lg">
              <FiUsers className="mx-auto mb-2 text-red-400" size={24} />
              <p>No skillsets added yet</p>
            </div>
          )}
        </div>
      )
    }

    if (category === "tools") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-purple-800">Tools Selection</h4>
            <ToolsDropdown productId={productId} onSelect={(tool) => addToolToProduct(productId, tool)} />
          </div>

          {products.length > 0 ? (
            <div className="space-y-3">
              {products.map((product, index) => (
                <div key={index} className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{product.name || product.tool_name}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Qty: {product.qty || 0} | Make: {product.make || "N/A"}
                      </div>
                      <div className="text-sm text-purple-600 mt-1">
                        Material Requisitions: {(product.materialRequisitions || []).length}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingProductModal({ productId, category, productIndex: index, product })}
                        className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                      >
                        <FiEdit3 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => removeProductFromCategory(productId, category, index)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                      >
                        <FiX />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8 border-2 border-dashed border-purple-200 rounded-lg">
              <FiTool className="mx-auto mb-2 text-purple-400" size={24} />
              <p>No tools added yet</p>
            </div>
          )}
        </div>
      )
    }

    // For nonBillable category - keep the original search functionality
    return (
      <div className="space-y-4">
        <div className="relative">
          <div className="flex items-center border rounded-lg">
            <FiSearch className="ml-3 text-gray-400" />
            <input
              type="text"
              placeholder={`Search products for ${categoryName}...`}
              value={searchTerms[searchKey] || ""}
              onChange={(e) => {
                setSearchTerms((prev) => ({
                  ...prev,
                  [searchKey]: e.target.value,
                }))
              }}
              onFocus={() => {
                setShowProductSearch((prev) => ({
                  ...prev,
                  [searchKey]: true,
                }))
              }}
              className="w-full p-2 focus:outline-none"
            />
          </div>

          {showProductSearch[searchKey] && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {getFilteredProducts(searchKey).map((product) => (
                <div
                  key={product.id}
                  className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                  onClick={() => addProductToCategory(productId, category, product)}
                >
                  <div className="font-medium">{product.product_name}</div>
                  <div className="text-sm text-gray-500">
                    {product.category} | HSN: {product.hsn_code} | UOM: {product.uom}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {products.length > 0 ? (
          <div className="space-y-3">
            {products.map((product, index) => (
              <div key={index} className="bg-amber-50 rounded-lg border border-amber-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{product.product_name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Qty: {product.qty || 0} | UOM: {product.uom || "N/A"} | Make: {product.make || "N/A"}
                    </div>
                    <div className="text-sm text-amber-600 mt-1">
                      Material Requisitions: {(product.materialRequisitions || []).length}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingProductModal({ productId, category, productIndex: index, product })}
                      className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                    >
                      <FiEdit3 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => removeProductFromCategory(productId, category, index)}
                      className="text-red-500 hover:bg-red-50 p-1 rounded"
                    >
                      <FiX />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8 border-2 border-dashed border-amber-200 rounded-lg">
            <Icon className="mx-auto mb-2 text-amber-400" size={24} />
            <p>No products added to {categoryName} yet</p>
          </div>
        )}
      </div>
    )
  }

  const handleSaveChanges = () => {
    try {
      const summary = []

      boqProducts.forEach((product) => {
        const remainingQty = calculateRemainingQty(product)

        summary.push({
          productName: product.product_name,
          totalQty: product.qty,
          installedQty: product.materialRequisitions.reduce((sum, mtr) => sum + Number.parseFloat(mtr.mtrQty || 0), 0),
          remainingQty: remainingQty,
          uom: product.uom,
          make: product.make,
          materialRequisitionsCount: product.materialRequisitions.length,
        })
      })

      setChangesSummary(summary)
      setShowChangesSummary(true)
    } catch (err) {
      console.error("Error preparing summary:", err)
      setError("Error preparing summary: " + err.message)
    }
  }

  const confirmAndSaveChanges = () => {
    try {
      setLoading(true)

      const enhancedBOQData = {
        items: boqProducts.map((product) => ({
          id: product.id,
          product_id: product.product_id,
          qty: product.qty,
          make: product.make || "",
          uom: product.uom || "",
          nonBillable: product.nonBillable || [],
          skillSet: product.skillSet || [],
          tools: product.tools || [],
          materialRequisitions: product.materialRequisitions || [],
        })),
      }

      onSave(enhancedBOQData)
    } catch (err) {
      console.error("Error saving BOQ:", err)
      setError("Error saving BOQ: " + err.message)
    } finally {
      setLoading(false)
      setShowChangesSummary(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-blue-600">Edit BOQ - {projectName}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 border border-red-100">
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
              <FiX />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {boqProducts.length > 0 ? (
              <>
                {boqProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg bg-white shadow-sm">
                    <div className="p-4 bg-gray-50 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{product.product_name}</h3>
                          <div className="text-sm text-gray-500 mt-1">
                            HSN: {product.hsn_code} | UOM: {product.uom} | Qty: {product.qty} | Make:{" "}
                            {product.make || "N/A"}
                          </div>
                          <div className="text-sm text-blue-600 mt-1">
                            Remaining Qty: {calculateRemainingQty(product)}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleProductExpansion(product.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          {expandedProducts[product.id] ? (
                            <AiOutlineArrowDown size={16} />
                          ) : (
                            <AiOutlineArrowUp size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedProducts[product.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4">
                            <div className="flex border-b mb-4">
                              <button
                                onClick={() => selectProductTab(product.id, "billable")}
                                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                                  selectedProductTab[product.id] === "billable"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <FiPackage size={16} />
                                  Billable Product
                                </div>
                              </button>
                              <button
                                onClick={() => selectProductTab(product.id, "nonBillable")}
                                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                                  selectedProductTab[product.id] === "nonBillable"
                                    ? "border-amber-500 text-amber-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <FiPackage size={16} />
                                  Non Billable ({(product.nonBillable || []).length})
                                </div>
                              </button>
                              <button
                                onClick={() => selectProductTab(product.id, "skillSet")}
                                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                                  selectedProductTab[product.id] === "skillSet"
                                    ? "border-red-500 text-red-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <FiUsers size={16} />
                                  Skill Set ({(product.skillSet || []).length})
                                </div>
                              </button>
                              <button
                                onClick={() => selectProductTab(product.id, "tools")}
                                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                                  selectedProductTab[product.id] === "tools"
                                    ? "border-purple-500 text-purple-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <FiTool size={16} />
                                  Tools ({(product.tools || []).length})
                                </div>
                              </button>
                            </div>

                            <div className="min-h-[300px]">
                              {selectedProductTab[product.id] === "billable" && (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-blue-800">
                                      Billable Product Material Requisitions
                                    </h4>
                                    <button
                                      onClick={() => toggleMTRForm(`${product.id}-billable`)}
                                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                    >
                                      <FiPlus size={14} />
                                      Add Material Requisition
                                    </button>
                                  </div>

                                  <MaterialRequisitionList
                                    materialRequisitions={product.materialRequisitions || []}
                                    onRemove={(mtrId) => removeMTRFromProduct(product.id, "billable", null, mtrId)}
                                  />

                                  <AnimatePresence>
                                    {expandedMTRForms[`${product.id}-billable`] && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <MaterialRequisitionForm
                                          onSubmit={(mtrData) => {
                                            addMTRToProduct(product.id, "billable", null, mtrData)
                                            toggleMTRForm(`${product.id}-billable`)
                                          }}
                                          onCancel={() => toggleMTRForm(`${product.id}-billable`)}
                                        />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}

                              {selectedProductTab[product.id] === "nonBillable" && (
                                <CategoryTabContent
                                  productId={product.id}
                                  category="nonBillable"
                                  categoryName="Non Billable"
                                  products={product.nonBillable || []}
                                  icon={FiPackage}
                                />
                              )}

                              {selectedProductTab[product.id] === "skillSet" && (
                                <CategoryTabContent
                                  productId={product.id}
                                  category="skillSet"
                                  categoryName="Skill Set"
                                  products={product.skillSet || []}
                                  icon={FiUsers}
                                />
                              )}

                              {selectedProductTab[product.id] === "tools" && (
                                <CategoryTabContent
                                  productId={product.id}
                                  category="tools"
                                  categoryName="Tools"
                                  products={product.tools || []}
                                  icon={FiTool}
                                />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                <div className="border rounded-lg bg-white shadow-sm">
                  <div
                    className="p-4 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
                    onClick={() => setShowAddProductModal(!showAddProductSection)}
                  >
                    <h3 className="text-lg font-medium">Add Another Billable Product</h3>
                  </div>

                  <AnimatePresence>
                    {showAddProductSection && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6">
                          <ProductBOQSelector
                            projectId={projectId}
                            onSave={(boqData) => {
                              if (boqData && boqData.items && boqData.items.length > 0) {
                                const newProducts = boqData.items.map((item) => ({
                                  id: Date.now() + Math.floor(Math.random() * 1000),
                                  product_id: item.product_id,
                                  product_name: item.product_name || "New Product",
                                  hsn_code: item.hsn_code || "",
                                  product_description: item.product_description || "",
                                  qty: item.qty || 0,
                                  make: item.make || "",
                                  uom: item.uom || "",
                                  materialRequisitions: [],
                                  nonBillable: [],
                                  skillSet: [],
                                  tools: [],
                                }))
                                setBOQProducts([...boqProducts, ...newProducts])
                                setShowAddProductSection(false)

                                const newExpandedState = { ...expandedProducts }
                                const newTabState = { ...selectedProductTab }
                                newProducts.forEach((product) => {
                                  newExpandedState[product.id] = true
                                  newTabState[product.id] = "billable"
                                })
                                setExpandedProducts(newExpandedState)
                                setSelectedProductTab(newTabState)
                              }
                            }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p className="mb-4">No BOQ products found</p>
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Add First Product
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 p-6 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <FiSave className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Modals */}
        {showAddProductModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-xl font-bold">Add Billable Product</h3>
                <button onClick={() => setShowAddProductModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <FiX />
                </button>
              </div>

              <div className="p-6 overflow-auto flex-1">
                <ProductBOQSelector
                  projectId={projectId}
                  onSave={(boqData) => {
                    if (boqData && boqData.items && boqData.items.length > 0) {
                      const newProducts = boqData.items.map((item) => ({
                        id: Date.now() + Math.floor(Math.random() * 1000),
                        product_id: item.product_id,
                        product_name: item.product_name || "New Product",
                        hsn_code: item.hsn_code || "",
                        product_description: item.product_description || "",
                        qty: item.qty || 0,
                        make: item.make || "",
                        uom: item.uom || "",
                        materialRequisitions: [],
                        nonBillable: [],
                        skillSet: [],
                        tools: [],
                      }))
                      setBOQProducts([...boqProducts, ...newProducts])
                      setShowAddProductModal(false)

                      const newExpandedState = { ...expandedProducts }
                      const newTabState = { ...selectedProductTab }
                      newProducts.forEach((product) => {
                        newExpandedState[product.id] = true
                        newTabState[product.id] = "billable"
                      })
                      setExpandedProducts(newExpandedState)
                      setSelectedProductTab(newTabState)
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
                <button
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {editingProductModal && (
          <CategoryProductModal
            product={editingProductModal.product}
            productId={editingProductModal.productId}
            category={editingProductModal.category}
            productIndex={editingProductModal.productIndex}
            onClose={() => setEditingProductModal(null)}
            onSave={() => {}}
          />
        )}

        {showChangesSummary && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-xl font-bold">Review Changes Before Saving</h3>
                <button onClick={() => setShowChangesSummary(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <FiX />
                </button>
              </div>

              <div className="p-4 overflow-auto flex-1">
                <div className="mb-4 bg-blue-50 p-3 rounded border border-blue-100 text-sm">
                  Please review the changes before saving. This summary shows the current state of all products and
                  their material requisitions.
                </div>

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
                        Total Qty
                      </th>
                      <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Installed
                      </th>
                      <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remaining
                      </th>
                      <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        MTRs
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {changesSummary.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{item.productName}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{item.make || "N/A"}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {item.totalQty} {item.uom}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {item.installedQty} {item.uom}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {item.remainingQty} {item.uom}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {item.materialRequisitionsCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-4 p-4 border-t bg-gray-50">
                <button
                  onClick={() => setShowChangesSummary(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAndSaveChanges}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>Confirm & Save</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default BOQEditComponent
