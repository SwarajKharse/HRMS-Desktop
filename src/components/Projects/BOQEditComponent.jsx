"use client"

import { useState, useEffect, useRef } from "react"
import {
  FiSearch,
  FiPlus,
  FiX,
  FiSave,
  FiEdit3,
  FiPackage,
  FiTool,
  FiUsers,
  FiCheck,
  FiClock,
  FiAlertTriangle,
  FiTrash2,
} from "react-icons/fi"
import { AiOutlineArrowDown, AiOutlineArrowUp } from "react-icons/ai"
import { motion, AnimatePresence } from "framer-motion"
import BillableProductSelector from "./BillableProductSelector"
import CreateRequisition from "./CreateRequisition"
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
  project,
  onBOQUpdate,
  readOnly = false,
}) {
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [showRequisitionModal, setShowRequisitionModal] = useState(false)
  const [boqProducts, setBOQProducts] = useState([])
  const [availableSkillsets, setAvailableSkillsets] = useState([])
  const [availableTools, setAvailableTools] = useState([])
  const [leadProductTypes, setLeadProductTypes] = useState([])
  const [availableProducts, setAvailableProducts] = useState([])
  const [expandedProducts, setExpandedProducts] = useState({})
  const [expandedProductTypes, setExpandedProductTypes] = useState({})
  const [selectedProductTab, setSelectedProductTab] = useState({})
  const [openCat, setOpenCat] = useState({})
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
  const [editingCategoryMTR, setEditingCategoryMTR] = useState(null)
  // const [showSkillSetModal, setShowSkillSetModal] = useState(false)
  // const [showToolsModal, setShowToolsModal] = useState(false)
  // const [skillSetSearchTerm, setSkillSetSearchTerm] = useState("")
  // const [toolsSearchTerm, setToolsSearchTerm] = useState("")
  // const [selectedSkillSets, setSelectedSkillSets] = useState([])
  // const [selectedTools, setSelectedTools] = useState([])

  const currentUserData = (() => {
    try { return JSON.parse(localStorage.getItem("userData")) } catch { return null }
  })()
  const userDesignation = (currentUserData?.designation?.name || "").toLowerCase()
  const canApprove =
    userDesignation.includes("project manager") ||
    userDesignation.includes("director") ||
    userDesignation.includes("vice president")

  const refetchBOQData = async () => {
    try {
      if (onBOQUpdate) {
        await onBOQUpdate()
      }
    } catch (error) {
      console.error("Error refetching BOQ data:", error)
    }
  }

  const updateCategoryItemApprovalStatus = async (productId, categoryType, itemIndex, approvalData) => {
    try {
      const { type, status, remarks } = approvalData
      const isProjectManager = currentUserId && project?.project_manager?.id === currentUserId

      const finalStatus = isProjectManager ? "APPROVED" : status
      const finalDate = finalStatus !== "PENDING" ? new Date().toISOString() : null

      // Update local state
      setBOQProducts((prev) =>
        prev.map((product) => {
          if (product.id === productId) {
            const updatedProduct = { ...product }
            const categoryItems = [...(updatedProduct[categoryType] || [])]

            if (categoryItems[itemIndex]) {
              categoryItems[itemIndex] = {
                ...categoryItems[itemIndex],
                pmApprovalStatus: finalStatus,
                pmApprovalRemarks: remarks,
                pmApprovalDate: finalDate,
              }
              updatedProduct[categoryType] = categoryItems
            }

            return updatedProduct
          }
          return product
        }),
      )

      const payload = {
        pmApprovalStatus: finalStatus,
        pmApprovalRemarks: remarks || "",
        pmApprovalDate: finalDate,
      }

      console.log("[v0] Sending category item approval update payload:", payload)

      // Use correct method signature: updateCategoryItemApprovalStatus(projectId, productId, categoryType, itemIndex, approvalData)
      await projectService.updateCategoryItemApprovalStatus(projectId, productId, categoryType, itemIndex, payload)

      setShowApprovalModal(null)

      await refetchBOQData()
    } catch (error) {
      console.error("Error updating category item approval status:", error)
      setError("Failed to update category item approval status: " + error.message)
    }
  }

  const updateMTRApprovalStatus = async (productId, categoryType, itemIndex, mtrIndex, approvalData) => {
    try {
      const { type, status, remarks } = approvalData
      const isProjectManager = currentUserId && project?.project_manager?.id === currentUserId

      const finalStatus = isProjectManager ? "APPROVED" : status
      const finalDate = finalStatus !== "PENDING" ? new Date().toISOString() : null

      // Update local state
      setBOQProducts((prev) =>
        prev.map((product) => {
          if (product.id === productId) {
            const updatedProduct = { ...product }

            if (categoryType === "billable") {
              const materialRequisitions = [...(updatedProduct.materialRequisitions || [])]
              if (materialRequisitions[mtrIndex]) {
                if (type === "PM") {
                  materialRequisitions[mtrIndex] = {
                    ...materialRequisitions[mtrIndex],
                    pmApprovalStatus: finalStatus,
                    pmApprovalRemarks: remarks,
                    pmApprovalDate: finalDate,
                  }
                } else if (type === "SALESTL") {
                  materialRequisitions[mtrIndex] = {
                    ...materialRequisitions[mtrIndex],
                    salestlApprovalStatus: finalStatus,
                    salestlApprovalRemarks: remarks,
                    salestlApprovalDate: finalDate,
                  }
                }
                updatedProduct.materialRequisitions = materialRequisitions
              }
            } else {
              const categoryItems = [...(updatedProduct[categoryType] || [])]
              if (categoryItems[itemIndex] && categoryItems[itemIndex].materialRequisitions) {
                const mtrItems = [...categoryItems[itemIndex].materialRequisitions]
                if (mtrItems[mtrIndex]) {
                  mtrItems[mtrIndex] = {
                    ...mtrItems[mtrIndex],
                    pmApprovalStatus: finalStatus,
                    pmApprovalRemarks: remarks,
                    pmApprovalDate: finalDate,
                  }
                  categoryItems[itemIndex].materialRequisitions = mtrItems
                  updatedProduct[categoryType] = categoryItems
                }
              }
            }

            return updatedProduct
          }
          return product
        }),
      )

      const payload = {}
      if (type === "PM") {
        payload.pmApprovalStatus = finalStatus
        payload.pmApprovalRemarks = remarks || ""
        payload.pmApprovalDate = finalDate
      } else if (type === "SALESTL") {
        payload.salestlApprovalStatus = finalStatus
        payload.salestlApprovalRemarks = remarks || ""
        payload.salestlApprovalDate = finalDate
      }

      console.log("[v0] Sending MTR approval update payload:", payload)

      // For billable MTRs, itemIndex is not needed (pass null or undefined)
      await projectService.updateMTRApprovalStatus(
        projectId,
        productId,
        categoryType,
        categoryType === "billable" ? null : itemIndex,
        mtrIndex,
        payload,
      )

      setShowApprovalModal(null)

      await refetchBOQData()
    } catch (error) {
      console.error("Error updating MTR approval status:", error)
      setError("Failed to update MTR approval status: " + error.message)
    }
  }

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log("[v0] Starting data fetch...")
        setLoading(true)

        // Fetch Lead Product Types
        const leadResponse = await leadService.getLeadProductTypeList()
        console.log("[v0] Lead product types response:", leadResponse)
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
        console.log("[v0] Processed lead product types:", productTypesData)
        setLeadProductTypes(productTypesData)

        // Fetch Skillsets
        const skillsetsResponse = await storeService.getSkillSets(0, 1000) // FIX: Changed getSkillsets to getSkillSets
        console.log("[v0] Skillsets response:", skillsetsResponse)
        let skillsetsData = []
        if (skillsetsResponse && Array.isArray(skillsetsResponse.content)) {
          skillsetsData = skillsetsResponse.content
        } else if (Array.isArray(skillsetsResponse)) {
          skillsetsData = skillsetsResponse
        } else if (skillsetsResponse && Array.isArray(skillsetsResponse.data)) {
          skillsetsData = skillsetsResponse.data
        } else if (skillsetsResponse && skillsetsResponse.data && Array.isArray(skillsetsResponse.data.content)) {
          skillsetsData = skillsetsResponse.data.content
        } else if (skillsetsResponse && Array.isArray(skillsetsResponse.skillsets)) {
          skillsetsData = skillsetsResponse.skillsets
        } else if (skillsetsResponse && typeof skillsetsResponse === "object") {
          const arrayProperty = Object.values(skillsetsResponse).find((value) => Array.isArray(value))
          if (arrayProperty) {
            skillsetsData = arrayProperty
          }
        }
        console.log("[v0] Processed skillsets:", skillsetsData)
        setAvailableSkillsets(skillsetsData)

        // Fetch Tools
        const toolsResponse = await storeService.getTools(0, 1000)
        console.log("[v0] Tools response:", toolsResponse)
        let toolsData = []
        if (toolsResponse && Array.isArray(toolsResponse.content)) {
          toolsData = toolsResponse.content
        } else if (Array.isArray(toolsResponse)) {
          toolsData = toolsResponse
        } else if (toolsResponse && Array.isArray(toolsResponse.data)) {
          toolsData = toolsResponse.data
        } else if (toolsResponse && toolsResponse.data && Array.isArray(toolsResponse.data.content)) {
          toolsData = toolsResponse.data.content
        } else if (toolsResponse && Array.isArray(toolsResponse.tools)) {
          toolsData = toolsResponse.tools
        } else if (toolsResponse && typeof toolsResponse === "object") {
          const arrayProperty = Object.values(toolsResponse).find((value) => Array.isArray(value))
          if (arrayProperty) {
            toolsData = arrayProperty
          }
        }
        console.log("[v0] Processed tools:", toolsData)
        setAvailableTools(toolsData)

        // Fetch All Products for Non-Billable
        const allProductsResponse = await storeService.getProductsList()
        console.log("[v0] All products response:", allProductsResponse)
        let allProductsData = []
        if (allProductsResponse && Array.isArray(allProductsResponse.content)) {
          allProductsData = allProductsResponse.content
        } else if (Array.isArray(allProductsResponse)) {
          allProductsData = allProductsResponse
        } else if (allProductsResponse && Array.isArray(allProductsResponse.data)) {
          allProductsData = allProductsResponse.data
        } else if (allProductsResponse && allProductsResponse.data && Array.isArray(allProductsResponse.data.content)) {
          allProductsData = allProductsResponse.data.content
        } else if (allProductsResponse && Array.isArray(allProductsResponse.products)) {
          allProductsData = allProductsResponse.products
        } else if (allProductsResponse && typeof allProductsResponse === "object") {
          const arrayProperty = Object.values(allProductsResponse).find((value) => Array.isArray(value))
          if (arrayProperty) {
            allProductsData = arrayProperty
          }
        }
        console.log("[v0] Processed all products:", allProductsData)
        setAvailableProducts(allProductsData)

        console.log("[v0] Data fetch completed successfully")
      } catch (err) {
        console.error("[v0] Error fetching initial data:", err)
        setError("Error fetching initial data: " + err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [])

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

  const getProductNameByReferenceId = (item, category) => {
    // If item already has a name/product_name, use it
    if (category === "nonBillable" && (item.product_name || item.productName)) {
      return item.product_name || item.productName
    }
    if (category === "skillSet" && (item.name || item.skillset_name)) {
      return item.name || item.skillset_name
    }
    if (category === "tools" && (item.name || item.tool_name)) {
      return item.name || item.tool_name
    }

    // If no name but has referenceId, look it up from available lists
    if (!item.referenceId) {
      return category === "nonBillable"
        ? "Unknown Product"
        : category === "skillSet"
          ? "Unknown Skillset"
          : "Unknown Tool"
    }

    if (category === "nonBillable") {
      const product = availableProducts.find((p) => p.id === item.referenceId)
      return product?.product_name || product?.productName || "Unknown Product"
    } else if (category === "skillSet") {
      const skillset = availableSkillsets.find((s) => s.id === item.referenceId)
      return skillset?.skillset_name || "Unknown Skillset"
    } else if (category === "tools") {
      const tool = availableTools.find((t) => t.id === item.referenceId)
      return tool?.tool_name || "Unknown Tool"
    }

    return "Unknown Item"
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
                pmApprovalStatus: mtr.pmApprovalStatus || "PENDING",
                pmApprovalRemarks: mtr.pmApprovalRemarks || "",
                pmApprovalDate: mtr.pmApprovalDate || null,
                salestlApprovalStatus: mtr.salestlApprovalStatus || "PENDING",
                salestlApprovalRemarks: mtr.salestlApprovalRemarks || "",
                salestlApprovalDate: mtr.salestlApprovalDate || null,
              }
            })

            const nonBillable = (item.nonBillableItems || []).map((nb) => ({
              ...nb,
              id: nb.id,
              product_name:
                nb.product_name || nb.productName || nb.itemDescription || nb.hsnCode || "Unknown Non-Billable Product",
              qty: nb.qty || 0,
              make: nb.make || "",
              uom: nb.uom || "",
              materialRequisitions: (nb.materialRequisitions || []).map((mtr, mtrIndex) => ({
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
                pmApprovalStatus: mtr.pmApprovalStatus || "PENDING",
                pmApprovalRemarks: mtr.pmApprovalRemarks || "",
                pmApprovalDate: mtr.pmApprovalDate || null,
                salestlApprovalStatus: mtr.salestlApprovalStatus || "PENDING",
                salestlApprovalRemarks: mtr.salestlApprovalRemarks || "",
                salestlApprovalDate: mtr.salestlApprovalDate || null,
              })),
            }))

            const skillSet = (item.skillSetItems || []).map((ss) => ({
              ...ss,
              id: ss.id,
              name: ss.name || ss.skillset_name || ss.itemDescription || "Unknown Skillset",
              skillset_name: ss.skillset_name || ss.name || ss.itemDescription,
              qty: ss.qty || 0,
              materialRequisitions: (ss.materialRequisitions || []).map((mtr, mtrIndex) => ({
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
                pmApprovalStatus: mtr.pmApprovalStatus || "PENDING",
                pmApprovalRemarks: mtr.pmApprovalRemarks || "",
                pmApprovalDate: mtr.pmApprovalDate || null,
                salestlApprovalStatus: mtr.salestlApprovalStatus || "PENDING",
                salestlApprovalRemarks: mtr.salestlApprovalRemarks || "",
                salestlApprovalDate: mtr.salestlApprovalDate || null,
              })),
            }))

            const tools = (item.toolsItems || []).map((tool) => ({
              ...tool,
              id: tool.id,
              name: tool.name || tool.tool_name || tool.itemDescription || "Unknown Tool",
              tool_name: tool.tool_name || tool.name || tool.itemDescription,
              qty: tool.qty || 0,
              make: tool.make || "",
              materialRequisitions: (tool.materialRequisitions || []).map((mtr, mtrIndex) => ({
                id: mtr.id,
                mtrQty: mtr.mtrQty || 0,
                stockAlloted: mtr.stockAlloted || 0,
                purchaseMTR: mtr.purchaseMTR || 0,
                dcQty: tool.dcQty || 0,
                remarks: mtr.remarks || "",
                status: mtr.status || "Pending",
                expectedDeliveryDate: mtr.expectedDeliveryDate || "",
                priority: mtr.priority || "MEDIUM",
                mtrCode: mtr.mtrCode || "",
                pmApprovalStatus: mtr.pmApprovalStatus || "PENDING",
                pmApprovalRemarks: mtr.pmApprovalRemarks || "",
                pmApprovalDate: mtr.pmApprovalDate || null,
                salestlApprovalStatus: mtr.salestlApprovalStatus || "PENDING",
                salestlApprovalRemarks: mtr.salestlApprovalRemarks || "",
                salestlApprovalDate: mtr.salestlApprovalDate || null,
              })),
            }))

            const formattedItem = {
              id: item.id, // CRITICAL CHANGE: Use item.id directly for existing BOQ items
              product_id: product.id || 0, // This is the ProductsMaster ID
              product_name: product.productName || product.product_name || product.name || "Unknown Product", // Prioritize productName
              hsn_code: product.hsnCode || product.hsn_code || "",
              product_description: product.productDescription || product.product_description || "",
              qty: item.totalQty || 0,
              make: item.make || "",
              uom: item.uom || "",
              remarks: item.remarks || "",
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
    categoryType,
    itemIndex,
    mtrIndex,
    remarks,
    approvalDate,
    isMTR = false,
    readOnly = false, // Added readOnly prop for SalesTL approval
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

    const getType = (type) => {
      console.log("Category Type is" + type)
      if (type === "PM") {
        console.log("PM--------")
        return "PM"
      } else {
        return "Sales TL"
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

    const handleClick = () => {
      if (readOnly) return

      if (isMTR) {
        setShowApprovalModal({
          productId,
          categoryType,
          itemIndex,
          mtrIndex,
          type: "PM", // MTRs are only PM approved in this context
          currentStatus: status,
          currentRemarks: remarks,
          isMTR: true,
        })
      } else if (categoryType) {
        setShowApprovalModal({
          productId,
          categoryType,
          itemIndex,
          type: "PM", // Non-billable, Skillset, Tools only PM approved in this context
          currentStatus: status,
          currentRemarks: remarks,
          isMTR: false,
        })
      } else {
        setShowApprovalModal({
          productId,
          type: "PM", // Billable product PM approval
          currentStatus: status,
          currentRemarks: remarks,
        })
      }
    }

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">{getType(type)} Approval:</span>
          {readOnly ? (
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                status,
              )}`}
            >
              {getStatusIcon(status)}
              {status}
            </div>
          ) : (
            <button
              onClick={handleClick}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                status,
              )} hover:opacity-80 transition-opacity`}
            >
              {getStatusIcon(status)}
              {status}
            </button>
          )}
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
    categoryType,
    itemIndex,
    mtrIndex,
    type, // "PM" or "SALESTL"
    currentStatus,
    currentRemarks,
    onClose,
    onSave,
    isMTR = false,
  }) => {
    const [status, setStatus] = useState(currentStatus)
    const [remarks, setRemarks] = useState(currentRemarks)

    const handleSave = async () => {
      try {
        if (isMTR) {
          // Updating MTR approval status
          await updateMTRApprovalStatus(productId, categoryType, itemIndex, mtrIndex, { type: "PM", status, remarks })
        } else if (categoryType) {
          // Updating Non-Billable, SkillSet, Tools item approval status
          await updateCategoryItemApprovalStatus(productId, categoryType, itemIndex, { type: "PM", status, remarks })
        } else {
          // Updating Billable product approval status (PM or SALESTL)
          const approvalDetails = {
            approvalType: type, // "PM" or "SALESTL"
            statusValue: status, // "APPROVED", "REJECTED", "PENDING"
            remarks: remarks || "",
          }

          console.log("[v0] Sending billable product approval update:", approvalDetails)

          // Use correct method signature: updateBOQItemApprovalStatus(boqItemId, approvalDetails)
          await projectService.updateBOQItemApprovalStatus(productId, approvalDetails)

          // Update local state for billable product approval
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
        onClose()
      } catch (error) {
        console.error("Failed to update approval status:", error)
        setError("Failed to update approval status: " + error.message)
      }
    }

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-bold">
              Update {type} Approval Status {isMTR ? "(MTR)" : categoryType ? `(${categoryType})` : ""}
            </h3>
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
                className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows="3"
                placeholder="Enter approval remarks..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Save
              </button>
            </div>
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
  const MTRList = ({ materialRequisitions, onRemove, onEdit, productId, categoryType, itemIndex }) => {
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
                  {/* <div>
                    <span className="text-gray-600">DC Qty:</span>
                    <span className="ml-1 font-medium">{mtr.dcQty}</span>
                  </div> */}
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

                {categoryType === "billable" && (
                  <div className="mt-3 p-2 bg-white rounded-lg border border-gray-200">
                    <div className="flex gap-4">
                      {/* PM Approval - editable */}
                      <ApprovalStatusBadge
                        status={mtr.pmApprovalStatus || "PENDING"}
                        productId={productId}
                        type="PM"
                        categoryType={categoryType}
                        itemIndex={itemIndex}
                        mtrIndex={index}
                        remarks={mtr.pmApprovalRemarks}
                        approvalDate={mtr.pmApprovalDate}
                        onUpdate={updateMTRApprovalStatus}
                        isMTR={true}
                      />

                      {/* SalesTL Approval - read only */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-600">SalesTL Approval:</span>
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                              mtr.salestlApprovalStatus === "APPROVED"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : mtr.salestlApprovalStatus === "REJECTED"
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200"
                            }`}
                          >
                            {mtr.salestlApprovalStatus === "APPROVED" && <FiCheck size={14} />}
                            {mtr.salestlApprovalStatus === "REJECTED" && <FiX size={14} />}
                            {mtr.salestlApprovalStatus === "PENDING" && <FiClock size={14} />}
                            {mtr.salestlApprovalStatus}
                          </div>
                        </div>
                        {mtr.salestlApprovalRemarks && (
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Remarks111111:</span> {mtr.salestlApprovalRemarks}
                          </div>
                        )}
                        {mtr.salestlApprovalDate && (
                          <div className="text-xs text-gray-500">
                            {new Date(mtr.salestlApprovalDate).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
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
    // const [editingCategoryMTR, setEditingCategoryMTR] = useState(null) // Moved to parent component state

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

    const handleQtyChange = (value) => {
      setLocalData((prev) => ({ ...prev, qty: value }))
    }

    const handleMakeChange = (value) => {
      if (category !== "skillSet") {
        setLocalData((prev) => ({ ...prev, make: value }))
      }
    }

    const handleSave = () => {
      updateCategoryProduct(productId, category, productIndex, "qty", localData.qty)
      if (category !== "skillSet") {
        updateCategoryProduct(productId, category, productIndex, "make", localData.make)
      }
      onClose()
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

              
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Save
            </button>
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
          return {
            id: typeof product.id === "number" ? product.id : null,
            productId: product.product_id?.toString() || "",
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
            pmApprovalDate: product.pmApprovalDate,
            salestlApprovalDate: product.salestlApprovalDate,
            supplyRate: Number.parseFloat(product.supply_rate || 0),
            installationRate: Number.parseFloat(product.installation_rate || 0),
            supplyAmount: Number.parseFloat(product.supply_amount || 0),
            installationAmount: Number.parseFloat(product.installation_amount || 0),
            total: Number.parseFloat(product.total || 0),
            nonBillable: (product.nonBillable || []).map((item) => ({
              ...item,
              id: typeof item.id === "number" ? item.id : null,
              materialRequisitions: (item.materialRequisitions || []).map((mtr) => ({
                ...mtr,
                id: typeof mtr.id === "number" ? mtr.id : null,
              })),
            })),
            skillSet: (product.skillSet || []).map((item) => ({
              ...item,
              id: typeof item.id === "number" ? item.id : null,
              make: null,
              materialRequisitions: (item.materialRequisitions || []).map((mtr) => ({
                ...mtr,
                id: typeof mtr.id === "number" ? mtr.id : null,
              })),
            })),
            tools: (product.tools || []).map((item) => ({
              ...item,
              id: typeof item.id === "number" ? item.id : null,
              materialRequisitions: (item.materialRequisitions || []).map((mtr) => ({
                ...mtr,
                id: typeof mtr.id === "number" ? mtr.id : null,
              })),
            })),
            // installmentData: installmentData, // This seems to be an old/alternative way of sending MTRs
            materialRequisitions: (product.materialRequisitions || []).map((mtr) => ({
              id: null, // CRITICAL: Always send null for MTR IDs as backend recreates them
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
    const mainProduct = boqProducts.find((p) => p.id === mainProductId)
    const newIndex = (mainProduct?.nonBillable || []).length
    const newItem = {
      id: null,
      referenceId: product.id,
      product_name: product.product_name || product.productName || product.name,
      productName: product.product_name || product.productName || product.name,
      hsn_code: product.hsn_code || product.hsnCode,
      item_code: product.item_code,
      qty: "",
      make: "",
      materialRequisitions: [],
      sequenceNumber: Date.now(),
      pmApprovalStatus: canApprove ? "APPROVED" : "PENDING",
      pmApprovalRemarks: "",
      pmApprovalDate: canApprove ? new Date().toISOString() : null,
      salestlApprovalStatus: "PENDING",
      salestlApprovalRemarks: "",
      salestlApprovalDate: null,
    }
    setBOQProducts((prev) =>
      prev.map((p) => (p.id === mainProductId ? { ...p, nonBillable: [...(p.nonBillable || []), newItem] } : p)),
    )
    setShowProductSearch((prev) => ({ ...prev, [`${mainProductId}-nonBillable`]: false }))
    setSearchTerms((prev) => ({ ...prev, [`${mainProductId}-nonBillable`]: "" }))
    setEditingProductModal({ product: newItem, productId: mainProductId, category: "nonBillable", productIndex: newIndex, projectCode })
  }

  const addSkillsetToProduct = (mainProductId, skillset) => {
    const mainProduct = boqProducts.find((p) => p.id === mainProductId)
    const newIndex = (mainProduct?.skillSet || []).length
    const newItem = {
      id: null,
      referenceId: skillset.id,
      name: skillset.skillset_name,
      qty: "",
      make: null,
      materialRequisitions: [],
      sequenceNumber: Date.now(),
      pmApprovalStatus: canApprove ? "APPROVED" : "PENDING",
      pmApprovalRemarks: "",
      pmApprovalDate: canApprove ? new Date().toISOString() : null,
      salestlApprovalStatus: "PENDING",
      salestlApprovalRemarks: "",
      salestlApprovalDate: null,
    }
    setBOQProducts((prev) =>
      prev.map((p) => (p.id === mainProductId ? { ...p, skillSet: [...(p.skillSet || []), newItem] } : p)),
    )
    setShowProductSearch((prev) => ({ ...prev, [`${mainProductId}-skillSet`]: false }))
    setSearchTerms((prev) => ({ ...prev, [`${mainProductId}-skillSet`]: "" }))
    setEditingProductModal({ product: newItem, productId: mainProductId, category: "skillSet", productIndex: newIndex, projectCode })
  }

  const addToolToProduct = (mainProductId, tool) => {
    const mainProduct = boqProducts.find((p) => p.id === mainProductId)
    const newIndex = (mainProduct?.tools || []).length
    const newItem = {
      id: null,
      referenceId: tool.id,
      name: tool.tool_name,
      qty: "",
      make: null,
      materialRequisitions: [],
      sequenceNumber: Date.now(),
      pmApprovalStatus: canApprove ? "APPROVED" : "PENDING",
      pmApprovalRemarks: "",
      pmApprovalDate: canApprove ? new Date().toISOString() : null,
      salestlApprovalStatus: "PENDING",
      salestlApprovalRemarks: "",
      salestlApprovalDate: null,
    }
    setBOQProducts((prev) =>
      prev.map((p) => (p.id === mainProductId ? { ...p, tools: [...(p.tools || []), newItem] } : p)),
    )
    setShowProductSearch((prev) => ({ ...prev, [`${mainProductId}-tools`]: false }))
    setSearchTerms((prev) => ({ ...prev, [`${mainProductId}-tools`]: "" }))
    setEditingProductModal({ product: newItem, productId: mainProductId, category: "tools", productIndex: newIndex, projectCode })
  }
    

  const removeProductFromCategory = (mainProductId, category, productIndex) => {
    const mainProduct = boqProducts.find((p) => p.id === mainProductId)
    const item = (mainProduct?.[category] || [])[productIndex]
    if (item && (item.salestlApprovalStatus || "").toUpperCase() === "APPROVED") {
      alert("Cannot delete — this item is approved by Sales TL.")
      return
    }
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
    console.log("[v0] handleMTRSubmit called with:", { mainProductId, category, mtrData })

    setBOQProducts((prev) =>
      prev.map((p) => {
        if (p.id === mainProductId) {
          if (category === "billable") {
            if (editingBillableMTR) {
              console.log("[v0] Editing existing billable MTR:", editingBillableMTR.id)
              return {
                ...p,
                materialRequisitions: p.materialRequisitions.map((mtr) =>
                  mtr.id === editingBillableMTR.id
                    ? {
                        ...mtr,
                        ...mtrData,
                        mtrQty: mtrData.mtrQty ? Number(mtrData.mtrQty) : 0, // Ensure mtrQty is a number
                      }
                    : mtr,
                ),
              }
            } else {
              const isDuplicate = (p.materialRequisitions || []).some(
                (mtr) =>
                  mtr.remarks === mtrData.remarks &&
                  mtr.expectedDeliveryDate === mtrData.expectedDeliveryDate &&
                  mtr.priority === mtrData.priority &&
                  mtr.mtrQty === Number(mtrData.mtrQty || 0) && // Compare quantity as well
                  (mtr.id === null || !mtr.id), // Check both null and undefined/falsy IDs
              )

              if (isDuplicate) {
                console.warn("[v0] Duplicate MTR detected - skipping:", mtrData.remarks)
                return p
              }

              // Adding new billable MTR
              console.log("[v0] Adding new billable MTR:", mtrData.remarks)
              return {
                ...p,
                materialRequisitions: [
                  ...(p.materialRequisitions || []),
                  {
                    id: null, // New MTR, ID should be null
                    ...mtrData,
                    mtrQty: mtrData.mtrQty ? Number(mtrData.mtrQty) : 0, // Ensure mtrQty is persisted as number
                    createdAt: new Date().toISOString(),
                    salestlApprovalStatus: "PENDING",
                    salestlApprovalRemarks: "",
                    salestlApprovalDate: null,
                  },
                ],
              }
            }
          } else {
            // Handling MTRs for NonBillable, SkillSet, Tools categories
            const updatedCategory = [...(p[category] || [])]
            const targetItem = updatedCategory[productIndex]

            if (editingCategoryMTR) {
              const updatedMTRs = (targetItem.materialRequisitions || []).map((mtr) =>
                mtr.id === editingCategoryMTR.id
                  ? {
                      ...mtr,
                      ...mtrData,
                      mtrQty: mtrData.mtrQty ? Number(mtrData.mtrQty) : 0,
                    }
                  : mtr,
              )
              updatedCategory[productIndex] = {
                ...targetItem,
                materialRequisitions: updatedMTRs,
              }
            } else {
              const isDuplicate = (targetItem.materialRequisitions || []).some(
                (mtr) =>
                  mtr.remarks === mtrData.remarks &&
                  mtr.expectedDeliveryDate === mtrData.expectedDeliveryDate &&
                  mtr.priority === mtrData.priority &&
                  mtr.mtrQty === Number(mtrData.mtrQty || 0) &&
                  (mtr.id === null || !mtr.id),
              )

              if (isDuplicate) {
                console.warn("[v0] Duplicate category MTR detected - skipping:", mtrData.remarks)
                return p
              }

              // Adding new MTR for a category item
              console.log("[v0] Adding new category MTR:", mtrData.remarks)
              const newMTRs = [
                ...(targetItem.materialRequisitions || []),
                {
                  id: null,
                  ...mtrData,
                  mtrQty: mtrData.mtrQty ? Number(mtrData.mtrQty) : 0, // Ensure mtrQty is persisted as number
                  createdAt: new Date().toISOString(),
                  salestlApprovalStatus: "PENDING",
                  salestlApprovalRemarks: "",
                  salestlApprovalDate: null,
                },
              ]
              updatedCategory[productIndex] = {
                ...targetItem,
                materialRequisitions: newMTRs,
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
    setEditingCategoryMTR(null)
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
            // Remove MTR from NonBillable, SkillSet, Tools categories
            const updatedCategory = [...(p[category] || [])]
            const targetItem = updatedCategory[productIndex]
            const updatedMTRs = (targetItem.materialRequisitions || []).filter((mtr) => mtr.id !== mtrId)
            updatedCategory[productIndex] = {
              ...targetItem,
              materialRequisitions: updatedMTRs,
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
        (product.product_name || product.productName || "").toLowerCase().includes(lowercasedSearch) ||
        (product.item_code || "").toLowerCase().includes(lowercasedSearch) ||
        (product.hsn_code || product.hsnCode || "").toLowerCase().includes(lowercasedSearch) ||
        (product.product_description || product.productDescription || "").toLowerCase().includes(lowercasedSearch)
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
    const incomingItems = boqDataFromSelector.items
    console.log("[v0] handleBillableProductSave called with:", incomingItems.length, "items")

    const updatedBOQProducts = []
    const processedIncomingIds = new Set()

    boqProducts.forEach((existingBOQItem, originalIndex) => {
      const matchedIncomingItem = incomingItems.find((incomingItem) => incomingItem.id === existingBOQItem.id)

      if (matchedIncomingItem) {
        console.log("[v0] Matched existing item:", existingBOQItem.id)
        const requisitionedQty = (existingBOQItem.materialRequisitions || [])
          .reduce((sum, mtr) => sum + (Number(mtr.mtrQty) || 0), 0)
        const incomingQty = Number(matchedIncomingItem.qty) || 0
        const existingQty = Number(existingBOQItem.qty) || 0

        let finalQty = incomingQty

        if ((existingBOQItem.salestlApprovalStatus || "").toUpperCase() === "APPROVED" && incomingQty < existingQty) {
          alert(`Cannot decrease qty for "${existingBOQItem.product_name}" — it is approved by Sales TL. Keeping previous value (${existingQty}).`)
          finalQty = existingQty
        } else if (incomingQty < requisitionedQty) {
          alert(`Cannot decrease qty for "${existingBOQItem.product_name}" below ${requisitionedQty} (already requisitioned). Keeping previous value (${existingQty}).`)
          finalQty = existingQty
        }

        updatedBOQProducts.push({
          ...existingBOQItem,
          originalOrder: originalIndex,
          // Update billable-specific fields
          product_id: matchedIncomingItem.productId,
          product_name: matchedIncomingItem.productName,
          hsn_code: matchedIncomingItem.hsnCode,
          product_description: matchedIncomingItem.productDescription,
          qty: finalQty,
          make: matchedIncomingItem.make,
          uom: matchedIncomingItem.uom,
          leadProductTypeId: matchedIncomingItem.leadProductTypeId,
          supply_rate: matchedIncomingItem.supplyRate,
          installation_rate: matchedIncomingItem.installationRate,
          supply_amount: matchedIncomingItem.supplyAmount,
          installation_amount: matchedIncomingItem.installationAmount,
          total: matchedIncomingItem.total,
          categoryInfo: matchedIncomingItem.categoryInfo,
          pmApprovalStatus: existingBOQItem.pmApprovalStatus,
          pmApprovalRemarks: existingBOQItem.pmApprovalRemarks,
          pmApprovalDate: existingBOQItem.pmApprovalDate,
          salestlApprovalStatus: existingBOQItem.salestlApprovalStatus,
          salestlApprovalRemarks: existingBOQItem.salestlApprovalRemarks,
          salestlApprovalDate: existingBOQItem.salestlApprovalDate,
        })
        processedIncomingIds.add(matchedIncomingItem.id)
      }
    })

    // Add new items at the end
    incomingItems.forEach((incomingItem) => {
      if (!processedIncomingIds.has(incomingItem.id)) {
        // More precise duplicate detection
        const existsInUpdated = updatedBOQProducts.find(
          (item) =>
            (item.id && item.id === incomingItem.id) ||
            (item.product_id === incomingItem.productId &&
              item.product_name === incomingItem.productName &&
              item.leadProductTypeId === incomingItem.leadProductTypeId),
        )

        if (!existsInUpdated) {
          console.log("[v0] Adding new item:", incomingItem.productName)
          const isProjectManager = canApprove

          updatedBOQProducts.push({
            id: incomingItem.id,
            originalOrder: boqProducts.length + updatedBOQProducts.length,
            sequenceNumber: incomingItem.sequenceNumber || Date.now(), // Preserve or add sequence number
            product_id: incomingItem.productId,
            product_name: incomingItem.productName,
            hsn_code: incomingItem.hsnCode,
            product_description: incomingItem.productDescription,
            qty: incomingItem.qty,
            make: incomingItem.make,
            uom: incomingItem.uom,
            leadProductTypeId: incomingItem.leadProductTypeId,
            supply_rate: incomingItem.supplyRate,
            installation_rate: incomingItem.installationRate,
            supply_amount: incomingItem.supplyAmount,
            installation_amount: incomingItem.installationAmount,
            total: incomingItem.total,
            categoryInfo: incomingItem.categoryInfo,
            pmApprovalStatus: isProjectManager ? "APPROVED" : "PENDING",
            pmApprovalRemarks: "",
            pmApprovalDate: isProjectManager ? new Date().toISOString() : null,
            salestlApprovalStatus: "PENDING", // Default Salestl approval status
            salestlApprovalRemarks: "",
            salestlApprovalDate: null,
            nonBillable: [],
            skillSet: [],
            tools: [],
            materialRequisitions: incomingItem.materialRequisitions || [],
          })
        }
      }
    })

    // Sort by originalOrder first, then by sequenceNumber for stable ordering
    updatedBOQProducts.sort((a, b) => {
      const orderA = a.originalOrder || 0
      const orderB = b.originalOrder || 0
      if (orderA !== orderB) {
        return orderA - orderB
      }
      return (a.sequenceNumber || 0) - (b.sequenceNumber || 0)
    })

    console.log("[v0] Final updated products count:", updatedBOQProducts.length)
    setBOQProducts(updatedBOQProducts)
    setShowAddProductModal(false)
  }

  const getFilteredSkillSets = (searchKey) => {
    const searchTerm = searchTerms[searchKey] || ""
    if (!searchTerm.trim()) return availableSkillsets
    const lowercasedSearch = searchTerm.toLowerCase()
    return availableSkillsets.filter((skillset) => {
      if (!skillset) return false
      return (
        (skillset.skillset_name || "").toLowerCase().includes(lowercasedSearch) ||
        (skillset.category || "").toLowerCase().includes(lowercasedSearch)
      )
    })
  }

  const getFilteredTools = (searchKey) => {
    const searchTerm = searchTerms[searchKey] || ""
    if (!searchTerm.trim()) return availableTools
    const lowercasedSearch = searchTerm.toLowerCase()
    return availableTools.filter((tool) => {
      if (!tool) return false
      return (
        (tool.tool_name || "").toLowerCase().includes(lowercasedSearch) ||
        (tool.tool_type || "").toLowerCase().includes(lowercasedSearch)
      )
    })
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
          <h3 className="text-xl font-bold text-blue-600">Edit12112 BOQ - {projectName}</h3>
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
          <div className="mb-6 flex justify-end gap-3">
            {!readOnly && (
              <button
                onClick={() => setShowRequisitionModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus size={16} />
                Requisitions
              </button>
            )}
            {!readOnly && canApprove && (
              <button
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiPlus size={16} />
                Edit Billable Products
              </button>
            )}
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
                          <div className="p-4 space-y-4">
                           {productTypeGroup.products.map((product) => {
                              const isOpen = !!expandedProducts[product.id]
                              const cat = openCat[product.id]
                              return (
                                <div key={product.id} className="border rounded-lg bg-white">
                                  <div
                                    onClick={() => toggleProductExpansion(product.id)}
                                    className="flex items-start justify-between gap-3 p-3 cursor-pointer hover:bg-gray-50 rounded-lg"
                                  >
                                    <div className="flex items-start gap-2 min-w-0">
                                      {isOpen ? (
                                        <AiOutlineArrowUp size={16} className="mt-1 text-gray-400 flex-shrink-0" />
                                      ) : (
                                        <AiOutlineArrowDown size={16} className="mt-1 text-gray-400 flex-shrink-0" />
                                      )}
                                      <div className="min-w-0">
                                        <div className="font-semibold text-base">{product.product_name}</div>
                                        <div className="text-sm text-gray-500 mt-0.5">
                                          · UOM: {product.uom}  · Make: {product.make || "N/A"} . HSN: {product.hsn_code}
                                         
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className="text-xs text-gray-500 whitespace-nowrap">
                                        BOQ Qty. <span className="font-medium text-gray-800">{product.qty} </span>
                                          ||  <span className="font-medium text-gray-800"></span>
                                        Remaining <span className="font-medium text-gray-800">{calculateRemainingQty(product)}</span>
                                      </span>
                                      <ApprovalPill label="PM" status={product.pmApprovalStatus} />
                                      <ApprovalPill label="Sales TL" status={product.salestlApprovalStatus} />
                                    </div>
                                  </div>

                                  <AnimatePresence>
                                    {isOpen && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="px-3 pb-3 pt-1 space-y-3">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                                            <ApprovalStatusBadge
                                              status={product.pmApprovalStatus || "PENDING"}
                                              type="PM"
                                              productId={product.id}
                                              remarks={product.pmApprovalRemarks}
                                              approvalDate={product.pmApprovalDate}
                                              readOnly={!canApprove}
                                            />
                                            <ApprovalStatusBadge
                                              status={product.salestlApprovalStatus || "PENDING"}
                                              type="SALESTL"
                                              productId={product.id}
                                              remarks={product.salestlApprovalRemarks}
                                              approvalDate={product.salestlApprovalDate}
                                              readOnly={true}
                                            />
                                          </div>

                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Remark (from Sales)</label>
                                            <div className="w-full p-2 text-sm border rounded bg-gray-50 text-gray-700 whitespace-pre-wrap min-h-[2.5rem]">
                                              {product.remarks ? product.remarks : <span className="text-gray-400">No remark added by Sales</span>}
                                            </div>
                                          </div>

                                          <div className="border rounded-lg overflow-hidden">
                                            <button
                                              onClick={() => setOpenCat((p) => ({ ...p, [product.id]: p[product.id] === "nonBillable" ? null : "nonBillable" }))}
                                              className="w-full flex items-center justify-between px-3 py-2 bg-amber-50 text-amber-800 text-sm font-medium hover:bg-amber-100 transition-colors"
                                            >
                                              <span className="flex items-center gap-2"><FiPackage size={15} /> Non-billable ({(product.nonBillable || []).length})</span>
                                              {cat === "nonBillable" ? <AiOutlineArrowUp size={14} /> : <AiOutlineArrowDown size={14} />}
                                            </button>
                                            {cat === "nonBillable" && (
                                              <div className="p-3 space-y-2">
                                                <div className="flex justify-end">
                                                  <button
                                                    onClick={() => setShowProductSearch((prev) => ({ ...prev, [`${product.id}-nonBillable`]: !prev[`${product.id}-nonBillable`] }))}
                                                    className="flex items-center gap-1 px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors text-sm"
                                                  >
                                                    <FiPlus size={14} /> Add Non-Billable Product
                                                  </button>
                                                </div>
                                                {showProductSearch[`${product.id}-nonBillable`] && (
                                                  <div className="p-3 bg-white rounded border">
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <FiSearch size={16} className="text-gray-400" />
                                                      <input
                                                        type="text"
                                                        placeholder="Search products..."
                                                        value={searchTerms[`${product.id}-nonBillable`] || ""}
                                                        onChange={(e) => setSearchTerms((prev) => ({ ...prev, [`${product.id}-nonBillable`]: e.target.value }))}
                                                        className="flex-1 p-2 border rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                      />
                                                    </div>
                                                    <div className="max-h-40 overflow-y-auto">
                                                      {getFilteredNonBillableProducts(`${product.id}-nonBillable`).map((availableProduct) => (
                                                        <button
                                                          key={availableProduct.id}
                                                          onClick={() => addProductToCategory(product.id, "nonBillable", availableProduct)}
                                                          className="w-full text-left p-2 hover:bg-gray-100 rounded text-sm"
                                                        >
                                                          <div className="font-medium">
                                                            {availableProduct.product_name || availableProduct.productName}
                                                            {availableProduct.item_code ? ` (${availableProduct.item_code})` : ""}
                                                          </div>
                                                          <div className="text-gray-500 text-xs">Code: {availableProduct.item_code || "—"} | HSN: {availableProduct.hsn_code || availableProduct.hsnCode}</div>
                                                        </button>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                                {(product.nonBillable || []).map((item, index) => (
                                                  <div key={item.id || `nb-${index}`} className="bg-white p-3 rounded border">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <div className="min-w-0">
                                                        <div className="font-medium">{getProductNameByReferenceId(item, "nonBillable")}{item.item_code ? ` (${item.item_code})` : ""}</div>
                                                        <div className="text-sm text-gray-500">Qty: {item.qty || 0} | Make: {item.make || "N/A"}</div>
                                                      </div>
                                                      <div className="flex items-center gap-2 flex-shrink-0">
                                                        <button onClick={() => setEditingProductModal({ product: item, productId: product.id, category: "nonBillable", productIndex: index, projectCode: projectCode })} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><FiEdit3 size={14} /></button>
                                                        <button onClick={() => removeProductFromCategory(product.id, "nonBillable", index)} className="p-1 text-red-600 hover:bg-red-50 rounded"><FiTrash2 size={14} /></button>
                                                      </div>
                                                    </div>
                                                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                                      <ApprovalStatusBadge status={item.pmApprovalStatus || "PENDING"} type="PM" productId={product.id} categoryType="nonBillable" itemIndex={index} remarks={item.pmApprovalRemarks} approvalDate={item.pmApprovalDate} readOnly={!canApprove} onUpdate={updateCategoryItemApprovalStatus} />
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>

                                          <div className="border rounded-lg overflow-hidden">
                                            <button
                                              onClick={() => setOpenCat((p) => ({ ...p, [product.id]: p[product.id] === "skillSet" ? null : "skillSet" }))}
                                              className="w-full flex items-center justify-between px-3 py-2 bg-green-50 text-green-800 text-sm font-medium hover:bg-green-100 transition-colors"
                                            >
                                              <span className="flex items-center gap-2"><FiUsers size={15} /> Skill set ({(product.skillSet || []).length})</span>
                                              {cat === "skillSet" ? <AiOutlineArrowUp size={14} /> : <AiOutlineArrowDown size={14} />}
                                            </button>
                                            {cat === "skillSet" && (
                                              <div className="p-3 space-y-2">
                                                <div className="flex justify-end">
                                                  <button
                                                    onClick={() => setShowProductSearch((prev) => ({ ...prev, [`${product.id}-skillSet`]: !prev[`${product.id}-skillSet`] }))}
                                                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                                                  >
                                                    <FiPlus size={14} /> Add Skill Set
                                                  </button>
                                                </div>
                                                {showProductSearch[`${product.id}-skillSet`] && (
                                                  <div className="p-3 bg-white rounded border">
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <FiSearch size={16} className="text-gray-400" />
                                                      <input
                                                        type="text"
                                                        placeholder="Search skillsets..."
                                                        value={searchTerms[`${product.id}-skillSet`] || ""}
                                                        onChange={(e) => setSearchTerms((prev) => ({ ...prev, [`${product.id}-skillSet`]: e.target.value }))}
                                                        className="flex-1 p-2 border rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                                      />
                                                    </div>
                                                    <div className="max-h-40 overflow-y-auto">
                                                      {availableSkillsets
                                                        .filter((skillset) => skillset.skillset_name?.toLowerCase().includes((searchTerms[`${product.id}-skillSet`] || "").toLowerCase()))
                                                        .map((skillset) => (
                                                          <button key={skillset.id} onClick={() => addSkillsetToProduct(product.id, skillset)} className="w-full text-left p-2 hover:bg-gray-100 rounded text-sm">
                                                            <div className="font-medium">{skillset.skillset_name}</div>
                                                            <div className="text-gray-500 text-xs">Category: {skillset.category}</div>
                                                          </button>
                                                        ))}
                                                    </div>
                                                  </div>
                                                )}
                                                {(product.skillSet || []).map((item, index) => (
                                                  <div key={item.id || `skill-${index}`} className="bg-white p-3 rounded border">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <div className="min-w-0">
                                                        <div className="font-medium">{getProductNameByReferenceId(item, "skillSet")}</div>
                                                        <div className="text-sm text-gray-500">Qty: {item.qty || 0}</div>
                                                      </div>
                                                      <div className="flex items-center gap-2 flex-shrink-0">
                                                        <button onClick={() => setEditingProductModal({ product: item, productId: product.id, category: "skillSet", productIndex: index, projectCode: projectCode })} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><FiEdit3 size={14} /></button>
                                                        <button onClick={() => removeProductFromCategory(product.id, "skillSet", index)} className="p-1 text-red-600 hover:bg-red-50 rounded"><FiTrash2 size={14} /></button>
                                                      </div>
                                                    </div>
                                                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                                      <ApprovalStatusBadge status={item.pmApprovalStatus || "PENDING"} type="PM" productId={product.id} categoryType="skillSet" itemIndex={index} remarks={item.pmApprovalRemarks} approvalDate={item.pmApprovalDate} readOnly={!canApprove} onUpdate={updateCategoryItemApprovalStatus} />
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>

                                          <div className="border rounded-lg overflow-hidden">
                                            <button
                                              onClick={() => setOpenCat((p) => ({ ...p, [product.id]: p[product.id] === "tools" ? null : "tools" }))}
                                              className="w-full flex items-center justify-between px-3 py-2 bg-purple-50 text-purple-800 text-sm font-medium hover:bg-purple-100 transition-colors"
                                            >
                                              <span className="flex items-center gap-2"><FiTool size={15} /> Tools ({(product.tools || []).length})</span>
                                              {cat === "tools" ? <AiOutlineArrowUp size={14} /> : <AiOutlineArrowDown size={14} />}
                                            </button>
                                            {cat === "tools" && (
                                              <div className="p-3 space-y-2">
                                                <div className="flex justify-end">
                                                  <button
                                                    onClick={() => setShowProductSearch((prev) => ({ ...prev, [`${product.id}-tools`]: !prev[`${product.id}-tools`] }))}
                                                    className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
                                                  >
                                                    <FiPlus size={14} /> Add Tool
                                                  </button>
                                                </div>
                                                {showProductSearch[`${product.id}-tools`] && (
                                                  <div className="p-3 bg-white rounded border">
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <FiSearch size={16} className="text-gray-400" />
                                                      <input
                                                        type="text"
                                                        placeholder="Search tools..."
                                                        value={searchTerms[`${product.id}-tools`] || ""}
                                                        onChange={(e) => setSearchTerms((prev) => ({ ...prev, [`${product.id}-tools`]: e.target.value }))}
                                                        className="flex-1 p-2 border rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                      />
                                                    </div>
                                                    <div className="max-h-40 overflow-y-auto">
                                                      {availableTools
                                                        .filter((tool) => tool.tool_name?.toLowerCase().includes((searchTerms[`${product.id}-tools`] || "").toLowerCase()))
                                                        .map((tool) => (
                                                          <button key={tool.id} onClick={() => addToolToProduct(product.id, tool)} className="w-full text-left p-2 hover:bg-gray-100 rounded text-sm">
                                                            <div className="font-medium">{tool.tool_name}</div>
                                                            <div className="text-gray-500 text-xs">Category: {tool.category}</div>
                                                          </button>
                                                        ))}
                                                    </div>
                                                  </div>
                                                )}
                                                {(product.tools || []).map((item, index) => (
                                                  <div key={item.id || `tool-${index}`} className="bg-white p-3 rounded border">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <div className="min-w-0">
                                                        <div className="font-medium">{getProductNameByReferenceId(item, "tools")}</div>
                                                        <div className="text-sm text-gray-500">Qty: {item.qty || 0} | Make: {item.make || "N/A"}</div>
                                                      </div>
                                                      <div className="flex items-center gap-2 flex-shrink-0">
                                                        <button onClick={() => setEditingProductModal({ product: item, productId: product.id, category: "tools", productIndex: index, projectCode: projectCode })} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><FiEdit3 size={14} /></button>
                                                        <button onClick={() => removeProductFromCategory(product.id, "tools", index)} className="p-1 text-red-600 hover:bg-red-50 rounded"><FiTrash2 size={14} /></button>
                                                      </div>
                                                    </div>
                                                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                                     <ApprovalStatusBadge status={item.pmApprovalStatus || "PENDING"} type="PM" productId={product.id} categoryType="tools" itemIndex={index} remarks={item.pmApprovalRemarks} approvalDate={item.pmApprovalDate} readOnly={!canApprove} onUpdate={updateCategoryItemApprovalStatus} />
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )
                            })} 
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p className="mb-4">No BOQ products found</p>
                {canApprove && (
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Add First Billable Product
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-4 p-6 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { if (window.confirm("Save BOQ?")) saveChanges() }}
            style={{ display: readOnly ? "none" : undefined }}
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
                Save BOQ
              </>
            )}
          </button>
        </div>
        {showRequisitionModal && (
          <CreateRequisition
            projectId={projectId}
            createdBy={currentUserId}
            isOpen={true}
            onClose={() => setShowRequisitionModal(false)}
          />
        )}
        {showAddProductModal && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"
            onClick={() => setShowAddProductModal(false)}
          >
            <div
              className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-bold">Select Billable Products</h3>
                <button onClick={() => setShowAddProductModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                  <FiX />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <BillableProductSelector
                  isOpen={true}
                  onClose={() => setShowAddProductModal(false)}
                  projectId={projectId}
                  onSave={handleBillableProductSave}
                  selectedProducts={boqProducts}
                  currentUserId={currentUserId}
                  leadProductTypes={leadProductTypes}
                  existingBOQ={{ items: boqProducts }}
                  isEditMode={true}
                />
              </div>
            </div>
          </div>
        )}
        {showApprovalModal && (
          <ApprovalModal
            productId={showApprovalModal.productId}
            categoryType={showApprovalModal.categoryType}
            itemIndex={showApprovalModal.itemIndex}
            mtrIndex={showApprovalModal.mtrIndex}
            type={showApprovalModal.type}
            currentStatus={showApprovalModal.currentStatus}
            currentRemarks={showApprovalModal.currentRemarks}
            onClose={() => setShowApprovalModal(null)}
            onSave={() => {}} // This is handled internally by ApprovalModal
            isMTR={showApprovalModal.isMTR}
          />
        )}
        {editingProductModal && (
          <CategoryProductModal
            product={editingProductModal.product}
            productId={editingProductModal.productId}
            category={editingProductModal.category}
            productIndex={editingProductModal.productIndex}
            onClose={() => setEditingProductModal(null)}
            onSave={() => {}} // This is handled internally by CategoryProductModal
            projectCode={projectCode}
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
                  Please review the changes before saving. This will save the BOQ with all material requisitions to the
                  database.
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
                  onClick={saveChanges}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>Save BOQ</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
  function ApprovalPill({ label, status }) {
    const u = (status || "PENDING").toUpperCase()
    const cls =
      u === "APPROVED" ? "bg-green-100 text-green-700"
      : u === "REJECTED" ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700"
    const mark = u === "APPROVED" ? "✓" : u === "REJECTED" ? "✕" : "•"
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${cls}`} title={`${label} approval: ${u}`}>
        <span className="font-semibold">{mark}</span>
        {label}
      </span>
    )
  }
}
export default BOQEditComponent