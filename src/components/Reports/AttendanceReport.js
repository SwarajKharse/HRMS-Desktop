import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format, addDays, subDays } from "date-fns";
import { attendanceService } from "../../services/attendanceService";
import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";

function AttendanceReport() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate]);

  // Filter data when search term or attendance data changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(attendanceData)
    } else {
      const filtered = attendanceData.filter(
        (record) =>
          `${record.firstName} ${record.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.employeeId.toString().includes(searchTerm),
      )
      setFilteredData(filtered)
    }
  }, [searchTerm, attendanceData]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const data = await attendanceService.getAttendanceReport(selectedDate);
      setAttendanceData(data);
      setFilteredData(data) // Initialize filtered data with all data
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  // Format time to hh:mm
  const formatTime = (timeString) => {
    if (!timeString || timeString === "-") return "-"

    try {
      // Assuming timeString is in a format that can be parsed by Date
      const date = new Date(timeString)
      return format(date, "HH:mm")
    } catch (error) {
      // If parsing fails, return the original string
      return timeString
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6 rounded-xl bg-red-50 border border-red-100">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Date Navigation and Search */}
      <div className="flex justify-between items-center">
        <div className="inline-flex items-center gap-4 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
          <button
            onClick={handlePreviousDay}
            className="p-1 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <FiChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-sm font-medium text-gray-900">
            {format(selectedDate, "dd MMM yyyy")}
          </h2>
          <button
            onClick={handleNextDay} 
            className="p-1 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <FiChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-[300px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full shadow-sm"
          />
        </div>
      </div>

      {/* Attendance Table with Horizontal Scroll */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-In Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-Out Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Late Entry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Early exit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  filteredData.map((record, index) => (
                    <motion.tr
                      key={record.employeeId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                        <div className="flex items-center">
                          {record.profilePhotoUrl ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
                              src={record.profilePhotoUrl || "/placeholder.svg"}
                              alt={`${record.firstName} ${record.lastName}`}
                            />
                          ) : (
                            <span className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-medium text-sm border-2 border-white shadow-sm">
                              {record.firstName[0]}
                              {record.lastName[0]}
                            </span>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {record.firstName} {record.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {record.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.checkInPhotoUrl && (
                          <img
                            src={record.checkInPhotoUrl}
                            alt="Check-In"
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        )}{" "}
                        {formatTime(record.checkIn)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.checkInLocation || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.checkOutPhotoUrl && (
                          <img
                            src={record.checkOutPhotoUrl}
                            alt="Check-Out"
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        )}{" "}
                        {formatTime(record.checkOut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.checkOutLocation || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700">
                        {formatTime(record.lateEntry)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700">
                        {formatTime(record.earlyExit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.totalHours || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`font-medium ${
                            record.status === "Present" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                      No employees found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceReport;