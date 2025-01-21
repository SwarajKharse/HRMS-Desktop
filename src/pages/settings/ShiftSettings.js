import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiFileText, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi"
import { format } from "date-fns"
import { shiftService } from "../../services/shiftService"
import ShiftForm from "../../components/shift/ShiftForm"
import { authService } from "../../services/authService";

function ShiftSettings() {
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedShift, setSelectedShift] = useState(null)

  // Hardcoded orgId for now - in real app get from context
  const orgId = authService.getUser().orgId;

  useEffect(() => {
    fetchShifts()
  }, [])

  const fetchShifts = async () => {
    try {
      const data = await shiftService.getShiftsByOrgId(orgId)
      setShifts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (shift) => {
    setSelectedShift(shift)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this shift?")) {
      try {
        await shiftService.deleteShift(id)
        await fetchShifts()
      } catch (err) {
        setError(err.message)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
          <FiFileText className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Settings</h1>
          <p className="text-sm text-gray-500">Configure shift timings and schedules</p>
        </div>
      </div>

      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setSelectedShift(null)
            setShowForm(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <FiPlus className="mr-2" />
          Add Shift
        </motion.button>
      </div>

      {error && <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shift Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grace Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allowance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No shifts found
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => (
                  <motion.tr key={shift.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shift?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(`2000-01-01T${shift?.startTime}`), "hh:mm a")} -
                      {format(new Date(`2000-01-01T${shift?.endTime}`), "hh:mm a")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shift.graceTime > 0 ? `${shift?.graceTime} ${shift?.graceTimeUnit?.toLowerCase()}` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shift.shiftAllowance ? `Rs. ${shift?.shiftAllowanceAmount?.toFixed(2)}` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(shift)} className="text-blue-600 hover:text-blue-900 mr-4">
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(shift.id)} className="text-red-600 hover:text-red-900">
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <ShiftForm
            shift={selectedShift}
            orgId={orgId}
            onClose={() => {
              setShowForm(false)
              setSelectedShift(null)
            }}
            onSubmit={fetchShifts}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default ShiftSettings;