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
      // Sort payslips by year and month in descending order
      const sortedData = data.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })
      setPayslips(sortedData)
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
    const absAmount = Math.abs(amount)
    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(absAmount)

    return amount < 0 ? `-${formattedAmount}` : formattedAmount
  }

  const formatPayPeriod = (year, month) => {
    const date = new Date(year, month - 1)
    return format(date, "MMMM yyyy")
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
                  Basic + DA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Earnings
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
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPayPeriod(payslip.year, payslip.month)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(payslip.basicDa)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(payslip.totalEarnings)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(payslip.totalDeductions)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${payslip.netPay < 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(payslip.netPay)}
                      </div>
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