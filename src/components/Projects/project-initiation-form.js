"use client"

import { useState, useEffect } from "react"
import { FiSave, FiChevronDown, FiChevronRight, FiX, FiEdit2 } from "react-icons/fi"

// Mock services for demonstration purposes.
// In a real application, you would replace these with your actual API integrations.
const storeService = {
  getProductsList: async () => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    return [
      {
        id: 101,
        product_name: "Billable Product A",
        hsn_code: "B001",
        uom: "Pcs",
        product_qty: 100,
        product_description: "High-quality billable product for project delivery.",
        category_id: {
          id: 1,
          productCategory: { category_name: "Category 1", leadProductType: { label: "Billable Products" } },
        },
      },
      {
        id: 102,
        product_name: "Billable Product B",
        hsn_code: "B002",
        uom: "Kg",
        product_qty: 50,
        product_description: "Another essential billable product.",
        category_id: {
          id: 1,
          productCategory: { category_name: "Category 1", leadProductType: { label: "Billable Products" } },
        },
      },
      {
        id: 201,
        product_name: "Non-Billable Item X",
        hsn_code: "NB001",
        uom: "Units",
        product_qty: 200,
        product_description: "Internal use item, not directly billed to client.",
        category_id: {
          id: 2,
          productCategory: { category_name: "Category 2", leadProductType: { label: "Nonbillable Products" } },
        },
      },
      {
        id: 301,
        product_name: "Frontend Dev Skill",
        hsn_code: "SKL001",
        uom: "Hours",
        product_qty: 1000,
        product_description: "Expert frontend development hours for UI/UX.",
        category_id: {
          id: 3,
          productCategory: { category_name: "Category 3", leadProductType: { label: "Skillset" } },
        },
      },
      {
        id: 302,
        product_name: "Backend Dev Skill",
        hsn_code: "SKL002",
        uom: "Hours",
        product_qty: 800,
        product_description: "Expert backend development hours for API and database.",
        category_id: {
          id: 3,
          productCategory: { category_name: "Category 3", leadProductType: { label: "Skillset" } },
        },
      },
      {
        id: 401,
        product_name: "Laptop (High-End)",
        hsn_code: "TOOL001",
        uom: "Pcs",
        product_qty: 10,
        product_description: "High-performance laptop for project team members.",
        category_id: { id: 4, productCategory: { category_name: "Category 4", leadProductType: { label: "Tools" } } },
      },
      {
        id: 402,
        product_name: "Software License",
        hsn_code: "TOOL002",
        uom: "Licenses",
        product_qty: 50,
        product_description: "Annual software licenses for development tools.",
        category_id: { id: 4, productCategory: { category_name: "Category 4", leadProductType: { label: "Tools" } } },
      },
    ]
  },
}

const projectService = {
  createOrUpdateBOQ: async (projectId, boqData) => {
    console.log("Mock projectService.createOrUpdateBOQ called:", projectId, boqData)
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { success: true, message: "BOQ saved successfully (mock)" }
  },
  getBOQByProjectId: async (projectId) => {
    console.log("Mock projectService.getBOQByProjectId called:", projectId)
    await new Promise((resolve) => setTimeout(resolve, 300))
    // Return dummy BOQ data for a specific project ID
    if (projectId === "project-123") {
      return {
        project_id: "project-123",
        items: [
          {
            product_id: 101,
            product_name: "Billable Product A",
            hsn_code: "B001",
            uom: "Pcs",
            qty: 5,
            make: "Manufacturer X",
            supply_rate: 100,
            installation_rate: 20,
            supply_amount: 500,
            installation_amount: 100,
            total: 600,
            category_id: 1,
            categoryInfo: {
              topCategory: "Billable Products",
              mainCategory: "Category 1",
              subCategory: "Category 1",
              fullPath: "Billable Products > Category 1 > Category 1",
            },
            procurementPlan: { actualDate: "2025-07-10", leadTimeDays: "5" },
            dispatchPlan: { actualDate: "", leadTimeDays: "2" },
            installationPlan: { actualDate: "", leadTimeDays: "3" },
          },
          {
            product_id: 301,
            product_name: "Frontend Dev Skill",
            hsn_code: "SKL001",
            uom: "Hours",
            qty: 160,
            make: "Internal",
            supply_rate: 50,
            installation_rate: 0,
            supply_amount: 8000,
            installation_amount: 0,
            total: 8000,
            category_id: 3,
            categoryInfo: {
              topCategory: "Skillset",
              mainCategory: "Category 3",
              subCategory: "Category 3",
              fullPath: "Skillset > Category 3 > Category 3",
            },
            procurementPlan: { actualDate: "", leadTimeDays: "" },
            dispatchPlan: { actualDate: "", leadTimeDays: "" },
            installationPlan: { actualDate: "", leadTimeDays: "" },
          },
          {
            product_id: 401,
            product_name: "Laptop (High-End)",
            hsn_code: "TOOL001",
            uom: "Pcs",
            qty: 2,
            make: "Dell",
            supply_rate: 1200,
            installation_rate: 0,
            supply_amount: 2400,
            installation_amount: 0,
            total: 2400,
            category_id: 4,
            categoryInfo: {
              topCategory: "Tools",
              mainCategory: "Category 4",
              subCategory: "Category 4",
              fullPath: "Tools > Category 4 > Category 4",
            },
            procurementPlan: { actualDate: "", leadTimeDays: "" },
            dispatchPlan: { actualDate: "", leadTimeDays: "" },
            installationPlan: { actualDate: "", leadTimeDays: "" },
          },
        ],
      }
    }
    return null // For other project IDs, assume no existing BOQ data
  },
}

// ProjectProductPlans component (refactored from ProductBOQSelector)
function ProjectProductPlans({ projectId, onSave, existingBOQ = null }) {
  const [boqItems, setBoqItems] = useState([])
  const [expandedCategories, setExpandedCategories] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchAndInitializeBOQ = async () => {
      setLoading(true)
      setError("")
      try {
        const fetchedBOQ = await projectService.getBOQByProjectId(projectId)
        const initialItems = (fetchedBOQ?.items || []).map((item) => ({
          ...item,
          // Ensure plan objects exist with default values
          procurementPlan: item.procurementPlan || { actualDate: "", leadTimeDays: "" },
          dispatchPlan: item.dispatchPlan || { actualDate: "", leadTimeDays: "" },
          installationPlan: item.installationPlan || { actualDate: "", leadTimeDays: "" },
        }))

        setBoqItems(initialItems)

        // Initialize expanded categories based on fetched items
        const initialExpanded = {}
        initialItems.forEach((item) => {
          initialExpanded[item.category_id] = true
        })
        setExpandedCategories(initialExpanded)
      } catch (err) {
        console.error("Error fetching BOQ for project initiation:", err)
        setError(`Failed to load BOQ items: ${err.message}`)
        setBoqItems([])
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchAndInitializeBOQ()
    } else {
      setLoading(false)
      setError("No Project ID provided to fetch BOQ.")
    }
  }, [projectId])

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

  const handleProductFieldChange = (productId, field, value, planType = null) => {
    setBoqItems((prevItems) =>
      prevItems.map((item) => {
        if (item.product_id === productId) {
          if (planType) {
            return {
              ...item,
              [planType]: {
                ...item[planType],
                [field]: value,
              },
            }
          }
          return { ...item, [field]: value }
        }
        return item
      }),
    )
  }

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  const handleSavePlans = async () => {
    setSaving(true)
    setError("")
    try {
      // Prepare data for saving, including the new plan fields
      const dataToSave = {
        project_id: projectId,
        items: boqItems.map((item) => ({
          product_id: item.product_id,
          category_id: item.category_id,
          qty: item.qty,
          make: item.make,
          uom: item.uom,
          supply_rate: item.supply_rate,
          installation_rate: item.installation_rate,
          supply_amount: item.supply_amount,
          installation_amount: item.installation_amount,
          total: item.total,
          product_name: item.product_name,
          hsn_code: item.hsn_code,
          procurementPlan: item.procurementPlan,
          dispatchPlan: item.dispatchPlan,
          installationPlan: item.installationPlan,
        })),
      }
      console.log("Saving Project Product Plans:", dataToSave)
      // In a real app, you'd call your API here, e.g., projectService.saveProductPlans(projectId, dataToSave);
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
      onSave(dataToSave) // Pass the updated data back to the parent form
    } catch (err) {
      console.error("Error saving plans:", err)
      setError(`Failed to save plans: ${err.message || err}`)
    } finally {
      setSaving(false)
    }
  }

  // Group items by category for display
  const groupedBoqItems = boqItems.reduce((acc, item) => {
    const categoryId = item.category_id
    if (!acc[categoryId]) {
      acc[categoryId] = {
        name: item.categoryInfo?.mainCategory || "Uncategorized", // Use mainCategory for display
        items: [],
      }
    }
    acc[categoryId].items.push(item)
    return acc
  }, {})

  const getCalculatedDate = (baseDate, leadTimeDays) => {
    if (!baseDate || !leadTimeDays) return "N/A"
    const date = new Date(baseDate)
    date.setDate(date.getDate() + Number(leadTimeDays))
    return date.toISOString().split("T")[0]
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Loading BOQ items...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg bg-white border p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg border-b pb-2 flex-1">Product Plans (from BOQ)</h3>
          <div className="flex items-center text-sm text-blue-600">
            <FiEdit2 className="mr-1" />
            Edit Mode
          </div>
        </div>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 border border-red-100">
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
              <FiX />
            </button>
          </div>
        )}

        {Object.keys(groupedBoqItems).length === 0 ? (
          <div className="p-4 text-center text-gray-500">No BOQ items found for this project.</div>
        ) : (
          <div className="mt-6">
            {Object.entries(groupedBoqItems).map(([categoryId, categoryData]) => (
              <div key={categoryId} className="mb-4 border rounded-lg">
                <div className="flex items-center justify-between p-3 bg-gray-50">
                  <div
                    className="flex items-center cursor-pointer hover:bg-gray-100 transition-colors flex-1 -m-3 p-3"
                    onClick={() => toggleCategoryExpansion(categoryId)}
                  >
                    {expandedCategories[categoryId] ? (
                      <FiChevronDown className="mr-2 text-gray-500" />
                    ) : (
                      <FiChevronRight className="mr-2 text-gray-500" />
                    )}
                    <h5 className="font-medium text-gray-900">{categoryData.name}</h5>
                    <span className="ml-2 text-sm text-gray-500">({categoryData.items.length} items)</span>
                  </div>
                </div>
                {expandedCategories[categoryId] && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Procurement Plan
                          </th>
                          <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dispatch Plan
                          </th>
                          <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Installation Plan
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {categoryData.items.map((product, index) => {
                          const procurementDate = product.procurementPlan?.actualDate
                          const dispatchDate = product.dispatchPlan?.actualDate
                          const installationDate = product.installationPlan?.actualDate

                          const calculatedDispatchDate = getCalculatedDate(
                            procurementDate,
                            product.dispatchPlan?.leadTimeDays,
                          )
                          const calculatedInstallationDate = getCalculatedDate(
                            dispatchDate,
                            product.installationPlan?.leadTimeDays,
                          )

                          return (
                            <tr key={product.product_id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                              <td className="px-3 py-2">
                                <div className="text-sm font-medium">{product.product_name || "Unnamed Product"}</div>
                                <div className="text-xs text-gray-500">HSN: {product.hsn_code || "N/A"}</div>
                                <div className="text-xs text-gray-400">UOM: {product.uom || "N/A"}</div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="text-sm font-medium">{product.qty}</div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex flex-col gap-1">
                                  <label htmlFor={`procurementDate-${product.product_id}`} className="sr-only">
                                    Procurement Date
                                  </label>
                                  <input
                                    type="date"
                                    id={`procurementDate-${product.product_id}`}
                                    value={procurementDate}
                                    onChange={(e) =>
                                      handleProductFieldChange(
                                        product.product_id,
                                        "actualDate",
                                        e.target.value,
                                        "procurementPlan",
                                      )
                                    }
                                    className="w-32 p-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <label htmlFor={`procurementLeadTime-${product.product_id}`} className="sr-only">
                                    Procurement Lead Time
                                  </label>
                                  <input
                                    type="number"
                                    id={`procurementLeadTime-${product.product_id}`}
                                    value={product.procurementPlan?.leadTimeDays}
                                    onChange={(e) =>
                                      handleProductFieldChange(
                                        product.product_id,
                                        "leadTimeDays",
                                        e.target.value,
                                        "procurementPlan",
                                      )
                                    }
                                    placeholder="Lead Days"
                                    min="0"
                                    className="w-24 p-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex flex-col gap-1">
                                  <label htmlFor={`dispatchDate-${product.product_id}`} className="sr-only">
                                    Dispatch Date
                                  </label>
                                  <input
                                    type="date"
                                    id={`dispatchDate-${product.product_id}`}
                                    value={dispatchDate}
                                    onChange={(e) =>
                                      handleProductFieldChange(
                                        product.product_id,
                                        "actualDate",
                                        e.target.value,
                                        "dispatchPlan",
                                      )
                                    }
                                    className="w-32 p-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <label htmlFor={`dispatchLeadTime-${product.product_id}`} className="sr-only">
                                    Dispatch Lead Time
                                  </label>
                                  <input
                                    type="number"
                                    id={`dispatchLeadTime-${product.product_id}`}
                                    value={product.dispatchPlan?.leadTimeDays}
                                    onChange={(e) =>
                                      handleProductFieldChange(
                                        product.product_id,
                                        "leadTimeDays",
                                        e.target.value,
                                        "dispatchPlan",
                                      )
                                    }
                                    placeholder="Lead Days"
                                    min="0"
                                    className="w-24 p-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  {procurementDate && (
                                    <p className="text-xs text-gray-500 mt-1">Calc: {calculatedDispatchDate}</p>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex flex-col gap-1">
                                  <label htmlFor={`installationDate-${product.product_id}`} className="sr-only">
                                    Installation Date
                                  </label>
                                  <input
                                    type="date"
                                    id={`installationDate-${product.product_id}`}
                                    value={installationDate}
                                    onChange={(e) =>
                                      handleProductFieldChange(
                                        product.product_id,
                                        "actualDate",
                                        e.target.value,
                                        "installationPlan",
                                      )
                                    }
                                    className="w-32 p-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <label htmlFor={`installationLeadTime-${product.product_id}`} className="sr-only">
                                    Installation Lead Time
                                  </label>
                                  <input
                                    type="number"
                                    id={`installationLeadTime-${product.product_id}`}
                                    value={product.installationPlan?.leadTimeDays}
                                    onChange={(e) =>
                                      handleProductFieldChange(
                                        product.product_id,
                                        "leadTimeDays",
                                        e.target.value,
                                        "installationPlan",
                                      )
                                    }
                                    placeholder="Lead Days"
                                    min="0"
                                    className="w-24 p-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  {dispatchDate && (
                                    <p className="text-xs text-gray-500 mt-1">Calc: {calculatedInstallationDate}</p>
                                  )}
                                </div>
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

        {boqItems.length > 0 && (
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSavePlans}
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
                  Save Product Plans ({boqItems.length} items)
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectProductPlans
