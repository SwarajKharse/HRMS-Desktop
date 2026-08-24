"use client"

import { useState, useEffect, useCallback } from "react"
import { paymentTransactionService } from "../../services/paymentTransactionService"
import { purchaseInvoiceService } from "../../services/purchaseInvoiceService"
import { useAuth } from "../../contexts/AuthContext"
import WeekdayDatePicker from "../Purchase/PurchaserComponents/WeekdayDatePicker"

const formatDate = (d) => {
  if (!d) return "N/A"
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}
const toISODate = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}
const money = (n) => `₹${(Number(n) || 0).toFixed(2)}`

const StatusBadge = ({ status }) => {
  const color = status === "APPROVED" || status === "PAID" ? "bg-green-100 text-green-800"
    : status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${color}`}>{status || "PENDING"}</span>
}

// Shared "Payment Calendar" page for AM, Accountant, and FM — one component, role prop
// swaps which actions are available:
//  - AM: approve/reject requested amounts (Step 2), reschedule pending balances
//  - FM: approve/reject AM-approved amounts (final financial gate)
//  - AM/Accountant: upload payment advice once FM has approved (Step 3)
export default function PaymentCalendarPage({ role }) {
  const { user } = useAuth()
  const currentUserId = user?.userId || user?.id

  const [viewMonth, setViewMonth] = useState(new Date())
  const [summaryByDate, setSummaryByDate] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [dayList, setDayList] = useState([])
  const [dayLoading, setDayLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  const [editAmounts, setEditAmounts] = useState({}) // { [txnId]: value }
  const [remarks, setRemarks] = useState({}) // { [txnId]: value }
  const [paymentForms, setPaymentForms] = useState({}) // { [txnId]: { date, file } }

  // Tab 1 = Step 1 + Step 2 ("Payment Requests"), Tab 2 = Step 3 ("Payment Execution").
  const [activeTab, setActiveTab] = useState("requests")

  // "Take from another date" picker — Previous / Future tabs of Step-1-done requests
  // that AM/Accountant can pull onto the currently open date.
  const [showPendingPicker, setShowPendingPicker] = useState(false)
  const [pendingTab, setPendingTab] = useState("previous")
  const [pendingList, setPendingList] = useState([])
  const [pendingLoading, setPendingLoading] = useState(false)

  // Step 1 — assign a payment cycle to each unscheduled (virtual) request shown on the
  // tile for its expected date. { [key]: { cycle, amount } }
  const [step1Forms, setStep1Forms] = useState({})
  const [paymentCycles, setPaymentCycles] = useState([])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: "", text: "" }), 4000)
  }

  const fetchCalendar = useCallback(async () => {
    setLoading(true)
    try {
      const year = viewMonth.getFullYear(), month = viewMonth.getMonth()
      const start = toISODate(new Date(year, month, 1))
      const end = toISODate(new Date(year, month + 1, 0))
      const days = await paymentTransactionService.getCalendar(start, end)
      const map = {}
      days.forEach((d) => { map[d.date] = d })
      setSummaryByDate(map)
    } catch (e) {
      console.error("Error loading payment calendar:", e)
      showMessage("error", e?.response?.data?.message || e?.message || "Failed to load payment calendar")
    } finally {
      setLoading(false)
    }
  }, [viewMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchCalendar() }, [fetchCalendar])

  useEffect(() => {
    purchaseInvoiceService.getPaymentCycles()
      .then((list) => setPaymentCycles([...(list || []).map((c) => c.day), "Urgent"]))
      .catch(() => setPaymentCycles(["Urgent"]))
  }, [])

  const rowKey = (t) => t.id ?? `virtual-${t.type}-${t.piId ?? t.grnId}`

  const openDate = async (iso) => {
    setSelectedDate(iso)
    setDayLoading(true)
    try {
      const list = await paymentTransactionService.getByDate(iso)
      setDayList(list)
      const amts = {}
      const s1 = {}
      list.forEach((t) => {
        amts[rowKey(t)] = role === "FM" ? (t.amApprovedAmount ?? t.requestedAmount) : (t.requestedAmount ?? "")
        if (!t.paymentCycle) s1[rowKey(t)] = { status: "Approve", cycle: "", date: t.scheduledDate || "", amount: t.requestedAmount ?? "" }
      })
      setEditAmounts(amts)
      setStep1Forms(s1)
    } catch (e) {
      console.error("Error loading day payments:", e)
      showMessage("error", e?.response?.data?.message || e?.message || "Failed to load payments for this date")
      setDayList([])
    } finally {
      setDayLoading(false)
    }
  }

  const refreshDay = async () => {
    if (selectedDate) await openDate(selectedDate)
    fetchCalendar()
  }

  const handleAmDecision = async (txn, decision) => {
    try {
      await paymentTransactionService.amApprove(txn.id, {
        decision,
        approvedAmount: decision === "APPROVED" ? Number(editAmounts[txn.id]) : null,
        remarks: remarks[txn.id] || "",
        userId: currentUserId,
      })
      showMessage("success", `${txn.type} ${txn.number} ${decision.toLowerCase()} by AM`)
      refreshDay()
    } catch (e) {
      showMessage("error", e?.response?.data?.message || "Failed to update AM approval")
    }
  }

  const handleFmDecision = async (txn, decision) => {
    try {
      await paymentTransactionService.fmApprove(txn.id, {
        decision,
        approvedAmount: decision === "APPROVED" ? Number(editAmounts[txn.id]) : null,
        remarks: remarks[txn.id] || "",
        userId: currentUserId,
      })
      showMessage("success", `${txn.type} ${txn.number} ${decision.toLowerCase()} by Finance`)
      refreshDay()
    } catch (e) {
      showMessage("error", e?.response?.data?.message || "Failed to update Finance approval")
    }
  }

  const handleCompletePayment = async (txn) => {
    const form = paymentForms[txn.id] || {}
    if (!form.date) {
      showMessage("error", "Select a payment done date first")
      return
    }
    try {
      await paymentTransactionService.completePayment(txn.id, {
        paymentDoneDate: form.date, file: form.file, userId: currentUserId,
      })
      showMessage("success", `Payment completed for ${txn.type} ${txn.number}`)
      refreshDay()
    } catch (e) {
      showMessage("error", e?.response?.data?.message || "Failed to complete payment")
    }
  }

  const handleMarkNotPaid = async (txn) => {
    try {
      await paymentTransactionService.markNotPaid(txn.id, { remarks: remarks[txn.id] || "", userId: currentUserId })
      showMessage("success", `${txn.type} ${txn.number} marked not paid — sent back to the pending list`)
      refreshDay()
    } catch (e) {
      showMessage("error", e?.response?.data?.message || "Failed to mark as not paid")
    }
  }

  const handleRaiseToFm = async () => {
    const raisable = dayList.filter((t) => t.amApprovalStatus === "APPROVED" && !t.raisedToFm)
    if (raisable.length === 0) {
      showMessage("error", "Nothing new to raise — everything AM-approved has already been sent to Finance")
      return
    }
    try {
      await paymentTransactionService.raiseToFm(raisable.map((t) => t.id), currentUserId)
      showMessage("success", `Raised ${raisable.length} payment request(s) to Finance`)
      refreshDay()
    } catch (e) {
      showMessage("error", e?.response?.data?.message || "Failed to raise request to Finance")
    }
  }

  const openPendingPicker = async (tab = pendingTab) => {
    setShowPendingPicker(true)
    setPendingTab(tab)
    setPendingLoading(true)
    try {
      const list = await paymentTransactionService.getAround(selectedDate, tab)
      setPendingList(list)
    } catch (e) {
      console.error("Error loading scheduled payments:", e)
      showMessage("error", e?.response?.data?.message || e?.message || "Failed to load payments")
    } finally {
      setPendingLoading(false)
    }
  }

  const takeToDate = async (txn) => {
    if (!selectedDate) return
    try {
      await paymentTransactionService.move(txn.id, { scheduledDate: selectedDate, userId: currentUserId })
      showMessage("success", `${txn.type} ${txn.number} moved to ${formatDate(selectedDate)}`)
      openPendingPicker(pendingTab)
      refreshDay()
    } catch (e) {
      showMessage("error", e?.response?.data?.message || "Failed to move payment")
    }
  }

  // Step 1 — the full accountant form: status, payment cycle, expected date, amount.
  // "Revision from Purchase" sends it back to the purchaser and skips scheduling.
  const handleStep1Save = async (t) => {
    const key = rowKey(t)
    const form = step1Forms[key] || {}
    const isRevision = form.status === "Revision from Purchase"
    if (!form.status) {
      showMessage("error", "Select a status")
      return
    }
    if (!isRevision) {
      if (!form.cycle) { showMessage("error", "Select a payment cycle"); return }
      if (!form.date) { showMessage("error", "Select an expected payment date"); return }
      if (!form.amount || Number(form.amount) <= 0) { showMessage("error", "Enter a valid amount"); return }
    }
    try {
      await paymentTransactionService.step1({
        txnId: t.virtual ? null : t.id,
        piId: t.type === "PI" ? t.piId : null,
        grnId: t.type === "GRN" ? t.grnId : null,
        status: form.status,
        paymentCycle: isRevision ? null : form.cycle,
        scheduledDate: isRevision ? null : form.date,
        amount: isRevision ? null : Number(form.amount),
        userId: currentUserId,
      })
      showMessage("success", isRevision ? `${t.type} ${t.number} sent back for revision` : `${t.type} ${t.number} — payment details saved`)
      refreshDay()
    } catch (e) {
      showMessage("error", e?.response?.data?.message || "Failed to save payment details")
    }
  }

  // ── Month grid ──────────────────────────────────────────────────────────
  const year = viewMonth.getFullYear(), month = viewMonth.getMonth()
  const startOffset = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  // Anything without a payment cycle needs Step 1 — whether it's a virtual (never-scheduled)
  // item, or a real transaction AM rejected and sent back for re-editing.
  const step1PendingList = dayList.filter((t) => !t.paymentCycle)
  const scheduledList = dayList.filter((t) => t.paymentCycle)

  const dayTotals = scheduledList.reduce((acc, t) => {
    acc.requested += t.requestedAmount || 0
    acc.am += t.amApprovalStatus === "APPROVED" ? (t.amApprovedAmount || 0) : 0
    acc.fm += t.fmApprovalStatus === "APPROVED" ? (t.fmApprovedAmount || 0) : 0
    return acc
  }, { requested: 0, am: 0, fm: 0 })

  // Tab 2 ("Payment Execution") is the final payment sheet for the day — only what
  // Finance has approved shows up here, regardless of role.
  const executionList = scheduledList.filter((t) => t.fmApprovalStatus === "APPROVED")
  const raisableCount = scheduledList.filter((t) => t.amApprovalStatus === "APPROVED" && !t.raisedToFm).length

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold text-blue-700">Payment Calendar</h2>
            <p className="text-sm text-gray-500 mt-1">
              {role === "FM" ? "Finance approval of AM-approved payments" : "Payment requests scheduled by cycle date"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMonth(new Date(year, month - 1, 1))} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50">‹ Prev</button>
            <span className="text-sm font-medium text-gray-700 w-32 text-center">{viewMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
            <button onClick={() => setViewMonth(new Date(year, month + 1, 1))} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50">Next ›</button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading calendar...</div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-gray-500 pb-1">{d}</div>
              ))}
              {cells.map((date, i) => {
                if (!date) return <div key={i} />
                const iso = toISODate(date)
                const s = summaryByDate[iso]
                const hasData = s && (s.requestedTotal > 0 || s.amApprovedTotal > 0 || s.fmApprovedTotal > 0 || s.pendingTotal > 0)
                return (
                  <button
                    key={i}
                    onClick={() => openDate(iso)}
                    className={`text-left p-2 rounded-lg border min-h-[7.5rem] overflow-hidden text-[10px] leading-tight transition-colors ${
                      selectedDate === iso ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-blue-300"
                    } ${hasData ? "bg-blue-50/40" : "bg-white"}`}
                  >
                    <div className="text-xs font-semibold text-gray-700 mb-1">{date.getDate()}</div>
                    {hasData ? (
                      <div className="space-y-0.5">
                        <div className="text-gray-500">Expected: <span className="font-medium text-gray-800">{money(s.requestedTotal)}</span></div>
                        <div className="text-blue-600">Approved by AM: <span className="font-medium">{money(s.amApprovedTotal)}</span></div>
                        <div className="text-green-700">Approved by FM: <span className="font-medium">{money(s.fmApprovedTotal)}</span></div>
                        <div className="text-red-600">Pending: <span className="font-medium">{money(s.pendingTotal)}</span></div>
                      </div>
                    ) : (
                      <div className="text-gray-300">No payments</div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4" onClick={() => setSelectedDate(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Payments on {formatDate(selectedDate)}</h3>
              <div className="flex items-center gap-2">
                {(role === "AM" || role === "ACCOUNTANT") && (
                  <button onClick={() => openPendingPicker("previous")} className="px-3 py-1.5 bg-amber-600 text-white rounded-md text-xs font-medium hover:bg-amber-700">
                    + Take from Another Date
                  </button>
                )}
                <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-gray-600 text-sm">Close</button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("requests")}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === "requests" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Payment Requests
              </button>
              <button
                onClick={() => setActiveTab("execution")}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === "execution" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Payment Execution {executionList.length > 0 ? `(${executionList.length})` : ""}
              </button>
            </div>

            {dayLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : activeTab === "requests" ? (
              dayList.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No payments scheduled on this date.</div>
              ) : (
                <>
                  {step1PendingList.length > 0 && (
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
                        Step 1 — Assign Payment Cycle ({step1PendingList.length})
                      </p>
                      <div className="overflow-x-auto rounded-lg border border-amber-200">
                        <table className="w-full text-sm">
                          <thead className="bg-amber-50 border-b border-amber-200">
                            <tr>
                              {["Vendor", "PO", "PI / GRN", "Status", "Amount", "Payment Cycle", "Expected Date", ""].map((h) => (
                                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-amber-100 bg-white">
                            {step1PendingList.map((t) => {
                              const key = rowKey(t)
                              const form = step1Forms[key] || {}
                              const isRevision = form.status === "Revision from Purchase"
                              return (
                                <tr key={key} className="hover:bg-amber-50/50">
                                  <td className="px-3 py-3 font-medium text-gray-900">{t.vendorName || "N/A"}</td>
                                  <td className="px-3 py-3">
                                    {t.poFileUrl ? <a href={t.poFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{t.poNumber}</a> : t.poNumber}
                                  </td>
                                  <td className="px-3 py-3">
                                    <span className="text-[10px] text-gray-500 block">{t.type}</span>
                                    {t.itemUrl ? <a href={t.itemUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{t.number}</a> : t.number}
                                    {t.amApprovalStatus === "REJECTED" && (
                                      <div className="mt-1">
                                        <StatusBadge status="REJECTED" />
                                        {t.amRemarks && <p className="text-[10px] text-red-600 italic mt-0.5">"{t.amRemarks}"</p>}
                                      </div>
                                    )}
                                    {t.amApprovalStatus !== "REJECTED" && t.paymentRemarks && (
                                      <div className="mt-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-800">NOT PAID — redo from Step 1</span>
                                        <p className="text-[10px] text-red-600 italic mt-0.5">"{t.paymentRemarks}"</p>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-3">
                                    <select value={form.status || ""} onChange={(e) => setStep1Forms((p) => ({ ...p, [key]: { ...p[key], status: e.target.value } }))}
                                      className="h-8 rounded border border-gray-300 px-2 text-sm">
                                      <option value="">Select</option>
                                      <option value="Approve">Approve</option>
                                      <option value="In progress">In progress</option>
                                      <option value="Revision from Purchase">Revision from Purchase</option>
                                    </select>
                                  </td>
                                  <td className="px-3 py-3">
                                    <input type="number" step="0.01" value={form.amount ?? ""} disabled={isRevision}
                                      onChange={(e) => setStep1Forms((p) => ({ ...p, [key]: { ...p[key], amount: e.target.value } }))}
                                      className="w-24 h-8 rounded border border-gray-300 px-2 text-right text-sm disabled:bg-gray-100" />
                                  </td>
                                  <td className="px-3 py-3">
                                    <select value={form.cycle || ""} disabled={isRevision}
                                      onChange={(e) => setStep1Forms((p) => ({ ...p, [key]: { ...p[key], cycle: e.target.value, date: "" } }))}
                                      className="h-8 rounded border border-gray-300 px-2 text-sm disabled:bg-gray-100">
                                      <option value="">Select</option>
                                      {paymentCycles.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                  </td>
                                  <td className="px-3 py-3">
                                    <WeekdayDatePicker
                                      value={form.date || ""}
                                      onChange={(iso) => setStep1Forms((p) => ({ ...p, [key]: { ...p[key], date: iso } }))}
                                      allowedWeekday={form.cycle && form.cycle !== "Urgent" ? form.cycle : null}
                                      minDate={new Date().toISOString().split("T")[0]}
                                      disabled={isRevision || !form.cycle}
                                    />
                                  </td>
                                  <td className="px-3 py-3">
                                    <button onClick={() => handleStep1Save(t)} className="px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700">Save</button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {role === "AM" && scheduledList.length > 0 && (
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={handleRaiseToFm}
                        disabled={raisableCount === 0}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-xs font-medium hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Raise Request to Finance {raisableCount > 0 ? `(${raisableCount})` : ""}
                      </button>
                    </div>
                  )}
                  {scheduledList.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          {["Vendor", "PO", "PI / GRN", "Requested", "AM Approved", "Raised", "Finance Approved"].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {scheduledList.map((t) => {
                          const canEditAm = role === "AM" && t.amApprovedAmountEditable !== false && t.requestedAmountEditable !== false
                          const canEditFm = role === "FM" && t.fmApprovedAmountEditable !== false
                          return (
                            <tr key={t.id} className="hover:bg-gray-50">
                              <td className="px-3 py-3 font-medium text-gray-900">{t.vendorName || "N/A"}</td>
                              <td className="px-3 py-3">
                                {t.poFileUrl ? <a href={t.poFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{t.poNumber}</a> : t.poNumber}
                              </td>
                              <td className="px-3 py-3">
                                <span className="text-[10px] text-gray-500 block">{t.type}</span>
                                {t.itemUrl ? <a href={t.itemUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{t.number}</a> : t.number}
                              </td>
                              <td className="px-3 py-3 font-medium">{money(t.requestedAmount)}</td>
                              <td className="px-3 py-3">
                                {role === "AM" && canEditAm ? (
                                  <div className="flex flex-col gap-1">
                                    <input type="number" step="0.01" value={editAmounts[t.id] ?? ""} onChange={(e) => setEditAmounts((p) => ({ ...p, [t.id]: e.target.value }))}
                                      className="w-24 h-8 rounded border border-gray-300 px-2 text-right text-sm" />
                                    <input type="text" placeholder="Remark (optional)" value={remarks[t.id] || ""} onChange={(e) => setRemarks((p) => ({ ...p, [t.id]: e.target.value }))}
                                      className="w-32 h-7 rounded border border-gray-300 px-1.5 text-xs" />
                                    <div className="flex gap-1">
                                      <button onClick={() => handleAmDecision(t, "APPROVED")} className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Approve</button>
                                      <button onClick={() => handleAmDecision(t, "REJECTED")} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Reject</button>
                                    </div>
                                  </div>
                                ) : (
                                  <span className={t.amApprovalStatus === "APPROVED" ? "text-green-700 font-medium" : "text-gray-400"}>
                                    {t.amApprovalStatus === "APPROVED" ? money(t.amApprovedAmount) : "—"}
                                  </span>
                                )}
                                <div className="mt-1"><StatusBadge status={t.amApprovalStatus} /></div>
                              </td>
                              <td className="px-3 py-3">
                                {t.amApprovalStatus === "APPROVED" ? (
                                  t.raisedToFm
                                    ? <span className="text-purple-700 text-xs font-medium">✓ Raised</span>
                                    : <span className="text-gray-400 text-xs">Not raised</span>
                                ) : <span className="text-gray-300 text-xs">—</span>}
                              </td>
                              <td className="px-3 py-3">
                                {!t.raisedToFm ? (
                                  <span className="text-xs text-gray-400">Awaiting AM request</span>
                                ) : role === "FM" && canEditFm ? (
                                  <div className="flex flex-col gap-1">
                                    <input type="number" step="0.01" value={editAmounts[t.id] ?? ""} onChange={(e) => setEditAmounts((p) => ({ ...p, [t.id]: e.target.value }))}
                                      className="w-24 h-8 rounded border border-gray-300 px-2 text-right text-sm" />
                                    <input type="text" placeholder="Remark (optional)" value={remarks[t.id] || ""} onChange={(e) => setRemarks((p) => ({ ...p, [t.id]: e.target.value }))}
                                      className="w-32 h-7 rounded border border-gray-300 px-1.5 text-xs" />
                                    <div className="flex gap-1">
                                      <button onClick={() => handleFmDecision(t, "APPROVED")} className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Approve</button>
                                      <button onClick={() => handleFmDecision(t, "REJECTED")} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Reject</button>
                                    </div>
                                    <div className="mt-1"><StatusBadge status={t.fmApprovalStatus} /></div>
                                  </div>
                                ) : (
                                  <>
                                    <span className={t.fmApprovalStatus === "APPROVED" ? "text-green-700 font-medium" : "text-gray-400"}>
                                      {t.fmApprovalStatus === "APPROVED" ? money(t.fmApprovedAmount) : "—"}
                                    </span>
                                    <div className="mt-1"><StatusBadge status={t.fmApprovalStatus} /></div>
                                  </>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50 font-semibold">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-right">Total</td>
                          <td className="px-3 py-2">{money(dayTotals.requested)}</td>
                          <td className="px-3 py-2">{money(dayTotals.am)}</td>
                          <td />
                          <td className="px-3 py-2">{money(dayTotals.fm)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  )}
                </>
              )
            ) : executionList.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Nothing Finance-approved for this date yet.</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {["Vendor", "PO", "PI / GRN", "Finance Approved Amount", "Payment Advice", "Status"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {executionList.map((t) => {
                      const canAct = (role === "AM" || role === "ACCOUNTANT") && t.paymentStatus !== "PAID" && t.paymentStatus !== "NOT_PAID"
                      return (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-3 py-3 font-medium text-gray-900">{t.vendorName || "N/A"}</td>
                          <td className="px-3 py-3">
                            {t.poFileUrl ? <a href={t.poFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{t.poNumber}</a> : t.poNumber}
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-[10px] text-gray-500 block">{t.type}</span>
                            {t.itemUrl ? <a href={t.itemUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{t.number}</a> : t.number}
                          </td>
                          <td className="px-3 py-3 font-medium text-green-700">{money(t.fmApprovedAmount)}</td>
                          <td className="px-3 py-3">
                            {canAct ? (
                              <div className="flex flex-col gap-1">
                                <input type="date" value={paymentForms[t.id]?.date || ""} onChange={(e) => setPaymentForms((p) => ({ ...p, [t.id]: { ...p[t.id], date: e.target.value } }))}
                                  className="h-7 rounded border border-gray-300 px-1.5 text-xs" />
                                <input type="file" onChange={(e) => setPaymentForms((p) => ({ ...p, [t.id]: { ...p[t.id], file: e.target.files?.[0] } }))}
                                  className="text-[10px]" />
                                <input type="text" placeholder="Remark (optional)" value={remarks[t.id] || ""} onChange={(e) => setRemarks((p) => ({ ...p, [t.id]: e.target.value }))}
                                  className="w-36 h-7 rounded border border-gray-300 px-1.5 text-xs" />
                                <div className="flex gap-1">
                                  <button onClick={() => handleCompletePayment(t)} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700">Mark Paid</button>
                                  <button onClick={() => handleMarkNotPaid(t)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Not Paid</button>
                                </div>
                              </div>
                            ) : (
                              t.paymentReceiptUrl && (
                                <a href={t.paymentReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-xs">View Advice</a>
                              )
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <StatusBadge status={t.paymentStatus} />
                            {t.paymentStatus === "NOT_PAID" && <p className="text-[10px] text-red-500 mt-1">Sent back to pending list</p>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>
        )}
      </div>

      {showPendingPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowPendingPicker(false)}>
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Take a Payment onto {selectedDate ? formatDate(selectedDate) : "this date"}</h3>
              <button onClick={() => setShowPendingPicker(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="flex gap-2 px-4 pt-3 border-b border-gray-100">
              <button
                onClick={() => openPendingPicker("previous")}
                className={`px-3 py-1.5 text-sm font-medium border-b-2 -mb-px ${pendingTab === "previous" ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Previous
              </button>
              <button
                onClick={() => openPendingPicker("future")}
                className={`px-3 py-1.5 text-sm font-medium border-b-2 -mb-px ${pendingTab === "future" ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Future
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {pendingLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : pendingList.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No {pendingTab} payments with Step 1 completed.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="pb-2">Vendor / PO / PI-GRN</th>
                      <th className="pb-2">Scheduled Date</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingList.map((t) => (
                      <tr key={t.id}>
                        <td className="py-2">
                          <div className="font-medium">{t.vendorName || "N/A"}</div>
                          <div className="text-xs text-gray-500">{t.poNumber} · {t.type} {t.number}</div>
                        </td>
                        <td className="py-2 text-xs text-gray-500">{formatDate(t.scheduledDate)} · {t.paymentCycle}</td>
                        <td className="py-2 text-xs text-gray-700">{money(t.requestedAmount)}</td>
                        <td className="py-2">
                          <StatusBadge status={t.amApprovalStatus === "APPROVED" ? (t.fmApprovalStatus === "APPROVED" ? "FM Approved" : "AM Approved") : t.amApprovalStatus} />
                        </td>
                        <td className="py-2">
                          <button
                            disabled={!selectedDate}
                            title={!selectedDate ? "Select a date on the calendar first" : ""}
                            onClick={() => takeToDate(t)}
                            className="px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 disabled:opacity-50"
                          >
                            Take to {selectedDate ? formatDate(selectedDate) : "date"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
