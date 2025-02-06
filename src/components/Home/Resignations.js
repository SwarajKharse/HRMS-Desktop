import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiLogOut, FiCheck, FiX } from "react-icons/fi"
import { resignationService } from "../../services/resignationService"
import { useAuth } from "../../contexts/AuthContext"

function Resignations() {
  const [pendingResignations, setPendingResignations] = useState([])
  const [allResignations, setAllResignations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeView, setActiveView] = useState("pending")
  const { user } = useAuth()

  useEffect(() => {
    fetchResignations()
  }, [])

  const fetchResignations = async () => {
    try {
      const data = await resignationService.getAllResignationsByOrgId(user.orgId)
      setPendingResignations(data.filter((r) => r.status === "Pending"))
      setAllResignations(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (employeeId) => {
    try {
      await resignationService.approveResignation(employeeId)
      await fetchResignations()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleReject = async (employeeId) => {
    try {
      await resignationService.rejectResignation(employeeId)
      await fetchResignations()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-md">
        <p className="font-medium">Error loading resignations:</p>
        <p>{error}</p>
      </div>
    )
  }

  const renderResignationTable = (resignations, showActions = false) => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resignation Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              {showActions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {resignations.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 5 : 4} className="px-6 py-4 text-center text-gray-500">
                  No resignations found
                </td>
              </tr>
            ) : (
              resignations.map((resignation) => (
                <motion.tr
                  key={resignation.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-900 flex items-center justify-center text-white">
                        {resignation.employee.profilePhotoUrl ? (
                          <img
                            src={resignation.employee.profilePhotoUrl || "/placeholder.svg"}
                            alt="Profile"
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span>
                            {resignation.employee.firstName.charAt(0)}
                            {resignation.employee.lastName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {resignation.employee.firstName} {resignation.employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{resignation.employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(resignation.resignationDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                    <div className="truncate">{resignation.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        resignation.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : resignation.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {resignation.status}
                    </span>
                  </td>
                  {showActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleApprove(resignation.employee.id)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        <FiCheck className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleReject(resignation.employee.id)}
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
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FiLogOut className="text-blue-600 w-5 h-5" />
          <h2 className="text-lg font-semibold">Resignations</h2>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveView("pending")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === "pending" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Pending Resignations
          </button>
          <button
            onClick={() => setActiveView("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Resignations
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeView === "pending"
            ? renderResignationTable(pendingResignations, true)
            : renderResignationTable(allResignations)}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default Resignations;