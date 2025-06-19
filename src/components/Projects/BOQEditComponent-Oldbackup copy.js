"use client"

import { useState, useEffect } from "react"
import { FiSearch, FiPlus, FiX, FiSave, FiChevronDown, FiChevronRight } from "react-icons/fi"
import { motion, AnimatePresence } from "framer-motion"
import ProductBOQSelector from "./product-boq-selector"

function BOQEditComponent({ projectId, existingBOQ, onSave, onClose }) {
  const [showAddProductSection, setShowAddProductSection] = useState(false)
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [boqProducts, setBOQProducts] = useState([])
  const [availableProducts, setAvailableProducts] = useState([])
  const [expandedProducts, setExpandedProducts] = useState({})
  const [activeProductTabs, setActiveProductTabs] = useState({})
  const [expandedInstallmentForms, setExpandedInstallmentForms] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerms, setSearchTerms] = useState({})
  const [showProductSearch, setShowProductSearch] = useState({})
  const [showChangesSummary, setShowChangesSummary] = useState(false)
  const [changesSummary, setChangesSummary] = useState([])
  const [expandedCategoryProducts, setExpandedCategoryProducts] = useState({})

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
            product_name: product.productName || product.product_name || "Unknown Product", // Fix: Use product_name as fallback
            hsn_code: product.hsnCode || product.hsn_code || "",
            product_description: product.productDescription || product.product_description || "",
            qty: item.totalQty || 0,
            make: item.make || "",
            uom: item.uom || "",
            nonBillable: (item.nonBillable || []).map((nb) => ({
              ...nb,
              installments: nb.installments || [],
            })),
            skillSet: (item.skillSet || []).map((ss) => ({
              ...ss,
              installments: ss.installments || [],
            })),
            tools: (item.tools || []).map((t) => ({
              ...t,
              installments: t.installments || [],
            })),
            installments: item.installments || [],
          }
        })
        setBOQProducts(formattedProducts)
        console.log("Formatted products:", formattedProducts)

        if (formattedProducts.length > 0) {
          setExpandedProducts({ [formattedProducts[0].id]: true })
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

    setAvailableProducts([
      { id: 101, product_name: "Steel Rod 12mm", category: "Construction", hsn_code: "7213", uom: "MT" },
      { id: 102, product_name: "Cement Bag", category: "Construction", hsn_code: "2523", uom: "BAG" },
      { id: 103, product_name: "Welding Machine", category: "Tools", hsn_code: "8515", uom: "PCS" },
      { id: 104, product_name: "Safety Helmet", category: "Safety", hsn_code: "3926", uom: "PCS" },
      { id: 105, product_name: "Electrical Wire", category: "Electrical", hsn_code: "8544", uom: "MTR" },
    ])
  }, [existingBOQ])

  const toggleProductExpansion = (productId) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }))
  }

  const toggleCategoryProductExpansion = (key) => {
    setExpandedCategoryProducts((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const setActiveTab = (productId, tabName) => {
    setActiveProductTabs((prev) => ({
      ...prev,
      [productId]: tabName,
    }))
  }

  const toggleInstallmentForm = (key) => {
    setExpandedInstallmentForms((prev) => ({
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
                qty: "", // Fix: Start with empty string instead of 1
                make: "",
                installments: [],
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

  const addInstallmentToProduct = (mainProductId, category, productIndex, installmentData) => {
    setBOQProducts((prev) =>
      prev.map((p) => {
        if (p.id === mainProductId) {
          if (category === "main") {
            return {
              ...p,
              installments: [
                ...(p.installments || []),
                {
                  id: Date.now(),
                  ...installmentData,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          } else {
            const updatedCategory = [...(p[category] || [])]
            updatedCategory[productIndex] = {
              ...updatedCategory[productIndex],
              installments: [
                ...(updatedCategory[productIndex].installments || []),
                {
                  id: Date.now(),
                  ...installmentData,
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

  const removeInstallmentFromProduct = (mainProductId, category, productIndex, installmentId) => {
    setBOQProducts((prev) =>
      prev.map((p) => {
        if (p.id === mainProductId) {
          if (category === "main") {
            return {
              ...p,
              installments: p.installments.filter((inst) => inst.id !== installmentId),
            }
          } else {
            const updatedCategory = [...(p[category] || [])]
            updatedCategory[productIndex] = {
              ...updatedCategory[productIndex],
              installments: updatedCategory[productIndex].installments.filter((inst) => inst.id !== installmentId),
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
    const totalInstallmentQty = (product.installments || []).reduce(
      (sum, inst) => sum + Number.parseFloat(inst.mtrQty || 0),
      0,
    )
    const remainingQty = Math.max(0, Number.parseFloat(product.qty || 0) - totalInstallmentQty).toFixed(2)
    return remainingQty
  }

  const InstallmentForm = ({ onSubmit, onCancel }) => {
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
      e.stopPropagation()
      onSubmit(formData)
      setFormData({
        mtrQty: "",
        stockAlloted: "",
        purchaseMTR: "0",
        dcQty: "",
        remarks: "",
      })
    }

    const handleInputChange = (e, field) => {
      e.stopPropagation()
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    }

    return (
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-blue-50 p-4 rounded-lg border border-blue-200"
      >
        <h5 className="font-medium mb-3 text-blue-800">Add New Installment</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MTR Qty</label>
            <input
              type="number"
              step="0.01"
              value={formData.mtrQty}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => handleInputChange(e, "mtrQty")}
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
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => handleInputChange(e, "stockAlloted")}
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
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full p-2 border rounded bg-gray-50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DC Qty</label>
            <input
              type="number"
              step="0.01"
              value={formData.dcQty}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => handleInputChange(e, "dcQty")}
              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea
            value={formData.remarks}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => handleInputChange(e, "remarks")}
            placeholder="Enter remarks for this installment..."
            rows="2"
            className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            onClick={(e) => e.stopPropagation()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Installment
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onCancel(e)
            }}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  const InstallmentList = ({ installments, onRemove }) => {
    const [expandedInstallments, setExpandedInstallments] = useState({})

    const toggleInstallment = (id) => {
      setExpandedInstallments((prev) => ({
        ...prev,
        [id]: !prev[id],
      }))
    }

    if (!installments || installments.length === 0) {
      return <div className="text-center text-gray-500 py-2 text-sm">No installments added yet</div>
    }

    return (
      <div className="space-y-2 mb-4">
        <h5 className="font-medium text-gray-800">Previous Installments ({installments.length})</h5>
        {installments.map((installment, index) => (
          <div key={installment.id} className="bg-gray-50 p-3 rounded border">
            <div
              className="flex justify-between items-center mb-2 cursor-pointer"
              onClick={() => toggleInstallment(installment.id)}
            >
              <div className="flex items-center gap-2">
                {expandedInstallments[installment.id] ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                <span className="text-sm font-medium text-gray-700">Installment #{index + 1}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">MTR: {installment.mtrQty}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(installment.id)
                }}
                className="text-red-500 hover:bg-red-50 p-1 rounded"
                title="Remove installment"
              >
                <FiX size={14} />
              </button>
            </div>

            {expandedInstallments[installment.id] && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">MTR Qty:</span>
                    <span className="ml-1 font-medium">{installment.mtrQty}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Stock:</span>
                    <span className="ml-1 font-medium">{installment.stockAlloted}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Purchase:</span>
                    <span className="ml-1 font-medium">{installment.purchaseMTR}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">DC Qty:</span>
                    <span className="ml-1 font-medium">{installment.dcQty}</span>
                  </div>
                </div>
                {installment.remarks && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Remarks:</span>
                    <span className="ml-1">{installment.remarks}</span>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  Added: {new Date(installment.createdAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const CategoryTab = ({ productId, category, categoryName, products = [] }) => {
    const searchKey = `${productId}-${category}`
    const isActive = activeProductTabs[productId] === category

    const categoryColors = {
      nonBillable: {
        header: "bg-amber-50 hover:bg-amber-100",
        headerActive: "bg-amber-100 text-amber-800",
        border: "border-amber-200",
        product: "bg-amber-50",
        button: "bg-amber-600 hover:bg-amber-700 text-white",
        buttonLight: "bg-amber-100 text-amber-700 hover:bg-amber-200",
      },
      skillSet: {
        header: "bg-green-50 hover:bg-green-100",
        headerActive: "bg-green-100 text-green-800",
        border: "border-green-200",
        product: "bg-green-50",
        button: "bg-green-600 hover:bg-green-700 text-white",
        buttonLight: "bg-green-100 text-green-700 hover:bg-green-200",
      },
      tools: {
        header: "bg-purple-50 hover:bg-purple-100",
        headerActive: "bg-purple-100 text-purple-800",
        border: "border-purple-200",
        product: "bg-purple-50",
        button: "bg-purple-600 hover:bg-purple-700 text-white",
        buttonLight: "bg-purple-100 text-purple-700 hover:bg-purple-200",
      },
    }

    const colors = categoryColors[category] || {
      header: "bg-gray-50 hover:bg-gray-100",
      headerActive: "bg-blue-50 text-blue-700",
      border: "border-gray-200",
      product: "bg-gray-50",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      buttonLight: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    }

    const calculateCategoryProductRemainingQty = (product) => {
      const totalInstallmentQty = (product.installments || []).reduce(
        (sum, inst) => sum + Number.parseFloat(inst.mtrQty || 0),
        0,
      )
      const remainingQty = Math.max(0, Number.parseFloat(product.qty || 0) - totalInstallmentQty).toFixed(2)
      return remainingQty
    }

    return (
      <div className={`border rounded-lg ${colors.border}`}>
        <button
          onClick={() => setActiveTab(productId, isActive ? null : category)}
          className={`w-full p-3 text-left flex items-center justify-between ${
            isActive ? colors.headerActive : colors.header
          }`}
        >
          <span className="font-medium">
            {categoryName} ({products.length})
          </span>
          {isActive ? <FiChevronDown /> : <FiChevronRight />}
        </button>

        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 border-t">
                <div className="relative mb-4">
                  <div className="flex items-center border rounded-lg">
                    <FiSearch className="ml-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`Search products for ${categoryName}...`}
                      value={searchTerms[searchKey] || ""}
                      onChange={(e) => {
                        e.stopPropagation()
                        setSearchTerms((prev) => ({
                          ...prev,
                          [searchKey]: e.target.value,
                        }))
                      }}
                      onFocus={(e) => {
                        e.stopPropagation()
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
                          onClick={(e) => {
                            e.stopPropagation()
                            addProductToCategory(productId, category, product)
                          }}
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

                {products.length > 0 && (
                  <div className="space-y-4">
                    {products.map((product, index) => {
                      const productKey = `${productId}-${category}-${index}`
                      const isExpanded = expandedCategoryProducts[productKey]
                      const remainingQty = calculateCategoryProductRemainingQty(product)

                      return (
                        <div key={index} className={`${colors.product} rounded-lg border ${colors.border}`}>
                          <div className="p-3 flex items-center justify-between">
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={(e) => {
                                // Only toggle if clicking on the main area, not inputs
                                const target = e.target
                                if (!target.closest("input") && !target.closest("button")) {
                                  toggleCategoryProductExpansion(productKey)
                                }
                              }}
                            >
                              <div className="flex items-center">
                                {isExpanded ? <FiChevronDown className="mr-2" /> : <FiChevronRight className="mr-2" />}
                                <span className="font-medium">{product.product_name}</span>
                              </div>
                              <div className="text-sm text-gray-500 mt-1 ml-6">
                                Qty: {product.qty || 0} | UOM: {product.uom || "N/A"} | Make: {product.make || "N/A"}
                              </div>
                              <div className="text-sm text-blue-600 mt-1 ml-6">
                                Remaining: {remainingQty} {product.uom || "Nos"} of {product.qty || 0}{" "}
                                {product.uom || "Nos"}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeProductFromCategory(productId, category, index)
                              }}
                              className="text-red-500 hover:bg-red-50 p-1 rounded ml-2"
                            >
                              <FiX />
                            </button>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 pt-0 border-t">
                                  <div className="grid grid-cols-2 gap-3 mb-4 mt-3">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={product.qty || ""}
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onFocus={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          e.stopPropagation()
                                          updateCategoryProduct(productId, category, index, "qty", e.target.value)
                                        }}
                                        className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                                      <input
                                        type="text"
                                        value={product.make || ""}
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onFocus={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          e.stopPropagation()
                                          updateCategoryProduct(productId, category, index, "make", e.target.value)
                                        }}
                                        placeholder="Enter make"
                                        className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>

                                  <div className={`border-t pt-3 ${colors.border}`}>
                                    <div className="flex items-center justify-between mb-3">
                                      <h5 className="font-medium">Installments</h5>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleInstallmentForm(`${productId}-${category}-${index}`)
                                        }}
                                        className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${colors.buttonLight}`}
                                      >
                                        <FiPlus size={14} />
                                        Add Installment
                                      </button>
                                    </div>

                                    <InstallmentList
                                      installments={product.installments || []}
                                      onRemove={(installmentId) => {
                                        removeInstallmentFromProduct(productId, category, index, installmentId)
                                      }}
                                    />

                                    <AnimatePresence>
                                      {expandedInstallmentForms[`${productId}-${category}-${index}`] && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="overflow-hidden"
                                        >
                                          <InstallmentForm
                                            onSubmit={(installmentData) => {
                                              addInstallmentToProduct(productId, category, index, installmentData)
                                              toggleInstallmentForm(`${productId}-${category}-${index}`)
                                            }}
                                            onCancel={(e) => {
                                              if (e) e.stopPropagation()
                                              toggleInstallmentForm(`${productId}-${category}-${index}`)
                                            }}
                                          />
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                )}

                {products.length === 0 && (
                  <div className="text-center text-gray-500 py-4">No products added to {categoryName} yet</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
          installedQty: product.installments.reduce((sum, inst) => sum + Number.parseFloat(inst.mtrQty || 0), 0),
          remainingQty: remainingQty,
          uom: product.uom,
          make: product.make,
          installmentsCount: product.installments.length,
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
          installments: product.installments || [],
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
          <h2 className="text-2xl font-bold text-gray-900">Edit BOQ - Project {projectId}</h2>
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
                            Remaining Qty: {calculateRemainingQty(product)} {product.uom} of {product.qty} {product.uom}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleProductExpansion(product.id)}
                          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          {expandedProducts[product.id] ? <FiChevronDown /> : <FiChevronRight />}
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
                          <div className="p-4 space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-blue-800">Main Product Installments</h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleInstallmentForm(`${product.id}-main`)
                                  }}
                                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                  <FiPlus size={14} />
                                  Add Installment
                                </button>
                              </div>

                              <InstallmentList
                                installments={product.installments || []}
                                onRemove={(installmentId) =>
                                  removeInstallmentFromProduct(product.id, "main", null, installmentId)
                                }
                              />

                              <AnimatePresence>
                                {expandedInstallmentForms[`${product.id}-main`] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <InstallmentForm
                                      onSubmit={(installmentData) => {
                                        addInstallmentToProduct(product.id, "main", null, installmentData)
                                        toggleInstallmentForm(`${product.id}-main`)
                                      }}
                                      onCancel={(e) => {
                                        if (e) e.stopPropagation()
                                        toggleInstallmentForm(`${product.id}-main`)
                                      }}
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="space-y-3">
                              <CategoryTab
                                productId={product.id}
                                category="nonBillable"
                                categoryName="Non Billable"
                                products={product.nonBillable || []}
                              />
                              <CategoryTab
                                productId={product.id}
                                category="skillSet"
                                categoryName="Skill Set"
                                products={product.skillSet || []}
                              />
                              <CategoryTab
                                productId={product.id}
                                category="tools"
                                categoryName="Tools"
                                products={product.tools || []}
                              />
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
                    onClick={() => setShowAddProductSection(!showAddProductSection)}
                  >
                    <h3 className="text-lg font-medium">Add Another Main Product</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowAddProductModal(true)
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Open in Popup
                      </button>
                      {showAddProductSection ? <FiChevronDown /> : <FiChevronRight />}
                    </div>
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
                          <div className="border rounded-lg p-4 bg-white shadow-sm">
                            <ProductBOQSelector
                              projectId={projectId}
                              onSave={(boqData) => {
                                if (boqData && boqData.items && boqData.items.length > 0) {
                                  const newProducts = boqData.items.map((item) => ({
                                    id: Date.now() + Math.floor(Math.random() * 1000),
                                    product_id: item.product_id,
                                    // Fix: Use the actual product name from the item
                                    product_name: item.product_name || "New Product",
                                    hsn_code: item.hsn_code || "",
                                    product_description: item.product_description || "",
                                    qty: item.qty || 0,
                                    make: item.make || "",
                                    uom: item.uom || "",
                                    installments: [],
                                    nonBillable: [],
                                    skillSet: [],
                                    tools: [],
                                  }))
                                  setBOQProducts([...boqProducts, ...newProducts])
                                  setShowAddProductSection(false)

                                  // Fix: Auto-expand the newly added products
                                  const newExpandedState = { ...expandedProducts }
                                  newProducts.forEach((product) => {
                                    newExpandedState[product.id] = true
                                  })
                                  setExpandedProducts(newExpandedState)
                                }
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="border rounded-lg bg-white shadow-sm">
                <div
                  className="p-4 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
                  onClick={() => setShowAddProductSection(!showAddProductSection)}
                >
                  <h3 className="text-lg font-medium">Add Main Product</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowAddProductModal(true)
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Open in Popup
                    </button>
                    {showAddProductSection ? <FiChevronDown /> : <FiChevronRight />}
                  </div>
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
                        <div className="border rounded-lg p-4 bg-white shadow-sm">
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
                                  installments: [],
                                  nonBillable: [],
                                  skillSet: [],
                                  tools: [],
                                }))
                                setBOQProducts(newProducts)
                                setShowAddProductSection(false)

                                // Auto-expand the first product
                                if (newProducts.length > 0) {
                                  setExpandedProducts({ [newProducts[0].id]: true })
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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

        {showAddProductModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-xl font-bold">Add Main Product</h3>
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
                        installments: [],
                        nonBillable: [],
                        skillSet: [],
                        tools: [],
                      }))
                      setBOQProducts([...boqProducts, ...newProducts])
                      setShowAddProductModal(false)

                      // Auto-expand newly added products
                      const newExpandedState = { ...expandedProducts }
                      newProducts.forEach((product) => {
                        newExpandedState[product.id] = true
                      })
                      setExpandedProducts(newExpandedState)
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
                  their installments.
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
                        Installments
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {changesSummary.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                        <td className="px-3 py-2 text-sm font-medium">{item.productName}</td>
                        <td className="px-3 py-2 text-sm">{item.make || "N/A"}</td>
                        <td className="px-3 py-2 text-sm">
                          {item.totalQty} {item.uom}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {item.installedQty} {item.uom}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-blue-600">
                          {item.remainingQty} {item.uom}
                        </td>
                        <td className="px-3 py-2 text-sm">{item.installmentsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
                <button
                  onClick={() => setShowChangesSummary(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Back to Editing
                </button>
                <button
                  onClick={confirmAndSaveChanges}
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
                      Confirm & Save Changes
                    </>
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
