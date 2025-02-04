import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { leaveBalanceService } from "../../services/leaveBalanceService"
import { authService } from "../../services/authService"

function LeaveBookedAndBalance() {
  const [leaveData, setLeaveData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchLeaveBalances()
  }, [])

  const fetchLeaveBalances = async () => {
    try {
      setLoading(true)
      const data = await leaveBalanceService.getLeaveBalances(authService.getUser().orgId)
      setLeaveData(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getUniqueLeaveTypes = () => {
    const leaveTypes = new Set()
    Object.values(leaveData).forEach((employeeLeaves) => {
      employeeLeaves.forEach((leave) => {
        leaveTypes.add(JSON.stringify(leave.leaveType))
      })
    })
    return Array.from(leaveTypes).map((type) => JSON.parse(type))
  }

  const groupLeaveTypesByCategory = () => {
    const uniqueTypes = getUniqueLeaveTypes()
    return uniqueTypes.reduce((acc, type) => {
      const category = type.leaveCategory || "Other"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(type)
      return acc
    }, {})
  }

  const getLeaveBalance = (employeeLeaves, leaveTypeId) => {
    const leave = employeeLeaves?.find((l) => l.leaveType.id === leaveTypeId)
    return leave ? leave.balance : null
  }

  const calculateEmployeeTotals = (employeeLeaves) => {
    if (!employeeLeaves || employeeLeaves.length === 0) return { total: 0, taken: 0, balance: 0 }

    return employeeLeaves.reduce(
      (acc, leave) => {
        acc.total += leave.leaveType.accrualCount || 0
        acc.balance += leave.balance || 0
        acc.taken += leave.leaveType.accrualCount - leave.balance || 0
        return acc
      },
      { total: 0, taken: 0, balance: 0 },
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6 rounded-xl bg-red-50 border border-red-100">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    )
  }

  const groupedLeaveTypes = groupLeaveTypesByCategory()
  const employees = Object.entries(leaveData)

  if (employees.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 rounded-xl bg-gray-50 border border-gray-100">
        <p className="text-gray-500 font-medium">No leave balance data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-b">
                  Employee
                </th>
                {Object.entries(groupedLeaveTypes).map(([category, leaveTypes]) => (
                  <React.Fragment key={category}>
                    <th
                      colSpan={leaveTypes.length * 3}
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-b bg-gray-50/80"
                    >
                      {category}
                    </th>
                  </React.Fragment>
                ))}
                {/* Add this after the last category mapping */}
                <th
                  colSpan={3}
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-b bg-blue-50/50"
                >
                  Grand Total
                </th>
              </tr>
              <tr className="bg-gray-50/70">
                <th className="px-6 py-3 bg-gray-50 sticky left-0 z-10 border-b"></th>
                {Object.entries(groupedLeaveTypes).map(([category, leaveTypes]) => (
                  <React.Fragment key={`${category}-types`}>
                    {leaveTypes.map((leaveType) => (
                      <React.Fragment key={leaveType.id}>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 tracking-wider border-l border-b min-w-[80px]">
                          <div className="truncate">{leaveType.name}</div>
                          <div className="text-[10px] text-gray-400 font-normal">Total</div>
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 tracking-wider border-b min-w-[80px]">
                          <div className="truncate">Taken</div>
                        </th>
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 tracking-wider border-b min-w-[80px]">
                          <div className="truncate">Balance</div>
                        </th>
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
                <th className="px-2 py-3 text-center text-xs font-medium text-blue-600 tracking-wider border-l border-b bg-blue-50/50 min-w-[80px]">
                  Total
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-blue-600 tracking-wider border-b bg-blue-50/50 min-w-[80px]">
                  Taken
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-blue-600 tracking-wider border-b bg-blue-50/50 min-w-[80px]">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map(([employeeId, employeeLeaves], index) => {
                const employeeTotals = calculateEmployeeTotals(employeeLeaves)

                return (
                  <motion.tr
                    key={employeeId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10 border-r">
                      <div className="flex items-center">
                        <span className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-medium text-sm border-2 border-white shadow-sm">
                          {employeeId}
                        </span>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">Employee {employeeId}</div>
                          <div className="text-xs text-gray-500">ID: {employeeId}</div>
                        </div>
                      </div>
                    </td>
                    {Object.entries(groupedLeaveTypes).map(([category, leaveTypes]) => (
                      <React.Fragment key={`${employeeId}-${category}`}>
                        {leaveTypes.map((leaveType) => {
                          const balance = getLeaveBalance(employeeLeaves, leaveType.id)
                          const isEligible = balance !== null
                          const taken = isEligible ? leaveType.accrualCount - balance : 0

                          return (
                            <React.Fragment key={`${employeeId}-${leaveType.id}`}>
                              <td
                                className={`px-3 py-4 text-center text-sm border-l ${isEligible ? "text-gray-900" : "text-gray-400 bg-gray-50/50"}`}
                              >
                                {isEligible ? leaveType.accrualCount : "N/A"}
                              </td>
                              <td
                                className={`px-3 py-4 text-center text-sm ${isEligible ? "text-gray-900" : "text-gray-400 bg-gray-50/50"}`}
                              >
                                {isEligible ? taken : "-"}
                              </td>
                              <td
                                className={`px-3 py-4 text-center text-sm ${isEligible ? "text-gray-900" : "text-gray-400 bg-gray-50/50"}`}
                              >
                                {isEligible ? balance : "-"}
                              </td>
                            </React.Fragment>
                          )
                        })}
                      </React.Fragment>
                    ))}
                    {/* Remove the category-wise total columns and add this after the category mapping */}
                    <td className="px-3 py-4 text-center text-sm font-medium text-blue-600 border-l bg-blue-50/50">
                      {employeeTotals.total}
                    </td>
                    <td className="px-3 py-4 text-center text-sm font-medium text-blue-600 bg-blue-50/50">
                      {employeeTotals.taken}
                    </td>
                    <td className="px-3 py-4 text-center text-sm font-medium text-blue-600 bg-blue-50/50">
                      {employeeTotals.balance}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default LeaveBookedAndBalance;