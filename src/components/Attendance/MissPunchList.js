import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { missPunchService } from "../../services/missPunchService"
import { format } from "date-fns"
import { FiClock, FiCheck, FiX, FiAlertCircle } from "react-icons/fi";
import { authService } from "../../services/authService";

function MissPunchList() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const data = await missPunchService.getEmployeeRequests(authService.getUser().sub) // Replace with actual employee ID
      setRequests(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <FiAlertCircle className="w-5 h-5 mr-2" />
        {error}
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      APPROVED: "bg-green-100 text-green-800 border-green-200",
      REJECTED: "bg-red-100 text-red-800 border-red-200",
    }

    const icons = {
      PENDING: <FiClock className="w-4 h-4" />,
      APPROVED: <FiCheck className="w-4 h-4" />,
      REJECTED: <FiX className="w-4 h-4" />,
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
      {requests.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No miss punch requests found</div>
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
            {requests.map((request, index) => (
              <motion.tr
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {format(new Date(request.date), "MMM d, yyyy")}
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