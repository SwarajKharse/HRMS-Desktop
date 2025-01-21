import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FiX, FiAlertCircle } from "react-icons/fi"
import { shiftService } from "../../services/shiftService"

function ShiftForm({ shift, orgId, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    endTime: "",
    graceTime: 0,
    graceTimeUnit: "MINUTES",
    shiftAllowance: false,
    shiftAllowanceAmount: 0,
    org: {
      id: orgId,
    },
    weekends: [],
  })

  const [weekendConfig, setWeekendConfig] = useState({
    weekendGrid: {
      Sunday: ["all", "1st", "2nd", "3rd", "4th", "5th"],
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: ["all", "1st", "2nd", "3rd", "4th", "5th"],
    },
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (shift) {
      setFormData({
        ...shift,
        startTime: shift.startTime.substring(0, 5),
        endTime: shift.endTime.substring(0, 5),
      })

      // Process weekends into grid format
      const grid = {
        Sunday: [],
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
      }

      shift.weekends?.forEach((weekend) => {
        if (!grid[weekend.dayOfWeek]) grid[weekend.dayOfWeek] = []
        grid[weekend.dayOfWeek].push(weekend.weekOccurrence.toLowerCase())
      })

      setWeekendConfig((prev) => ({
        ...prev,
        weekendGrid: grid,
      }))
    }
  }, [shift])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number.parseFloat(value) || 0 : value,
    }))
    if (error) setError("")
  }

  const toggleWeekend = (day, occurrence) => {
    setWeekendConfig((prev) => {
      const grid = { ...prev.weekendGrid }
      const dayWeekends = [...grid[day]]

      if (occurrence === "all") {
        // If 'all' is being added, add all occurrences
        if (!dayWeekends.includes("all")) {
          grid[day] = ["all", "1st", "2nd", "3rd", "4th", "5th"]
        } else {
          grid[day] = []
        }
      } else {
        // Handle individual occurrence
        const index = dayWeekends.indexOf(occurrence)
        if (index === -1) {
          dayWeekends.push(occurrence)
          // If all individual occurrences are selected, add 'all'
          if (dayWeekends.length === 5) {
            dayWeekends.push("all")
          }
        } else {
          dayWeekends.splice(index, 1)
          // Remove 'all' if any individual occurrence is removed
          const allIndex = dayWeekends.indexOf("all")
          if (allIndex !== -1) {
            dayWeekends.splice(allIndex, 1)
          }
        }
        grid[day] = dayWeekends
      }

      return {
        ...prev,
        weekendGrid: grid,
      }
    })
  }

  const processWeekendsForSubmission = () => {
    const weekends = []
    Object.entries(weekendConfig.weekendGrid).forEach(([day, occurrences]) => {
      occurrences.forEach((occurrence) => {
        if (occurrence !== "all") {
          weekends.push({
            dayOfWeek: day,
            weekOccurence: occurrence.toUpperCase(),
          })
        }
      })
    })
    return weekends
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const weekends = processWeekendsForSubmission()
      const submitData = {
        ...formData,
        weekends,
      }

      if (shift?.id) {
        await shiftService.updateShift(shift.id, submitData)
      } else {
        await shiftService.createShift(submitData)
      }

      if (onSubmit) await onSubmit()
      onClose()
    } catch (err) {
      setError(err.message || "Failed to save shift")
      window.scrollTo(0, 0)
    } finally {
      setLoading(false)
    }
  }

  const weekOccurrences = ["all", "1st", "2nd", "3rd", "4th", "5th"]
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">{shift ? "Edit Shift" : "Add New Shift"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FiX size={20} />
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="m-4 bg-red-50 text-red-500 p-4 rounded-md flex items-center"
          >
            <FiAlertCircle className="mr-2" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Shift Information */}
          <div className="space-y-4 rounded-lg bg-gray-50 p-4">
            <h3 className="font-semibold text-lg border-b pb-2">Shift Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shift Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="startTime"
                  required
                  value={formData.startTime}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="endTime"
                  required
                  value={formData.endTime}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Grace Time</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="graceTime"
                    min="0"
                    value={formData.graceTime}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                  <select
                    name="graceTimeUnit"
                    value={formData.graceTimeUnit}
                    onChange={handleChange}
                    className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="MINUTES">Minutes</option>
                    <option value="HOURS">Hours</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="shiftAllowance"
                  name="shiftAllowance"
                  checked={formData.shiftAllowance}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="shiftAllowance" className="ml-2 block text-sm text-gray-700">
                  Enable Shift Allowance
                </label>
              </div>
              {formData.shiftAllowance && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="shiftAllowanceAmount"
                    value={formData.shiftAllowanceAmount}
                    onChange={handleChange}
                    placeholder="Amount"
                    className="block w-32 rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Weekend Configuration */}
          <div className="space-y-4 rounded-lg bg-white border p-4">
            <h3 className="font-semibold text-lg border-b pb-2">Weekend Configuration</h3>

            {/* Weekend Grid */}
            <div className="mt-6 bg-gray-50 rounded-lg overflow-hidden">
              <div className="grid grid-cols-[200px_repeat(6,1fr)] gap-px bg-gray-200">
                {/* Header */}
                <div className="bg-gray-50 p-3">
                  <span className="text-sm font-medium text-gray-500">Day</span>
                </div>
                {weekOccurrences.map((occurrence) => (
                  <div key={occurrence} className="bg-gray-50 p-3 text-center">
                    <span className="text-sm font-medium text-gray-500">
                      {occurrence === "all" ? "All" : occurrence}
                    </span>
                  </div>
                ))}

                {/* Grid Body */}
                {days.map((day) => (
                  <React.Fragment key={day}>
                    <div className="bg-white p-3">
                      <span className="text-sm text-gray-900">{day}</span>
                    </div>
                    {weekOccurrences.map((occurrence) => (
                      <div key={`${day}-${occurrence}`} className="bg-white p-3 flex justify-center">
                        <input
                          type="checkbox"
                          checked={weekendConfig.weekendGrid[day].includes(occurrence)}
                          onChange={() => toggleWeekend(day, occurrence)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : shift ? (
                "Update Shift"
              ) : (
                "Create Shift"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default ShiftForm;