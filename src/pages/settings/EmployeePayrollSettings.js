import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FiDollarSign,
  FiAlertCircle,
  FiEdit2,
  FiGift,
  FiMinusCircle,
  FiPlusCircle,
  FiUpload,
  FiDownload,
  FiX,
  FiCheck,
} from "react-icons/fi"
import { getMonth, getYear } from "date-fns"
import { employeeService } from "../../services/employeeService"
import { payrollSettingsService } from "../../services/payrollSettingsService"
import { allowanceService } from "../../services/allowanceService"
import { deductionService } from "../../services/deductionService"
import { bonusService } from "../../services/bonusService"
import PayrollDialog from "../../components/PayrollDialog"
import MonthlyDataDialog from "../../components/PaySlipForms/MonthlyDataDialog"
import AllowanceForm from "../../components/PaySlipForms/AllowanceForm"
import DeductionForm from "../../components/PaySlipForms/DeductionForm"
import BonusForm from "../../components/PaySlipForms/BonusForm"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { useAuth } from "../../contexts/AuthContext"

function EmployeePayroll() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [payrollData, setPayrollData] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showAllowances, setShowAllowances] = useState(false)
  const [showDeductions, setShowDeductions] = useState(false)
  const [showBonus, setShowBonus] = useState(false)
  const [allowances, setAllowances] = useState([])
  const [deductions, setDeductions] = useState([])
  const [bonuses, setBonuses] = useState([])
  const [showAllowanceForm, setShowAllowanceForm] = useState(false)
  const [showDeductionForm, setShowDeductionForm] = useState(false)
  const [showBonusForm, setShowBonusForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataType, setDataType] = useState(null)
  const [showMigrateDialog, setShowMigrateDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const { user } = useAuth()

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

  const fetchMonthlyData = useCallback(
    async (employeeId, type, date = currentDate) => {
      setDataLoading(true)
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      const formattedStart = format(start, "yyyy-MM-dd")
      const formattedEnd = format(end, "yyyy-MM-dd")

      try {
        let data
        switch (type) {
          case "allowance":
            data = await allowanceService.getByEmployeeIdAndDate(employeeId, formattedStart, formattedEnd)
            setAllowances(data)
            break
          case "deduction":
            data = await deductionService.getByEmployeeIdAndDate(employeeId, formattedStart, formattedEnd)
            setDeductions(data)
            break
          case "bonus":
            data = await bonusService.getByEmployeeIdAndDate(employeeId, formattedStart, formattedEnd)
            setBonuses(data)
            break
        }
      } catch (err) {
        setError(`Failed to load ${type}s`)
      } finally {
        setDataLoading(false)
      }
    },
    [currentDate],
  )

  const handleEditPayroll = async (employee) => {
    try {
      setSelectedEmployee(employee)
      const payroll = await payrollSettingsService.getByEmployeeIdAndMonth(employee.id, getMonth(currentDate) + 1, getYear(currentDate))
      setPayrollData(payroll)
      setShowDialog(true)
    } catch (err) {
      setError("Failed to load payroll details")
    }
  }

  const handleShowMonthlyData = async (employee, type) => {
    setSelectedEmployee(employee)
    await fetchMonthlyData(employee.id, type)
    switch (type) {
      case "allowance":
        setShowAllowances(true)
        break
      case "deduction":
        setShowDeductions(true)
        break
      case "bonus":
        setShowBonus(true)
        break
    }
  }

  const handleDateChange = async (newDate, type) => {
    setCurrentDate(newDate)
    setDataType(type)
  }

  useEffect(() => {
    if (selectedEmployee && dataType) {
      fetchMonthlyData(selectedEmployee.id, dataType)
    }
  }, [selectedEmployee, dataType, fetchMonthlyData])

  const handleDelete = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return
    try {
      switch (type) {
        case "allowance":
          await allowanceService.deleteAllowance(id)
          break
        case "deduction":
          await deductionService.deleteDeduction(id)
          break
        case "bonus":
          await bonusService.deleteBonus(id)
          break
      }
      await fetchMonthlyData(selectedEmployee.id, type)
    } catch (err) {
      setError(`Failed to delete ${type}`)
    }
  }

  const handleSubmit = async (formData, type) => {
    try {
      switch (type) {
        case "allowance":
          if (editingItem) {
            await allowanceService.updateAllowance(formData)
          } else {
            await allowanceService.createAllowance(formData)
          }
          setShowAllowanceForm(false)
          break
        case "deduction":
          if (editingItem) {
            await deductionService.updateDeduction(formData)
          } else {
            await deductionService.createDeduction(formData)
          }
          setShowDeductionForm(false)
          break
        case "bonus":
          if (editingItem) {
            await bonusService.updateBonus(formData)
          } else {
            await bonusService.createBonus(formData)
          }
          setShowBonusForm(false)
          break
      }
      setEditingItem(null)
      await fetchMonthlyData(selectedEmployee.id, type)
    } catch (err) {
      setError(`Failed to ${editingItem ? "update" : "create"} ${type}`)
    }
  }

  const handleSubmitPayroll = async (payrollData) => {
    try {
      await payrollSettingsService.createOrUpdatePayroll(payrollData)
      setShowDialog(false)
      setSelectedEmployee(null)
      setPayrollData(null)
    } catch (err) {
      throw new Error("Failed to save payroll details")
    }
  }

  // New: Handle exporting payroll settings
  const handleExportPayroll = async () => {
    try {
      setIsExporting(true)
      const blob = await payrollSettingsService.exportPayroll(user.orgId)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "payroll_settings.xlsx")
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
    } catch (error) {
      setError("Error exporting payroll details")
    } finally {
      setIsExporting(false)
    }
  }

  // New: Handle importing payroll settings (stub; update as needed)
  const handleImportPayroll = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      await payrollSettingsService.importPayroll(file)
      alert("Payroll imported successfully!")
    } catch (error) {
      setError("Error importing payroll details")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with title and Migrate Data button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FiDollarSign className="text-blue-600 w-6 h-6" />
          <h1 className="text-2xl font-bold">Employee Payroll Settings</h1>
        </div>
        {/* Migrate Data button */}
        <button
          onClick={() => setShowMigrateDialog(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
        >
          Migrate Data
        </button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-center shadow-sm"
        >
          <FiAlertCircle className="w-5 h-5 mr-2" />
          <span className="font-medium">{error}</span>
        </motion.div>
      )}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-green-50 text-green-600 p-4 rounded-lg border border-green-100 flex items-center shadow-sm"
        >
          <FiCheck className="w-5 h-5 mr-2" />
          <span className="font-medium">{successMessage}</span>
        </motion.div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <motion.tr
                    key={employee.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-900 flex items-center justify-center text-white">
                          {employee.profilePhotoUrl ? (
                            <img
                              src={employee.profilePhotoUrl || "/placeholder.svg"}
                              alt="Profile"
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <span>
                              {employee.firstName.charAt(0)}
                              {employee.lastName.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.department?.name || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.designation?.name || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.employeeCode || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleEditPayroll(employee)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Edit Payroll"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleShowMonthlyData(employee, "allowance")}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Allowances"
                      >
                        <FiPlusCircle size={18} />
                      </button>
                      <button
                        onClick={() => handleShowMonthlyData(employee, "deduction")}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Deductions"
                      >
                        <FiMinusCircle size={18} />
                      </button>
                      <button
                        onClick={() => handleShowMonthlyData(employee, "bonus")}
                        className="text-yellow-600 hover:text-yellow-900 transition-colors"
                        title="Bonuses"
                      >
                        <FiGift size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Migrate Data Dialog */}
      <AnimatePresence>
        {showMigrateDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            onClick={() => setShowMigrateDialog(false)} // Close when clicking outside
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl p-6 w-[600px] relative"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              {/* Close button */}
              <button
                onClick={() => setShowMigrateDialog(false)}
                className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Migrate Payroll Data</h2>
                <p className="text-sm text-gray-500 mt-1">Export your current data or import new data</p>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {/* Export Section */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FiDownload className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Export Data</h3>
                      <p className="text-sm text-gray-500 mb-3">Download your current payroll settings as Excel file</p>
                      <button
                        onClick={handleExportPayroll}
                        disabled={isExporting}
                        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 ${
                          isExporting ? "cursor-not-allowed" : ""
                        }`}
                      >
                        {isExporting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Exporting...</span>
                          </div>
                        ) : (
                          <>
                            <FiDownload className="w-4 h-4 mr-2" />
                            Export Payroll
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Import Section */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FiUpload className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Import Data</h3>
                      <p className="text-sm text-gray-500 mb-3">Upload new payroll settings from Excel file</p>
                      <label
                        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-green-600 text-white hover:bg-green-700 ${
                          isImporting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        }`}
                      >
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          disabled={isImporting}
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return

                            try {
                              setIsImporting(true)
                              const formData = new FormData()
                              formData.append("file", file)
                              await payrollSettingsService.importPayroll(file)
                              setShowMigrateDialog(false)
                              setError(null)
                              setSuccessMessage("Payroll data imported successfully!")
                              setTimeout(() => setSuccessMessage(null), 3000)
                            } catch (error) {
                              setError("Error importing payroll data. Please check your file and try again.")
                            } finally {
                              setIsImporting(false)
                            }
                          }}
                        />
                        {isImporting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Importing...</span>
                          </div>
                        ) : (
                          "Choose File & Import"
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Important Notes</h4>
                  <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
                    <li>Export your current data before importing new data</li>
                    <li>Make sure your import file follows the correct format</li>
                    <li>Only .xlsx or .xls files are supported</li>
                    <li>Maximum file size: 5MB</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showDialog && selectedEmployee && (
          <PayrollDialog
            employee={selectedEmployee}
            payroll={payrollData}
            onClose={() => {
              setShowDialog(false)
              setSelectedEmployee(null)
              setPayrollData(null)
            }}
            onSubmit={handleSubmitPayroll}
          />
        )}

        {showAllowances && selectedEmployee && (
          <MonthlyDataDialog
            title="Allowances"
            data={allowances}
            onClose={() => setShowAllowances(false)}
            onAdd={() => setShowAllowanceForm(true)}
            onEdit={(item) => {
              setEditingItem(item)
              setShowAllowanceForm(true)
            }}
            onDelete={(id) => handleDelete(id, "allowance")}
            currentDate={currentDate}
            onDateChange={(date) => handleDateChange(date, "allowance")}
            loading={dataLoading}
          />
        )}

        {showDeductions && selectedEmployee && (
          <MonthlyDataDialog
            title="Deductions"
            data={deductions}
            onClose={() => setShowDeductions(false)}
            onAdd={() => setShowDeductionForm(true)}
            onEdit={(item) => {
              setEditingItem(item)
              setShowDeductionForm(true)
            }}
            onDelete={(id) => handleDelete(id, "deduction")}
            currentDate={currentDate}
            onDateChange={(date) => handleDateChange(date, "deduction")}
            loading={dataLoading}
          />
        )}

        {showBonus && selectedEmployee && (
          <MonthlyDataDialog
            title="Bonuses"
            data={bonuses}
            onClose={() => setShowBonus(false)}
            onAdd={() => setShowBonusForm(true)}
            onEdit={(item) => {
              setEditingItem(item)
              setShowBonusForm(true)
            }}
            onDelete={(id) => handleDelete(id, "bonus")}
            currentDate={currentDate}
            onDateChange={(date) => handleDateChange(date, "bonus")}
            loading={dataLoading}
          />
        )}

        {showAllowanceForm && (
          <AllowanceForm
            onSubmit={(data) => handleSubmit(data, "allowance")}
            onClose={() => {
              setShowAllowanceForm(false)
              setEditingItem(null)
            }}
            initialData={editingItem}
            employeeId={selectedEmployee.id}
          />
        )}

        {showDeductionForm && (
          <DeductionForm
            onSubmit={(data) => handleSubmit(data, "deduction")}
            onClose={() => {
              setShowDeductionForm(false)
              setEditingItem(null)
            }}
            initialData={editingItem}
            employeeId={selectedEmployee.id}
          />
        )}

        {showBonusForm && (
          <BonusForm
            onSubmit={(data) => handleSubmit(data, "bonus")}
            onClose={() => {
              setShowBonusForm(false)
              setEditingItem(null)
            }}
            initialData={editingItem}
            employeeId={selectedEmployee.id}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default EmployeePayroll;