import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { format, addMonths, subMonths } from "date-fns"
import { FiChevronLeft, FiChevronRight, FiDownload, FiAlertCircle } from "react-icons/fi"
import { payslipService } from "../../services/payslipService"

function Payslips() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [payslips, setPayslips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPayslips()
  }, []) // Removed currentDate from dependencies

  const fetchPayslips = async () => {
    try {
      setLoading(true)
      const month = currentDate.getMonth() + 1 // JavaScript months are 0-based
      const year = currentDate.getFullYear()
      const data = await payslipService.getAllPayslipsByMonthAndYear(month, year)
      setPayslips(data)
      setError(null)
    } catch (err) {
      setError(err.message || "Failed to load payslips")
    } finally {
      setLoading(false)
    }
  }

  const handlePreviousMonth = () => {
    setCurrentDate((prevDate) => subMonths(prevDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate((prevDate) => addMonths(prevDate, 1))
  }

  const handleViewDetails = async (payslipId) => {
    try {
      const payslip = await payslipService.getById(payslipId)
      // You can implement a modal or detailed view here with the payslip data
      console.log("Payslip details:", payslip)
    } catch (err) {
      setError(err.message || "Failed to fetch payslip details")
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <button
          onClick={handlePreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Previous Month"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold">{format(currentDate, "MMMM yyyy")}</h2>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Next Month"
        >
          <FiChevronRight className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-[300px] bg-white rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Basic Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Income Tax
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payslips.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No payslips found for {format(currentDate, "MMMM yyyy")}
                    </td>
                  </tr>
                ) : (
                  payslips.map((payslip, index) => (
                    <motion.tr
                      key={payslip.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-900 flex items-center justify-center text-white overflow-hidden">
                            {payslip.employee.profilePhotoUrl ? (
                              <img
                                src={payslip.employee.profilePhotoUrl || "/placeholder.svg"}
                                alt="Profile"
                                className="h-10 w-10 object-cover"
                              />
                            ) : (
                              <span>
                                {payslip.employee.firstName[0]}
                                {payslip.employee.lastName[0]}
                              </span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {payslip.employee.firstName} {payslip.employee.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payslip.employee.employeeCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payslip.basicSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payslip.totalEarnings)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payslip.totalDeductions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payslip.incomeTax)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-medium text-green-600">{formatCurrency(payslip.netPay)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleViewDetails(payslip.id)}
                          className="text-blue-600 hover:text-blue-900 transition-colors flex items-center"
                          title="View Details"
                        >
                          <FiDownload className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payslips;