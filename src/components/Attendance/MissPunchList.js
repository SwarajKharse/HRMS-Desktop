import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { missPunchService } from "../../services/missPunchService"
import { format, getMonth, getYear, subMonths, addMonths } from "date-fns"
import { FiClock, FiCheck, FiX, FiAlertCircle, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { authService } from "../../services/authService";
import { getErrorMessage } from "../../utils/errorUtils"

function MissPunchList() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRequests(currentDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate])

  const fetchRequests = async (date) => {
    setLoading(true)
    try {
      const data = await missPunchService.getEmployeeRequestsByMonth(
        authService.getUser().sub, // Replace with actual employee ID
        getMonth(date),
        getYear(date)
      )
      setRequests(data)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch miss punch requests"))
    } finally {
      setLoading(false)
    }
  }

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1))
  }

  const getStatusBadge = (status) => {
    const styles = {
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Approved: "bg-green-100 text-green-800 border-green-200",
      Rejected: "bg-red-100 text-red-800 border-red-200",
    }

    const icons = {
      Pending: <FiClock className="w-4 h-4" />,
      Approved: <FiCheck className="w-4 h-4" />,
      Rejected: <FiX className="w-4 h-4" />,
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
      >
        {icons[status]}
        {status}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between px-6 pt-6">
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={handlePreviousMonth}>
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">{format(currentDate, "MMMM yyyy")}</h2>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={handleNextMonth}>
          <FiChevronRight className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-red-500">
          <FiAlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No miss punch requests found for this month</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Check In
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Check Out
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Comments
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <motion.tr
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {format(new Date(request.date), "d MMM yyyy")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(`2000-01-01T${request.checkIn}`), "hh:mm a")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(`2000-01-01T${request.checkOut}`), "hh:mm a")}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{request.comments}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(request.status)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default MissPunchList;
