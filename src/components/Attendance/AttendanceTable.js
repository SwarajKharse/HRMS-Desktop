import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval } from 'date-fns';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiCalendar, 
  FiGrid,
  FiMoreVertical 
} from 'react-icons/fi';

function AttendanceTable({ data }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);

  // Get start (Sunday) and end (Saturday) of the week
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); // 0 = Sunday
  const endDate = endOfWeek(currentDate, { weekStartsOn: 0 });

  // Get array of dates for the current week
  const weekDates = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const handlePreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const formatTime = (time) => {
    return time ? format(new Date(time), 'hh:mm a') : '-';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Weekend':
        return 'bg-yellow-100 text-yellow-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      case 'Present':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter data for the current week
  const weekData = weekDates.map(date => {
    const dayData = data.find(item => 
      format(new Date(item.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    ) || {
      date: date,
      firstIn: null,
      lastOut: null,
      totalHours: null,
      payableHours: null,
      status: format(date, 'iii') === 'Sun' || format(date, 'iii') === 'Sat' ? 'Weekend' : 'Absent',
      shift: '-',
      regularization: null
    };
    return dayData;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button 
            className="p-2 hover:bg-gray-100 rounded-lg"
            onClick={handlePreviousWeek}
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button 
            className="p-2 hover:bg-gray-100 rounded-lg"
            onClick={handleNextWeek}
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">
            {format(startDate, 'dd-MMM-yyyy')} - {format(endDate, 'dd-MMM-yyyy')}
          </span>
        </div>
        
        <div className="flex items-center space-x-4 relative">
          <button 
            className="p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <FiMoreVertical className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-white shadow-lg z-20"
                >
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => {
                      // Handle Edit Weekends click
                      setShowDropdown(false);
                    }}
                  >
                    Edit Weekends
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  First In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payable Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shift(s)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Regularization
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {weekData.map((row, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(row.date), 'EEE, dd-MMM-yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(row.firstIn)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(row.lastOut)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.totalHours || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.payableHours || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.shift}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.regularization || '-'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AttendanceTable;