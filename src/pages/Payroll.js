import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { FiDownload, FiAlertCircle } from "react-icons/fi"
import { payslipService } from "../services/payslipService"
import { useAuth } from "../contexts/AuthContext"

function Payroll() {
  const [payslips, setPayslips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchPayslips()
  }, [])

  const fetchPayslips = async () => {
    try {
      const data = await payslipService.getPayslipsByEmployeeId(user.sub)
      setPayslips(data)
      setError(null)
    } catch (err) {
      setError("Failed to load payslips")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = async (payslipId) => {
    try {
      const blob = await payslipService.downloadPayslipPdf(payslipId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `payslip-${payslipId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError("Failed to download payslip")
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date) => {
    return format(new Date(date), "dd MMM yyyy")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Payslips</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pay Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allowances
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
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
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No payslips found
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{formatDate(payslip.startDate)}</div>
                      <div className="text-gray-500">to</div>
                      <div className="font-medium">{formatDate(payslip.endDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="font-medium text-gray-900">{formatCurrency(payslip.basicSalary)}</div>
                      <div className="text-xs text-gray-500">
                        HRA: {formatCurrency(payslip.hra)}
                        <br />
                        DA: {formatCurrency(payslip.da)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payslip.allowances)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="font-medium text-gray-900">{formatCurrency(payslip.grossSalary)}</div>
                      <div className="text-xs text-gray-500">
                        Total Earnings: {formatCurrency(payslip.totalEarnings)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="font-medium text-gray-900">{formatCurrency(payslip.totalDeductions)}</div>
                      <div className="text-xs text-gray-500">Tax: {formatCurrency(payslip.incomeTax)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="font-medium text-green-600">{formatCurrency(payslip.netPay)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDownloadPdf(payslip.id)}
                        className="text-blue-600 hover:text-blue-900 transition-colors flex items-center"
                        title="Download Payslip"
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
    </div>
  )
}

export default Payroll;