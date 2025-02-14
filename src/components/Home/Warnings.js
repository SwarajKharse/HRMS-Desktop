import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FiAlertTriangle } from "react-icons/fi"
import { warningService } from "../../services/warningService"
import { useAuth } from "../../contexts/AuthContext"
import { format } from "date-fns"

function Warnings() {
  const [warnings, setWarnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchWarnings()
  }, [])

  const fetchWarnings = async () => {
    try {
      const data = await warningService.getWarningsByOrgId(user.orgId)
      setWarnings(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-md">
        <p className="font-medium">Error loading warnings:</p>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FiAlertTriangle className="text-yellow-600 w-5 h-5" />
          <h2 className="text-lg font-semibold">Warning Letters</h2>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warning Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {warnings.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    No warnings found
                  </td>
                </tr>
              ) : (
                warnings.map((warning) => (
                  <motion.tr
                    key={warning.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-900 flex items-center justify-center text-white">
                          {warning.employee.profilePhotoUrl ? (
                            <img
                              src={warning.employee.profilePhotoUrl || "/placeholder.svg"}
                              alt="Profile"
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <span>
                              {warning.employee.firstName.charAt(0)}
                              {warning.employee.lastName.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {warning.employee.firstName} {warning.employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{warning.employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(warning.warningDate), "d MMM yyyy")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                      <div className="truncate">{warning.reason}</div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Warnings;