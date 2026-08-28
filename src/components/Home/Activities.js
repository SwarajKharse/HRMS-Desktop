import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { FiCheckCircle, FiClock, FiCalendar } from "react-icons/fi";
import PunchAction from "../Attendance/PunchAction";
import { usePermissions } from "../../contexts/PermissionsContext";
import { getNavItems } from "../../config/navItems";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function Activities({ employee }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaysAttendance, setTodaysAttendance] = useState({});
  const { permissions } = usePermissions();

  // Same permission-gated module list the sidebar/navbar already use -
  // mobile-only shortcut tiles, not a second source of truth.
  const moduleTiles = getNavItems(permissions).filter((item) => item.path !== "/");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  // Total hours worked - only computable once both check-in and check-out exist
  const getTotalHoursDisplay = () => {
    if (!todaysAttendance.checkIn) return "—";
    if (!todaysAttendance.checkOut) return "In progress";

    const toMinutes = (t) => {
      const [h, m] = String(t).split(":").map(Number);
      return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
    };

    const start = toMinutes(todaysAttendance.checkIn);
    const end = toMinutes(todaysAttendance.checkOut);
    if (start === null || end === null || end < start) return "—";

    const total = end - start;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting Card - compact single row on mobile, full layout on desktop */}
      <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
        {/* Mobile: compact single row */}
        <div className="md:hidden flex justify-between items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 truncate">
            {getGreeting()}, {getValue(employee?.firstName)}
          </span>
          <span className="text-lg font-bold text-gray-900 shrink-0">{format(currentTime, "HH:mm")}</span>
        </div>

        {/* Desktop: unchanged full layout */}
        <div className="hidden md:flex justify-between items-center">
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
              {getTotalHoursDisplay()}
            </div>
            <div className="flex items-center gap-1 text-blue-600 mt-1">
              <FiCalendar className="w-4 h-4" />
              <span className="text-sm">Today</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <PunchAction employee={employee} onAttendanceChange={setTodaysAttendance} />
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

      {/* Module shortcuts - mobile only. Desktop already has the sidebar. */}
      {moduleTiles.length > 0 && (
        <div className="md:hidden bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Modules</h3>
          <div className="grid grid-cols-3 gap-3">
            {moduleTiles.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center gap-1.5 min-h-[64px] rounded-lg bg-gray-50 active:bg-gray-100 p-2 text-center"
              >
                <item.icon className="w-6 h-6 text-gray-700" />
                <span className="text-xs font-medium text-gray-700 leading-tight">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Activities;
