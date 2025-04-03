import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { payslipService } from "../../services/payslipService"
import { payrollSettingsService } from "../../services/payrollSettingsService"
import { employeeService } from "../../services/employeeService"
import {
  FiDownload,
  FiFileText,
  FiDollarSign,
  FiPieChart,
  FiSearch,
  FiUser,
  FiFilePlus,
  FiFileText as FiFileTextIcon,
  FiX,
  FiChevronDown,
} from "react-icons/fi"

const Reports = () => {
  const { user } = useAuth()
  const orgId = user?.orgId

  const [reportType, setReportType] = useState("")
  const [month, setMonth] = useState("")
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Employee selection state
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  // Format selection for individual monthly salary
  const [selectedFormat, setSelectedFormat] = useState("xlsx")

  // Refs for dropdown handling
  const dropdownRef = useRef(null)

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
      label: "Payslips (All Employees)",
      icon: <FiFileText className="w-5 h-5" />,
      description: "Download payslips for all employees",
      requiresMonth: true,
      requiresEmployee: false,
    },
    {
      value: "ctcBreakdown",
      label: "CTC Breakdown (All Employees)",
      icon: <FiPieChart className="w-5 h-5" />,
      description: "Export CTC breakdown for all employees",
      requiresMonth: true,
      requiresEmployee: false,
    },
    {
      value: "monthlySalary",
      label: "Monthly Salary (All Employees)",
      icon: <FiDollarSign className="w-5 h-5" />,
      description: "Export monthly salary details for all employees",
      requiresMonth: true,
      requiresEmployee: false,
    },
    {
      value: "individualCtcBreakdown",
      label: "Individual CTC Breakdown",
      icon: <FiUser className="w-5 h-5" />,
      description: "Export CTC breakdown for a specific employee",
      requiresMonth: true,
      requiresEmployee: true,
    },
    {
      value: "individualMonthlySalary",
      label: "Individual Monthly Salary",
      icon: <FiFilePlus className="w-5 h-5" />,
      description: "Export monthly salary details for a specific employee (PDF or Excel)",
      requiresMonth: true,
      requiresEmployee: true,
      requiresFormat: true,
    },
  ]

  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true)
        const data = await employeeService.getAllEmployees()
        setEmployees(data)
      } catch (err) {
        console.error("Failed to fetch employees:", err)
      } finally {
        setLoadingEmployees(false)
      }
    }

    fetchEmployees()
  }, [])

  // Handle click outside of dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Filter employees based on search term
  const filteredEmployees = employees.filter(
    (employee) =>
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      let blob
      let filename
      const monthLabel = months.find((m) => m.value === Number.parseInt(month))?.label

      switch (reportType) {
        case "payslips":
          blob = await payslipService.exportPayslips(orgId, month, year)
          filename = `Payslips_${monthLabel}_${year}.xlsx`
          break
        case "ctcBreakdown":
          blob = await payrollSettingsService.exportCTCBreakdown(orgId, month, year)
          filename = `CTC_Breakdown_${monthLabel}_${year}.xlsx`
          break
        case "monthlySalary":
          blob = await payslipService.exportMonthlySalary(orgId, month, year)
          filename = `Monthly_Salary_${monthLabel}_${year}.xlsx`
          break
        case "individualCtcBreakdown":
          if (!selectedEmployee) throw new Error("Please select an employee")
          blob = await payrollSettingsService.exportIndividualCTCBreakdown(selectedEmployee.id, month, year)
          filename = `CTC_Breakdown_${selectedEmployee.firstName}_${selectedEmployee.lastName}_${monthLabel}_${year}.xlsx`
          break
        case "individualMonthlySalary":
          if (!selectedEmployee) throw new Error("Please select an employee")
          if (selectedFormat === "xlsx") {
            blob = await payslipService.exportIndividualMonthlySalary(selectedEmployee.id, month, year)
            filename = `Monthly_Salary_${selectedEmployee.firstName}_${selectedEmployee.lastName}_${monthLabel}_${year}.xlsx`
          } else {
            blob = await payslipService.downloadPayslipByEmpIdPdf(selectedEmployee.id, month, year)
            filename = `Payslip_${selectedEmployee.firstName}_${selectedEmployee.lastName}_${monthLabel}_${year}.pdf`
          }
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

  // Reset employee selection when changing report type
  useEffect(() => {
    if (!selectedReport?.requiresEmployee) {
      setSelectedEmployee(null)
      setSearchTerm("")
    }
  }, [reportType])

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

              {/* Employee Selection (conditional) */}
              {reportType && selectedReport?.requiresEmployee && (
                <div>
                  <label htmlFor="employeeSearch" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Employee
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    <div
                      className={`flex items-center w-full px-3 py-2 border ${
                        isDropdownOpen ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none ${loadingEmployees ? "bg-gray-50 cursor-wait" : "cursor-pointer"}`}
                      onClick={() => !loadingEmployees && setIsDropdownOpen(true)}
                    >
                      {loadingEmployees ? (
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                      ) : (
                        <FiSearch className="text-gray-400 mr-2" />
                      )}
                      <input
                        type="text"
                        id="employeeSearch"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value)
                          if (!loadingEmployees) setIsDropdownOpen(true)
                        }}
                        placeholder={loadingEmployees ? "Loading employees..." : "Search employee by name or code"}
                        className="flex-1 focus:outline-none bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!loadingEmployees) setIsDropdownOpen(true)
                        }}
                        disabled={loadingEmployees}
                      />
                      {selectedEmployee && !loadingEmployees && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedEmployee(null)
                            setSearchTerm("")
                          }}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      )}
                      <FiChevronDown
                        className={`ml-2 text-gray-400 transition-transform ${isDropdownOpen ? "transform rotate-180" : ""} ${
                          loadingEmployees ? "opacity-50" : ""
                        }`}
                      />
                    </div>

                    {/* Employee dropdown */}
                    {isDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                        {loadingEmployees ? (
                          <div className="p-4 text-center text-gray-500">Loading employees...</div>
                        ) : filteredEmployees.length > 0 ? (
                          filteredEmployees.map((employee) => (
                            <div
                              key={employee.id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                              onClick={() => {
                                setSelectedEmployee(employee)
                                setSearchTerm(
                                  `${employee.firstName} ${employee.lastName} (${employee.employeeCode || "No Code"})`,
                                )
                                setIsDropdownOpen(false)
                              }}
                            >
                              <FiUser className="text-gray-400 mr-2" />
                              <div>
                                <div className="font-medium">
                                  {employee.firstName} {employee.lastName}
                                </div>
                                {employee.employeeCode && (
                                  <div className="text-xs text-gray-500">{employee.employeeCode}</div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">No employees found</div>
                        )}
                      </div>
                    )}
                  </div>
                  {!selectedEmployee && reportType && selectedReport?.requiresEmployee && (
                    <p className="mt-1 text-sm text-amber-600">Please select an employee</p>
                  )}
                </div>
              )}

              {/* Format Selection for Individual Monthly Salary */}
              {reportType === "individualMonthlySalary" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="format"
                        value="xlsx"
                        checked={selectedFormat === "xlsx"}
                        onChange={() => setSelectedFormat("xlsx")}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 flex items-center">
                        <FiFileTextIcon className="w-4 h-4 mr-1 text-green-600" />
                        Excel
                      </span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="format"
                        value="pdf"
                        checked={selectedFormat === "pdf"}
                        onChange={() => setSelectedFormat("pdf")}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 flex items-center">
                        <FiFileText className="w-4 h-4 mr-1 text-red-600" />
                        PDF
                      </span>
                    </label>
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
                  disabled={
                    loading ||
                    !reportType ||
                    (selectedReport?.requiresMonth && !month) ||
                    (selectedReport?.requiresEmployee && !selectedEmployee)
                  }
                  className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading ||
                    !reportType ||
                    (selectedReport?.requiresMonth && !month) ||
                    (selectedReport?.requiresEmployee && !selectedEmployee)
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