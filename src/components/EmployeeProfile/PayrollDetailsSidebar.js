"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { attendanceService } from "../../services/attendanceService"
import { FiFileText, FiClock, FiAlertCircle, FiLogOut, FiDollarSign, FiGift, FiMinusCircle } from "react-icons/fi"

const Toggle = ({ checked, onChange, size = "small" }) => {
  const baseClasses =
    "relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  const sizeClasses = size === "small" ? "h-4 w-8" : "h-6 w-11"

  return (
    <button
      type="button"
      className={`${baseClasses} ${sizeClasses} ${checked ? "bg-blue-600" : "bg-gray-200"}`}
      role="switch"
      aria-checked={checked}
      onClick={onChange}
    >
      <span
        className={`${
          checked ? "translate-x-4" : "translate-x-0.5"
        } inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
          size === "small" ? "h-3 w-3" : "h-5 w-5"
        }`}
      />
    </button>
  )
}

const PayrollDetailsSidebar = ({ report, onUpdate }) => {
  const tabs = [
    { id: "summary", label: "Summary", icon: FiFileText },
    { id: "overtimes", label: "Overtimes", icon: FiClock },
    { id: "late", label: "Late Check-Ins", icon: FiAlertCircle },
    { id: "early", label: "Early Check-Outs", icon: FiLogOut },
    { id: "allowances", label: "Allowances", icon: FiDollarSign },
    { id: "bonus", label: "Bonus", icon: FiGift },
    { id: "deductions", label: "Deductions", icon: FiMinusCircle },
  ]

  const [activeTab, setActiveTab] = useState("summary")
  const [localOvertimes, setLocalOvertimes] = useState(report.overtimes || [])
  const [localLateCheckIns, setLocalLateCheckIns] = useState(report.lateCheckIn || [])
  const [localEarlyCheckOuts, setLocalEarlyCheckOuts] = useState(report.earlyCheckOuts || [])

  const handleToggleOvertime = async (attendanceId, currentValue, overtimeMinutes) => {
    try {
      await attendanceService.markUpdateOvertime(attendanceId, overtimeMinutes, !currentValue)
      setLocalOvertimes((prev) =>
        prev.map((item) => (item.id === attendanceId ? { ...item, isIncludeOvertime: !currentValue } : item)),
      )
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Failed to update overtime:", error)
    }
  }

  const handleToggleLateCheckIn = async (attendanceId, currentValue) => {
    try {
      await attendanceService.markUpdateLateCheckIn(attendanceId, !currentValue)
      setLocalLateCheckIns((prev) =>
        prev.map((item) => (item.id === attendanceId ? { ...item, isIncludeLateCheckIn: !currentValue } : item)),
      )
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Failed to update late check-in:", error)
    }
  }

  const handleToggleEarlyCheckOut = async (attendanceId, currentValue) => {
    try {
      await attendanceService.markUpdateEarlyCheckOut(attendanceId, !currentValue)
      setLocalEarlyCheckOuts((prev) =>
        prev.map((item) => (item.id === attendanceId ? { ...item, isIncludeEarlyCheckOut: !currentValue } : item)),
      )
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Failed to update early check-out:", error)
    }
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)

  const TableHeader = ({ children }) => (
    <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
      {children}
    </th>
  )

  const TableCell = ({ children, className = "" }) => <td className={`px-4 py-2 text-sm ${className}`}>{children}</td>

  const renderSummary = () => (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Salary Components</h3>
          <div className="space-y-2">
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

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Deductions</h3>
          <div className="space-y-2">
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

      <div className="space-y-4">
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

      <div className="bg-green-50 rounded-lg p-6 border border-green-100">
        <div className="text-sm text-green-600 mb-1">Net Salary</div>
        <div className="text-3xl font-bold text-green-700">{formatCurrency(report.netSalary)}</div>
      </div>
    </div>
  )

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
                    onChange={() => handleToggleOvertime(item.id, item.isIncludeOvertime, item.overtimeMinutes)}
                  />
                </TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

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
  )

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
  )

  const renderAllowances = () => (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <TableHeader>Date</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Amount</TableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {report.allowances?.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-green-600 font-medium">{formatCurrency(item.amount)}</TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderBonus = () => (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <TableHeader>Date</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Amount</TableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {report.bonuses?.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-green-600 font-medium">{formatCurrency(item.amount)}</TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderDeductions = () => (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <TableHeader>Date</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Amount</TableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {report.periodDeductionsList?.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-red-600 font-medium">{formatCurrency(item.amount)}</TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case "summary":
        return renderSummary()
      case "overtimes":
        return renderOvertimes()
      case "late":
        return renderLateCheckIns()
      case "early":
        return renderEarlyCheckOuts()
      case "allowances":
        return renderAllowances()
      case "bonus":
        return renderBonus()
      case "deductions":
        return renderDeductions()
      default:
        return null
    }
  }

  return (
    <div className="flex">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-gray-200 bg-gray-50">
        <nav className="space-y-1 p-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-x-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  )
}

export default PayrollDetailsSidebar;