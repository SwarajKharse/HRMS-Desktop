import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FiUserX } from "react-icons/fi"
import { terminationService } from "../../services/terminationService"
import { useAuth } from "../../contexts/AuthContext"

function Terminations() {
  const [terminations, setTerminations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchTerminations()
  }, [])

  const fetchTerminations = async () => {
    try {
      const data = await terminationService.getTerminationsByOrgId(user.orgId)
      setTerminations(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-md">
        <p className="font-medium">Error loading terminations:</p>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FiUserX className="text-red-600 w-5 h-5" />
          <h2 className="text-lg font-semibold">Terminations</h2>
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
                  Termination Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {terminations.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No terminations found
                  </td>
                </tr>
              ) : (
                terminations.map((termination) => (
                  <motion.tr
                    key={termination.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-900 flex items-center justify-center text-white">
                          {termination.employee.profilePhotoUrl ? (
                            <img
                              src={termination.employee.profilePhotoUrl || "/placeholder.svg"}
                              alt="Profile"
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <span>
                              {termination.employee.firstName.charAt(0)}
                              {termination.employee.lastName.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {termination.employee.firstName} {termination.employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{termination.employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(termination.terminationDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                      <div className="truncate">{termination.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(termination.createdAt).toLocaleDateString()}
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

export default Terminations

