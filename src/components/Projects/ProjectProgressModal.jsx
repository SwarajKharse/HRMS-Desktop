"use client"
import { useState } from "react"
import { FiX, FiChevronDown, FiChevronRight } from "react-icons/fi"
import { useEffect } from "react"
import { projectService } from "../../services/projectService"
import { getErrorMessage } from "../../utils/errorUtils"

export default function ProjectProgressModal({ projectId, projectName, isOpen, onClose }) {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [selectedItemId, setSelectedItemId] = useState("")
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10))
  const [sharedQty, setSharedQty] = useState("")
  const [checkedSteps, setCheckedSteps] = useState({}) // { stepId: qtyString }
  const [stagedRows, setStagedRows] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [expandedDates, setExpandedDates] = useState({})

  const userData = JSON.parse(localStorage.getItem("userData") || "{}")
  const enteredByName = [userData?.firstName, userData?.lastName].filter(Boolean).join(" ") || "Unknown"

  const [editingLogId, setEditingLogId] = useState(null)
  const [editQty, setEditQty] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editError, setEditError] = useState("")

  const fetchProgress = () => {
    if (!projectId) return
    setLoading(true)
    setError("")
    projectService.getProjectProgress(projectId)
      .then((data) => setProgress(data))
      .catch(() => setError("Failed to load progress data."))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!isOpen || !projectId) return
    fetchProgress()
    resetForm()
  }, [isOpen, projectId])

  if (!isOpen) return null

  const itemsWithSteps = (progress?.items || []).filter((i) => i.hasProcessDefined)
  const selectedItem = itemsWithSteps.find((i) => i.boqItemId === Number(selectedItemId))

  const resetForm = () => {
    setSelectedItemId("")
    setSharedQty("")
    setCheckedSteps({})
    setStagedRows([])
    setSaveError("")
  }

  // Sum of qty already staged (not yet saved) for this exact item+step, across ALL batches added this session
  const getStagedQtyForStep = (boqItemId, stepId) => {
    return stagedRows
      .filter((r) => r.boqItemId === Number(boqItemId) && r.installationStepId === Number(stepId))
      .reduce((sum, r) => sum + r.qty, 0)
  }

  const isEditable = (log) => {
    const ageHours = (Date.now() - new Date(log.createdAt).getTime()) / (1000 * 60 * 60)
    return ageHours < 48
  }

  // What's actually still available to log right now = server-known remaining, minus anything already staged
  const getAvailableQty = (boqItemId, stepId) => {
    const item = progress?.items?.find((i) => i.boqItemId === Number(boqItemId))
    const step = item?.steps?.find((s) => s.stepId === Number(stepId))
    if (!item || !step) return null
    const serverRemaining = (item.totalQty || 0) - (step.completedQty || 0)
    const staged = getStagedQtyForStep(boqItemId, stepId)
    return Math.max(0, serverRemaining - staged)
  }

  const toggleStep = (stepId) => {
    setCheckedSteps((prev) => {
      const updated = { ...prev }
      if (updated[stepId] !== undefined) {
        delete updated[stepId]
      } else {
        updated[stepId] = "" // blank on check - user or "Apply to checked" fills it in explicitly
      }
      return updated
    })
  }

  const updateStepQty = (stepId, value) => {
    setCheckedSteps((prev) => ({ ...prev, [stepId]: value }))
  }

  // Explicit action - fills the shared qty into every currently checked step (capped to each step's own availability)
  const applyQtyToChecked = () => {
    if (!sharedQty || !selectedItemId) return
    setCheckedSteps((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((stepId) => {
        const available = getAvailableQty(selectedItemId, stepId)
        updated[stepId] = available !== null ? Math.min(Number(sharedQty), available) : Number(sharedQty)
      })
      return updated
    })
  }

  const addToBatch = () => {
    setSaveError("")
    const stepIds = Object.keys(checkedSteps)
    if (!selectedItemId || stepIds.length === 0 || !entryDate) {
      setSaveError("Select an item, at least one process, and a date.")
      return
    }
    for (const stepId of stepIds) {
      const qty = checkedSteps[stepId]
      if (!qty || Number(qty) <= 0) {
        setSaveError("Enter a valid qty for every checked process.")
        return
      }
      const available = getAvailableQty(selectedItemId, stepId)
      if (available !== null && Number(qty) > available) {
        setSaveError(`Qty exceeds what's available (${available}) for one of the checked processes — check what you've already staged below.`)
        return
      }
    }

    const newRows = stepIds.map((stepId) => {
      const step = selectedItem.steps.find((s) => s.stepId === Number(stepId))
      return {
        boqItemId: Number(selectedItemId),
        itemName: selectedItem.itemName,
        installationStepId: Number(stepId),
        stepName: step.stepName,
        qty: Number(checkedSteps[stepId]),
        entryDate,
      }
    })

    setStagedRows([...stagedRows, ...newRows])
    setSelectedItemId("")
    setSharedQty("")
    setCheckedSteps({})
  }

  const removeStagedRow = (index) => {
    setStagedRows(stagedRows.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setSaveError("")
    if (stagedRows.length === 0) return
    try {
      setSaving(true)
      await projectService.saveProjectProgress(projectId, {
        enteredBy: enteredByName,
        entries: stagedRows.map((r) => ({
          boqItemId: r.boqItemId,
          installationStepId: r.installationStepId,
          qty: r.qty,
          entryDate: r.entryDate,
        })),
      })
      resetForm()
      fetchProgress()
    } catch (err) {
      setSaveError(getErrorMessage(err, "Failed to save progress."))
    } finally {
      setSaving(false)
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  const startEdit = (log) => {
    setEditingLogId(log.id)
    setEditQty(log.qty)
    setEditDate(log.entryDate)
    setEditError("")
  }

  const cancelEdit = () => {
    setEditingLogId(null)
    setEditError("")
  }

  const saveEdit = async (logId) => {
    setEditError("")
    if (!editQty || Number(editQty) <= 0) {
      setEditError("Enter a valid qty.")
      return
    }
    try {
      await projectService.editProjectProgressEntry(projectId, logId, {
        qty: Number(editQty),
        entryDate: editDate,
      })
      setEditingLogId(null)
      fetchProgress()
    } catch (err) {
      setEditError(getErrorMessage(err, "Failed to update entry."))
    }
  }
  const deleteEntry = async (logId) => {
    if (!window.confirm("Delete this progress entry? This cannot be undone.")) return
    setEditError("")
    try {
      await projectService.deleteProjectProgressEntry(projectId, logId)
      setEditingLogId(null)
      fetchProgress()
    } catch (err) {
      setEditError(getErrorMessage(err, "Failed to delete entry."))
    }
  }

  const logsByDate = (progress?.logs || []).reduce((acc, log) => {
    if (!acc[log.entryDate]) acc[log.entryDate] = []
    acc[log.entryDate].push(log)
    return acc
  }, {})
  const sortedDates = Object.keys(logsByDate).sort((a, b) => new Date(b) - new Date(a))

  const toggleDate = (date) => {
    setExpandedDates((prev) => ({ ...prev, [date]: !prev[date] }))
  }

  const getProgressMadeForDate = (date) => {
    return round2(logsByDate[date].reduce((sum, log) => sum + (log.overallContributionPercent || 0), 0))
  }
  const round2 = (v) => Math.round(v * 100) / 100

  const sortedDatesAsc = [...sortedDates].sort((a, b) => new Date(a) - new Date(b))
  const totalTillDateMap = {}
  let runningTotal = 0
  sortedDatesAsc.forEach((d) => {
    runningTotal += getProgressMadeForDate(d)
    totalTillDateMap[d] = round2(runningTotal)
  })
  

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b gap-2">
          <h2 className="text-base font-semibold text-blue-900 truncate">
            Project Progress — {projectName || "Project"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none shrink-0">
            <FiX />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">{error}</div>}

          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : progress ? (
            <>
              <div className="bg-blue-50 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Overall Project Progress</span>
                <span className="text-lg font-bold text-blue-700">{progress.overallProgressPercent}%</span>
              </div>

              {/* Add Entry */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Entry</h3>
                {saveError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2 mb-3">
                    {saveError}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <select
                    value={selectedItemId}
                    onChange={(e) => { setSelectedItemId(e.target.value); setCheckedSteps({}); setSharedQty("") }}
                    className="w-full sm:flex-1 px-3 py-3 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Select BOQ Item</option>
                    {itemsWithSteps.map((item) => (
                      <option key={item.boqItemId} value={item.boqItemId}>{item.itemName}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Qty for all"
                    value={sharedQty}
                    onChange={(e) => setSharedQty(e.target.value)}
                    disabled={!selectedItemId}
                    className="w-full sm:w-32 px-3 py-3 border border-gray-300 rounded-md text-sm"
                  />

                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    max={todayStr}
                    className="w-full sm:w-40 px-3 py-3 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                {selectedItem && (
                  <>
                    <div className="flex justify-end mb-3">
                      <button
                        type="button"
                        onClick={applyQtyToChecked}
                        disabled={!sharedQty || Object.keys(checkedSteps).length === 0}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium disabled:opacity-40"
                      >
                        Apply to checked
                      </button>
                    </div>

                    <div className="border rounded-lg divide-y">
                      {selectedItem.steps.map((step) => {
                        const available = getAvailableQty(selectedItemId, step.stepId)
                        const isChecked = checkedSteps[step.stepId] !== undefined
                        const isDone = available !== null && available <= 0

                        return (
                          <div key={step.stepId} className="p-3">
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isDone}
                                onChange={() => toggleStep(step.stepId)}
                                className="w-5 h-5 mt-0.5 shrink-0"
                              />
                              <div className="flex-1">
                                <div className={`text-sm ${isDone ? "text-gray-400 line-through" : "text-gray-800"}`}>
                                  {step.stepName} ({step.percentage}%)
                                </div>
                                <div className="text-xs mt-0.5">
                                  {isDone ? (
                                    <span className="text-green-600 font-medium">Completed</span>
                                  ) : (
                                    <span className="text-gray-500">Available to log: {available}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isChecked && (
                              <input
                                type="number"
                                value={checkedSteps[step.stepId]}
                                onChange={(e) => updateStepQty(step.stepId, e.target.value)}
                                max={available ?? undefined}
                                min="0"
                                placeholder={`Enter qty (max ${available})`}
                                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

                <button
                  onClick={addToBatch}
                  disabled={!selectedItemId}
                  className="w-full mt-3 px-3 py-3 bg-blue-100 text-blue-700 rounded-md text-sm font-medium disabled:opacity-40"
                >
                  + Add to Batch
                </button>

                {stagedRows.length > 0 && (
                  <div className="mt-3 border rounded-lg p-3 bg-gray-50">
                    <div className="text-xs font-medium text-gray-500 mb-2">Staged entries (not saved yet):</div>
                    {stagedRows.map((row, index) => (
                      <div key={index} className="flex items-center justify-between text-sm py-1.5 border-b last:border-b-0">
                        <span className="flex-1">{row.entryDate} — {row.itemName} — {row.stepName} — Qty {row.qty}</span>
                        <button onClick={() => removeStagedRow(index)} className="text-red-500 hover:text-red-700 text-xs px-2 shrink-0">
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleSubmit}
                      disabled={saving}
                      className="w-full mt-3 px-3 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {saving ? "Saving..." : `Save ${stagedRows.length} Entries`}
                    </button>
                  </div>
                )}
              </div>

              {/* Progress History */}
              <div className="border-t pt-4 space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Progress History</h3>
                {sortedDates.length === 0 ? (
                  <div className="text-sm text-gray-400 border border-dashed border-gray-300 rounded-md px-3 py-6 text-center">
                    No progress logged yet.
                  </div>
                ) : (
                  sortedDates.map((date) => {
                    const isExpanded = !!expandedDates[date]
                    const progressMade = getProgressMadeForDate(date)
                    const totalTillDate = totalTillDateMap[date]
                    return (
                      <div key={date} className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleDate(date)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-3 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 text-left"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            {isExpanded ? <FiChevronDown className="shrink-0" /> : <FiChevronRight className="shrink-0" />}
                            <span className="text-sm font-semibold text-gray-800 truncate">Progress on {date}</span>
                          </span>
                          <span className="flex items-center gap-2 shrink-0">
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                              +{progressMade}% today
                            </span>
                            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                              {totalTillDate}% total
                            </span>
                          </span>
                        </button>

                        {isExpanded && (
                          <>
                            {/* Desktop: table */}
                            <table className="hidden md:table min-w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left">Item</th>
                                  <th className="px-3 py-2 text-left">Process</th>
                                  <th className="px-3 py-2 text-left">Qty</th>
                                  <th className="px-3 py-2 text-left">This Addition</th>
                                  <th className="px-3 py-2 text-left">Item Total</th>
                                  <th className="px-3 py-2 text-left">Entered By</th>
                                </tr>
                              </thead>
                              <tbody>
                                {logsByDate[date].map((log) => (
                                  editingLogId === log.id ? (
                                    <tr key={log.id} className="border-t bg-yellow-50">
                                      <td className="px-3 py-2 font-medium text-gray-900" colSpan={6}>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-sm">{log.itemName} — {log.stepName}</span>
                                          <input
                                            type="number"
                                            value={editQty}
                                            onChange={(e) => setEditQty(e.target.value)}
                                            className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                          />
                                          <input
                                            type="date"
                                            value={editDate}
                                            max={todayStr}
                                            onChange={(e) => setEditDate(e.target.value)}
                                            className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                                          />
                                          <button onClick={() => saveEdit(log.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium">
                                            Save
                                          </button>
                                          <button onClick={cancelEdit} className="px-3 py-1 border border-gray-300 rounded text-xs font-medium">
                                            Cancel
                                          </button>
                                          <button onClick={() => deleteEntry(log.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                                            Remove
                                          </button>
                                          {editError && <span className="text-red-600 text-xs w-full">{editError}</span>}
                                        </div>
                                      </td>
                                    </tr>
                                  ) : (
                                    <tr key={log.id} className="border-t">
                                      <td className="px-3 py-2 font-medium text-gray-900">{log.itemName}</td>
                                      <td className="px-3 py-2 text-gray-600">{log.stepName}</td>
                                      <td className="px-3 py-2">{log.qty}</td>
                                      <td className="px-3 py-2">
                                        <span className="text-green-700 font-semibold">+{log.itemDeltaPercent}%</span>
                                      </td>
                                      <td className="px-3 py-2">
                                        <span className="text-indigo-700 font-semibold">{log.cumulativeItemProgressPercent}%</span>
                                      </td>
                                      <td className="px-3 py-2 text-gray-600 flex items-center justify-between gap-2">
                                        {log.enteredBy}
                                        {isEditable(log) && (
                                          <button onClick={() => startEdit(log)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                                            Edit
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  )
                                ))}
                              </tbody>
                            </table>

                            {/* Mobile: cards */}
                            <div className="md:hidden divide-y">
                              {logsByDate[date].map((log) => (
                                editingLogId === log.id ? (
                                  <div key={log.id} className="px-3 py-3 bg-yellow-50 space-y-2">
                                    <div className="text-sm font-medium">{log.itemName} — {log.stepName}</div>
                                    <input
                                      type="number"
                                      value={editQty}
                                      onChange={(e) => setEditQty(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    />
                                    <input
                                      type="date"
                                      value={editDate}
                                      max={todayStr}
                                      onChange={(e) => setEditDate(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    />
                                    {editError && <div className="text-red-600 text-xs">{editError}</div>}
                                    <div className="flex gap-2">
                                      <button onClick={() => saveEdit(log.id)} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium">
                                        Save
                                      </button>
                                      <button onClick={cancelEdit} className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium">
                                        Cancel
                                      </button>
                                    </div>
                                    <button onClick={() => deleteEntry(log.id)} className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium">
                                      Remove Entry
                                    </button>
                                  </div>
                                ) : (
                                  <div key={log.id} className="px-3 py-2.5">
                                    <div className="flex items-start justify-between">
                                      <div className="font-medium text-gray-900 text-sm">{log.itemName}</div>
                                      {isEditable(log) && (
                                        <button onClick={() => startEdit(log)} className="text-blue-600 text-xs font-medium shrink-0">
                                          Edit
                                        </button>
                                      )}
                                    </div>
                                    <div className="text-gray-600 text-sm">{log.stepName} — Qty {log.qty}</div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded font-semibold">
                                        +{log.itemDeltaPercent}% this entry
                                      </span>
                                      <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold">
                                        {log.cumulativeItemProgressPercent}% item total
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">By {log.enteredBy}</div>
                                  </div>
                                )
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 px-4 py-3 border-t">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}