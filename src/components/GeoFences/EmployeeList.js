import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiCheck, FiAlertCircle, FiSearch, FiFilter } from "react-icons/fi"
import { employeeService } from "../../services/employeeService"
import { authService } from "../../services/authService"

function Toggle({ checked, onChange, disabled }) {
  return (
    <div
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
        disabled ? "bg-gray-300" : checked ? "bg-green-500" : "bg-gray-200"
      }`}
      onClick={disabled ? null : onChange}
    >
      <div
        className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </div>
  )
}

function EmployeeList() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState({})
  const [successMessage, setSuccessMessage] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const orgId = authService.getUser().orgId
      const data = await employeeService.getGeofencingByOrgId(orgId)
      setEmployees(data)
      setError(null)
    } catch (err) {
      setError(err.message || "Failed to fetch employees")
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (employeeId, currentStatus) => {
    try {
      setUpdating((prev) => ({ ...prev, [employeeId]: true }))
      await employeeService.updateGeofencingByEmployeeId(employeeId, {
        isGeofencingEnabled: !currentStatus,
      })
      fetchEmployees()
      setSuccessMessage("Geofencing status updated successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || "Failed to update geofencing status")
      setTimeout(() => setError(null), 3000)
    } finally {
      setUpdating((prev) => ({ ...prev, [employeeId]: false }))
    }
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const nameMatch = `${employee.firstName} ${employee.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      
      const statusMatch = 
        statusFilter === "all" ? true :
        statusFilter === "enabled" ? employee.geofenced :
        statusFilter === "disabled" ? !employee.geofenced :
        true

      return nameMatch && statusMatch
    })
  }, [employees, searchQuery, statusFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Employee Geofencing</h1>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white w-full sm:w-48"
            >
              <option value="all">All Status</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 text-red-500 p-4 rounded-lg flex items-center"
          >
            <FiAlertCircle className="mr-2" />
            {error}
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 text-green-500 p-4 rounded-lg flex items-center"
          >
            <FiCheck className="mr-2" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
        <div className="">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Employee Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Geofencing Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {filteredEmployees.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                      No employees found matching your search criteria
                    </td>
                  </motion.tr>
                ) : (
                  filteredEmployees.map((employee, index) => (
                    <motion.tr
                      key={employee.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                            {employee.profilePhotoUrl ? (
                              <img
                                src={employee.profilePhotoUrl || "/placeholder.svg"}
                                alt={`${employee.firstName} ${employee.lastName}`}
                                className="h-10 w-10 object-cover"
                              />
                            ) : (
                              <span>
                                {employee.firstName[0]}
                                {employee.lastName[0]}
                              </span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.firstName} {employee.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          {employee.employeeCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Toggle
                            checked={employee.geofenced}
                            onChange={() => handleToggle(employee.id, employee.geofenced)}
                            disabled={updating[employee.id]}
                          />
                          <span className="text-sm text-gray-500">
                            {updating[employee.id] ? (
                              <span className="text-blue-500">Updating...</span>
                            ) : employee.geofenced ? (
                              <span className="text-green-600 font-medium">Enabled</span>
                            ) : (
                              <span className="text-gray-500">Disabled</span>
                            )}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default EmployeeList;