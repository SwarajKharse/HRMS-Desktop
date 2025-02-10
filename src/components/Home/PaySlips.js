import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format, addMonths, subMonths } from "date-fns"
import { FiChevronLeft, FiChevronRight, FiDownload, FiAlertCircle, FiRefreshCw } from "react-icons/fi"
import { payslipService } from "../../services/payslipService"

function Payslips() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [payslips, setPayslips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState({})
  const [refreshingAll, setRefreshingAll] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)

  useEffect(() => {
    fetchPayslips()
  }, [currentDate]) // Updated useEffect dependency array

  const fetchPayslips = async () => {
    try {
      setLoading(true)
      const month = currentDate.getMonth() + 1
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

  const handleRefreshAll = async () => {
    try {
      setRefreshingAll(true)
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()
      await payslipService.refreshAllPayslips(month, year)
      await fetchPayslips()
      setSuccessMessage("All payslips refreshed successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || "Failed to refresh payslips")
    } finally {
      setRefreshingAll(false)
    }
  }

  const handleRefreshIndividual = async (empId) => {
    try {
      setRefreshing((prev) => ({ ...prev, [empId]: true }))
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()
      await payslipService.refreshPayslip(empId, month, year)
      await fetchPayslips()
      setSuccessMessage(`Payslip refreshed successfully`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || "Failed to refresh payslip")
    } finally {
      setRefreshing((prev) => ({ ...prev, [empId]: false }))
    }
  }

  const handleDownload = async (payslipId) => {
    try {
      const blob = await payslipService.downloadPayslipPdf(payslipId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `payslip_${payslipId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err.message || "Failed to download payslip")
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
      {/* Header with Month Navigation and Refresh All */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
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
        <button
          onClick={handleRefreshAll}
          disabled={refreshingAll}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white transition-colors ${
            refreshingAll ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <FiRefreshCw className={`w-4 h-4 ${refreshingAll ? "animate-spin" : ""}`} />
          <span>{refreshingAll ? "Refreshing..." : "Refresh All"}</span>
        </button>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 text-red-500 p-4 rounded-md flex items-center"
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
            className="bg-green-50 text-green-500 p-4 rounded-md flex items-center"
          >
            <FiAlertCircle className="mr-2" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payslips Table */}
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
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleRefreshIndividual(payslip.employee.id)}
                            disabled={refreshing[payslip.employee.id]}
                            className={`text-blue-600 hover:text-blue-900 transition-colors ${
                              refreshing[payslip.employee.id] ? "opacity-50" : ""
                            }`}
                            title="Refresh Payslip"
                          >
                            <FiRefreshCw
                              className={`w-5 h-5 ${refreshing[payslip.employee.id] ? "animate-spin" : ""}`}
                            />
                          </button>
                          <button
                            onClick={() => handleDownload(payslip.id)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Download Payslip"
                          >
                            <FiDownload className="w-5 h-5" />
                          </button>
                        </div>
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