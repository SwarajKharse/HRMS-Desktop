import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { FiCheckCircle, FiClock, FiCalendar } from "react-icons/fi"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  return "Good Evening"
}

function Activities({ employee }) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const getValue = (value, defaultValue = "NA") => {
    if (value === null || value === undefined || value === "") {
      return defaultValue
    }
    return value
  }

  return (
    <div className="space-y-6">
      {/* Greeting Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {getGreeting()}, {getValue(employee?.firstName)}!
            </h2>
            <p className="text-gray-600 mt-1">Have a productive day!</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{format(currentTime, "HH:mm")}</div>
            <div className="text-gray-600">{format(currentTime, "EEEE, MMMM d, yyyy")}</div>
          </div>
        </div>
      </div>

      {/* Check In/Out Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Today's Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Check In</div>
            <div className="text-lg font-semibold mt-1">09:00 AM</div>
            <div className="flex items-center gap-1 text-green-600 mt-1">
              <FiCheckCircle className="w-4 h-4" />
              <span className="text-sm">On Time</span>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Check Out</div>
            <div className="text-lg font-semibold mt-1">--:-- --</div>
            <div className="flex items-center gap-1 text-gray-500 mt-1">
              <FiClock className="w-4 h-4" />
              <span className="text-sm">Pending</span>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Total Hours</div>
            <div className="text-lg font-semibold mt-1">07:42</div>
            <div className="flex items-center gap-1 text-blue-600 mt-1">
              <FiCalendar className="w-4 h-4" />
              <span className="text-sm">Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Work Schedule */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Work Schedule</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-500">Current Shift</div>
              <div className="text-lg font-semibold mt-1">General Shift</div>
              <div className="text-sm text-gray-500 mt-1">09:00 AM - 06:00 PM</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Break Time</div>
              <div className="text-lg font-semibold mt-1">01:00 PM - 02:00 PM</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Activities;