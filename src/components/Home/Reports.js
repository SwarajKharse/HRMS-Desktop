import { useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { payslipService } from "../../services/payslipService"
import { payrollSettingsService } from "../../services/payrollSettingsService"
import { FiDownload, FiFileText, FiDollarSign, FiPieChart } from "react-icons/fi"

const Reports = () => {
  const { user } = useAuth()
  const orgId = user?.orgId

  const [reportType, setReportType] = useState("")
  const [month, setMonth] = useState("")
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const reportTypes = [
    {
      value: "payslips",
      label: "Payslips",
      icon: <FiFileText className="w-5 h-5" />,
      description: "Download payslips for all employees",
      requiresMonth: true,
    },
    {
      value: "ctcBreakdown",
      label: "CTC Breakdown",
      icon: <FiPieChart className="w-5 h-5" />,
      description: "Export CTC breakdown for all employees",
      requiresMonth: true,
    },
    {
      value: "monthlySalary",
      label: "Monthly Salary",
      icon: <FiDollarSign className="w-5 h-5" />,
      description: "Export monthly salary details",
      requiresMonth: true,
    },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      let blob
      let filename

      switch (reportType) {
        case "payslips":
          blob = await payslipService.exportPayslips(orgId, month, year)
          filename = `Payslips_${months.find((m) => m.value === Number.parseInt(month))?.label}_${year}.xlsx`
          break
        case "ctcBreakdown":
          blob = await payrollSettingsService.exportCTCBreakdown(orgId, month, year)
          filename = `CTC_Breakdown_${year}.xlsx`
          break
        case "monthlySalary":
          blob = await payslipService.exportMonthlySalary(orgId, month, year)
          filename = `Monthly_Salary_${months.find((m) => m.value === Number.parseInt(month))?.label}_${year}.xlsx`
          break
        default:
          throw new Error("Please select a report type")
      }

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      setError(err.message || "Failed to generate report")
      console.error("Report generation error:", err)
    } finally {
      setLoading(false)
    }
  }

  const selectedReport = reportTypes.find((r) => r.value === reportType)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Reports</h1>
        <p className="text-gray-600">Generate and download various reports for your organization</p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Report Type Selection */}
              <div>
                <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                  Report Type
                </label>
                <select
                  id="reportType"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a report type</option>
                  {reportTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Report Description */}
              {selectedReport && (
                <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      {selectedReport.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900">{selectedReport.label}</h3>
                    <p className="text-sm text-blue-700">{selectedReport.description}</p>
                  </div>
                </div>
              )}

              {/* Month and Year Selection (conditional) */}
              {reportType && selectedReport?.requiresMonth && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                      Month
                    </label>
                    <select
                      id="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select month</option>
                      {months.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <select
                      id="year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || !reportType || (selectedReport?.requiresMonth && !month)}
                  className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading || !reportType || (selectedReport?.requiresMonth && !month)
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  }`}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <FiDownload className="mr-2" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Reports;