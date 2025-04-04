import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiFileText,
  FiClock,
  FiLogOut,
  FiDollarSign,
  FiGift,
  FiMinusCircle,
  FiEdit2,
  FiTrash2,
  FiPlusCircle,
  FiCheck,
  FiDownload,
  FiPieChart,
} from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";

// Services
import { payrollReportService } from "../../services/payrollReportService";
import { attendanceService } from "../../services/attendanceService";
import { payrollSettingsService } from "../../services/payrollSettingsService";
import { allowanceService } from "../../services/allowanceService";
import { deductionService } from "../../services/deductionService";
import { bonusService } from "../../services/bonusService";
import { payslipService } from "../../services/payslipService";

// Modals / Forms
import PayrollDialog from "../../components/PayrollDialog";
import AllowanceForm from "../../components/PaySlipForms/AllowanceForm";
import DeductionForm from "../../components/PaySlipForms/DeductionForm";
import BonusForm from "../../components/PaySlipForms/BonusForm";

// Toggle component for on/off states
const Toggle = ({ checked, onChange, size = "small" }) => {
  const baseClasses =
    "relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
  const sizeClasses = size === "small" ? "h-4 w-8" : "h-6 w-11";

  return (
    <button
      type="button"
      className={`${baseClasses} ${sizeClasses} ${
        checked ? "bg-blue-600" : "bg-gray-200"
      }`}
      role="switch"
      aria-checked={checked}
      onClick={onChange}
    >
      <span
        className={`${
          checked ? "translate-x-4" : "translate-x-0.5"
        } inline-block transform rounded-full bg-white transition-transform ${
          size === "small" ? "h-3 w-3" : "h-5 w-5"
        }`}
      />
    </button>
  );
};

const EmployeePayrollReport = ({ employeeId }) => {
  // Report and loading states
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const { user } = useAuth();

  // Month/Year navigator
  const currentDate = new Date(new Date().setDate(new Date().getDate() - 10));
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Local states for toggleable attendance items
  const [localOvertimes, setLocalOvertimes] = useState([]);
  const [localLateCheckIns, setLocalLateCheckIns] = useState([]);
  const [localEarlyCheckOuts, setLocalEarlyCheckOuts] = useState([]);

  // Modal states for payroll settings and for data (allowance/deduction/bonus)
  const [showPayrollDialog, setShowPayrollDialog] = useState(false);
  const [showAllowanceForm, setShowAllowanceForm] = useState(false);
  const [showDeductionForm, setShowDeductionForm] = useState(false);
  const [showBonusForm, setShowBonusForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState(null); // "allowance", "deduction", "bonus"

  // Tabs definition
  const tabs = [
    { id: "summary", label: "Summary", icon: FiFileText },
    { id: "overtimes", label: "Overtimes", icon: FiClock },
    { id: "late", label: "Late Check-Ins", icon: FiAlertCircle },
    { id: "early", label: "Early Check-Outs", icon: FiLogOut },
    { id: "allowances", label: "Allowances", icon: FiDollarSign },
    { id: "bonus", label: "Bonus", icon: FiGift },
    { id: "deductions", label: "Deductions", icon: FiMinusCircle },
  ];

  // Fetch payroll report data
  const fetchReport = useCallback(async (empId, month, year) => {
    try {
      setReportLoading(true);
      const data = await payrollReportService.getPayrollReportByEmployeeIdAndMonthAndYear(
        empId,
        month,
        year
      );
      setReport(data);
      // Update local toggle states (preserving active tab)
      setLocalOvertimes(data.overtimes || []);
      setLocalLateCheckIns(data.lateCheckIn || []);
      setLocalEarlyCheckOuts(data.earlyCheckOuts || []);
      setError(null);
    } catch (err) {
      setError("Failed to load payroll report");
      setReport(null);
    } finally {
      setReportLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (employeeId) {
      fetchReport(employeeId, selectedMonth, selectedYear);
    }
  }, [employeeId, selectedMonth, selectedYear, fetchReport]);

  const handlePrevMonth = () => {
    let month = selectedMonth;
    let year = selectedYear;
    if (month === 1) {
      month = 12;
      year = year - 1;
    } else {
      month = month - 1;
    }
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const handleNextMonth = () => {
    let month = selectedMonth;
    let year = selectedYear;
    if (month === 12) {
      month = 1;
      year = year + 1;
    } else {
      month = month + 1;
    }
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // Optimistic toggle handlers for overtime, late check-in, and early check-out
  const handleToggleOvertime = async (attendanceId, currentValue, overtimeMinutes) => {
    try {
      setLocalOvertimes((prev) =>
        prev.map((item) =>
          item.id === attendanceId
            ? { ...item, isIncludeOvertime: !currentValue }
            : item
        )
      );
      await attendanceService.markUpdateOvertime(attendanceId, overtimeMinutes, !currentValue);
      fetchReport(employeeId, selectedMonth, selectedYear);
    } catch (error) {
      setLocalOvertimes((prev) =>
        prev.map((item) =>
          item.id === attendanceId
            ? { ...item, isIncludeOvertime: currentValue }
            : item
        )
      );
      console.error("Failed to update overtime:", error);
    }
  };

  const handleToggleLateCheckIn = async (attendanceId, currentValue) => {
    try {
      setLocalLateCheckIns((prev) =>
        prev.map((item) =>
          item.id === attendanceId
            ? { ...item, isIncludeLateCheckIn: !currentValue }
            : item
        )
      );
      await attendanceService.markUpdateLateCheckIn(attendanceId, !currentValue);
      fetchReport(employeeId, selectedMonth, selectedYear);
    } catch (error) {
      setLocalLateCheckIns((prev) =>
        prev.map((item) =>
          item.id === attendanceId
            ? { ...item, isIncludeLateCheckIn: currentValue }
            : item
        )
      );
      console.error("Failed to update late check-in:", error);
    }
  };

  const handleToggleEarlyCheckOut = async (attendanceId, currentValue) => {
    try {
      setLocalEarlyCheckOuts((prev) =>
        prev.map((item) =>
          item.id === attendanceId
            ? { ...item, isIncludeEarlyCheckOut: !currentValue }
            : item
        )
      );
      await attendanceService.markUpdateEarlyCheckOut(attendanceId, !currentValue);
      fetchReport(employeeId, selectedMonth, selectedYear);
    } catch (error) {
      setLocalEarlyCheckOuts((prev) =>
        prev.map((item) =>
          item.id === attendanceId
            ? { ...item, isIncludeEarlyCheckOut: currentValue }
            : item
        )
      );
      console.error("Failed to update early check-out:", error);
    }
  };

  // Bulk update handlers for overtime entries
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false)

  const handleIncludeAllOvertimes = async () => {
    if (localOvertimes.length === 0) return

    try {
      setBulkOperationLoading(true)
      setError(null)

      // Update local state immediately for better UX
      setLocalOvertimes((prev) =>
        prev.map((item) => ({
          ...item,
          isIncludeOvertime: true,
        })),
      )

      // Process all overtime entries in sequence
      for (const item of localOvertimes) {
        if (!item.isIncludeOvertime) {
          // Only update entries that need changing
          await attendanceService.markUpdateOvertime(item.id, item.overtimeMinutes, true)
        }
      }

      // Refresh data after all updates
      fetchReport(employeeId, selectedMonth, selectedYear)
    } catch (error) {
      console.error("Failed to include all overtimes:", error)
      setError("Failed to update all overtime entries. Please try again.")
      // Revert local state on error
      fetchReport(employeeId, selectedMonth, selectedYear)
    } finally {
      setBulkOperationLoading(false)
    }
  }

  const handleRemoveAllOvertimes = async () => {
    if (localOvertimes.length === 0) return

    try {
      setBulkOperationLoading(true)
      setError(null)

      // Update local state immediately for better UX
      setLocalOvertimes((prev) =>
        prev.map((item) => ({
          ...item,
          isIncludeOvertime: false,
        })),
      )

      // Process all overtime entries in sequence
      for (const item of localOvertimes) {
        if (item.isIncludeOvertime) {
          // Only update entries that need changing
          await attendanceService.markUpdateOvertime(item.id, item.overtimeMinutes, false)
        }
      }

      // Refresh data after all updates
      fetchReport(employeeId, selectedMonth, selectedYear)
    } catch (error) {
      console.error("Failed to remove all overtimes:", error)
      setError("Failed to update all overtime entries. Please try again.")
      // Revert local state on error
      fetchReport(employeeId, selectedMonth, selectedYear)
    } finally {
      setBulkOperationLoading(false)
    }
  }

  // Format currency helper
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  // Simple table header and cell components
  const TableHeader = ({ children }) => (
    <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
      {children}
    </th>
  );
  const TableCell = ({ children, className = "" }) => (
    <td className={`px-4 py-2 text-sm ${className}`}>{children}</td>
  );

  // --- Missing Functions Definitions ---

  // Delete data for allowance, bonus, or deduction
  const handleDeleteData = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      switch (type) {
        case "allowance":
          await allowanceService.deleteAllowance(id);
          break;
        case "deduction":
          await deductionService.deleteDeduction(id);
          break;
        case "bonus":
          await bonusService.deleteBonus(id);
          break;
        default:
          break;
      }
      fetchReport(employeeId, selectedMonth, selectedYear);
    } catch (err) {
      setError(`Failed to delete ${type}`);
    }
  };

  // Open the Payroll Dialog for editing payroll settings
  const handleEditPayrollSettings = () => {
    setShowPayrollDialog(true);
  };

  // Handle submission for allowance, deduction, or bonus data (create or update)
  const handleSubmitData = async (data, type) => {
    try {
      if (editingItem) {
        // Update existing item
        switch (type) {
          case "allowance":
            await allowanceService.updateAllowance(data);
            break;
          case "deduction":
            await deductionService.updateDeduction(data);
            break;
          case "bonus":
            await bonusService.updateBonus(data);
            break;
          default:
            break;
        }
      } else {
        // Create new item
        switch (type) {
          case "allowance":
            await allowanceService.createAllowance(data);
            break;
          case "deduction":
            await deductionService.createDeduction(data);
            break;
          case "bonus":
            await bonusService.createBonus(data);
            break;
          default:
            break;
        }
      }
      // Close the corresponding form
      if (type === "allowance") setShowAllowanceForm(false);
      else if (type === "deduction") setShowDeductionForm(false);
      else if (type === "bonus") setShowBonusForm(false);
      setEditingItem(null);
      setEditingType(null);
      fetchReport(employeeId, selectedMonth, selectedYear);
    } catch (err) {
      setError(`Failed to ${editingItem ? "update" : "create"} ${type}`);
    }
  };

  // Add the following state for download operations:
  const [downloadLoading, setDownloadLoading] = useState(null)

  // Add the following download handler functions:
  const handleDownloadCTCBreakdown = async () => {
    try {
      setDownloadLoading("ctc")
      const blob = await payrollSettingsService.exportIndividualCTCBreakdown(employeeId, selectedMonth, selectedYear)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `CTC_Breakdown_${employeeId}_${selectedMonth}_${selectedYear}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      setError("Failed to download CTC breakdown")
      console.error(error)
    } finally {
      setDownloadLoading(null)
    }
  }

  const handleDownloadPayslipXlsx = async () => {
    try {
      setDownloadLoading("xlsx")
      const blob = await payslipService.exportIndividualMonthlySalary(employeeId, selectedMonth, selectedYear)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `Monthly_Salary_${employeeId}_${selectedMonth}_${selectedYear}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      setError("Failed to download monthly salary report")
      console.error(error)
    } finally {
      setDownloadLoading(null)
    }
  }

  const handleDownloadPayslipPdf = async () => {
    try {
      setDownloadLoading("pdf")
      const blob = await payslipService.downloadPayslipByEmpIdPdf(employeeId, selectedMonth, selectedYear)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `Payslip_${employeeId}_${selectedMonth}_${selectedYear}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      setError("Failed to download payslip PDF")
      console.error(error)
    } finally {
      setDownloadLoading(null)
    }
  }

  // --- Render Functions for Each Tab ---

  const renderSummary = () => (
    <div className="p-6 flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Salary Components</h3>
            <div className="flex flex-col gap-2">
              {report.basicDaEarning > 0 && (
                <div className="flex justify-between items-center py-1 border-b">
                  <span className="text-gray-600">Basic Salary + DA</span>
                  <span className="font-medium">{formatCurrency(report.basicDaEarning)}</span>
                </div>
              )}
              {report.hraEarning > 0 && (
                <div className="flex justify-between items-center py-1 border-b">
                  <span className="text-gray-600">HRA</span>
                  <span className="font-medium">{formatCurrency(report.hraEarning)}</span>
                </div>
              )}
              {/* fixedAllowances.map and then render the getAllowanceName and getAmount and use Id as key*/}
              {report.fixedAllowances.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-1 border-b">
                    <span className="text-gray-600">{item.allowanceName}</span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
              ))}
              {report.otherAllowances > 0 && (
                <div className="flex justify-between items-center py-1 border-b">
                  <span className="text-gray-600">Other Allowances</span>
                  <span className="font-medium">{formatCurrency(report.otherAllowances)}</span>
                </div>
              )}
              {report.incentives > 0 && (
                <div className="flex justify-between items-center py-1 border-b">
                  <span className="text-gray-600">Incentives</span>
                  <span className="font-medium">{formatCurrency(report.incentives)}</span>
                </div>
              )}
              {report.grossSalary > 0 && (
                <div className="flex justify-between items-center py-1 border-b">
                  <span className="text-gray-600">Gross Salary</span>
                  <span className="font-medium">{formatCurrency(report.grossSalary)}</span>
                </div>
              )}
              {report.totalAllowances > 0 && (
                <div className="flex justify-between items-center py-1 border-b">
                  <span className="text-gray-600">Total Allowances</span>
                  <span className="font-medium">{formatCurrency(report.totalAllowances)}</span>
                </div>
              )}
              {report.totalBonuses > 0 && (
                <div className="flex justify-between items-center py-1 border-b">
                  <span className="text-gray-600">Total Bonus</span>
                  <span className="font-medium">{formatCurrency(report.totalBonuses)}</span>
                </div>
              )}
              {report.totalEarnings > 0 && (
                <div className="flex justify-between items-center py-1 border-b">
                  <span className="text-gray-600">Total Earnings</span>
                  <span className="font-medium">{formatCurrency(report.totalEarnings)}</span>
                </div>
              )}
            </div>
          </div>
          {/* Deductions */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Deductions</h3>
          <div className="flex flex-col gap-2">
            {report.employeePf > 0 && (
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-gray-600">Employee PF</span>
                <span className="font-medium">{formatCurrency(report.employeePf)}</span>
              </div>
            )}
            {report.employeeEsic > 0 && (
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-gray-600">Employee ESIC</span>
                <span className="font-medium">{formatCurrency(report.employeeEsic)}</span>
              </div>
            )}
            {report.professionalTax > 0 && (
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-gray-600">Professional Tax</span>
                <span className="font-medium text-red-600">{formatCurrency(report.professionalTax)}</span>
              </div>
            )}
            {report.periodDeductions > 0 && (
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-gray-600">Other Deductions</span>
                <span className="font-medium text-red-600">{formatCurrency(report.periodDeductions)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-gray-600">Total Deductions</span>
              <span className="font-medium text-red-600">{formatCurrency(report.totalDeductions)}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Attendance Summary */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Attendance Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[
            { label: "Present", value: report.presentCount },
            { label: "Absent", value: report.absentCount },
            { label: "Paid Leaves", value: report.paidLeavesCount },
            { label: "Unpaid Leaves", value: report.unpaidLeavesCount },
            { label: "Late Count", value: report.lateCount + "/" + (report.lateCheckIn.length + report.earlyCheckOuts.length) },
            { label: "Half Days (Paid | Unpaid)", value: report.paidHalfDayCount + " | " + report.unpaidHalfDayCount },
            { label: "Weekends + Holidays", value: report.weekendsCount + report.holidaysCount },
            { label: "Effective Days", value: report.effectiveWorkingDays },
          ].map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3 flex flex-col justify-between border border-gray-200">
              <div className="text-sm text-gray-500">{item.label}</div>
              <div className="text-2xl font-semibold mt-1">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Net Salary */}
      <div className="bg-green-50 rounded-lg p-6 border border-green-100">
        <div className="text-sm text-green-600 mb-1">Net Salary</div>
        <div className="text-3xl font-bold text-green-700">{formatCurrency(report.netSalary)}</div>
      </div>

      {/* Download Buttons */}
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        <button
          onClick={handleDownloadCTCBreakdown}
          disabled={downloadLoading === "ctc"}
          className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloadLoading === "ctc" ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-700 border-t-transparent mr-2"></div>
          ) : (
            <FiPieChart className="mr-2" />
          )}
          Download CTC Breakdown
        </button>

        <button
          onClick={handleDownloadPayslipXlsx}
          disabled={downloadLoading === "xlsx"}
          className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloadLoading === "xlsx" ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-700 border-t-transparent mr-2"></div>
          ) : (
            <FiFileText className="mr-2" />
          )}
          Download Payslip (XLSX)
        </button>

        <button
          onClick={handleDownloadPayslipPdf}
          disabled={downloadLoading === "pdf"}
          className="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloadLoading === "pdf" ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-700 border-t-transparent mr-2"></div>
          ) : (
            <FiDownload className="mr-2" />
          )}
          Download Payslip (PDF)
        </button>
      </div>
    </div>
  );

  const renderOvertimes = () => (
    <div className="p-6">
      {user?.userId !== employeeId && (
        <div className="mb-4 flex items-center justify-end gap-3">
          <button
            onClick={handleIncludeAllOvertimes}
            disabled={bulkOperationLoading || localOvertimes.length === 0}
            className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkOperationLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-700 border-t-transparent mr-2"></div>
            ) : (
              <FiCheck className="mr-2" />
            )}
            Include All
          </button>
          <button
            onClick={handleRemoveAllOvertimes}
            disabled={bulkOperationLoading || localOvertimes.length === 0}
            className="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkOperationLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-700 border-t-transparent mr-2"></div>
            ) : (
              <FiTrash2 className="mr-2" />
            )}
            Remove All
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <TableHeader>Date</TableHeader>
              <TableHeader>Minutes</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Action</TableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {localOvertimes.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <TableCell>{format(new Date(item.date), "d MMM yyyy")}</TableCell>
                <TableCell>
                  {user?.userId !== employeeId ? (
                    <input
                      type="number"
                      defaultValue={item.overtimeMinutes}
                      className="w-20 px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const minutes = Number.parseInt(e.target.value, 10)
                        if (!isNaN(minutes) && minutes >= 0) {
                          item.overtimeMinutes = minutes
                        }
                      }}
                    />
                  ) : (
                    item.overtimeMinutes
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.isIncludeOvertime ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.isIncludeOvertime ? "Included" : "Not Included"}
                  </span>
                </TableCell>
                {user?.userId !== employeeId && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Toggle
                        checked={item.isIncludeOvertime}
                        onChange={() =>
                          handleToggleOvertime(item.id, item.isIncludeOvertime, item.overtimeMinutes)
                        }
                      />
                      <button
                        onClick={() => handleToggleOvertime(item.id, !item.isIncludeOvertime, item.overtimeMinutes)}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                      >
                        <FiCheck className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLateCheckIns = () => (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <TableHeader>Date</TableHeader>
              <TableHeader>Check-In</TableHeader>
              <TableHeader>Check-Out</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Action</TableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {localLateCheckIns.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <TableCell>{format(new Date(item.date), "d MMM yyyy")}</TableCell>
                <TableCell>{item.checkIn}</TableCell>
                <TableCell>{item.checkOut}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.isIncludeLateCheckIn ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.isIncludeLateCheckIn ? "Included" : "Not Included"}
                  </span>
                </TableCell>
                {user?.userId !== employeeId && (
                  <TableCell>
                    <Toggle
                      checked={item.isIncludeLateCheckIn}
                      onChange={() => handleToggleLateCheckIn(item.id, item.isIncludeLateCheckIn)}
                    />
                  </TableCell>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEarlyCheckOuts = () => (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <TableHeader>Date</TableHeader>
              <TableHeader>Check-In</TableHeader>
              <TableHeader>Check-Out</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Action</TableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {localEarlyCheckOuts.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <TableCell>{format(new Date(item.date), "d MMM yyyy")}</TableCell>
                <TableCell>{item.checkIn}</TableCell>
                <TableCell>{item.checkOut}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.isIncludeEarlyCheckOut ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.isIncludeEarlyCheckOut ? "Included" : "Not Included"}
                  </span>
                </TableCell>
                {user?.userId !== employeeId && (
                  <TableCell>
                    <Toggle
                      checked={item.isIncludeEarlyCheckOut}
                      onChange={() => handleToggleEarlyCheckOut(item.id, item.isIncludeEarlyCheckOut)}
                    />
                  </TableCell>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAllowances = () => (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <TableHeader>Date</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {report.allowances?.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <TableCell>{format(new Date(item.date), "d MMM yyyy")}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-green-600 font-medium">{formatCurrency(item.amount)}</TableCell>
                <TableCell>
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setEditingType("allowance");
                      setShowAllowanceForm(true);
                    }}
                    className="mr-2 text-blue-600 hover:text-blue-900"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteData(item.id, "allowance")}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {user?.userId !== employeeId && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setEditingItem(null);
              setEditingType("allowance");
              setShowAllowanceForm(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors"
          >
            <FiPlusCircle className="mr-2" />
            Add Allowance
          </button>
        </div>
      )}
    </div>
  );

  const renderBonus = () => (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <TableHeader>Date</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {report.bonuses?.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <TableCell>{format(new Date(item.date), "d MMM yyyy")}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-green-600 font-medium">{formatCurrency(item.amount)}</TableCell>
                <TableCell>
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setEditingType("bonus");
                      setShowBonusForm(true);
                    }}
                    className="mr-2 text-blue-600 hover:text-blue-900"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteData(item.id, "bonus")}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {user?.userId !== employeeId && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setEditingItem(null);
              setEditingType("bonus");
              setShowBonusForm(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors"
          >
            <FiPlusCircle className="mr-2" />
            Add Bonus
          </button>
        </div>
      )}
    </div>
  );

  const renderDeductions = () => (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <TableHeader>Date</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {report.periodDeductionsList?.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <TableCell>{format(new Date(item.date), "d MMM yyyy")}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-red-600 font-medium">{formatCurrency(item.amount)}</TableCell>
                <TableCell>
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setEditingType("deduction");
                      setShowDeductionForm(true);
                    }}
                    className="mr-2 text-blue-600 hover:text-blue-900"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteData(item.id, "deduction")}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {user?.userId !== employeeId && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setEditingItem(null);
              setEditingType("deduction");
              setShowDeductionForm(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors"
          >
            <FiPlusCircle className="mr-2" />
            Add Deduction
          </button>
        </div>
      )}
    </div>
  );

  // Decide which tab content to render
  const renderContent = () => {
    switch (activeTab) {
      case "summary":
        return renderSummary();
      case "overtimes":
        return renderOvertimes();
      case "late":
        return renderLateCheckIns();
      case "early":
        return renderEarlyCheckOuts();
      case "allowances":
        return renderAllowances();
      case "bonus":
        return renderBonus();
      case "deductions":
        return renderDeductions();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w mx-auto p-4">
      {/* Month Navigator and Edit Payroll Settings Button */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FiChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-lg font-medium text-gray-700">
            {format(new Date(selectedYear, selectedMonth - 1), "MMMM yyyy")}
          </div>
          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FiChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        {user?.userId !== employeeId && (
          <button
            onClick={handleEditPayrollSettings}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors"
          >
            Edit Payroll Settings
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg border border-red-100 flex items-center">
          <FiAlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {reportLoading ? (
        <div className="flex items-center justify-center h-[600px] bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-sm text-gray-500">Loading payroll report...</div>
          </div>
        </div>
      ) : (
        report && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex">
              {/* Sidebar Tabs */}
              <div className="w-64 border-r border-gray-200 bg-gray-50">
                <nav className="flex flex-col gap-1 p-4">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
              {/* Content Area */}
              <div className="flex-1">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="p-6"
                >
                  {renderContent()}
                </motion.div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Modals */}
      <AnimatePresence>
        {showPayrollDialog && (
          <PayrollDialog
            employee={{employeeId}}
            payroll={report?.payrollSettings || null}
            onClose={() => setShowPayrollDialog(false)}
            onSubmit={async (data) => {
              try {
                await payrollSettingsService.createOrUpdatePayroll(data);
                setShowPayrollDialog(false);
                fetchReport(employeeId, selectedMonth, selectedYear);
              } catch (err) {
                setError("Failed to save payroll details");
              }
            }}
          />
        )}

        {showAllowanceForm && (
          <AllowanceForm
            onSubmit={(data) => handleSubmitData(data, "allowance")}
            onClose={() => {
              setShowAllowanceForm(false);
              setEditingItem(null);
              setEditingType(null);
            }}
            month={selectedMonth}
            year={selectedYear}
            initialData={editingItem}
            employeeId={employeeId}
          />
        )}

        {showDeductionForm && (
          <DeductionForm
            onSubmit={(data) => handleSubmitData(data, "deduction")}
            onClose={() => {
              setShowDeductionForm(false);
              setEditingItem(null);
              setEditingType(null);
            }}
            month={selectedMonth}
            year={selectedYear}
            initialData={editingItem}
            employeeId={employeeId}
          />
        )}

        {showBonusForm && (
          <BonusForm
            onSubmit={(data) => handleSubmitData(data, "bonus")}
            onClose={() => {
              setShowBonusForm(false);
              setEditingItem(null);
              setEditingType(null);
            }}
            month={selectedMonth}
            year={selectedYear}
            initialData={editingItem}
            employeeId={employeeId}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeePayrollReport;