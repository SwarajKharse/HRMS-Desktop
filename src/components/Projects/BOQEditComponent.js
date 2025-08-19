"use client"

import { useState, useEffect, useRef } from "react"
import { FiPlus, FiX, FiEdit3, FiCheck, FiClock, FiAlertTriangle } from "react-icons/fi"
import { motion, AnimatePresence } from "framer-motion"
import BillableProductSelector from "./BillableProductSelector"
import { storeService } from "../../services/storeService"
import { projectService } from "../../services/projectService"
import { leadService } from "../../services/leadService"

function BOQEditComponent({
  projectId,
  projectName,
  existingBOQ,
  onSave,
  onClose,
  currentUserId,
  updateCategoryProduct,
}) {
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [boqProducts, setBOQProducts] = useState([])
  const [availableSkillsets, setAvailableSkillsets] = useState([])
  const [availableTools, setAvailableTools] = useState([])
  const [availableProducts, setAvailableProducts] = useState([])
  const [leadProductTypes, setLeadProductTypes] = useState([])
  const [expandedProducts, setExpandedProducts] = useState({})
  const [expandedProductTypes, setExpandedProductTypes] = useState({})
  const [selectedProductTab, setSelectedProductTab] = useState({})
  const [expandedMTRForms, setExpandedMTRForms] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerms, setSearchTerms] = useState({})
  const [showProductSearch, setShowProductSearch] = useState({})
  const [showChangesSummary, setShowChangesSummary] = useState(false)
  const [changesSummary, setChangesSummary] = useState([])
  const [editingProductModal, setEditingProductModal] = useState(null)
  const [showApprovalModal, setShowApprovalModal] = useState(null)
  const [isBOQInitializedFromProps, setIsBOQInitializedFromProps] = useState(false)
  const [editingBillableMTR, setEditingBillableMTR] = useState(null)
  const [projectManager, setProjectManager] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("[v0] Starting fetchData")
        setLoading(true)

        // Fetch Lead Product Types
        const leadResponse = await leadService.getLeadProductTypeList()
        let productTypesData = []
        if (Array.isArray(leadResponse)) {
          productTypesData = leadResponse
        } else if (leadResponse && Array.isArray(leadResponse.data)) {
          productTypesData = leadResponse.data
        } else if (leadResponse && Array.isArray(leadResponse.leadProductTypes)) {
          productTypesData = leadResponse.leadProductTypes
        } else if (leadResponse && typeof leadResponse === "object") {
          const arrayProperty = Object.values(leadResponse).find((value) => Array.isArray(value))
          if (arrayProperty) {
            productTypesData = arrayProperty
          }
        }
        setLeadProductTypes(productTypesData)

        // Fetch Skillsets
        try {
          const skillsetsResponse = await storeService.getSkillSets()
          let skillsetsData = []
          if (skillsetsResponse && skillsetsResponse.data && Array.isArray(skillsetsResponse.data.content)) {
            skillsetsData = skillsetsResponse.data.content
          } else if (Array.isArray(skillsetsResponse)) {
            skillsetsData = skillsetsResponse
          } else if (skillsetsResponse && Array.isArray(skillsetsResponse.data)) {
            skillsetsData = skillsetsResponse.data
          } else if (skillsetsResponse && Array.isArray(skillsetsResponse.skillsets)) {
            skillsetsData = skillsetsResponse.skillsets
          } else if (skillsetsResponse && typeof skillsetsResponse === "object") {
            const arrayProperty = Object.values(skillsetsResponse).find((value) => Array.isArray(value))
            if (arrayProperty) {
              skillsetsData = arrayProperty
            }
          }
          setAvailableSkillsets(skillsetsData)
          console.log("[v0] Skillsets loaded:", skillsetsData.length)
        } catch (error) {
          console.error("[v0] Error loading skillsets:", error)
          setAvailableSkillsets([])
        }

        try {
          // Fetch Tools
          const toolsResponse = await storeService.getTools()
          let toolsData = []
          if (toolsResponse && toolsResponse.data && Array.isArray(toolsResponse.data.content)) {
            toolsData = toolsResponse.data.content
          } else if (Array.isArray(toolsResponse)) {
            toolsData = toolsResponse
          } else if (toolsResponse && Array.isArray(toolsResponse.data)) {
            toolsData = toolsResponse.data
          } else if (toolsResponse && Array.isArray(toolsResponse.tools)) {
            toolsData = toolsResponse.tools
          } else if (toolsResponse && typeof toolsResponse === "object") {
            const arrayProperty = Object.values(toolsResponse).find((value) => Array.isArray(value))
            if (arrayProperty) {
              toolsData = arrayProperty
            }
          }
          setAvailableTools(toolsData)
          console.log("[v0] Tools loaded:", toolsData.length)
        } catch (error) {
          console.error("[v0] Error loading tools:", error)
          setAvailableTools([])
        }

        try {
          // Fetch All Products for Non-Billable
          const allProductsResponse = await storeService.getProductsList()
          let allProductsData = []
          if (allProductsResponse && allProductsResponse.data && Array.isArray(allProductsResponse.data.content)) {
            allProductsData = allProductsResponse.data.content
          } else if (Array.isArray(allProductsResponse)) {
            allProductsData = allProductsResponse
          } else if (allProductsResponse && Array.isArray(allProductsResponse.data)) {
            allProductsData = allProductsResponse.data
          } else if (allProductsResponse && Array.isArray(allProductsResponse.products)) {
            allProductsData = allProductsResponse.products
          } else if (allProductsResponse && typeof allProductsResponse === "object") {
            const arrayProperty = Object.values(allProductsResponse).find((value) => Array.isArray(value))
            if (arrayProperty) {
              allProductsData = arrayProperty
            }
          }
          setAvailableProducts(allProductsData)
          console.log("[v0] Products loaded:", allProductsData.length)
        } catch (error) {
          console.error("[v0] Error loading products:", error)
          setAvailableProducts([])
        }

        const projectResponse = await projectService.getProjectById(projectId)
        setProjectManager(projectResponse.projectManager || projectResponse.project_manager)
      } catch (error) {
        console.error("[v0] Error in fetchData:", error)
        setError("Failed to load initial data: " + error.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getPMApprovalStatus = () => {
    if (!projectManager || !currentUserId) return "PENDING"
    return currentUserId === projectManager ? "APPROVED" : "PENDING"
  }

  const cleanProjectCode = (name) => {
    return name ? name.replace(/[^a-zA-Z0-9]/g, "") : ""
  }
  const projectCode = cleanProjectCode(projectName)

  const extractCategoryInfo = (product, allLeadProductTypes, explicitLeadProductTypeId = null) => {
    if (!product) {
      return {
        topCategory: "Unassigned",
        mainCategory: "Uncategorized",
        subCategory: "Uncategorized",
        fullPath: "Unassigned > Uncategorized > Uncategorized",
        leadProductTypeId: null,
      }
    }

    let topCategory = "Unassigned"
    let mainCategory = "Uncategorized"
    let subCategory = "Uncategorized"
    let finalLeadProductTypeId = explicitLeadProductTypeId // Prioritize explicit ID

    // Determine finalLeadProductTypeId first
    if (finalLeadProductTypeId === null) {
      // Case 1: Product is an existing BOQ item's product (item.product)
      // It has a categoryId which is the leadProductType object
      if (product.categoryId && product.categoryId.id) {
        finalLeadProductTypeId = product.categoryId.id
      }
      // Case 2: Product is from storeService (e.g., availableProducts for non-billable)
      // It has a category_id which is the sub-category object
      else if (
        product.category_id &&
        product.category_id.productCategory &&
        product.category_id.productCategory.mainGroup
      ) {
        finalLeadProductTypeId = product.category_id.productCategory.mainGroup.id
      }
    }

    // Now, use finalLeadProductTypeId to find the topCategory label
    if (finalLeadProductTypeId) {
      topCategory = allLeadProductTypes.find((t) => t.id === finalLeadProductTypeId)?.label || "Unassigned"
    }

    // Determine mainCategory and subCategory based on available product structure
    // Prioritize existing BOQ item structure (product.categoryId)
    if (product.categoryId) {
      mainCategory = product.categoryId.productCategory?.category_name || "Uncategorized"
      subCategory = product.categoryId.category_name || "Uncategorized"
    }
    // Fallback to storeService product structure (product.category_id)
    else if (product.category_id) {
      mainCategory = product.category_id.productCategory?.category_name || "Uncategorized"
      subCategory = product.category_id.category_name || "Uncategorized"
    }

    return {
      topCategory,
      mainCategory,
      subCategory,
      fullPath: `${topCategory} > ${mainCategory} > ${subCategory}`,
      leadProductTypeId: finalLeadProductTypeId,
    }
  }

  useEffect(() => {
    console.log("=== BOQ Data Debug ===")
    console.log("Raw Existing BOQ:", JSON.stringify(existingBOQ, null, 2))
    const initializeBOQ = async () => {
      // Ensure leadProductTypes are available before processing BOQ
      if (
        existingBOQ &&
        existingBOQ.items &&
        Array.isArray(existingBOQ.items) &&
        !isBOQInitializedFromProps &&
        leadProductTypes.length > 0
      ) {
        try {
          const formattedProducts = existingBOQ.items.map((item, index) => {
            console.log(`BOQEdit: Processing item ${index}:`, JSON.stringify(item, null, 2))
            const product = item.product || {}
            console.log(`BOQEdit: Item product object:`, JSON.stringify(product, null, 2))

            // Correctly determine leadProductTypeId and categoryInfo for existing BOQ items
            const boqItemLeadProductTypeId = product.categoryId?.id || null
            const boqItemCategoryInfo = extractCategoryInfo(product, leadProductTypes, boqItemLeadProductTypeId) // Pass explicit ID
            console.log(`BOQEdit: Derived boqItemLeadProductTypeId:`, boqItemLeadProductTypeId)
            console.log(`BOQEdit: Derived boqItemCategoryInfo:`, boqItemCategoryInfo)

            const materialRequisitions = (item.mtrs || []).map((mtr, mtrIndex) => {
              console.log(`Processing MTR ${mtrIndex}:`, mtr)
              return {
                id: mtr.id, // Preserve existing MTR ID for frontend state
                mtrQty: mtr.mtrQty || 0,
                stockAlloted: mtr.stockAlloted || 0,
                purchaseMTR: mtr.purchaseMTR || 0,
                dcQty: mtr.dcQty || 0,
                remarks: mtr.remarks || mtr.notes || "",
                status: mtr.status || "Pending",
                expectedDeliveryDate: mtr.expectedDeliveryDate || "",
                priority: mtr.priority || "MEDIUM",
                mtrCode: mtr.mtrCode || "",
              }
            })

            const nonBillable = (item.nonBillableItems || []).map((nb) => ({
              ...nb,
              id: nb.id, // Preserve existing non-billable item ID for frontend state
              product_name: nb.productName || nb.itemDescription || nb.hsnCode || "Unknown Non-Billable Product", // Use itemDescription or hsnCode as fallback
              qty: nb.qty || 0,
              make: nb.make || "",
              uom: nb.uom || "",
              materialRequisitions: (nb.materialRequisitions || []).map((mtr, mtrIndex) => ({
                id: mtr.id, // Preserve existing category MTR ID for frontend state
                mtrQty: mtr.mtrQty || 0,
                stockAlloted: mtr.stockAlloted || 0,
                purchaseMTR: mtr.purchaseMTR || 0,
                dcQty: mtr.dcQty || 0,
                remarks: mtr.remarks || "",
                status: mtr.status || "Pending",
                expectedDeliveryDate: mtr.expectedDeliveryDate || "",
                priority: mtr.priority || "MEDIUM",
                mtrCode: mtr.mtrCode || "",
              })),
            }))

            const skillSet = (item.skillSetItems || []).map((ss) => ({
              ...ss,
              id: ss.id, // Preserve existing skillset item ID for frontend state
              name: ss.skillset_name || ss.itemDescription || "Unknown Skillset", // Use skillset_name or itemDescription as fallback
              qty: ss.qty || 0,
              materialRequisitions: (ss.materialRequisitions || []).map((mtr, mtrIndex) => ({
                id: mtr.id, // Preserve existing category MTR ID for frontend state
                mtrQty: mtr.mtrQty || 0,
                stockAlloted: mtr.stockAlloted || 0,
                purchaseMTR: mtr.purchaseMTR || 0,
                dcQty: mtr.dcQty || 0,
                remarks: mtr.remarks || "",
                status: mtr.status || "Pending",
                expectedDeliveryDate: mtr.expectedDeliveryDate || "",
                priority: mtr.priority || "MEDIUM",
                mtrCode: mtr.mtrCode || "",
              })),
            }))

            const tools = (item.toolsItems || []).map((t) => ({
              ...t,
              id: t.id, // Preserve existing tool item ID for frontend state
              name: t.tool_name || t.itemDescription || "Unknown Tool", // Use tool_name or itemDescription as fallback
              qty: t.qty || 0,
              make: t.make || "",
              materialRequisitions: (t.materialRequisitions || []).map((mtr, mtrIndex) => ({
                id: mtr.id, // Preserve existing category MTR ID for frontend state
                mtrQty: mtr.mtrQty || 0,
                stockAlloted: mtr.stockAlloted || 0,
                purchaseMTR: mtr.purchaseMTR || 0,
                dcQty: t.dcQty || 0,
                remarks: mtr.remarks || "",
                status: mtr.status || "Pending",
                expectedDeliveryDate: t.expectedDeliveryDate || "",
                priority: mtr.priority || "MEDIUM",
                mtrCode: mtr.mtrCode || "",
              })),
            }))

            const formattedItem = {
              id: item.id, // CRITICAL CHANGE: Use item.id directly for existing BOQ items
              product_id: product.id || 0, // This is ProductsMaster ID
              product_name: product.productName || product.product_name || product.name || "Unknown Product", // Prioritize productName
              hsn_code: product.hsnCode || product.hsn_code || "",
              product_description: product.productDescription || product.product_description || "",
              qty: item.totalQty || 0,
              make: item.make || "",
              uom: item.uom || "",
              leadProductTypeId: boqItemLeadProductTypeId, // Use the ID from the BOQ item's product.categoryId
              pmApprovalStatus: item.pmApprovalStatus || "PENDING",
              salestlApprovalStatus: item.salestlApprovalStatus || "PENDING",
              pmApprovalRemarks: item.pmApprovalRemarks || "",
              salestlApprovalRemarks: item.salestlApprovalRemarks || "",
              pmApprovalDate: new Date(item.pmApprovalDate).toISOString() || null,
              salestlApprovalDate: new Date(item.salestlApprovalDate).toISOString() || null,
              nonBillable: nonBillable,
              skillSet: skillSet,
              tools: tools,
              materialRequisitions: materialRequisitions,
              categoryInfo: boqItemCategoryInfo, // Use the correctly extracted categoryInfo
              supply_rate: item.supplyRate || 0,
              installation_rate: item.installationRate || 0,
              supply_amount: item.supplyAmount || 0, // Use item.supplyAmount directly
              installation_amount: item.installationAmount || 0, // Use item.installationAmount directly
              total: item.total || 0, // Use item.total directly
            }
            console.log(`BOQEdit: Final product_name for item:`, formattedItem.product_name)
            return formattedItem
          })
          setBOQProducts(formattedProducts)
          if (formattedProducts.length > 0) {
            setExpandedProducts({ [formattedProducts[0].id]: true })
            setSelectedProductTab({ [formattedProducts[0].id]: "billable" })
          }
          setIsBOQInitializedFromProps(true)
        } catch (err) {
          console.error("Error processing BOQ data:", err)
          setError("Error processing BOQ data: " + err.message)
          setBOQProducts([])
        }
      } else if (!existingBOQ && !isBOQInitializedFromProps) {
        setBOQProducts([])
        setIsBOQInitializedFromProps(true)
      }
    }
    initializeBOQ()
  }, [existingBOQ, isBOQInitializedFromProps, leadProductTypes]) // Now leadProductTypes is a stable dependency after initial fetch

  const ApprovalStatusBadge = ({
    status,
    type,
    onUpdate,
    productId,
    remarks,
    approvalDate,
    category,
    categoryIndex,
  }) => {
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
            onClick={() =>
              setShowApprovalModal({
                productId,
                type,
                currentStatus: status,
                currentRemarks: remarks,
                category,
                categoryIndex,
              })
            }
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)} hover:opacity-80 transition-opacity`}
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
    productId,
    type,
    currentStatus,
    currentRemarks,
    onClose,
    onSave,
    category,
    categoryIndex,
  }) => {
    const [status, setStatus] = useState(currentStatus)
    const [remarks, setRemarks] = useState(currentRemarks)

    const handleSave = async () => {
      try {
        if (category && categoryIndex !== undefined) {
          // Category item approval (nonBillable, skillSet, tools)
          await projectService.updateBOQCategoryItemApprovalStatus(projectId, productId, {
            type,
            status,
            remarks,
            category,
            categoryIndex,
          })

          setBOQProducts((prev) =>
            prev.map((product) => {
              if (product.id === productId) {
                const updatedProduct = { ...product }
                const updatedCategory = [...(updatedProduct[category] || [])]

                if (updatedCategory[categoryIndex]) {
                  if (type === "PM") {
                    updatedCategory[categoryIndex].pmApprovalStatus = status
                    updatedCategory[categoryIndex].pmApprovalRemarks = remarks
                    if (status !== "PENDING") {
                      updatedCategory[categoryIndex].pmApprovalDate = new Date().toISOString()
                    }
                  }
                }

                updatedProduct[category] = updatedCategory
                return updatedProduct
              }
              return product
            }),
          )
        } else if (type === "MTR") {
          // MTR approval
          await projectService.updateMTRApprovalStatus(projectId, productId, { status, remarks })

          setBOQProducts((prev) =>
            prev.map((product) => {
              if (product.id === productId) {
                return {
                  ...product,
                  materialRequisitions: product.materialRequisitions.map((mtr) => ({
                    ...mtr,
                    pmApprovalStatus: status,
                    pmApprovalRemarks: remarks,
                    pmApprovalDate: status !== "PENDING" ? new Date().toISOString() : null,
                  })),
                }
              }
              return product
            }),
          )
        } else {
          // Billable product approval (existing functionality)
          await projectService.updateBOQItemApprovalStatus(projectId, productId, { type, status, remarks })
          setBOQProducts((prev) =>
            prev.map((product) => {
              if (product.id === productId) {
                const updatedProduct = { ...product }
                if (type === "PM") {
                  updatedProduct.pmApprovalStatus = status
                  updatedProduct.pmApprovalRemarks = remarks
                  if (status !== "PENDING") {
                    updatedProduct.pmApprovalDate = new Date().toISOString()
                  }
                } else if (type === "SALESTL") {
                  updatedProduct.salestlApprovalStatus = status
                  updatedProduct.salestlApprovalRemarks = remarks
                  if (status !== "PENDING") {
                    updatedProduct.salestlApprovalDate = new Date().toISOString()
                  }
                }
                return updatedProduct
              }
              return product
            }),
          )
        }

        onSave()
        onClose()
      } catch (error) {
        console.error("Error updating approval status:", error)
        setError("Failed to update approval status: " + error.message)
      }
    }
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-bold">Update {type} Approval Status</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
              <FiX />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter approval remarks..."
                rows="3"
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Update Status
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Inline MTR Form (replaces MaterialRequisitionForm.js)
  const MTRForm = ({ onSubmit, onCancel, projectCode, currentMTRCount, initialMTRData }) => {
    const [formData, setFormData] = useState({
      mtrQty: "",
      stockAlloted: "0",
      purchaseMTR: "0",
      dcQty: "0",
      remarks: "",
      expectedDeliveryDate: "",
      priority: "MEDIUM",
      mtrCode: "",
    })

    useEffect(() => {
      if (initialMTRData) {
        setFormData({
          mtrQty: initialMTRData.mtrQty || "",
          stockAlloted: initialMTRData.stockAlloted || "0",
          purchaseMTR: initialMTRData.purchaseMTR || "0",
          dcQty: initialMTRData.dcQty || "0",
          remarks: initialMTRData.remarks || "",
          expectedDeliveryDate: initialMTRData.expectedDeliveryDate || "",
          priority: initialMTRData.priority || "MEDIUM",
          mtrCode: initialMTRData.mtrCode || "",
        })
      } else {
        if (projectCode && currentMTRCount) {
          const generatedMtrCode = `MTR-${projectCode}-${currentMTRCount}`
          setFormData((prev) => ({ ...prev, mtrCode: generatedMtrCode }))
        }
      }
    }, [initialMTRData, projectCode, currentMTRCount])

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
        stockAlloted: "0",
        purchaseMTR: "0",
        dcQty: "0",
        remarks: "",
        expectedDeliveryDate: "",
        priority: "MEDIUM",
        mtrCode: "",
      })
    }

    return (
      <form onSubmit={handleSubmit} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h5 className="font-medium mb-3 text-blue-800">
          {initialMTRData ? "Edit Material Requisition" : "Add New Material Requisition"}
        </h5>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
            <input
              type="date"
              value={formData.expectedDeliveryDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, expectedDeliveryDate: e.target.value }))}
              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MTR Code</label>
            <input
              type="text"
              value={formData.mtrCode}
              readOnly
              className="w-full p-2 border rounded bg-gray-50 focus:outline-none"
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
            {initialMTRData ? "Update Material Requisition" : "Add Material Requisition"}
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

  // Inline MTR List (replaces MaterialRequisitionList.js)
  const MTRList = ({ materialRequisitions, onRemove, onEdit }) => {
    if (!materialRequisitions || materialRequisitions.length === 0) {
      return <div className="text-center text-gray-500 py-2 text-sm">No material requisitions added yet</div>
    }

    const getPriorityColor = (priority) => {
      switch (priority) {
        case "HIGH":
          return "bg-red-100 text-red-800"
        case "MEDIUM":
          return "bg-yellow-100 text-yellow-800"
        case "LOW":
          return "bg-green-100 text-green-800"
        default:
          return "bg-gray-100 text-gray-800"
      }
    }

    return (
      <div className="space-y-2 mb-4">
        <h5 className="font-medium text-gray-800">Previous Material Requisitions ({materialRequisitions.length})</h5>
        {materialRequisitions.map((mtr, index) => (
          <div key={mtr.id || `new-mtr-${index}`} className="bg-gray-50 p-3 rounded border">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">MTR #{index + 1}</span>
                  {mtr.mtrCode && (
                    <span className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded">Code: {mtr.mtrCode}</span>
                  )}
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">MTR: {mtr.mtrQty}</span>
                  {mtr.priority && (
                    <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(mtr.priority)}`}>
                      {mtr.priority}
                    </span>
                  )}
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
                  {mtr.expectedDeliveryDate && (
                    <div>
                      <span className="text-gray-600">Delivery:</span>
                      <span className="ml-1 font-medium">
                        {new Date(mtr.expectedDeliveryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                {mtr.remarks && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Remarks:</span>
                    <span className="ml-1">{mtr.remarks}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(mtr)}
                  className="text-blue-500 hover:bg-blue-50 p-1 rounded"
                  title="Edit material requisition"
                >
                  <FiEdit3 size={14} />
                </button>
                <button
                  onClick={() => onRemove(mtr.id)}
                  className="text-red-500 hover:bg-red-50 p-1 rounded"
                  title="Remove material requisition"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const CategoryProductModal = ({ product, productId, category, productIndex, onClose, onSave, projectCode }) => {
    const [editingCategoryMTR, setEditingCategoryMTR] = useState(null)

    const getCurrentProduct = () => {
      const mainProduct = boqProducts.find((p) => p.id === productId)
      if (!mainProduct || !mainProduct[category]) return product
      return mainProduct[category][productIndex] || product
    }

    const [localData, setLocalData] = useState(() => {
      const currentProduct = getCurrentProduct()
      return {
        qty: currentProduct?.qty || "",
        make: category === "skillSet" ? "" : currentProduct?.make || "",
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
      if (category !== "skillSet") {
        setLocalData((prev) => ({ ...prev, make: value }))
        syncToMainState("make", value)
      }
    }

    const currentMTRCount = (getCurrentProduct()?.materialRequisitions || []).length + 1

    const handleCategoryMTRSubmit = (mtrData) => {
      updateCategoryProduct(productId, category, productIndex, "qty", localData.qty)
      if (category !== "skillSet") {
        updateCategoryProduct(productId, category, productIndex, "make", localData.make)
      }
      handleMTRSubmit(productId, category, productIndex, mtrData)
      toggleMTRForm(`${productId}-${category}-${productIndex}`)
    }

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-xl font-bold">Edit {product?.product_name || product?.name}</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
              <FiX />
            </button>
          </div>
          <div className="p-6 overflow-auto flex-1">
            <div className="space-y-4">
              <div className={`grid ${category === "skillSet" ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
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
                {category !== "skillSet" && (
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
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium">Material Requisitions</h5>
                  <button
                    onClick={() => {
                      toggleMTRForm(`${productId}-${category}-${productIndex}`)
                      setEditingCategoryMTR(null)
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    <FiPlus size={14} />
                    Add Material Requisition
                  </button>
                </div>

                <MTRList
                  materialRequisitions={getCurrentProduct()?.materialRequisitions || []}
                  onRemove={(mtrId) => {
                    removeMTRFromProduct(productId, category, productIndex, mtrId)
                  }}
                  onEdit={(mtrToEdit) => {
                    setEditingCategoryMTR(mtrToEdit)
                    setExpandedMTRForms((prev) => ({
                      ...prev,
                      [`${productId}-${category}-${productIndex}`]: true,
                    }))
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
                      <MTRForm
                        projectCode={projectCode}
                        currentMTRCount={currentMTRCount}
                        initialMTRData={editingCategoryMTR}
                        onSubmit={(mtrData) => {
                          updateCategoryProduct(productId, category, productIndex, "qty", localData.qty)
                          if (category !== "skillSet") {
                            updateCategoryProduct(productId, category, productIndex, "make", localData.make)
                          }
                          handleMTRSubmit(productId, category, productIndex, mtrData)
                          toggleMTRForm(`${productId}-${category}-${productIndex}`)
                          setEditingCategoryMTR(null)
                        }}
                        onCancel={() => {
                          toggleMTRForm(`${productId}-${category}-${productIndex}`)
                          setEditingCategoryMTR(null)
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
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

  const getProductsByLeadProductType = () => {
    const grouped = {}
    boqProducts.forEach((product) => {
      console.log("product ---------------- ")
      console.log(product)
      const typeId = product.leadProductTypeId || "unassigned"
      const typeName = leadProductTypes.find((t) => t.id === typeId)?.label || "Unassigned"
      if (!grouped[typeId]) {
        grouped[typeId] = {
          id: typeId,
          name: typeName,
          products: [],
        }
      }
      grouped[typeId].products.push(product)
    })
    return Object.values(grouped)
  }

  const saveChanges = async () => {
    try {
      setLoading(true)
      setError("")

      const enhancedBOQData = {
        items: boqProducts.map((product) => {
          const installmentData = {}
          // Note: The backend's saveBOQWithMaterialRequisition deletes and recreates MTRs.
          // So, the `id` field for MTRs sent from frontend is not used for updates, only for new ones.
          // The `mtrCode` is important for tracking.
          product.materialRequisitions.forEach((mtr, index) => {
            installmentData[`mtr_${index}`] = {
              mtrQty: Number.parseFloat(mtr.mtrQty || 0),
              stockAlloted: Number.parseFloat(mtr.stockAlloted || 0),
              purchaseMTR: Number.parseFloat(mtr.purchaseMTR || 0),
              dcQty: Number.parseFloat(mtr.dcQty || 0),
              remarks: mtr.remarks || "",
              expectedDeliveryDate: mtr.expectedDeliveryDate || null,
              priority: mtr.priority || "MEDIUM",
              mtrCode: mtr.mtrCode || "", // mtrCode is included here
            }
          })

          return {
            id: product.id, // Ensure this is null for new items, and actual ID for existing BOQItems
            productId: product.product_id?.toString() || "", // This is the ProductsMaster ID
            productName: product.product_name || "", // Use productName
            hsnCode: product.hsn_code || "",
            qty: Number.parseFloat(product.qty) || 0,
            make: product.make || "",
            uom: product.uom || "",
            leadProductTypeId: product.leadProductTypeId,
            pmApprovalStatus: product.pmApprovalStatus,
            salestlApprovalStatus: product.salestlApprovalStatus,
            pmApprovalRemarks: product.pmApprovalRemarks,
            salestlApprovalRemarks: product.salestlApprovalRemarks,
            pmApprovalDate: product.pmApprovalDate, // Pass date string
            salestlApprovalDate: product.salestlApprovalDate, // Pass date string
            // Ensure these fields are passed in camelCase as per DTO
            supplyRate: Number.parseFloat(product.supply_rate || 0),
            installationRate: Number.parseFloat(product.installation_rate || 0),
            supplyAmount: Number.parseFloat(product.supply_amount || 0),
            installationAmount: Number.parseFloat(product.installation_amount || 0),
            total: Number.parseFloat(product.total || 0),
            nonBillable: (product.nonBillable || []).map((item) => ({
              ...item,
              id: typeof item.id === "number" ? item.id : null, // Preserve actual IDs (numbers), set to null for temporary frontend IDs (strings)
              materialRequisitions: (item.materialRequisitions || []).map((mtr) => ({
                ...mtr,
                id: typeof mtr.id === "number" ? mtr.id : null, // Preserve actual MTR IDs if they are numbers
              })),
            })),
            skillSet: (product.skillSet || []).map((item) => ({
              ...item,
              id: typeof item.id === "number" ? item.id : null, // Preserve actual IDs (numbers), set to null for temporary frontend IDs (strings)
              make: null,
              materialRequisitions: (item.materialRequisitions || []).map((mtr) => ({
                ...mtr,
                id: typeof mtr.id === "number" ? mtr.id : null,
              })),
            })),
            tools: (product.tools || []).map((item) => ({
              ...item,
              id: typeof item.id === "number" ? item.id : null, // Preserve actual IDs (numbers), set to null for temporary frontend IDs (strings)
              materialRequisitions: (item.materialRequisitions || []).map((mtr) => ({
                ...mtr,
                id: typeof mtr.id === "number" ? mtr.id : null,
              })),
            })),
            installmentData: installmentData, // This seems to be an old/alternative way of sending MTRs
            materialRequisitions: (product.materialRequisitions || []).map((mtr) => ({
              id: null, // CRITICAL CHANGE: Always send null for MTR IDs as backend recreates them
              mtrQty: Number.parseFloat(mtr.mtrQty || 0),
              stockAlloted: Number.parseFloat(mtr.stockAlloted || 0),
              purchaseMTR: Number.parseFloat(mtr.purchaseMTR || 0),
              dcQty: Number.parseFloat(mtr.dcQty || 0),
              remarks: mtr.remarks || "",
              status: mtr.status || "Pending",
              expectedDeliveryDate: mtr.expectedDeliveryDate || null,
              priority: mtr.priority || "MEDIUM",
              mtrCode: mtr.mtrCode || "",
            })),
          }
        }),
      }
      console.log("Saving BOQ with material requisitions:", enhancedBOQData)
      const response = await projectService.saveBOQWithMaterialRequisition(projectId, enhancedBOQData)
      console.log("BOQ saved successfully:", response)
      if (onSave) {
        onSave(enhancedBOQData)
      }
      setError("")
      alert("BOQ with material requisitions saved successfully!")
      onClose()
    } catch (err) {
      console.error("Error saving BOQ with material requisitions:", err)
      setError(`Error saving BOQ: ${err.message || err}`)
    } finally {
      setLoading(false)
      setShowChangesSummary(false)
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

  const toggleProductTypeExpansion = (typeId) => {
    setExpandedProductTypes((prev) => ({
      ...prev,
      [typeId]: !prev[typeId],
    }))
  }

  const selectProductTab = (productId, tab) => {
    setSelectedProductTab((prev) => ({ ...prev, [productId]: tab }))
  }

  const toggleMTRForm = (key) => {
    setExpandedMTRForms((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    setEditingBillableMTR(null)
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
                id: null, // CRITICAL: Ensure BOQCategoryItem's own ID is null for new items
                referenceId: product.id, // NEW: Pass the master data ID as referenceId
                product_name: product.product_name || product.productName || product.name, // Use itemDescription or hsnCode as fallback
                hsn_code: product.hsn_code || product.hsnCode || "",
                uom: product.uom || "",
                qty: "",
                make: "", // Non-billable products can have make
                pmApprovalStatus: getPMApprovalStatus(),
                pmApprovalRemarks: "",
                pmApprovalDate: getPMApprovalStatus() === "APPROVED" ? new Date().toISOString() : null,
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
                id: null, // CRITICAL: Ensure BOQCategoryItem's own ID is null for new items
                referenceId: skillset.id, // NEW: Pass the master data ID as referenceId
                name: skillset.skillset_name, // Use 'name' for display
                qty: "",
                make: null, // Skillsets do not have make
                pmApprovalStatus: getPMApprovalStatus(),
                pmApprovalRemarks: "",
                pmApprovalDate: getPMApprovalStatus() === "APPROVED" ? new Date().toISOString() : null,
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
      [`${mainProductId}-skillSet`]: false,
    }))
    setSearchTerms((prev) => ({
      ...prev,
      [`${mainProductId}-skillSet`]: "",
    }))
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
                id: null, // CRITICAL: Ensure BOQCategoryItem's own ID is null for new items
                referenceId: tool.id, // NEW: Pass the master data ID as referenceId
                name: tool.tool_name, // Use 'name' for display
                qty: "",
                make: "", // Tools can have make
                pmApprovalStatus: getPMApprovalStatus(),
                pmApprovalRemarks: "",
                pmApprovalDate: getPMApprovalStatus() === "APPROVED" ? new Date().toISOString() : null,
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
      [`${mainProductId}-tools`]: false,
    }))
    setSearchTerms((prev) => ({
      ...prev,
      [`${mainProductId}-tools`]: "",
    }))
  }

  const handleMTRSubmit = (mainProductId, category, productIndex, mtrData) => {
    setBOQProducts((prev) =>
      prev.map((p) => {
        if (p.id === mainProductId) {
          if (category === "billable") {
            if (editingBillableMTR) {
              return {
                ...p,
                materialRequisitions: p.materialRequisitions.map((mtr) =>
                  mtr.id === editingBillableMTR.id ? { ...mtr, ...mtrData } : mtr,
                ),
              }
            } else {
              return {
                ...p,
                materialRequisitions: [
                  ...(p.materialRequisitions || []),
                  {
                    id: null,
                    ...mtrData,
                    pmApprovalStatus: getPMApprovalStatus(),
                    pmApprovalRemarks: "",
                    pmApprovalDate: getPMApprovalStatus() === "APPROVED" ? new Date().toISOString() : null,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            }
          } else {
            const updatedCategory = [...(p[category] || [])]
            if (mtrData.id) {
              updatedCategory[productIndex] = {
                ...updatedCategory[productIndex],
                materialRequisitions: updatedCategory[productIndex].materialRequisitions.map((mtr) =>
                  mtr.id === mtrData.id ? { ...mtr, ...mtrData } : mtr,
                ),
              }
            } else {
              updatedCategory[productIndex] = {
                ...updatedCategory[productIndex],
                materialRequisitions: [
                  ...(updatedCategory[productIndex].materialRequisitions || []),
                  {
                    id: null,
                    ...mtrData,
                    pmApprovalStatus: getPMApprovalStatus(),
                    pmApprovalRemarks: "",
                    pmApprovalDate: getPMApprovalStatus() === "APPROVED" ? new Date().toISOString() : null,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
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
    setEditingBillableMTR(null)
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

  const getFilteredNonBillableProducts = (searchKey) => {
    const searchTerm = searchTerms[searchKey] || ""
    if (!searchTerm.trim()) return availableProducts
    const lowercasedSearch = searchTerm.toLowerCase()
    return availableProducts.filter((product) => {
      if (!product) return false
      return (
        (product.product_name || "").toLowerCase().includes(lowercasedSearch) ||
        (product.hsn_code || "").toLowerCase().includes(lowercasedSearch) ||
        (product.product_description || "").toLowerCase().includes(lowercasedSearch)
      )
    })
  }

  const calculateRemainingQty = (product) => {
    const totalMTRQty = (product.materialRequisitions || []).reduce(
      (sum, mtr) => sum + Number.parseFloat(mtr.mtrQty || 0),
      0,
    )
    const remainingQty = Math.max(0, Number.parseFloat(product.qty || 0) - totalMTRQty).toFixed(2)
    return remainingQty
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

  const handleBillableProductSave = (boqDataFromSelector) => {
    const incomingItems = boqDataFromSelector.items // These are the items from BillableProductSelector

    const updatedBOQProducts = []
    const processedIncomingIds = new Set() // To track which incoming items have been processed

    // 1. Process existing BOQ items in BOQEditComponent's state
    boqProducts.forEach((existingBOQItem) => {
      const matchedIncomingItem = incomingItems.find(
        (incomingItem) => incomingItem.id === existingBOQItem.id, // Match by BOQItem ID
      )

      if (matchedIncomingItem) {
        // Existing item found and still present in the selector's output
        updatedBOQProducts.push({
          ...existingBOQItem, // Keep existing nonBillable, skillSet, tools, MTRs
          // Update billable-specific fields from the matched incoming item
          product_id: matchedIncomingItem.productId, // ProductsMaster ID
          product_name: matchedIncomingItem.productName,
          hsn_code: matchedIncomingItem.hsnCode,
          product_description: matchedIncomingItem.productDescription,
          qty: matchedIncomingItem.qty,
          make: matchedIncomingItem.make,
          uom: matchedIncomingItem.uom,
          leadProductTypeId: matchedIncomingItem.leadProductTypeId,
          supply_rate: matchedIncomingItem.supplyRate, // Correctly map camelCase from selector to snake_case for internal state
          installation_rate: matchedIncomingItem.installationRate, // Correctly map camelCase from selector to snake_case for internal state
          supply_amount: matchedIncomingItem.supplyAmount, // Correctly map camelCase from selector to snake_case for internal state
          installation_amount: matchedIncomingItem.installationAmount, // Correctly map camelCase from selector to snake_case for internal state
          total: matchedIncomingItem.total,
          categoryInfo: matchedIncomingItem.categoryInfo,
          // Approval statuses should remain as they are, unless explicitly updated by the selector (which it doesn't for these fields)
        })
        processedIncomingIds.add(matchedIncomingItem.id)
      }
      // If not matched, it means it was removed from the BillableProductSelector, so we don't push it.
      // If we wanted to keep removed items, we'd push existingBOQItem here.
    })

    // 2. Add new BOQ items from the selector's output
    incomingItems.forEach((incomingItem) => {
      // If it's a new item (id is null or not yet processed)
      if (incomingItem.id === null || !processedIncomingIds.has(incomingItem.id)) {
        updatedBOQProducts.push({
          id: null, // Ensure new items have null ID for backend
          product_id: incomingItem.productId, // ProductsMaster ID
          product_name: incomingItem.productName,
          hsn_code: incomingItem.hsnCode,
          product_description: incomingItem.productDescription,
          qty: incomingItem.qty,
          make: incomingItem.make,
          uom: incomingItem.uom,
          leadProductTypeId: incomingItem.leadProductTypeId,
          supply_rate: incomingItem.supplyRate, // Correctly map camelCase from selector to snake_case for internal state
          installation_rate: incomingItem.installationRate, // Correctly map camelCase from selector to snake_case for internal state
          supply_amount: incomingItem.supplyAmount, // Correctly map camelCase from selector to snake_case for internal state
          installation_amount: incomingItem.installationAmount, // Correctly map camelCase from selector to snake_case for internal state
          total: incomingItem.total,
          categoryInfo: incomingItem.categoryInfo,
          // Default approval statuses for new items
          pmApprovalStatus: "APPROVED",
          salestlApprovalStatus: "PENDING",
          pmApprovalRemarks: "",
          salestlApprovalRemarks: "",
          pmApprovalDate: new Date().toISOString(),
          salestlApprovalDate: null,
          // New items start with empty non-billable, skillSet, tools, MTRs
          nonBillable: [],
          skillSet: [],
          tools: [],
          materialRequisitions: [],
        })
      }
    })

    setBOQProducts(updatedBOQProducts)
    setShowAddProductModal(false)
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
        {/* ... existing header code ... */}

        <div className="flex-1 overflow-auto p-6">
          {boqProducts.length > 0 ? (
            <>
              {getProductsByLeadProductType().map((productTypeGroup) => (
                <div key={productTypeGroup.id} className="border rounded-lg bg-white shadow-sm">
                  <AnimatePresence>
                    {expandedProductTypes[productTypeGroup.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 space-y-4">
                          {productTypeGroup.products.map((product) => (
                            <div key={product.id} className="border rounded-lg bg-gray-50">
                              <AnimatePresence>
                                {expandedProducts[product.id] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-4">
                                      {/* ... existing tab buttons ... */}

                                      <div className="min-h-[300px]">
                                        {/* ... existing billable tab ... */}

                                        {selectedProductTab[product.id] === "nonBillable" && (
                                          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                            {/* ... existing header ... */}

                                            <div className="space-y-2">
                                              {(product.nonBillable || []).map((item, index) => (
                                                <div
                                                  key={item.id || `nb-${index}`}
                                                  className="bg-white p-3 rounded border flex items-center justify-between"
                                                >
                                                  <div className="flex-1">
                                                    <div className="font-medium">{item.product_name}</div>
                                                    <div className="text-sm text-gray-500">
                                                      Qty: {item.qty || 0} | Make: {item.make || "N/A"} | MTRs:{" "}
                                                      {(item.materialRequisitions || []).length}
                                                    </div>
                                                    <div className="mt-2">
                                                      <ApprovalStatusBadge
                                                        status={item.pmApprovalStatus || "PENDING"}
                                                        type="PM"
                                                        productId={product.id}
                                                        remarks={item.pmApprovalRemarks}
                                                        approvalDate={item.pmApprovalDate}
                                                        category="nonBillable"
                                                        categoryIndex={index}
                                                      />
                                                    </div>
                                                  </div>
                                                  {/* ... existing buttons ... */}
                                                </div>
                                              ))}
                                              {/* ... existing empty state ... */}
                                            </div>
                                          </div>
                                        )}

                                        {selectedProductTab[product.id] === "skillSet" && (
                                          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                            {/* ... existing header ... */}

                                            <div className="space-y-2">
                                              {(product.skillSet || []).map((item, index) => (
                                                <div
                                                  key={item.id || `ss-${index}`}
                                                  className="bg-white p-3 rounded border flex items-center justify-between"
                                                >
                                                  <div className="flex-1">
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-sm text-gray-500">
                                                      Qty: {item.qty || 0} | MTRs:{" "}
                                                      {(item.materialRequisitions || []).length}
                                                    </div>
                                                    <div className="mt-2">
                                                      <ApprovalStatusBadge
                                                        status={item.pmApprovalStatus || "PENDING"}
                                                        type="PM"
                                                        productId={product.id}
                                                        remarks={item.pmApprovalRemarks}
                                                        approvalDate={item.pmApprovalDate}
                                                        category="skillSet"
                                                        categoryIndex={index}
                                                      />
                                                    </div>
                                                  </div>
                                                  {/* ... existing buttons ... */}
                                                </div>
                                              ))}
                                              {/* ... existing empty state ... */}
                                            </div>
                                          </div>
                                        )}

                                        {selectedProductTab[product.id] === "tools" && (
                                          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                            {/* ... existing header ... */}

                                            <div className="space-y-2">
                                              {(product.tools || []).map((item, index) => (
                                                <div
                                                  key={item.id || `tool-${index}`}
                                                  className="bg-white p-3 rounded border flex items-center justify-between"
                                                >
                                                  <div className="flex-1">
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-sm text-gray-500">
                                                      Qty: {item.qty || 0} | Make: {item.make || "N/A"} | MTRs:{" "}
                                                      {(item.materialRequisitions || []).length}
                                                    </div>
                                                    <div className="mt-2">
                                                      <ApprovalStatusBadge
                                                        status={item.pmApprovalStatus || "PENDING"}
                                                        type="PM"
                                                        productId={product.id}
                                                        remarks={item.pmApprovalRemarks}
                                                        approvalDate={item.pmApprovalDate}
                                                        category="tools"
                                                        categoryIndex={index}
                                                      />
                                                    </div>
                                                  </div>
                                                  {/* ... existing buttons ... */}
                                                </div>
                                              ))}
                                              {/* ... existing empty state ... */}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center text-gray-500 p-6">No products added yet.</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {showAddProductModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <BillableProductSelector
                projectId={projectId}
                existingBOQ={existingBOQ}
                onClose={() => setShowAddProductModal(false)}
                onSave={handleBillableProductSave}
              />
            </div>
          </div>
        )}

        {showChangesSummary && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-bold">Changes Summary</h3>
                <button onClick={() => setShowChangesSummary(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <FiX />
                </button>
              </div>
              <div className="p-4 overflow-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-2">Product</th>
                      <th className="pb-2">Total Qty</th>
                      <th className="pb-2">Installed Qty</th>
                      <th className="pb-2">Remaining Qty</th>
                      <th className="pb-2">UOM</th>
                      <th className="pb-2">Make</th>
                      <th className="pb-2">MTRs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changesSummary.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{item.productName}</td>
                        <td className="py-2">{item.totalQty}</td>
                        <td className="py-2">{item.installedQty}</td>
                        <td className="py-2">{item.remainingQty}</td>
                        <td className="py-2">{item.uom}</td>
                        <td className="py-2">{item.make}</td>
                        <td className="py-2">{item.materialRequisitionsCount}</td>
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
                  Close
                </button>
                <button onClick={saveChanges} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Confirm & Save
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
            projectCode={projectCode}
            onClose={() => setEditingProductModal(null)}
            onSave={() => {}}
          />
        )}

        {showApprovalModal && (
          <ApprovalModal
            productId={showApprovalModal.productId}
            type={showApprovalModal.type}
            currentStatus={showApprovalModal.currentStatus}
            currentRemarks={showApprovalModal.currentRemarks}
            category={showApprovalModal.category}
            categoryIndex={showApprovalModal.categoryIndex}
            onClose={() => setShowApprovalModal(null)}
            onSave={() => {}}
          />
        )}
      </motion.div>
    </motion.div>
  )
}
export default BOQEditComponent