import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { FiCheck, FiX, FiAlertCircle } from "react-icons/fi"
import { leaveRequestService } from "../../services/leaveRequestService"
import { useAuth } from "../../contexts/AuthContext"
import { employeeService } from "../../services/employeeService"

function LeaveApprovals() {
  const [leaveRequests, setLeaveRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionInProgress, setActionInProgress] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [comments, setComments] = useState("")
  const [actionType, setActionType] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    const initializeUser = async () => {
      try {
        if (user?.sub) {
          const fetchedUser = await employeeService.getEmployeeById(user.sub)
          setCurrentUser(fetchedUser)
          fetchLeaveRequests(fetchedUser)
        }
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    initializeUser()
  }, [user])

  const fetchLeaveRequests = async (userDetails) => {
    try {
      setLoading(true)
      let data = []

      if (userDetails?.designation?.name.includes("HR")) {
        data = await leaveRequestService.getHRPendingRequests()
      } else if (userDetails?.designation?.name.includes("Manager")) {
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

      if (actionType === "approve") {
        if (currentUser?.designation?.name.includes("HR")) {
          await leaveRequestService.hrApproveLeave(selectedRequest, comments)
        } else if (currentUser?.designation?.name.includes("Manager")) {
          await leaveRequestService.managerApproveLeave(selectedRequest, comments)
        }
      } else if (actionType === "reject") {
        if (currentUser?.designation?.name.includes("HR")) {
          await leaveRequestService.hrRejectLeave(selectedRequest, comments)
        } else if (currentUser?.designation?.name.includes("Manager")) {
          await leaveRequestService.managerRejectLeave(selectedRequest, comments)
        }
      }

      await fetchLeaveRequests(currentUser)
      setSelectedRequest(null)
      setActionType(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setActionInProgress(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (currentUser?.designation?.name === "Employee") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">You don't have permission to view leave requests.</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            {currentUser?.designation?.name.includes("HR") ? "HR Leave Approvals" : "Manager Leave Approvals"}
          </h2>
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
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No pending leave requests
                  </td>
                </tr>
              ) : (
                leaveRequests.map((request) => (
                  <motion.tr key={request.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {`${request.employee?.firstName || ""} ${request.employee?.lastName || ""}`}
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
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{request.reason}</div>
                    </td>
                    {user?.userId !== request.employee.id && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleAction(request.id, "approve")}
                              className="text-green-600 hover:text-green-900 mr-4"
                            >
                              <FiCheck className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleAction(request.id, "reject")}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FiX className="w-5 h-5" />
                            </button>
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comments Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
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
              className="w-full border rounded-md p-2 h-32 mb-4"
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