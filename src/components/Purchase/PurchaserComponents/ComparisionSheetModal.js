"use client"

import { useState, useEffect, useRef, Fragment } from "react"
import { FiX, FiChevronDown, FiChevronUp, FiPlus, FiTrash2, FiCheck, FiXCircle, FiClock } from "react-icons/fi"
import { motion, AnimatePresence } from "framer-motion"
import VendorDropdown from "./VendorDropdown"
import AddComparisonItemsModal from "./AddComparisonItemsModal"
import { comparisonSheetService } from "../../../services/comparisonSheetService"
import { getErrorMessage } from "../../../utils/errorUtils"

const formatDate = (dateString) => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

const emptyCell = { rate: "", leadTime: "" }

export default function ComparisionSheetModal({ mtr, onClose, onSave, mode = "purchaser" }) {
  const isManagerMode = mode === "manager"
  const itemKind = mtr?.itemKind || mtr?.type || "BILLABLE"

  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false)
  const [isComparisonExpanded, setIsComparisonExpanded] = useState(true)

  const [comparisonSheetId, setComparisonSheetId] = useState(null)
  const [comparisonSheetCreated, setComparisonSheetCreated] = useState(false)
  const [lines, setLines] = useState([])
  const [vendorColumns, setVendorColumns] = useState([])
  const [cells, setCells] = useState({})
  const [selectedVendorColumnKey, setSelectedVendorColumnKey] = useState("")
  const [showAddItemModal, setShowAddItemModal] = useState(false)

  const [saving, setSaving] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [pmApprovalStatus, setPmApprovalStatus] = useState(mtr?.boqMtr?.purchaseManagerApprovalStatus || "PENDING")
  const [pmApprovalRemarks, setPmApprovalRemarks] = useState(mtr?.boqMtr?.purchaseManagerApprovalRemarks || "")
  const [pmApprovalLoading, setPmApprovalLoading] = useState(false)

  const keyCounter = useRef(0)
  const nextKey = (prefix) => `${prefix}-${keyCounter.current++}`

  const seedDefaultSheet = (detail) => {
    const itemLineKey = nextKey("line")
    setLines([
      {
        key: itemLineKey,
        id: null,
        lineType: "ITEM",
        itemKind,
        boqMtrId: itemKind === "CATEGORY" ? null : mtr.id,
        boqCategoryMtrId: itemKind === "CATEGORY" ? mtr.id : null,
        itemName: mtr.productName,
        productCode: detail?.productCode || mtr.productCode || "",
        make: detail?.make || mtr.make || "",
        uom: detail?.uom || mtr.uom || "",
        qty: mtr.purchaseMTR || 0,
      },
      { key: "misc", id: null, lineType: "MISC_EXPENSE", itemName: "Miscellaneous expense", qty: null },
      { key: "disc", id: null, lineType: "DISCOUNT", itemName: "Discount", qty: null },
    ])
    setVendorColumns([
      { key: nextKey("col"), id: null, vendorId: null, vendorName: "" },
      { key: nextKey("col"), id: null, vendorId: null, vendorName: "" },
      { key: nextKey("col"), id: null, vendorId: null, vendorName: "" },
    ])
    setCells({})
    setSelectedVendorColumnKey("")
  }

  const hydrateFromFullSheet = (full) => {
    const loadedLines = (full.lines || [])
      .slice()
      .sort((a, b) => (a.lineOrder ?? 0) - (b.lineOrder ?? 0))
      .map((l) => ({
        key: `line-${l.id}`,
        id: l.id,
        lineType: l.lineType,
        itemKind: l.itemKind,
        boqMtrId: l.boqMtrId,
        boqCategoryMtrId: l.boqCategoryMtrId,
        itemName: l.itemName,
        productCode: l.productCode || "",
        make: l.make || "",
        uom: l.uom || "",
        qty: l.qty,
      }))
    const loadedColumns = (full.vendorColumns || [])
      .slice()
      .sort((a, b) => (a.columnOrder ?? 0) - (b.columnOrder ?? 0))
      .map((c) => ({ key: `col-${c.id}`, id: c.id, vendorId: c.vendorId, vendorName: c.vendorName }))
    const loadedCells = {}
    ;(full.cells || []).forEach((cell) => {
      const lineKey = `line-${cell.lineId}`
      const colKey = `col-${cell.vendorColumnId}`
      if (!loadedCells[lineKey]) loadedCells[lineKey] = {}
      loadedCells[lineKey][colKey] = { rate: cell.rate ?? "", leadTime: cell.leadTime || "" }
    })

    setLines(loadedLines)
    setVendorColumns(loadedColumns)
    setCells(loadedCells)

    if (full.selectedVendorId) {
      const col = loadedColumns.find((c) => c.vendorId === full.selectedVendorId)
      if (col) setSelectedVendorColumnKey(col.key)
    }
    setPmApprovalStatus(mtr?.boqMtr?.purchaseManagerApprovalStatus || "PENDING")
    setPmApprovalRemarks(mtr?.boqMtr?.purchaseManagerApprovalRemarks || "")
  }

  useEffect(() => {
    const load = async () => {
      if (!mtr?.id) return
      setIsLoadingData(true)
      try {
        const mtrWithSheet = await comparisonSheetService.getMTRWithComparisonSheet(mtr.id, itemKind)
        if (mtrWithSheet.comparisonSheetId && mtrWithSheet.comparisonSheetCreated) {
          setComparisonSheetCreated(true)
          setComparisonSheetId(mtrWithSheet.comparisonSheetId)
          const full = await comparisonSheetService.getFullComparisonSheet(mtrWithSheet.comparisonSheetId)
          hydrateFromFullSheet(full)
        } else {
          setComparisonSheetCreated(false)
          setComparisonSheetId(null)
          seedDefaultSheet(mtrWithSheet)
        }
      } catch (err) {
        console.error("Error loading comparison sheet data:", err)
        setError(getErrorMessage(err, "Error loading comparison sheet data"))
        seedDefaultSheet()
      } finally {
        setIsLoadingData(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mtr?.id])

  const updateCell = (lineKey, colKey, field, value) => {
    setCells((prev) => ({
      ...prev,
      [lineKey]: {
        ...(prev[lineKey] || {}),
        [colKey]: { ...(prev[lineKey]?.[colKey] || emptyCell), [field]: value },
      },
    }))
  }

  const addVendorColumn = () => {
    setVendorColumns((prev) => [...prev, { key: nextKey("col"), id: null, vendorId: null, vendorName: "" }])
  }

  const setVendorForColumn = (colKey, vendor) => {
    setVendorColumns((prev) =>
      prev.map((c) => (c.key === colKey ? { ...c, vendorId: vendor.id, vendorName: vendor.vendorName } : c)),
    )
  }

  const handleAddItems = (selectedMtrs) => {
    const newLines = selectedMtrs.map((m) => ({
      key: nextKey("line"),
      id: null,
      lineType: "ITEM",
      itemKind: m.type || "BILLABLE",
      boqMtrId: (m.type || "BILLABLE") === "CATEGORY" ? null : m.id,
      boqCategoryMtrId: (m.type || "BILLABLE") === "CATEGORY" ? m.id : null,
      itemName: m.productName,
      productCode: m.productCode || "",
      make: m.make || "",
      uom: m.uom || "",
      qty: m.purchaseMTR || 0,
    }))
    setLines((prev) => {
      const itemLines = prev.filter((l) => l.lineType === "ITEM")
      const otherLines = prev.filter((l) => l.lineType !== "ITEM")
      return [...itemLines, ...newLines, ...otherLines]
    })
  }

  const removeLine = (lineKey) => {
    setLines((prev) => prev.filter((l) => l.key !== lineKey))
    setCells((prev) => {
      const next = { ...prev }
      delete next[lineKey]
      return next
    })
  }

  const cellAmount = (line, colKey) => {
    const cell = cells[line.key]?.[colKey]
    const rate = Number.parseFloat(cell?.rate)
    if (Number.isNaN(rate)) return 0
    if (line.lineType === "ITEM") {
      return (Number.parseFloat(line.qty) || 0) * rate
    }
    return rate // MISC_EXPENSE / DISCOUNT rate field is a direct amount
  }

  const columnTotal = (colKey) => {
    let total = 0
    lines.forEach((line) => {
      const amt = cellAmount(line, colKey)
      total += line.lineType === "DISCOUNT" ? -amt : amt
    })
    return total
  }

  const filledColumnKeys = vendorColumns.filter((c) => c.vendorId).map((c) => c.key)
  const totalsWithValues = filledColumnKeys
    .map((key) => ({ key, total: columnTotal(key) }))
    .filter((t) => t.total > 0)
    .sort((a, b) => a.total - b.total)
  const rankByColumnKey = {}
  totalsWithValues.slice(0, 3).forEach((t, idx) => {
    rankByColumnKey[t.key] = idx + 1 // 1 = L1, 2 = L2, 3 = L3
  })
  const rankBadgeClass = { 1: "bg-green-100 text-green-800", 2: "bg-blue-100 text-blue-800", 3: "bg-amber-100 text-amber-800" }

  const MIN_VENDOR_COLUMNS = 3

  const removeVendorColumn = (colKey) => {
    if (vendorColumns.length <= MIN_VENDOR_COLUMNS) return
    setVendorColumns((prev) => prev.filter((c) => c.key !== colKey))
    setCells((prev) => {
      const next = {}
      Object.keys(prev).forEach((lineKey) => {
        const lineCells = { ...(prev[lineKey] || {}) }
        delete lineCells[colKey]
        next[lineKey] = lineCells
      })
      return next
    })
    if (selectedVendorColumnKey === colKey) setSelectedVendorColumnKey("")
  }

  const itemLines = lines.filter((l) => l.lineType === "ITEM")
  const fixedLines = lines.filter((l) => l.lineType !== "ITEM")

  const handleSave = async () => {
    setError("")
    setSuccess("")

    if (itemLines.length === 0) {
      setError("Add at least one item to compare.")
      return
    }
    const validColumns = vendorColumns.filter((c) => c.vendorId)
    if (validColumns.length === 0) {
      setError("Please select at least one vendor.")
      return
    }

    setSaving(true)
    try {
      const lineDTOs = lines.map((l, idx) => ({
        key: l.key,
        lineType: l.lineType,
        itemKind: l.itemKind,
        boqMtrId: l.boqMtrId,
        boqCategoryMtrId: l.boqCategoryMtrId,
        itemName: l.itemName,
        make: l.make,
        uom: l.uom,
        qty: l.qty !== null && l.qty !== undefined && l.qty !== "" ? Number.parseFloat(l.qty) : null,
        lineOrder: idx,
      }))
      const vendorColumnDTOs = validColumns.map((c, idx) => ({ key: c.key, vendorId: c.vendorId, columnOrder: idx }))
      const cellDTOs = []
      lines.forEach((l) => {
        validColumns.forEach((c) => {
          const cell = cells[l.key]?.[c.key]
          if (cell && cell.rate !== "" && cell.rate !== null && cell.rate !== undefined) {
            cellDTOs.push({
              lineKey: l.key,
              vendorColumnKey: c.key,
              rate: Number.parseFloat(cell.rate) || 0,
              leadTime: cell.leadTime || "",
            })
          }
        })
      })

      const selectedColumn = vendorColumns.find((c) => c.key === selectedVendorColumnKey)

      const payload = {
        comparisonSheetId,
        createdBy: "1",
        lines: lineDTOs,
        vendorColumns: vendorColumnDTOs,
        cells: cellDTOs,
        selectedVendorId: selectedColumn ? selectedColumn.vendorId : null,
      }

      const saved = await comparisonSheetService.saveCombinedComparisonSheet(payload)
      setComparisonSheetId(saved.id)
      setComparisonSheetCreated(true)

      const full = await comparisonSheetService.getFullComparisonSheet(saved.id)
      hydrateFromFullSheet(full)

      setSuccess("Comparison sheet saved successfully!")
      if (onSave) await onSave()
      setTimeout(() => onClose(), 1200)
    } catch (err) {
      console.error("Error saving comparison sheet:", err)
      setError(getErrorMessage(err, "Error saving comparison sheet. Please try again."))
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async () => {
    setError("")
    setSuccess("")
    const col = vendorColumns.find((c) => c.key === selectedVendorColumnKey)
    if (!col || !col.id) {
      setError("Select a vendor to approve.")
      return
    }
    setPmApprovalLoading(true)
    try {
      await comparisonSheetService.approveVendorForSheet(comparisonSheetId, col.id, pmApprovalRemarks, 1)
      setSuccess("Vendor approved — all items in this comparison are now approved for that vendor.")
      setTimeout(() => {
        if (onSave) onSave()
        onClose()
      }, 1200)
    } catch (err) {
      console.error("Error approving vendor:", err)
      setError(getErrorMessage(err, "Failed to update approval status. Please try again."))
    } finally {
      setPmApprovalLoading(false)
    }
  }

  if (!mtr) return null

  const isApproved = mtr.boqMtr?.purchaseManagerApprovalStatus === "APPROVED"

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
        className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b bg-blue-50">
          <h3 className="text-lg font-bold text-blue-700">
            Comparison Sheet - Material Requisition
            {isLoadingData && <span className="ml-2 text-sm text-blue-500">(Loading...)</span>}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {(error || success) && (
          <div className={`p-4 ${error ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"} border-b`}>
            <p className={`text-sm ${error ? "text-red-700" : "text-green-700"}`}>{error || success}</p>
          </div>
        )}

        {isLoadingData ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading comparison sheet data...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="min-h-0">
              <div className="border-b border-blue-200">
                <button
                  onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <h4 className="text-md font-semibold text-blue-600">Material Requisition Details</h4>
                  {isDetailsExpanded ? (
                    <FiChevronUp className="w-5 h-5 text-blue-600" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-blue-600" />
                  )}
                </button>

                <AnimatePresence>
                  {isDetailsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 border-l-4 border-blue-400">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-blue-600">Requisition No:</p>
                            <p className="font-semibold">{mtr.requisitionNo ? `Requisition ${mtr.requisitionNo}` : "N/A"}</p>
                          </div>
                          <div>
                            <p className="font-medium text-blue-600">Product Name:</p>
                            <p className="font-semibold">{mtr.productName || "N/A"}</p>
                          </div>
                          <div>
                            <p className="font-medium text-blue-600">Project Name:</p>
                            <p className="font-semibold">{mtr.projectName || "N/A"}</p>
                          </div>
                          <div>
                            <p className="font-medium text-blue-600">MTR Qty:</p>
                            <p>{mtr.mtrQty}</p>
                          </div>
                          <div>
                            <p className="font-medium text-blue-600">Purchase MTR:</p>
                            <p className="font-semibold text-blue-600">{mtr.purchaseMTR}</p>
                          </div>
                          <div>
                            <p className="font-medium text-blue-600">Priority:</p>
                            <p
                              className={`font-medium ${
                                mtr.priority === "HIGH"
                                  ? "text-red-600"
                                  : mtr.priority === "MEDIUM"
                                    ? "text-yellow-600"
                                    : "text-green-600"
                              }`}
                            >
                              {mtr.priority}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-blue-600">Status:</p>
                            <p>{mtr.status}</p>
                          </div>
                          <div>
                            <p className="font-medium text-blue-600">Expected Delivery:</p>
                            <p>{formatDate(mtr.expectedDeliveryDate)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-blue-600">PM Approval:</p>
                            <div className="flex items-center gap-2">
                              {mtr.boqMtr?.purchaseManagerApprovalStatus === "APPROVED" && <FiCheck className="text-green-600" />}
                              {mtr.boqMtr?.purchaseManagerApprovalStatus === "REJECTED" && <FiXCircle className="text-red-600" />}
                              <span
                                className={`font-semibold ${
                                  mtr.boqMtr?.purchaseManagerApprovalStatus === "APPROVED"
                                    ? "text-green-600"
                                    : mtr.boqMtr?.purchaseManagerApprovalStatus === "REJECTED"
                                      ? "text-red-600"
                                      : "text-yellow-600"
                                }`}
                              >
                                {mtr.boqMtr?.purchaseManagerApprovalStatus || "PENDING"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="border-b border-amber-200">
                <button
                  onClick={() => setIsComparisonExpanded(!isComparisonExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <h4 className="text-md font-semibold text-amber-700">Vendor Comparison Sheet</h4>
                  {isComparisonExpanded ? (
                    <FiChevronUp className="w-5 h-5 text-amber-600" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-amber-600" />
                  )}
                </button>

                <AnimatePresence>
                  {isComparisonExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {isManagerMode && !comparisonSheetCreated ? (
                        <div className="p-6 border-l-4 border-gray-300">
                          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <FiClock className="w-5 h-5 text-gray-500" />
                            <p className="text-sm text-gray-600">
                              Pending from Purchaser — vendor comparison has not been filled in yet.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 border-l-4 border-amber-400">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-lg font-semibold text-amber-700">Vendor Comparisons</h5>
                            {!isManagerMode && !isApproved && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setShowAddItemModal(true)}
                                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <FiPlus className="w-4 h-4" />
                                  Add Another Item
                                </button>
                                <button
                                  onClick={addVendorColumn}
                                  className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                                >
                                  <FiPlus className="w-4 h-4" />
                                  Add Vendor
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full border border-gray-200 rounded-lg text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th rowSpan={2} className="px-3 py-2 text-left font-medium text-gray-700 border-b border-r align-bottom">
                                    Item
                                  </th>
                                  <th rowSpan={2} className="px-3 py-2 text-left font-medium text-gray-700 border-b border-r align-bottom">
                                    Code
                                  </th>
                                  <th rowSpan={2} className="px-3 py-2 text-left font-medium text-gray-700 border-b border-r align-bottom">
                                    Make
                                  </th>
                                  <th rowSpan={2} className="px-3 py-2 text-left font-medium text-gray-700 border-b border-r align-bottom">
                                    UOM
                                  </th>
                                  <th rowSpan={2} className="px-3 py-2 text-left font-medium text-gray-700 border-b border-r align-bottom">
                                    Qty
                                  </th>
                                  {vendorColumns.map((col) => {
                                    const rank = rankByColumnKey[col.key]
                                    return (
                                      <th key={col.key} colSpan={3} className="px-3 py-2 text-center font-medium text-gray-700 border-b border-r">
                                        <div className="flex items-center justify-center gap-2">
                                          {rank && (
                                            <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${rankBadgeClass[rank]}`}>
                                              L{rank}
                                            </span>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            {isManagerMode ? (
                                              col.vendorName || "—"
                                            ) : (
                                              <VendorDropdown
                                                value={col.vendorName}
                                                onChange={() => {}}
                                                onSelectVendor={(vendor) => setVendorForColumn(col.key, vendor)}
                                                placeholder="Select vendor"
                                              />
                                            )}
                                          </div>
                                          {!isManagerMode && !isApproved && vendorColumns.length > MIN_VENDOR_COLUMNS && (
                                            <button
                                              onClick={() => removeVendorColumn(col.key)}
                                              title="Remove vendor"
                                              className="p-1 text-red-500 hover:bg-red-50 rounded-md"
                                            >
                                              <FiTrash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </th>
                                    )
                                  })}
                                  {!isManagerMode && !isApproved && <th rowSpan={2} className="px-2 py-2 border-b" />}
                                </tr>
                                <tr>
                                  {vendorColumns.map((col) => (
                                    <Fragment key={col.key}>
                                      <th className="px-2 py-1 text-right font-medium text-gray-600 border-b border-r">Rate</th>
                                      <th className="px-2 py-1 text-right font-medium text-gray-600 border-b border-r">Amount</th>
                                      <th className="px-2 py-1 text-left font-medium text-gray-600 border-b border-r">Lead Time</th>
                                    </Fragment>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {itemLines.map((line) => (
                                  <tr key={line.key} className="border-b hover:bg-gray-50">
                                    <td className="px-3 py-2 border-r">{line.itemName}</td>
                                    <td className="px-3 py-2 border-r font-mono text-xs text-blue-700">{line.productCode || "—"}</td>
                                    <td className="px-3 py-2 border-r">{line.make || "—"}</td>
                                    <td className="px-3 py-2 border-r">{line.uom || "—"}</td>
                                    <td className="px-3 py-2 border-r">{line.qty ?? "—"}</td>
                                    {vendorColumns.map((col) => {
                                      const cell = cells[line.key]?.[col.key] || emptyCell
                                      return (
                                        <Fragment key={`${line.key}-${col.key}`}>
                                          <td className="px-2 py-1 border-r">
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={cell.rate}
                                              readOnly={isManagerMode || isApproved}
                                              onChange={(e) => updateCell(line.key, col.key, "rate", e.target.value)}
                                              className={`w-24 px-2 py-1 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${isManagerMode || isApproved ? "bg-gray-100 text-gray-600" : ""}`}
                                            />
                                          </td>
                                          <td className="px-2 py-1 border-r text-right text-gray-700">
                                            {cellAmount(line, col.key).toFixed(2)}
                                          </td>
                                          <td className="px-2 py-1 border-r">
                                            <input
                                              type="text"
                                              value={cell.leadTime}
                                              readOnly={isManagerMode || isApproved}
                                              onChange={(e) => updateCell(line.key, col.key, "leadTime", e.target.value)}
                                              placeholder="e.g. 7 days"
                                              className={`w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isManagerMode || isApproved ? "bg-gray-100 text-gray-600" : ""}`}
                                            />
                                          </td>
                                        </Fragment>
                                      )
                                    })}
                                    {!isManagerMode && !isApproved && (
                                      <td className="px-2 py-1 text-center">
                                        {itemLines.length > 1 && (
                                          <button onClick={() => removeLine(line.key)} className="p-1 text-red-600 hover:bg-red-50 rounded-md">
                                            <FiTrash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                ))}

                                {fixedLines.map((line) => (
                                  <tr key={line.key} className="border-b bg-gray-50">
                                    <td colSpan={5} className="px-3 py-2 border-r font-medium text-gray-600 italic">
                                      {line.itemName}
                                    </td>
                                    {vendorColumns.map((col) => {
                                      const cell = cells[line.key]?.[col.key] || emptyCell
                                      return (
                                        <Fragment key={`${line.key}-${col.key}`}>
                                          <td colSpan={2} className="px-2 py-1 border-r">
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={cell.rate}
                                              readOnly={isManagerMode || isApproved}
                                              onChange={(e) => updateCell(line.key, col.key, "rate", e.target.value)}
                                              placeholder="Amount"
                                              className={`w-24 px-2 py-1 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${isManagerMode || isApproved ? "bg-gray-100 text-gray-600" : ""}`}
                                            />
                                          </td>
                                          <td className="px-2 py-1 border-r" />
                                        </Fragment>
                                      )
                                    })}
                                    {!isManagerMode && !isApproved && <td />}
                                  </tr>
                                ))}

                                <tr className="bg-amber-50 font-semibold">
                                  <td colSpan={5} className="px-3 py-2 border-r text-right">
                                    Total
                                  </td>
                                  {vendorColumns.map((col) => {
                                    const total = columnTotal(col.key)
                                    const rank = rankByColumnKey[col.key]
                                    return (
                                      <td
                                        key={`${col.key}-total`}
                                        colSpan={3}
                                        className={`px-3 py-2 border-r text-right ${rank ? rankBadgeClass[rank] : ""}`}
                                      >
                                        {total.toFixed(2)}
                                        {rank && <span className="ml-1 text-xs font-normal">(L{rank})</span>}
                                      </td>
                                    )
                                  })}
                                  {!isManagerMode && !isApproved && <td />}
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-6">
                            <label className="block text-sm font-medium text-amber-700 mb-2">Select Vendor:</label>

                            {isApproved && (
                              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-sm text-green-700 font-medium">
                                  ✓ Vendor selection is locked - PM has approved the selected vendor
                                </p>
                              </div>
                            )}
                            <div className="w-full max-w-md relative">
                              <select
                                value={selectedVendorColumnKey}
                                onChange={(e) => setSelectedVendorColumnKey(e.target.value)}
                                disabled={isApproved}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              >
                                <option value="">-- Select Vendor --</option>
                                {vendorColumns
                                  .filter((c) => c.vendorId)
                                  .slice()
                                  .sort((a, b) => columnTotal(a.key) - columnTotal(b.key))
                                  .map((c) => {
                                    const rank = rankByColumnKey[c.key]
                                    return (
                                      <option key={c.key} value={c.key}>
                                        {rank ? `L${rank} — ` : ""}
                                        {c.vendorName} (Total: {columnTotal(c.key).toFixed(2)})
                                      </option>
                                    )
                                  })}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {isManagerMode && comparisonSheetCreated && (
                <div className="p-4 border-t border-amber-200 bg-amber-50 space-y-3">
                  <h5 className="text-md font-semibold text-amber-700">Vendor Approval</h5>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Remarks:</label>
                    <textarea
                      value={pmApprovalRemarks}
                      onChange={(e) => setPmApprovalRemarks(e.target.value)}
                      placeholder="Enter approval remarks for selected vendor..."
                      rows={3}
                      disabled={pmApprovalLoading || isApproved}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            Cancel
          </button>
          {isManagerMode ? (
            comparisonSheetCreated && (
              <button
                onClick={handleApprove}
                disabled={pmApprovalLoading || isApproved || !selectedVendorColumnKey}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isApproved ? "Vendor Approved" : pmApprovalLoading ? "Approving..." : "Approve Selected Vendor"}
              </button>
            )
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || isApproved}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isApproved ? "Vendor Approved - Cannot Modify" : saving ? "Saving..." : "Save Comparison Sheet"}
            </button>
          )}
        </div>
      </motion.div>

      {showAddItemModal && (
        <AddComparisonItemsModal
          excludeMtrIds={itemLines.map((l) => (l.itemKind === "CATEGORY" ? l.boqCategoryMtrId : l.boqMtrId))}
          onClose={() => setShowAddItemModal(false)}
          onAdd={handleAddItems}
        />
      )}
    </motion.div>
  )
}
