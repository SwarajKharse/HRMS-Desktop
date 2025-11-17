"use client"

import { useState, useEffect } from "react"

const SmartCalendar = ({ paymentCycle, onDateSelect, onClose, selectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [localSelectedDate, setLocalSelectedDate] = useState(null)

  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate)
      setLocalSelectedDate(date)
      setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1))
    }
  }, [selectedDate])

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Get the day of week number for payment cycle
  const getPaymentCycleDayNumber = () => {
    const dayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    }
    return dayMap[paymentCycle] !== undefined ? dayMap[paymentCycle] : -1
  }

  // Check if a date should be enabled based on payment cycle
  const isDateEnabled = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (date < today) {
      return false
    }

    if (paymentCycle === "Urgent") {
      return true // All future dates enabled for urgent
    }

    const paymentDayNumber = getPaymentCycleDayNumber()
    if (paymentDayNumber === -1) {
      return false // Invalid payment cycle
    }

    return date.getDay() === paymentDayNumber
  }

  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDateObj = new Date(startDate)

    // Generate 42 days (6 weeks) for calendar grid
    for (let i = 0; i < 42; i++) {
      const date = new Date(currentDateObj)
      const isCurrentMonth = date.getMonth() === month
      const isToday = date.toDateString() === new Date().toDateString()
      const isEnabled = isCurrentMonth && isDateEnabled(date)
      const isSelected = localSelectedDate && date.toDateString() === localSelectedDate.toDateString()

      days.push({
        date: date,
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        isEnabled,
        isSelected,
      })

      currentDateObj.setDate(currentDateObj.getDate() + 1)
    }

    return days
  }

  const navigateMonth = (direction) => {
    const handleNavigation = (e) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      const newDate = new Date(currentDate)
      newDate.setMonth(newDate.getMonth() + direction)
      setCurrentDate(newDate)
    }
    return handleNavigation
  }

  const handleDateClick = (dayObj) => {
    if (dayObj.isEnabled) {
      setLocalSelectedDate(dayObj.date)
      const formattedDate = dayObj.date.toISOString().split("T")[0]
      onDateSelect(formattedDate)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const calendarDays = getCalendarDays()

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80 max-w-sm mx-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={navigateMonth(-1)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h3 className="text-lg font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>

          <button
            onClick={navigateMonth(1)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            type="button"
            onMouseDown={(e) => e.preventDefault()}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Payment Cycle Info */}
        <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
          {paymentCycle === "Urgent"
            ? "All future dates are available for urgent payments"
            : `Only ${paymentCycle}s are available for payment`}
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayObj, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(dayObj)}
              disabled={!dayObj.isEnabled}
              type="button"
              className={`
                h-10 w-10 text-sm rounded flex items-center justify-center transition-colors
                ${
                  !dayObj.isCurrentMonth
                    ? "text-gray-300 cursor-not-allowed"
                    : dayObj.isEnabled
                      ? "text-gray-900 hover:bg-blue-100 cursor-pointer"
                      : "text-gray-400 cursor-not-allowed"
                }
                ${dayObj.isToday ? "bg-blue-100 font-semibold" : ""}
                ${dayObj.isSelected ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                ${dayObj.isEnabled && !dayObj.isSelected ? "hover:bg-blue-50" : ""}
              `}
            >
              {dayObj.day}
            </button>
          ))}
        </div>

        {/* Calendar Footer */}
        <div className="flex justify-end mt-4 pt-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default SmartCalendar