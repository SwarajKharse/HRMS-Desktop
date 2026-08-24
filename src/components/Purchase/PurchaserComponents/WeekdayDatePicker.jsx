"use client"

import { useState, useEffect } from "react"

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const toISODate = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// A small calendar-grid date picker where only dates matching `allowedWeekday` are
// clickable (rest greyed out) — or every date is open when allowedWeekday is null
// (i.e. cycle = "Urgent"). `allowedWeekday` is a weekday name like "Monday".
export default function WeekdayDatePicker({ value, onChange, allowedWeekday, minDate, disabled }) {
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => (value ? new Date(value) : new Date()))

  useEffect(() => {
    if (value) setViewMonth(new Date(value))
  }, [value])

  const min = minDate ? new Date(minDate) : null
  if (min) min.setHours(0, 0, 0, 0)

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  const isAllowed = (date) => {
    if (!date) return false
    if (min && date < min) return false
    if (!allowedWeekday) return true // Urgent — every date open
    return WEEKDAY_NAMES[date.getDay()] === allowedWeekday
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full h-9 px-2 border border-gray-300 rounded-md text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {value || (allowedWeekday ? `Select a ${allowedWeekday}` : "Select date")}
      </button>
      {open && !disabled && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-[100] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="w-80 bg-white border border-gray-200 rounded-lg shadow-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={() => setViewMonth(new Date(year, month - 1, 1))} className="px-2 py-1 text-gray-500 hover:text-gray-800 text-lg">‹</button>
              <span className="text-sm font-semibold text-gray-800">{viewMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
              <button type="button" onClick={() => setViewMonth(new Date(year, month + 1, 1))} className="px-2 py-1 text-gray-500 hover:text-gray-800 text-lg">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs text-gray-400 mb-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className="text-center">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((date, i) => {
                if (!date) return <div key={i} />
                const allowed = isAllowed(date)
                const iso = toISODate(date)
                const selected = value === iso
                return (
                  <button
                    type="button"
                    key={i}
                    disabled={!allowed}
                    onClick={() => { onChange(iso); setOpen(false) }}
                    className={`text-sm h-9 rounded ${
                      selected ? "bg-blue-600 text-white" :
                      allowed ? "hover:bg-blue-50 text-gray-800" : "text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-end mt-3">
              <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-500 hover:text-gray-700">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
