import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { missPunchService } from "../../services/missPunchService"
import { format, getMonth, getYear, subMonths, addMonths } from "date-fns"
import { FiCheck, FiX, FiMessageSquare, FiLoader, FiChevronLeft, FiChevronRight } from "react-icons/fi"
import { useAuth } from "../../contexts/AuthContext"
import { getErrorMessage } from "../../utils/errorUtils"

function MissPunchApprovals() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCommentsDialog, setShowCommentsDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [comments, setComments] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [actionType, setActionType] = useState(null) // 'approve' or 'reject'
  const { user, employee } = useAuth()
  const orgId = employee?.org?.id

  useEffect(() => {
    if (orgId) {
      fetchPendingRequests(currentDate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, orgId])

  const fetchPendingRequests = async (date) => {
    setLoading(true)
    try {
      const data = await missPunchService.getPendingRequestsByOrgAndMonth(orgId, getMonth(date), getYear(date))
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

  const handleAction = (request, type) => {
    setSelectedRequest(request)
    setActionType(type)
    setComments("")
    setShowCommentsDialog(true)
  }

  const handleSubmitAction = async () => {
    setActionLoading(true)
    try {
      if (actionType === "approve") {
        await missPunchService.approve(selectedRequest.id, comments)
      } else {
        await missPunchService.reject(selectedRequest.id, comments)
      }
      // Refresh the list after action
      await fetchPendingRequests(currentDate)
      setShowCommentsDialog(false)
    } catch (err) {
      setError(getErrorMessage(err, "Failed to submit action"))
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-gray-900">Pending Miss Punch Requests</h2>

      <div className="flex items-center justify-between">
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={handlePreviousMonth}>
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold">{format(currentDate, "MMMM yyyy")}</h3>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={handleNextMonth}>
          <FiChevronRight className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">Error: {error}</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No pending requests found for this month</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Employee
                </th>
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
                  Actions
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {request.employee.firstName} {request.employee.lastName}
                    </div>
                    <div className="text-sm text-gray-500">ID: {request.employee.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(request.date), "d MMM yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(`2000-01-01T${request.checkIn}`), "hh:mm a")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(`2000-01-01T${request.checkOut}`), "hh:mm a")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{request.comments}</td>
                  {user?.userId !== request.employee.id && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAction(request, "approve")}
                          className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-100"
                          title="Approve"
                        >
                          <FiCheck className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleAction(request, "reject")}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100"
                          title="Reject"
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Comments Dialog */}
      <AnimatePresence>
        {showCommentsDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {actionType === "approve" ? "Approve" : "Reject"} Miss Punch Request
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <FiMessageSquare className="w-4 h-4 mr-2" />
                    Comments
                  </div>
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full p-2 rounded-lg border-black-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows="3"
                  placeholder={`Add your ${actionType === "approve" ? "approval" : "rejection"} comments...`}
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCommentsDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAction}
                  disabled={!comments.trim() || actionLoading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center
                    ${
                      actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                    } disabled:opacity-50`}
                >
                  {actionLoading && <FiLoader className="w-4 h-4 mr-2 animate-spin" />}
                  {actionType === "approve" ? "Approve" : "Reject"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MissPunchApprovals;
