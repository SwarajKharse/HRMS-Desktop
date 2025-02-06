import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format, differenceInHours, differenceInMinutes, parse } from "date-fns";
import { FiCheckCircle, FiClock, FiCalendar } from "react-icons/fi";
import { attendanceService } from "../../services/attendanceService";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function Activities({ employee }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaysAttendance, setTodaysAttendance] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTodaysAttendance();
  }, [employee]);

  const fetchTodaysAttendance = async () => {
    try {
      const response = await attendanceService.getTodayAttendance(employee.id);
      setTodaysAttendance(response);
    } catch (error) {
      console.error("Failed to fetch today's attendance", error);
    }
  };

  const getValue = (value, defaultValue = "NA") => {
    if (value === null || value === undefined || value === "") {
      return defaultValue;
    }
    return value;
  };

  // Format time without seconds
  const formatTime = (time) => {
    if (!time) return "--:--";
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

  // Calculate total hours worked
  const calculateTotalHoursWorked = () => {
    if (!todaysAttendance.checkIn) return "00:00";

    const checkInTime = parse(todaysAttendance.checkIn, "HH:mm:ss.SSS", new Date());
    const checkOutTime = todaysAttendance.checkOut
      ? parse(todaysAttendance.checkOut, "HH:mm:ss.SSS", new Date())
      : currentTime;

    const hours = differenceInHours(checkOutTime, checkInTime);
    const minutes = differenceInMinutes(checkOutTime, checkInTime) % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-6">
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
            <div className="text-lg font-semibold mt-1">
              {formatTime(todaysAttendance.checkIn)}
            </div>
            <div className="flex items-center gap-1 text-gray-500 mt-1">
              <FiCheckCircle className="w-4 h-4" />
              <span className="text-sm">
                {todaysAttendance.checkIn ? "Checked In" : "Pending"}
              </span>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Check Out</div>
            <div className="text-lg font-semibold mt-1">
              {formatTime(todaysAttendance.checkOut)}
            </div>
            <div className="flex items-center gap-1 text-gray-500 mt-1">
              <FiClock className="w-4 h-4" />
              <span className="text-sm">
                {todaysAttendance.checkOut ? "Checked Out" : "Pending"}
              </span>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Total Hours</div>
            <div className="text-lg font-semibold mt-1">
              {calculateTotalHoursWorked()}
            </div>
            <div className="flex items-center gap-1 text-blue-600 mt-1">
              <FiCalendar className="w-4 h-4" />
              <span className="text-sm">Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Attendance Status</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500">Status</div>
          <div className="text-lg font-semibold mt-1">
            {todaysAttendance.status || "No status available"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Activities;