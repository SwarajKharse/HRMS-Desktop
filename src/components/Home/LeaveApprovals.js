import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { FiCheck, FiX, FiAlertCircle, FiClock } from "react-icons/fi"
import { leaveRequestService } from "../../services/leaveRequestService"
import { useAuth } from "../../contexts/AuthContext"

function LeaveApprovals() {
  const [leaveRequests, setLeaveRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionInProgress, setActionInProgress] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [comments, setComments] = useState("")
  const [actionType, setActionType] = useState(null)
  const { user, employee } = useAuth()

  const isHR = employee?.designation?.name.includes("HR")
  const isManager = employee?.reportingEmployees?.length > 0
  const isDualRole = isHR && isManager

  useEffect(() => {
    const initializeUser = async () => {
      try {
        fetchLeaveRequests(employee)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    initializeUser()
  }, [employee])

  const fetchLeaveRequests = async (userDetails) => {
    try {
      setLoading(true)
      let data = []

      if (isDualRole) {
        // Fetch both HR and manager pending requests
        const [hrRequests, managerRequests] = await Promise.all([
          leaveRequestService.getHRPendingRequests(),
          leaveRequestService.getManagerPendingRequests(userDetails.id),
        ])
        // Combine and remove duplicates
        data = [...new Map([...hrRequests, ...managerRequests].map((item) => [item.id, item])).values()]
      } else if (isHR) {
        data = await leaveRequestService.getHRPendingRequests()
      } else if (isManager) {
        data = await leaveRequestService.getManagerPendingRequests(userDetails.id)
      }

      setLeaveRequests(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (leaveId, action) => {
    setSelectedRequest(leaveId)
    setActionType(action)
    setComments("")
  }

  const handleSubmit = async () => {
    try {
      setActionInProgress(true)
      const request = leaveRequests.find((req) => req.id === selectedRequest)

      if (actionType === "approve") {
        if (request.status === "Pending HR") {
          await leaveRequestService.hrApproveLeave(selectedRequest, comments)
        } else {
          await leaveRequestService.managerApproveLeave(selectedRequest, comments)
        }
      } else if (actionType === "reject") {
        if (request.status === "Pending HR") {
          await leaveRequestService.hrRejectLeave(selectedRequest, comments)
        } else {
          await leaveRequestService.managerRejectLeave(selectedRequest, comments)
        }
      }

      await fetchLeaveRequests(employee)
      setSelectedRequest(null)
      setActionType(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setActionInProgress(false)
    }
  }

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    switch (status) {
      case "Pending":
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <FiClock className="w-3 h-3 mr-1" />
            Pending Manager
          </span>
        )
      case "Pending HR":
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <FiClock className="w-3 h-3 mr-1" />
            Pending HR
          </span>
        )
      default:
        return null
    }
  }

  const canApprove = (request) => {
    // Cannot approve own requests
    if (user?.userId === request.employee.id) return false

    // HR can only approve requests with "Pending HR" status
    if (isHR && !isManager && request.status !== "Pending HR") return false

    // Manager can only approve their reportees' requests with "Pending" status
    if (!isHR && isManager && request.status !== "Pending") return false

    // Dual role (HR + Manager) can approve both types
    if (isDualRole) return true

    return true
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isDualRole ? "Leave Approvals (HR & Manager)" : isHR ? "HR Leave Approvals" : "Manager Leave Approvals"}
          </h2>
          {isDualRole && (
            <p className="mt-1 text-sm text-gray-500">You can approve requests both as HR and as a manager</p>
          )}
        </div>

        {error && (
          <div className="m-6 bg-red-50 text-red-500 p-4 rounded-md flex items-center">
            <FiAlertCircle className="mr-2" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No pending leave requests
                  </td>
                </tr>
              ) : (
                leaveRequests.map((request) => (
                  <motion.tr
                    key={request.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={request.employee.id === user?.userId ? "bg-gray-50" : ""}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {request.employee?.profilePhotoUrl ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={request.employee.profilePhotoUrl || "/placeholder.svg"}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-500">
                                {request.employee?.firstName?.[0]}
                                {request.employee?.lastName?.[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {`${request.employee?.firstName || ""} ${request.employee?.lastName || ""}`}
                          </div>
                          <div className="text-sm text-gray-500">{request.employee?.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.isHalfDay ? "Half Day" : request.duration === 1 ? "1 day" : `${request.duration} days`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(request.startDate), "d MMM yyyy")} -
                        {format(new Date(request.endDate), "d MMM yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(request.status)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{request.reason}</div>
                      {request.managerComments && (
                        <div className="mt-1 text-xs text-gray-500">Manager Comment: {request.managerComments}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canApprove(request) && (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleAction(request.id, "approve")}
                            className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded-full transition-colors"
                          >
                            <FiCheck className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleAction(request.id, "reject")}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <FiX className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comments Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-semibold mb-4">
              {actionType === "approve" ? "Approve Leave Request" : "Reject Leave Request"}
            </h3>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full border rounded-md p-2 h-32 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your comments..."
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setSelectedRequest(null)
                  setActionType(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={actionInProgress}
              >
                Cancel
              </button>
              {actionType === "approve" ? (
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  disabled={actionInProgress}
                >
                  {actionInProgress ? "Processing..." : "Approve"}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  disabled={actionInProgress}
                >
                  {actionInProgress ? "Processing..." : "Reject"}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default LeaveApprovals;