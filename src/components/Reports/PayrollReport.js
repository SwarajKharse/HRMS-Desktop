import { useState, useEffect } from "react"
import { format } from "date-fns"
import {
  FiDollarSign,
  FiAlertCircle,
} from "react-icons/fi"
import { employeeService } from "../../services/employeeService"
import { payrollReportService } from "../../services/payrollReportService"

function PayrollReport() {
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAllEmployees()
      setEmployees(data)
      setError(null)
    } catch (err) {
      setError("Failed to load employees")
    } finally {
      setLoading(false)
    }
  }

  const fetchReport = async (employeeId) => {
    try {
      setReportLoading(true)
      const data = await payrollReportService.getPayrollReportByEmployeeId(employeeId)
      setReport(data)
      setError(null)
    } catch (err) {
      setError("Failed to load payroll report")
      setReport(null)
    } finally {
      setReportLoading(false)
    }
  }

  const handleEmployeeChange = async (e) => {
    const employeeId = e.target.value
    const selected = employees.find((emp) => emp.id.toString() === employeeId)
    setSelectedEmployee(selected)
    if (employeeId) {
      await fetchReport(employeeId)
    } else {
      setReport(null)
    }
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto p-4">
      <div className="flex items-center space-x-2">
        <FiDollarSign className="text-blue-600 w-6 h-6" />
        <h1 className="text-2xl font-bold">Payroll Report</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}

      {/* Select Employee */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <select
            className="w-full p-2 pl-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            onChange={handleEmployeeChange}
            value={selectedEmployee?.id || ""}
          >
            <option value="">Select an employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName} ({employee.employeeCode})
              </option>
            ))}
          </select>
          {selectedEmployee?.profilePhotoUrl && (
            <img
              src={selectedEmployee.profilePhotoUrl}
              alt=""
              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full object-cover"
            />
          )}
        </div>
      </div>

      {/* Report Loading */}
      {reportLoading && (
        <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Report UI */}
      {!reportLoading && report && (
        <div className="bg-white rounded-lg shadow p-4 space-y-6">
          {/* Header (Company + Pay Slip Heading) */}
          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold">Pay Slip for {report.currentMonth} {report.currentYear}</h2>
            <p className="text-sm text-gray-500">
              Generated on: {format(new Date(report.currentDate), "dd MMM yyyy")}
            </p>
          </div>

          {/* Employee Details */}
          <div className="border-b pb-4">
            <h3 className="font-bold text-lg mb-2">Employee Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Name</p>
                <p className="font-medium">{report.firstName} {report.lastName}</p>
              </div>
              <div>
                <p className="text-gray-600">Phone Number</p>
                <p className="font-medium">{report.phoneNumber || "-"}</p>
              </div>
              <div>
                <p className="text-gray-600">Salary Amount</p>
                <p className="font-medium">{formatCurrency(report.salaryAmount || 0)}/Month</p>
              </div>
              <div>
                <p className="text-gray-600">Designation</p>
                <p className="font-medium">{report.designation}</p>
              </div>
              <div>
                <p className="text-gray-600">Employee ID</p>
                <p className="font-medium">{report.employeeId}</p>
              </div>
              <div>
                <p className="text-gray-600">Branch</p>
                <p className="font-medium">{report.branch}</p>
              </div>
              <div>
                <p className="text-gray-600">Date of Joining</p>
                <p className="font-medium">
                  {report.dateOfJoining
                    ? format(new Date(report.dateOfJoining), "dd/MM/yyyy")
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">UAN</p>
                <p className="font-medium">{report.uan || "-"}</p>
              </div>
              <div>
                <p className="text-gray-600">Bank Name</p>
                <p className="font-medium">{report.bankName || "-"}</p>
              </div>
              <div>
                <p className="text-gray-600">Bank A/C Number</p>
                <p className="font-medium">{report.bankAccountNumber || "-"}</p>
              </div>
            </div>
          </div>

          {/* Salary Calculations */}
          <div>
            <h3 className="font-bold text-lg mb-2">Salary Calculations</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* EARNINGS */}
              <table className="w-full border border-gray-200 rounded text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">EARNINGS</th>
                    <th className="px-4 py-2 text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Basic Salary, HRA, DA, PF from employer side, etc. */}
                  <tr>
                    <td className="px-4 py-2">Basic Salary</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(report.basicSalary || 0)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">HRA</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(report.hra || 0)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Dearness Allowance</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(report.da || 0)}</td>
                  </tr>

                  <hr />
                  {/* If you have separate bonuses or allowances, loop them below */}
                  {report.allowances?.map((allow) => (
                    <tr key={allow.id}>
                      <td className="px-4 py-2">{allow.description || "Allowance"}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(allow.amount)}</td>
                    </tr>
                  ))}
                  <hr />
                  {report.bonuses?.map((bonus) => (
                    <tr key={bonus.id}>
                      <td className="px-4 py-2">{bonus.description || "Bonus"}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(bonus.amount)}</td>
                    </tr>
                  ))}

                  <tr className="border-t font-semibold">
                    <td className="px-4 py-2">Total Earnings</td>
                    <td className="px-4 py-2 text-right text-green-600">
                      {formatCurrency(report.totalEarnings || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* DEDUCTIONS */}
              <table className="w-full border border-gray-200 rounded text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">DEDUCTIONS</th>
                    <th className="px-4 py-2 text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Common deduction fields: Late Fine, Employer PF, Employee PF, Professional Tax, etc. */}
                  {report.lateFine != null && (
                    <tr>
                      <td className="px-4 py-2">Late Fine</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(report.lateFine)}</td>
                    </tr>
                  )}
                  {report.pfDeduction != null && (
                    <tr>
                      <td className="px-4 py-2">Employer PF</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(report.pfDeduction)}</td>
                    </tr>
                  )}
                  {report.esicDeduction != null && (
                    <tr>
                      <td className="px-4 py-2">Employee ESIC</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(report.esicDeduction)}</td>
                    </tr>
                  )}
                  {report.gratuityDeduction != null && (
                    <tr>
                      <td className="px-4 py-2">Gratuity Deduction</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(report.gratuityDeduction)}</td>
                    </tr>
                  )}
                  {report.ptDeduction != null && (
                    <tr>
                      <td className="px-4 py-2">Professional Tax Deduction</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(report.ptDeduction)}</td>
                    </tr>
                  )}
                  {report.absentDeduction != null && (
                    <tr>
                      <td className="px-4 py-2">Absent Deduction</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(report.absentDeduction)}</td>
                    </tr>
                  )}
                  {report.lateDeduction != null && (
                    <tr>
                      <td className="px-4 py-2">Late Deduction</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(report.lateDeduction)}</td>
                    </tr>
                  )}

                  <hr />
                  {/* Additional deductions if any */}
                  {report.periodDeductionsList?.map((ded) => (
                    <tr key={ded.id}>
                      <td className="px-4 py-2">{ded.description || "Deduction"}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(ded.amount)}</td>
                    </tr>
                  ))}

                  <tr className="border-t font-semibold">
                    <td className="px-4 py-2">Total Deductions</td>
                    <td className="px-4 py-2 text-right text-red-600">
                      {formatCurrency(report.totalDeductions || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Attendance Summary */}
          <div>
            <h3 className="font-bold text-lg mb-2">Attendance Summary</h3>
            <table className="min-w-full border text-sm text-center">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2">Working Days</th>
                  <th className="p-2">Present</th>
                  <th className="p-2">Absent</th>
                  <th className="p-2">Leaves</th>
                  <th className="p-2">Late Count</th>
                  <th className="p-2">Holidays</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2">{report.workingDays || 0}</td>
                  <td className="p-2">{report.present || 0}</td>
                  <td className="p-2">{report.absentCount || 0}</td>
                  <td className="p-2">{report.leaveCount || 0}</td>
                  <td className="p-2">{report.lateCount || 0}</td>
                  <td className="p-2">{report.holidaysCount || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Paid Amount Breakdown */}
          {report.payments && report.payments.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-2">Paid Amount Breakdown</h3>
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Payment Type</th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {report.payments.map((pay) => (
                    <tr key={pay.id} className="border-b">
                      <td className="p-2">{pay.type}</td>
                      <td className="p-2">
                        {pay.date ? format(new Date(pay.date), "dd MMM yyyy") : "-"}
                      </td>
                      <td className="p-2 text-right">{formatCurrency(pay.amount || 0)}</td>
                      <td className="p-2">{pay.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Net Salary and other summary amounts */}
          <div className="bg-gray-50 p-4 rounded-md flex flex-wrap justify-around gap-4 text-sm font-medium">
            <div>
              <p className="text-gray-600">November Net Salary</p>
              <p className="text-lg text-green-600">{formatCurrency(report.netSalary || 0)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PayrollReport;