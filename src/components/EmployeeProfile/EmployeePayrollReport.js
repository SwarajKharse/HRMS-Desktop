"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
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
} from "react-icons/fi";

// Services
import { payrollReportService } from "../../services/payrollReportService";
import { attendanceService } from "../../services/attendanceService";
import { payrollPerEmployeeService } from "../../services/payrollPerEmployeeService";
import { allowanceService } from "../../services/allowanceService";
import { deductionService } from "../../services/deductionService";
import { bonusService } from "../../services/bonusService";

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

  // Month/Year navigator
  const currentDate = new Date();
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

  // --- Render Functions for Each Tab ---

  const renderSummary = () => (
    <div className="p-6 flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Salary Components */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Salary Components</h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-gray-600">Basic Salary</span>
              <span className="font-medium">{formatCurrency(report.basicSalary)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-gray-600">HRA</span>
              <span className="font-medium">{formatCurrency(report.hra)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-gray-600">DA</span>
              <span className="font-medium">{formatCurrency(report.da)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-gray-600">Total Allowances</span>
              <span className="font-medium">{formatCurrency(report.totalAllowances)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-gray-600">Total Bonus</span>
              <span className="font-medium">{formatCurrency(report.totalBonuses)}</span>
            </div>
          </div>
        </div>
        {/* Deductions */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Deductions</h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-gray-600">Absent Deduction</span>
              <span className="font-medium text-red-600">{formatCurrency(report.absentDeduction)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-gray-600">Late Deduction</span>
              <span className="font-medium text-red-600">{formatCurrency(report.lateDeduction)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-gray-600">Half Day Deduction</span>
              <span className="font-medium text-red-600">{formatCurrency(report.halfDayDeduction)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-gray-600">Unpaid Leaves</span>
              <span className="font-medium text-red-600">{formatCurrency(report.unpaidLeavesDeduction)}</span>
            </div>
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
            { label: "Late Count", value: report.lateCount },
            { label: "Half Days", value: report.paidHalfDayCount + report.unpaidHalfDayCount },
            { label: "Weekends", value: report.weekendsCount },
            { label: "Holidays", value: report.holidaysCount },
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
    </div>
  );

  const renderOvertimes = () => (
    <div className="p-6">
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
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.overtimeMinutes}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.isIncludeOvertime ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.isIncludeOvertime ? "Included" : "Not Included"}
                  </span>
                </TableCell>
                <TableCell>
                  <Toggle
                    checked={item.isIncludeOvertime}
                    onChange={() =>
                      handleToggleOvertime(item.id, item.isIncludeOvertime, item.overtimeMinutes)
                    }
                  />
                </TableCell>
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
                <TableCell>{item.date}</TableCell>
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
                <TableCell>
                  <Toggle
                    checked={item.isIncludeLateCheckIn}
                    onChange={() => handleToggleLateCheckIn(item.id, item.isIncludeLateCheckIn)}
                  />
                </TableCell>
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
                <TableCell>{item.date}</TableCell>
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
                <TableCell>
                  <Toggle
                    checked={item.isIncludeEarlyCheckOut}
                    onChange={() => handleToggleEarlyCheckOut(item.id, item.isIncludeEarlyCheckOut)}
                  />
                </TableCell>
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
                <TableCell>{item.date}</TableCell>
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
                <TableCell>{item.date}</TableCell>
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
                <TableCell>{item.date}</TableCell>
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
    <div className="flex flex-col gap-4 max-w-7xl mx-auto p-4">
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
        <button
          onClick={handleEditPayrollSettings}
          className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors"
        >
          Edit Payroll Settings
        </button>
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
                await payrollPerEmployeeService.createOrUpdatePayroll(data);
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
            initialData={editingItem}
            employeeId={employeeId}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeePayrollReport;