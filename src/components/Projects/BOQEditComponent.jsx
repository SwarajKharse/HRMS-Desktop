"use client"

import { useState, useEffect, useRef } from "react"
import { FiX, FiPlus, FiTrash2, FiSearch, FiCheck, FiClock, FiAlertTriangle, FiEdit3 } from "react-icons/fi"
import { AiOutlineArrowDown, AiOutlineArrowUp } from "react-icons/ai"
import { motion, AnimatePresence } from "framer-motion"
import BillableProductSelector from "./BillableProductSelector" // Ensure this path is correct
import { storeService } from "../../services/storeService"
import { projectService } from "../../services/projectService"
import { leadService } from "../../services/leadService"

function BOQEditComponent({
  projectId,
  projectPlanId,
  projectPlanType,
  onSaveSuccess,
  onCancel,
  projectName,
  existingBOQ,
  onSave,
  onClose,
}) {
  const [boqData, setBoqData] = useState(null)
  const [loading, setLoading] = useState(true) // This will now represent overall loading
  const [error, setError] = useState("")
  const [isEditMode, setIsEditMode] = useState(false)
  const [leadProductTypes, setLeadProductTypes] = useState([])
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [boqProducts, setBOQProducts] = useState([])
  const [availableSkillsets, setAvailableSkillsets] = useState([])
  const [availableTools, setAvailableTools] = useState([])
  const [availableProducts, setAvailableProducts] = useState([])
  const [expandedProducts, setExpandedProducts] = useState({})
  const [expandedProductTypes, setExpandedProductTypes] = useState({})
  const [selectedProductTab, setSelectedProductTab] = useState({})
  const [expandedMTRForms, setExpandedMTRForms] = useState({})
  const [searchTerms, setSearchTerms] = useState({})
  const [showProductSearch, setShowProductSearch] = useState({})
  const [showChangesSummary, setShowChangesSummary] = useState(false)
  const [changesSummary, setChangesSummary] = useState([])
  const [editingProductModal, setEditingProductModal] = useState(null)
  const [showApprovalModal, setShowApprovalModal] = useState(null)
  const [isBOQInitializedFromProps, setIsBOQInitializedFromProps] = useState(false)
  const [projectInitiationDate, setProjectInitiationDate] = useState("")
  const [editingBillableMTR, setEditingBillableMTR] = useState(null)

  const cleanProjectCode = (name) => {
    return name ? name.replace(/[^a-zA-Z0-9]/g, "") : ""
  }

  // Helper to extract category info, now more robust
  const extractCategoryInfo = (product, allLeadProductTypes) => {
    let topCategoryLabel = "Unassigned"
    let mainCategoryName = "Uncategorized"
    let subCategoryName = "Uncategorized"
    let leadProductTypeId = null

    // Prioritize leadProductTypeId from the product itself (if already processed)
    if (product?.leadProductTypeId) {
      leadProductTypeId = product.leadProductTypeId
    }
    // Try to get leadProductTypeId from product.categoryId (from existing BOQ item.product)
    else if (product?.categoryId?.id) {
      leadProductTypeId = product.categoryId.id
      mainCategoryName = product.categoryId.productCategory?.category_name || "Uncategorized"
      subCategoryName = product.categoryId.category_name || "Uncategorized"
    }
    // Try to get leadProductTypeId from product.category_id (from storeService products)
    else if (product?.category_id?.productCategory?.mainGroup?.id) {
      leadProductTypeId = product.category_id.productCategory.mainGroup.id
      mainCategoryName = product.category_id.productCategory.category_name || "Uncategorized"
      subCategoryName = product.category_id.category_name || "Uncategorized"
    }

    if (leadProductTypeId) {
      topCategoryLabel = allLeadProductTypes.find((t) => t.id === leadProductTypeId)?.label || "Unassigned"
    }

    return {
      topCategory: topCategoryLabel,
      mainCategory: mainCategoryName,
      subCategory: subCategoryName,
      fullPath: `${topCategoryLabel} > ${mainCategoryName} > ${subCategoryName}`,
    }
  }

  // Combined useEffect for all initial data fetching
  useEffect(() => {
    const loadAllInitialData = async () => {
      setLoading(true)
      setError("")
      try {
        // Fetch other dependencies concurrently first
        const [leadProductTypesResponse, skillsetsResponse, toolsResponse, allProductsResponse] = await Promise.all([
          leadService.getLeadProductTypeList(),
          storeService.getSkillSetList(),
          storeService.getToolsList(),
          storeService.getProductsList(),
        ])

        // Process lead product types
        let productTypesData = []
        if (Array.isArray(leadProductTypesResponse)) {
          productTypesData = leadProductTypesResponse
        } else if (leadProductTypesResponse && Array.isArray(leadProductTypesResponse.data)) {
          productTypesData = leadProductTypesResponse.data
        } else if (leadProductTypesResponse && Array.isArray(leadProductTypesResponse.leadProductTypes)) {
          productTypesData = leadProductTypesResponse.leadProductTypes
        } else if (leadProductTypesResponse && typeof leadProductTypesResponse === "object") {
          const arrayProperty = Object.values(leadProductTypesResponse).find((value) => Array.isArray(value))
          if (arrayProperty) {
            productTypesData = arrayProperty
          }
        }
        setLeadProductTypes(productTypesData)

        // Process skillsets
        let skillsetsData = []
        if (Array.isArray(skillsetsResponse)) {
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

        // Process tools
        let toolsData = []
        if (Array.isArray(toolsResponse)) {
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

        // Process all products for non-billable
        let productsData = []
        if (Array.isArray(allProductsResponse)) {
          productsData = allProductsResponse
        } else if (allProductsResponse && Array.isArray(allProductsResponse.data)) {
          productsData = allProductsResponse.data
        } else if (allProductsResponse && Array.isArray(allProductsResponse.products)) {
          productsData = allProductsResponse.products
        } else if (allProductsResponse && typeof allProductsResponse === "object") {
          const arrayProperty = Object.values(allProductsResponse).find((value) => Array.isArray(value))
          if (arrayProperty) {
            productsData = arrayProperty
          }
        }
        setAvailableProducts(productsData)

        // Now fetch BOQ data, using the fetched productTypesData
        if (projectId && projectPlanId) {
          const boqResponse = await projectService.getProjectPlanBOQ(projectId, projectPlanId)
          console.log("Fetched BOQ Data:", boqResponse)
          if (boqResponse && boqResponse.items) {
            const formattedItems = boqResponse.items.map((item) => {
              const product = item.product || {}
              const materialRequisitions = (item.mtrs || []).map((mtr) => ({
                id: mtr.id,
                mtrQty: mtr.mtrQty || 0,
                stockAlloted: mtr.stockAlloted || 0,
                purchaseMTR: mtr.purchaseMTR || 0,
                dcQty: mtr.dcQty || 0,
                remarks: mtr.remarks || mtr.notes || "",
                status: mtr.status || "Pending",
                expectedDeliveryDate: mtr.expectedDeliveryDate || "",
                priority: mtr.priority || "MEDIUM",
                mtrCode: mtr.mtrCode || "",
              }))
              const nonBillable = (item.nonBillableItems || []).map((nb) => ({
                ...nb,
                id: nb.id,
                productName: nb.productName || "Unknown",
                qty: nb.qty || 0,
                make: nb.make || "",
                uom: nb.uom || "",
                materialRequisitions: (nb.materialRequisitions || []).map((mtr) => ({
                  id: mtr.id,
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
                id: ss.id,
                productName: ss.productName || "Unknown Skillset",
                qty: ss.qty || 0,
                materialRequisitions: (ss.materialRequisitions || []).map((mtr) => ({
                  id: mtr.id,
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
                id: t.id,
                productName: t.productName || "Unknown Tool",
                qty: t.qty || 0,
                make: t.make || "",
                materialRequisitions: (t.materialRequisitions || []).map((mtr) => ({
                  id: mtr.id,
                  mtrQty: mtr.mtrQty || 0,
                  stockAlloted: mtr.stockAlloted || 0,
                  purchaseMTR: mtr.purchaseMTR || 0,
                  dcQty: t.dcQty || 0,
                  remarks: t.remarks || "",
                  status: t.status || "Pending",
                  expectedDeliveryDate: t.expectedDeliveryDate || "",
                  priority: mtr.priority || "MEDIUM",
                  mtrCode: mtr.mtrCode || "",
                })),
              }))

              // Determine leadProductTypeId and label for existing items
              const currentLeadProductTypeId = item.leadProductTypeId || product.categoryId?.id
              const currentLeadProductTypeLabel =
                productTypesData.find((t) => t.id === currentLeadProductTypeId)?.label || "Unassigned"

              return {
                id: item.id, // BOQItem.id
                productId: product.id, // ProductsMaster.id (renamed from product_id for consistency with BillableProductSelector output)
                product_name: product.productName,
                hsn_code: product.hsnCode,
                product_description: product.productDescription,
                qty: item.totalQty, // Use totalQty from BOQ item
                make: item.make,
                uom: item.uom, // Use uom from BOQ item
                leadProductTypeId: currentLeadProductTypeId,
                leadProductTypeLabel: currentLeadProductTypeLabel, // Ensure label is stored
                supplyRate: item.supplyRate,
                installationRate: item.installationRate,
                supplyAmount: item.supplyAmount,
                installationAmount: item.installationAmount,
                total: item.total,
                pmApprovalStatus: item.pmApprovalStatus,
                salestlApprovalStatus: item.salestlApprovalStatus,
                pmApprovalRemarks: item.pmApprovalRemarks,
                salestlApprovalRemarks: item.salestlApprovalRemarks,
                pmApprovalDate: item.pmApprovalDate,
                salestlApprovalDate: item.salestlApprovalDate,
                nonBillable: nonBillable,
                skillSet: skillSet,
                tools: tools,
                materialRequisitions: materialRequisitions,
                category_id: currentLeadProductTypeId, // Redundant, but keeping for consistency
                categoryInfo: extractCategoryInfo(product, productTypesData),
                isExisting: true,
                isNewBoqItem: false,
              }
            })
            setBoqData({ ...boqResponse, items: formattedItems }) // This boqData is passed to BillableProductSelector
            setBOQProducts(formattedItems) // This is the main state for display
            setIsEditMode(true)
          } else {
            setBoqData(null)
            setIsEditMode(false)
          }
        } else {
          setBoqData(null)
          setIsEditMode(false)
        }

        // Initialize boqProducts from existingBOQ after all data is fetched
        if (existingBOQ && existingBOQ.items && Array.isArray(existingBOQ.items) && !isBOQInitializedFromProps) {
          const formattedProducts = existingBOQ.items.map((item) => {
            const product = item.product || {}
            const materialRequisitions = (item.mtrs || []).map((mtr) => ({
              id: mtr.id,
              mtrQty: mtr.mtrQty || 0,
              stockAlloted: mtr.stockAlloted || 0,
              purchaseMTR: mtr.purchaseMTR || 0,
              dcQty: mtr.dcQty || 0,
              remarks: mtr.remarks || mtr.notes || "",
              status: mtr.status || "Pending",
              expectedDeliveryDate: mtr.expectedDeliveryDate || "",
              priority: mtr.priority || "MEDIUM",
              mtrCode: mtr.mtrCode || "",
            }))
            const nonBillable = (item.nonBillableItems || []).map((nb) => ({
              ...nb,
              id: nb.id,
              productName: nb.productName || "Unknown",
              qty: nb.qty || 0,
              make: nb.make || "",
              uom: nb.uom || "",
              materialRequisitions: (nb.materialRequisitions || []).map((mtr) => ({
                id: mtr.id,
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
              id: ss.id,
              productName: ss.productName || "Unknown Skillset",
              qty: ss.qty || 0,
              materialRequisitions: (ss.materialRequisitions || []).map((mtr) => ({
                id: mtr.id,
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
              id: t.id,
              productName: t.productName || "Unknown Tool",
              qty: t.qty || 0,
              make: t.make || "",
              materialRequisitions: (t.materialRequisitions || []).map((mtr) => ({
                id: mtr.id,
                mtrQty: mtr.mtrQty || 0,
                stockAlloted: mtr.stockAlloted || 0,
                purchaseMTR: mtr.purchaseMTR || 0,
                dcQty: t.dcQty || 0, // Corrected from t.remarks to t.dcQty
                remarks: t.remarks || "",
                status: t.status || "Pending",
                expectedDeliveryDate: t.expectedDeliveryDate || "",
                priority: mtr.priority || "MEDIUM",
                mtrCode: mtr.mtrCode || "",
              })),
            }))

            const currentLeadProductTypeId = item.leadProductTypeId || product.categoryId?.id
            const currentLeadProductTypeLabel =
              productTypesData.find((t) => t.id === currentLeadProductTypeId)?.label || "Unassigned"

            const formattedItem = {
              id: item.id,
              productId: product.id || 0,
              product_name: product.productName || product.product_name || product.name || "Unknown Product",
              hsn_code: product.hsnCode || product.hsn_code || "",
              product_description: product.productDescription || product.product_description || "",
              qty: item.totalQty || 0,
              make: item.make || "",
              uom: item.uom || product.uom || "",
              leadProductTypeId: currentLeadProductTypeId,
              leadProductTypeLabel: currentLeadProductTypeLabel, // Ensure label is stored
              pmApprovalStatus: item.pmApprovalStatus || "PENDING",
              salestlApprovalStatus: item.salestlApprovalStatus || "PENDING",
              pmApprovalRemarks: item.pmApprovalRemarks || "",
              salestlApprovalRemarks: item.salestlApprovalRemarks || "",
              pmApprovalDate: item.pmApprovalDate || null,
              salestlApprovalDate: item.salestlApprovalDate || null,
              nonBillable: nonBillable,
              skillSet: skillSet,
              tools: tools,
              materialRequisitions: materialRequisitions,
              category_id: currentLeadProductTypeId,
              categoryInfo: extractCategoryInfo(product, productTypesData),
              supply_rate: item.supplyRate || 0,
              installation_rate: item.installationRate || 0,
              supply_amount: item.supplyAmount || 0,
              installation_amount: item.installationAmount || 0,
              total: item.total,
              isNewBoqItem: false,
            }
            return formattedItem
          })
          setBOQProducts(formattedProducts)
          if (formattedProducts.length > 0) {
            setExpandedProducts({ [formattedProducts[0].id]: true })
            setSelectedProductTab({ [formattedProducts[0].id]: "billable" })
          }
          setIsBOQInitializedFromProps(true)
        } else if (!existingBOQ && !isBOQInitializedFromProps) {
          setBOQProducts([])
          setIsBOQInitializedFromProps(true)
        }
      } catch (err) {
        console.error("Error loading all initial data:", err)
        setError(`Failed to load essential data: ${err.message || err}`)
        setBoqData(null)
        setBOQProducts([])
        setLeadProductTypes([])
        setAvailableSkillsets([])
        setAvailableTools([])
        setAvailableProducts([])
      } finally {
        setLoading(false)
      }
    }
    loadAllInitialData()
  }, [projectId, projectPlanId, existingBOQ, isBOQInitializedFromProps]) // Dependencies for this combined effect

  const ApprovalStatusBadge = ({ status, type, onUpdate, productId, remarks, approvalDate }) => {
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
            onClick={() => setShowApprovalModal({ productId, type, currentStatus: status, currentRemarks: remarks })}
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

  const ApprovalModal = ({ productId, type, currentStatus, currentRemarks, onClose, onSave }) => {
    const [status, setStatus] = useState(currentStatus)
    const [remarks, setRemarks] = useState(currentRemarks)

    const handleSave = async () => {
      try {
        await projectService.updateBOQItemApprovalStatus(productId, type, status, remarks) // Corrected API call
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
            <h3 className="text-xl font-bold">Edit {product?.productName || product?.name}</h3>
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
      const typeId = product.leadProductTypeId || "unassigned"
      // Prioritize the stored label, then fallback to lookup, then "Unassigned"
      const typeName =
        product.leadProductTypeLabel || leadProductTypes.find((t) => t.id === typeId)?.label || "Unassigned"
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
    setLoading(true)
    setError("")
    try {
      console.log("Attempting to save BOQ:", boqData)
      const payload = {
        projectId: projectId,
        projectPlanId: projectPlanId,
        projectPlanType: projectPlanType,
        items: boqData.items.map((item) => ({
          id: item.isExisting ? item.id : null, // Send existing BOQItem ID or null for new
          productId: item.productId, // Use productId from the item
          qty: Number.parseFloat(item.qty),
          make: item.make,
          uom: item.uom,
          leadProductTypeId: item.leadProductTypeId,
          supplyRate: Number.parseFloat(item.supplyRate),
          installationRate: Number.parseFloat(item.installationRate),
          // Backend will calculate amounts based on rates and qty, so no need to send supplyAmount, installationAmount, total
          isNewBoqItem: item.isNewBoqItem, // Flag for backend to identify new items
        })),
      }
      console.log("Sending BOQ payload to backend:", payload)
      const response = await projectService.saveProjectPlanBOQ(payload)
      console.log("BOQ Save Response:", response)

      if (response && response.status === 200) {
        onSaveSuccess("BOQ saved successfully!")
      } else {
        throw new Error(response.message || "Failed to save BOQ.")
      }

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
            id: product.isNewBoqItem ? null : product.id, // Send null if it's a new BOQ item, else its actual ID
            productId: product.productId, // Corrected field name to productId
            productName: product.product_name || "",
            hsnCode: product.hsn_code || "",
            qty: Number.parseFloat(product.qty) || 0,
            make: product.make || "",
            uom: product.uom || "",
            leadProductTypeId: product.leadProductTypeId,
            pmApprovalStatus: product.pmApprovalStatus,
            salestlApprovalStatus: product.salestlApprovalStatus,
            pmApprovalRemarks: product.pmApprovalRemarks,
            salestlApprovalRemarks: product.salestlApprovalRemarks,
            nonBillable: (product.nonBillable || []).map((item) => ({
              ...item,
              // For nonBillable, skillset, tools, the backend recreates them, so ID is not used for update
              id: null, // Ensure ID is null for new/recreated category items
              productName: item.productName, // Ensure productName is passed
              materialRequisitions: (item.materialRequisitions || []).map((mtr) => ({
                id: null, // Ensure ID is null for new/recreated category MTRs
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
            })),
            skillSet: (product.skillSet || []).map((item) => ({
              ...item,
              id: null, // Ensure ID is null for new/recreated category items
              productName: item.productName, // Ensure productName is passed (from 'name' for skillsets)
              make: null, // Skillset items do not have 'make'
              materialRequisitions: (item.materialRequisitions || []).map((mtr) => ({
                id: null, // Ensure ID is null for new/recreated category MTRs
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
            })),
            tools: (product.tools || []).map((item) => ({
              ...item,
              id: null, // Ensure ID is null for new/recreated category items
              productName: item.productName, // Ensure productName is passed (from 'name' for tools)
              materialRequisitions: (item.materialRequisitions || []).map((mtr) => ({
                id: null, // Ensure ID is null for new/recreated category MTRs
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
      const response2 = await projectService.saveBOQWithMaterialRequisition(projectId, enhancedBOQData)
      console.log("BOQ saved successfully:", response2)

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
                id: null, // New category item, ID should be null
                ...product,
                productName: product.product_name, // Ensure productName is set for nonBillable
                qty: "",
                make: category === "skillSet" ? null : "",
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
                id: null, // New skillset item, ID should be null
                ...skillset,
                productName: skillset.skillset_name, // Map skillset_name to productName for consistency
                qty: "",
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
                id: null, // New tool item, ID should be null
                ...tool,
                productName: tool.tool_name, // Map tool_name to productName for consistency
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
      [`${mainProductId}-tools`]: false,
    }))
    setSearchTerms((prev) => ({
      ...prev,
      [`${mainProductId}-tools`]: "",
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
                    id: null, // New MTR, ID should be null
                    ...mtrData,
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
                    id: null, // New category MTR, ID should be null
                    ...mtrData,
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
    console.log("Received BOQ data from BillableProductSelector:", boqDataFromSelector)

    // Create a map of existing non-billable, skillset, and tools items, keyed by their parent BOQItem.id
    // This map will store the associated data for existing BOQItems (by their BOQItem.id)
    const existingAssociatedDataMap = new Map()
    boqProducts.forEach((p) => {
      // Only consider items that have an actual BOQItem ID (i.e., existing items)
      // or temporary IDs for new items that might have associated data already
      if (p.id !== null && p.id !== undefined) {
        existingAssociatedDataMap.set(p.id, {
          nonBillable: p.nonBillable,
          skillSet: p.skillSet,
          tools: p.tools,
          materialRequisitions: p.materialRequisitions, // Also preserve billable MTRs
          pmApprovalStatus: p.pmApprovalStatus,
          salestlApprovalStatus: p.salestlApprovalStatus,
          pmApprovalRemarks: p.pmApprovalRemarks,
          salestlApprovalRemarks: p.salestlApprovalRemarks,
          pmApprovalDate: p.pmApprovalDate,
          salestlApprovalDate: p.salestlApprovalDate,
        })
      }
    })

    const updatedBOQProducts = boqDataFromSelector.items.map((item) => {
      // item.id from BillableProductSelector is BOQItem.id if existing, or a temporary ID (Date.now()) if new.
      // item.productId from BillableProductSelector is always ProductsMaster.id.
      // item.isExisting from BillableProductSelector indicates if it's an existing BOQItem.
      // item.isNewBoqItem from BillableProductSelector indicates if it's a newly added BOQ item in frontend.
      const currentBoqItemId = item.id // Use item.id as the stable key for frontend state
      const existingAssociatedData = existingAssociatedDataMap.get(currentBoqItemId)

      return {
        id: currentBoqItemId, // Use the BOQItem ID (if existing) or the temporary ID (if new) as the stable frontend ID
        productId: item.productId, // This is ProductsMaster.id
        product_name: item.productName,
        hsn_code: item.hsnCode,
        product_description: item.productDescription,
        qty: item.qty,
        make: item.make,
        uom: item.uom,
        leadProductTypeId: item.leadProductTypeId,
        leadProductTypeLabel: item.leadProductTypeLabel, // ADDED: Use the label passed from selector
        supply_rate: item.supplyRate,
        installation_rate: item.installationRate,
        supply_amount: item.supplyAmount,
        installation_amount: item.installationAmount,
        total: item.total,
        category_id: item.leadProductTypeId, // Redundant, but keeping for consistency with old code
        categoryInfo: item.categoryInfo,
        // Preserve MTRs and other categories if they exist for this product
        materialRequisitions: existingAssociatedData ? existingAssociatedData.materialRequisitions : [],
        nonBillable: existingAssociatedData ? existingAssociatedData.nonBillable : [],
        skillSet: existingAssociatedData ? existingAssociatedData.skillSet : [],
        tools: existingAssociatedData ? existingAssociatedData.tools : [],
        // Preserve approval statuses for existing items
        pmApprovalStatus: existingAssociatedData ? existingAssociatedData.pmApprovalStatus : "PENDING",
        salestlApprovalStatus: existingAssociatedData ? existingAssociatedData.salestlApprovalStatus : "PENDING",
        pmApprovalRemarks: existingAssociatedData ? existingAssociatedData.pmApprovalRemarks : "",
        salestlApprovalRemarks: existingAssociatedData ? existingAssociatedData.salestlApprovalRemarks : "",
        pmApprovalDate: existingAssociatedData ? existingAssociatedData.pmApprovalDate : null,
        salestlApprovalDate: existingAssociatedData ? existingAssociatedData.salestlApprovalDate : null,
        isNewBoqItem: item.isNewBoqItem || false, // Propagate the new flag
      }
    })
    setBOQProducts(updatedBOQProducts)
    setShowAddProductModal(false)
  }

  const handleSaveBOQ = (boqData) => {
    setBoqData(boqData)
  }

  const projectCode = projectName ? projectName.replace(/[^a-zA-Z0-9]/g, "") : ""

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-4 text-gray-600">Loading BOQ data...</p>
      </div>
    )
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
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setShowAddProductModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FiPlus size={16} />
              Edit Billable Products
            </button>
          </div>
          <div className="space-y-6">
            {boqProducts.length > 0 ? (
              <>
                {getProductsByLeadProductType().map((productTypeGroup) => (
                  <div key={productTypeGroup.id} className="border rounded-lg bg-white shadow-sm">
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-indigo-800">{productTypeGroup.name}</h3>
                          <div className="text-sm text-indigo-600 mt-1">
                            {productTypeGroup.products.length} product{productTypeGroup.products.length > 1 ? "s" : ""}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleProductTypeExpansion(productTypeGroup.id)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                        >
                          {expandedProductTypes[productTypeGroup.id] ? (
                            <AiOutlineArrowUp size={16} />
                          ) : (
                            <AiOutlineArrowDown size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedProductTypes[productTypeGroup.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4">
                            <div className="space-y-4">
                              {productTypeGroup.products.map((product, index) => (
                                <div key={product.id} className="border rounded-lg p-4 bg-gray-50 shadow-sm">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-blue-700">{product.product_name}</h4>
                                      <div className="text-sm text-gray-600 mt-1">
                                        Qty: {product.qty} {product.uom}, Make: {product.make}
                                      </div>
                                      <div className="flex items-center gap-2 mt-2">
                                        <ApprovalStatusBadge
                                          productId={product.id}
                                          type="PM"
                                          status={product.pmApprovalStatus}
                                          remarks={product.pmApprovalRemarks}
                                          approvalDate={product.pmApprovalDate}
                                          onUpdate={() => {}}
                                        />
                                        <ApprovalStatusBadge
                                          productId={product.id}
                                          type="SALESTL"
                                          status={product.salestlApprovalStatus}
                                          remarks={product.salestlApprovalRemarks}
                                          approvalDate={product.salestlApprovalDate}
                                          onUpdate={() => {}}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => toggleProductExpansion(product.id)}
                                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                      >
                                        {expandedProducts[product.id] ? (
                                          <AiOutlineArrowUp size={16} />
                                        ) : (
                                          <AiOutlineArrowDown size={16} />
                                        )}
                                      </button>
                                      <button
                                        onClick={() => {
                                          const confirmation = window.confirm(
                                            "Are you sure you want to remove this product?",
                                          )
                                          if (confirmation) {
                                            setBOQProducts((prev) => prev.filter((p) => p.id !== product.id))
                                          }
                                        }}
                                        className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                      >
                                        <FiTrash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                  <AnimatePresence>
                                    {expandedProducts[product.id] && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden mt-4"
                                      >
                                        <div className="flex items-center justify-start gap-4 mb-4">
                                          <button
                                            onClick={() => selectProductTab(product.id, "billable")}
                                            className={`px-4 py-2 rounded-full text-sm font-medium ${
                                              selectedProductTab[product.id] === "billable"
                                                ? "bg-blue-600 text-white"
                                                : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                            } transition-colors`}
                                          >
                                            Billable
                                          </button>
                                          <button
                                            onClick={() => selectProductTab(product.id, "nonBillable")}
                                            className={`px-4 py-2 rounded-full text-sm font-medium ${
                                              selectedProductTab[product.id] === "nonBillable"
                                                ? "bg-green-600 text-white"
                                                : "bg-green-100 text-green-800 hover:bg-green-200"
                                            } transition-colors`}
                                          >
                                            Non-Billable
                                          </button>
                                          <button
                                            onClick={() => selectProductTab(product.id, "skillSet")}
                                            className={`px-4 py-2 rounded-full text-sm font-medium ${
                                              selectedProductTab[product.id] === "skillSet"
                                                ? "bg-yellow-600 text-white"
                                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                            } transition-colors`}
                                          >
                                            Skillset
                                          </button>
                                          <button
                                            onClick={() => selectProductTab(product.id, "tools")}
                                            className={`px-4 py-2 rounded-full text-sm font-medium ${
                                              selectedProductTab[product.id] === "tools"
                                                ? "bg-purple-600 text-white"
                                                : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                                            } transition-colors`}
                                          >
                                            Tools
                                          </button>
                                        </div>
                                        {selectedProductTab[product.id] === "billable" && (
                                          <div className="space-y-4">
                                            <div className="flex items-center justify-between mb-3">
                                              <h5 className="font-medium">Material Requisitions</h5>
                                              <button
                                                onClick={() => {
                                                  toggleMTRForm(`${product.id}-billable`)
                                                  setEditingBillableMTR(null)
                                                }}
                                                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                              >
                                                <FiPlus size={14} />
                                                Add Material Requisition
                                              </button>
                                            </div>
                                            <MTRList
                                              materialRequisitions={product.materialRequisitions || []}
                                              onRemove={(mtrId) => {
                                                removeMTRFromProduct(product.id, "billable", null, mtrId)
                                              }}
                                              onEdit={(mtrToEdit) => {
                                                setEditingBillableMTR(mtrToEdit)
                                                setExpandedMTRForms((prev) => ({
                                                  ...prev,
                                                  [`${product.id}-billable`]: true,
                                                }))
                                              }}
                                            />
                                            <AnimatePresence>
                                              {expandedMTRForms[`${product.id}-billable`] && (
                                                <motion.div
                                                  initial={{ height: 0, opacity: 0 }}
                                                  animate={{ height: "auto", opacity: 1 }}
                                                  exit={{ height: 0, opacity: 0 }}
                                                  className="overflow-hidden"
                                                >
                                                  <MTRForm
                                                    projectCode={projectCode}
                                                    currentMTRCount={(product.materialRequisitions || []).length + 1}
                                                    initialMTRData={editingBillableMTR}
                                                    onSubmit={(mtrData) => {
                                                      handleMTRSubmit(product.id, "billable", null, mtrData)
                                                      toggleMTRForm(`${product.id}-billable`)
                                                      setEditingBillableMTR(null)
                                                    }}
                                                    onCancel={() => {
                                                      toggleMTRForm(`${product.id}-billable`)
                                                      setEditingBillableMTR(null)
                                                    }}
                                                  />
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </div>
                                        )}
                                        {selectedProductTab[product.id] === "nonBillable" && (
                                          <div className="space-y-4">
                                            <div className="flex items-center justify-between mb-3">
                                              <h5 className="font-medium">Non-Billable Products</h5>
                                              <button
                                                onClick={() =>
                                                  setShowProductSearch((prev) => ({
                                                    ...prev,
                                                    [`${product.id}-nonBillable`]: true,
                                                  }))
                                                }
                                                className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                              >
                                                <FiPlus size={14} />
                                                Add Non-Billable Product
                                              </button>
                                            </div>
                                            {showProductSearch[`${product.id}-nonBillable`] && (
                                              <div className="mb-4">
                                                <div className="relative">
                                                  <input
                                                    type="text"
                                                    placeholder="Search products..."
                                                    value={searchTerms[`${product.id}-nonBillable`] || ""}
                                                    onChange={(e) =>
                                                      setSearchTerms((prev) => ({
                                                        ...prev,
                                                        [`${product.id}-nonBillable`]: e.target.value,
                                                      }))
                                                    }
                                                    className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                                  />
                                                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <FiSearch className="text-gray-500" />
                                                  </div>
                                                </div>
                                                <div className="max-h-48 overflow-y-auto mt-2">
                                                  {getFilteredNonBillableProducts(`${product.id}-nonBillable`).map(
                                                    (availableProduct) => (
                                                      <div
                                                        key={availableProduct.id}
                                                        className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                                                        onClick={() =>
                                                          addProductToCategory(
                                                            product.id,
                                                            "nonBillable",
                                                            availableProduct,
                                                          )
                                                        }
                                                      >
                                                        {availableProduct.product_name}
                                                      </div>
                                                    ),
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                            {product.nonBillable && product.nonBillable.length > 0 ? (
                                              <div className="space-y-3">
                                                {product.nonBillable.map((nonBillableProduct, nbIndex) => (
                                                  <div
                                                    key={nonBillableProduct.id}
                                                    className="bg-gray-50 p-3 rounded border"
                                                  >
                                                    <div className="flex justify-between items-start">
                                                      <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                          <span className="text-sm font-medium text-gray-700">
                                                            {nonBillableProduct.productName}
                                                          </span>
                                                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                            Qty: {nonBillableProduct.qty}
                                                          </span>
                                                          {nonBillableProduct.make && (
                                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                                              Make: {nonBillableProduct.make}
                                                            </span>
                                                          )}
                                                        </div>
                                                        <div className="text-sm">
                                                          <button
                                                            onClick={() =>
                                                              setEditingProductModal({
                                                                productId: product.id,
                                                                category: "nonBillable",
                                                                product: nonBillableProduct,
                                                                productIndex: nbIndex,
                                                              })
                                                            }
                                                            className="text-blue-500 hover:underline"
                                                          >
                                                            Edit Details
                                                          </button>
                                                        </div>
                                                      </div>
                                                      <div className="flex items-center gap-1">
                                                        <button
                                                          onClick={() =>
                                                            removeProductFromCategory(
                                                              product.id,
                                                              "nonBillable",
                                                              nbIndex,
                                                            )
                                                          }
                                                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                                                          title="Remove product"
                                                        >
                                                          <FiX size={14} />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <div className="text-center text-gray-500 py-2 text-sm">
                                                No non-billable products added yet
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        {selectedProductTab[product.id] === "skillSet" && (
                                          <div className="space-y-4">
                                            <div className="flex items-center justify-between mb-3">
                                              <h5 className="font-medium">Skillsets</h5>
                                              <button
                                                onClick={() =>
                                                  setShowProductSearch((prev) => ({
                                                    ...prev,
                                                    [`${product.id}-skillSet`]: true,
                                                  }))
                                                }
                                                className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                                              >
                                                <FiPlus size={14} />
                                                Add Skillset
                                              </button>
                                            </div>
                                            {showProductSearch[`${product.id}-skillSet`] && (
                                              <div className="mb-4">
                                                <div className="relative">
                                                  <input
                                                    type="text"
                                                    placeholder="Search skillsets..."
                                                    value={searchTerms[`${product.id}-skillSet`] || ""}
                                                    onChange={(e) =>
                                                      setSearchTerms((prev) => ({
                                                        ...prev,
                                                        [`${product.id}-skillSet`]: e.target.value,
                                                      }))
                                                    }
                                                    className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                                  />
                                                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <FiSearch className="text-gray-500" />
                                                  </div>
                                                </div>
                                                <div className="max-h-48 overflow-y-auto mt-2">
                                                  {availableSkillsets
                                                    .filter((skillset) => {
                                                      const searchTerm = searchTerms[`${product.id}-skillSet`] || ""
                                                      if (!searchTerm.trim()) return true
                                                      const lowercasedSearch = searchTerm.toLowerCase()
                                                      return (
                                                        (skillset.skillset_name || "")
                                                          .toLowerCase()
                                                          .includes(lowercasedSearch) ||
                                                        (skillset.skillset_description || "")
                                                          .toLowerCase()
                                                          .includes(lowercasedSearch)
                                                      )
                                                    })
                                                    .map((skillset) => (
                                                      <div
                                                        key={skillset.id}
                                                        className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                                                        onClick={() => addSkillsetToProduct(product.id, skillset)}
                                                      >
                                                        {skillset.skillset_name}
                                                      </div>
                                                    ))}
                                                </div>
                                              </div>
                                            )}
                                            {product.skillSet && product.skillSet.length > 0 ? (
                                              <div className="space-y-3">
                                                {product.skillSet.map((skillset, ssIndex) => (
                                                  <div key={skillset.id} className="bg-gray-50 p-3 rounded border">
                                                    <div className="flex justify-between items-start">
                                                      <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                          <span className="text-sm font-medium text-gray-700">
                                                            {skillset.name}
                                                          </span>
                                                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                            Qty: {skillset.qty}
                                                          </span>
                                                        </div>
                                                        <div className="text-sm">
                                                          <button
                                                            onClick={() =>
                                                              setEditingProductModal({
                                                                productId: product.id,
                                                                category: "skillSet",
                                                                product: skillset,
                                                                productIndex: ssIndex,
                                                              })
                                                            }
                                                            className="text-blue-500 hover:underline"
                                                          >
                                                            Edit Details
                                                          </button>
                                                        </div>
                                                      </div>
                                                      <div className="flex items-center gap-1">
                                                        <button
                                                          onClick={() =>
                                                            removeProductFromCategory(product.id, "skillSet", ssIndex)
                                                          }
                                                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                                                          title="Remove skillset"
                                                        >
                                                          <FiX size={14} />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <div className="text-center text-gray-500 py-2 text-sm">
                                                No skillsets added yet
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        {selectedProductTab[product.id] === "tools" && (
                                          <div className="space-y-4">
                                            <div className="flex items-center justify-between mb-3">
                                              <h5 className="font-medium">Tools</h5>
                                              <button
                                                onClick={() =>
                                                  setShowProductSearch((prev) => ({
                                                    ...prev,
                                                    [`${product.id}-tools`]: true,
                                                  }))
                                                }
                                                className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                                              >
                                                <FiPlus size={14} />
                                                Add Tool
                                              </button>
                                            </div>
                                            {showProductSearch[`${product.id}-tools`] && (
                                              <div className="mb-4">
                                                <div className="relative">
                                                  <input
                                                    type="text"
                                                    placeholder="Search tools..."
                                                    value={searchTerms[`${product.id}-tools`] || ""}
                                                    onChange={(e) =>
                                                      setSearchTerms((prev) => ({
                                                        ...prev,
                                                        [`${product.id}-tools`]: e.target.value,
                                                      }))
                                                    }
                                                    className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                  />
                                                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <FiSearch className="text-gray-500" />
                                                  </div>
                                                </div>
                                                <div className="max-h-48 overflow-y-auto mt-2">
                                                  {availableTools
                                                    .filter((tool) => {
                                                      const searchTerm = searchTerms[`${product.id}-tools`] || ""
                                                      if (!searchTerm.trim()) return true
                                                      const lowercasedSearch = searchTerm.toLowerCase()
                                                      return (
                                                        (tool.tool_name || "")
                                                          .toLowerCase()
                                                          .includes(lowercasedSearch) ||
                                                        (tool.tool_description || "")
                                                          .toLowerCase()
                                                          .includes(lowercasedSearch)
                                                      )
                                                    })
                                                    .map((tool) => (
                                                      <div
                                                        key={tool.id}
                                                        className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                                                        onClick={() => addToolToProduct(product.id, tool)}
                                                      >
                                                        {tool.tool_name}
                                                      </div>
                                                    ))}
                                                </div>
                                              </div>
                                            )}
                                            {product.tools && product.tools.length > 0 ? (
                                              <div className="space-y-3">
                                                {product.tools.map((tool, tIndex) => (
                                                  <div key={tool.id} className="bg-gray-50 p-3 rounded border">
                                                    <div className="flex justify-between items-start">
                                                      <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                          <span className="text-sm font-medium text-gray-700">
                                                            {tool.name}
                                                          </span>
                                                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                            Qty: {tool.qty}
                                                          </span>
                                                          {tool.make && (
                                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                                              Make: {tool.make}
                                                            </span>
                                                          )}
                                                        </div>
                                                        <div className="text-sm">
                                                          <button
                                                            onClick={() =>
                                                              setEditingProductModal({
                                                                productId: product.id,
                                                                category: "tools",
                                                                product: tool,
                                                                productIndex: tIndex,
                                                              })
                                                            }
                                                            className="text-blue-500 hover:underline"
                                                          >
                                                            Edit Details
                                                          </button>
                                                        </div>
                                                      </div>
                                                      <div className="flex items-center gap-1">
                                                        <button
                                                          onClick={() =>
                                                            removeProductFromCategory(product.id, "tools", tIndex)
                                                          }
                                                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                                                          title="Remove tool"
                                                        >
                                                          <FiX size={14} />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <div className="text-center text-gray-500 py-2 text-sm">
                                                No tools added yet
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center text-gray-500 py-6">No products added to BOQ yet.</div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end p-6 border-t">
          <button
            onClick={handleSaveChanges}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
      {showAddProductModal && (
        <BillableProductSelector
          projectId={projectId}
          projectPlanId={projectPlanId}
          projectPlanType={projectPlanType}
          existingBOQ={boqData}
          onSave={handleSaveBOQ}
          onClose={() => setShowAddProductModal(false)}
          onBillableProductSave={handleBillableProductSave}
          leadProductTypes={leadProductTypes}
          isEditMode={true} // Pass isEditMode to BillableProductSelector
        />
      )}
      {showChangesSummary && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold">Changes Summary</h3>
              <button
                onClick={() => setShowChangesSummary(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="overflow-auto p-6">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 px-3 font-semibold text-gray-700">Product</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Make</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Total Qty</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Installed Qty</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Remaining Qty</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">UOM</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">MTRs</th>
                  </tr>
                </thead>
                <tbody>
                  {changesSummary.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-2 px-3">{item.productName}</td>
                      <td className="py-2 px-3">{item.make}</td>
                      <td className="py-2 px-3">{item.totalQty}</td>
                      <td className="py-2 px-3">{item.installedQty}</td>
                      <td className="py-2 px-3">{item.remainingQty}</td>
                      <td className="py-2 px-3">{item.uom}</td>
                      <td className="py-2 px-3">{item.materialRequisitionsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end p-6 border-t">
              <button
                onClick={saveChanges}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
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
        />
      )}
      {showApprovalModal && (
        <ApprovalModal
          productId={showApprovalModal.productId}
          type={showApprovalModal.type === "PM" ? "PM" : "SALESTL"}
          currentStatus={showApprovalModal.currentStatus}
          currentRemarks={showApprovalModal.currentRemarks}
          onClose={() => setShowApprovalModal(null)}
          onSave={() => {}}
        />
      )}
    </motion.div>
  )
}

export default BOQEditComponent