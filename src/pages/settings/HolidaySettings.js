import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiCalendar, FiPlus, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight } from "react-icons/fi"
import { format } from "date-fns"
import { holidayService } from "../../services/holidayService"
import { authService } from "../../services/authService"
import HolidayForm from "../../components/Holiday/HolidayForm"

function HolidaySettings() {
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedHoliday, setSelectedHoliday] = useState(null)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const orgId = authService.getUser().orgId;

  useEffect(() => {
    fetchHolidays()
  }, [currentYear, orgId])

  const fetchHolidays = async () => {
    try {
      setLoading(true)
      const data = await holidayService.getHolidaysByYear(orgId, currentYear);
      setHolidays(data);
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (holiday) => {
    setSelectedHoliday(holiday)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this holiday?")) {
      try {
        await holidayService.deleteHoliday(id)
        await fetchHolidays()
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const handleYearChange = (increment) => {
    setCurrentYear((prev) => prev + increment)
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
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
          <FiCalendar className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Holiday Settings</h1>
          <p className="text-sm text-gray-500">Manage holidays and special events</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button onClick={() => handleYearChange(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <FiChevronLeft size={20} />
          </button>
          <span className="text-lg font-semibold">{currentYear}</span>
          <button onClick={() => handleYearChange(1)} className="p-2 hover:bg-gray-100 rounded-full">
            <FiChevronRight size={20} />
          </button>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setSelectedHoliday(null)
            setShowForm(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <FiPlus className="mr-2" />
          Add Holiday
        </motion.button>
      </div>

      {error && <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Holiday Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No holidays found for {currentYear}
                  </td>
                </tr>
              ) : (
                holidays.map((holiday) => (
                  <motion.tr key={holiday.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{holiday.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(holiday.date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{holiday.description || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(holiday)} className="text-blue-600 hover:text-blue-900 mr-4">
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(holiday.id)} className="text-red-600 hover:text-red-900">
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
          <HolidayForm
            holiday={selectedHoliday}
            onClose={() => {
              setShowForm(false)
              setSelectedHoliday(null)
            }}
            onSubmit={fetchHolidays}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default HolidaySettings;