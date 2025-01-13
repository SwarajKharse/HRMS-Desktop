import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSun, 
  FiClock, 
  FiDollarSign, 
  FiUser, 
  FiBook, 
  FiActivity,
  FiCalendar,
  FiList,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { 
  format, 
  startOfYear,
  endOfYear,
  addYears,
  subYears,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';
import LeaveCard from './LeaveCard';
import { leaveService } from '../../services/leaveService';
import LeaveForm from './LeaveForm';

function LeaveSummary({ leaves, onLeaveApplied }) {
  const [viewType, setViewType] = useState('list'); // 'list' or 'calendar'
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());

  const leaveTypes = [
    { 
      title: 'Casual Leave', 
      icon: <FiSun className="w-6 h-6 text-blue-600" />, 
      color: 'bg-blue-100',
      available: 12,
      booked: 0,
      calendarColor: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    { 
      title: 'Earned Leave', 
      icon: <FiClock className="w-6 h-6 text-green-600" />, 
      color: 'bg-green-100',
      available: 12,
      booked: 0,
      calendarColor: 'bg-green-100 text-green-800 border-green-200'
    },
    { 
      title: 'Leave Without Pay', 
      icon: <FiDollarSign className="w-6 h-6 text-red-600" />, 
      color: 'bg-red-100',
      available: 0,
      booked: 0,
      calendarColor: 'bg-red-100 text-red-800 border-red-200'
    },
    { 
      title: 'Paternity Leave', 
      icon: <FiUser className="w-6 h-6 text-orange-600" />, 
      color: 'bg-orange-100',
      available: 0,
      booked: 0,
      calendarColor: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    { 
      title: 'Sabbatical Leave', 
      icon: <FiBook className="w-6 h-6 text-yellow-600" />, 
      color: 'bg-yellow-100',
      available: 0,
      booked: 0,
      calendarColor: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    { 
      title: 'Sick Leave', 
      icon: <FiActivity className="w-6 h-6 text-purple-600" />, 
      color: 'bg-purple-100',
      available: 12,
      booked: 0,
      calendarColor: 'bg-purple-100 text-purple-800 border-purple-200'
    }
  ];

  // Calendar calculations
  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const startingDayIndex = monthStart.getDay();
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const totalDays = daysInMonth.length;
  const totalCells = Math.ceil((totalDays + startingDayIndex) / 7) * 7;
  
  const monthDates = Array.from({ length: totalCells }).map((_, index) => {
    const dayOffset = index - startingDayIndex;
    const date = new Date(monthStart);
    date.setDate(monthStart.getDate() + dayOffset);
    return date;
  });

  const handleLeaveSubmit = async (leaveData) => {
    try {
      await leaveService.applyLeave(leaveData);
      setShowLeaveForm(false);
      if (onLeaveApplied) {
        onLeaveApplied();
      }
    } catch (error) {
      console.error('Error applying leave:', error);
    }
  };

  const handlePreviousYear = () => {
    setCurrentDate(subYears(currentDate, 1));
  };

  const handleNextYear = () => {
    setCurrentDate(addYears(currentDate, 1));
  };

  const handlePreviousMonth = () => {
    setCalendarDate(subMonths(calendarDate, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(addMonths(calendarDate, 1));
  };

  // Mock function to get leave type for a date (replace with actual data)
  const getLeaveForDate = (date) => {
    // This should be replaced with actual leave data lookup
    if (leaves && leaves.length > 0) {
      const leave = leaves.find(l => isSameDay(new Date(l.date), date));
      if (leave) {
        return leaveTypes.find(lt => lt.title === leave.type);
      }
    }
    return null;
  };

  return (
    <div className="">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-medium text-gray-900">Leave booked this year: 0</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setViewType('list')}
              className={`p-2 rounded ${viewType === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
            >
              <FiList size={20} />
            </button>
            <button
              onClick={() => setViewType('calendar')}
              className={`p-2 rounded ${viewType === 'calendar' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
            >
              <FiCalendar size={20} />
            </button>
          </div>
          {viewType === 'list' && (
            <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 px-4 py-2">
              <button className="text-gray-600" onClick={handlePreviousYear}>
                <FiChevronLeft size={20} />
              </button>
              <span className="text-sm font-medium">
                01-Jan-{format(currentDate, 'yyyy')} - 31-Dec-{format(currentDate, 'yyyy')}
              </span>
              <button className="text-gray-600" onClick={handleNextYear}>
                <FiChevronRight size={20} />
              </button>
            </div>
          )}
          {viewType === 'calendar' && (
            <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 px-4 py-2">
              <button className="text-gray-600" onClick={handlePreviousMonth}>
                <FiChevronLeft size={20} />
              </button>
              <span className="text-sm font-medium">
                {format(calendarDate, 'MMMM yyyy')}
              </span>
              <button className="text-gray-600" onClick={handleNextMonth}>
                <FiChevronRight size={20} />
              </button>
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => setShowLeaveForm(true)}
          >
            Apply Leave
          </motion.button>
        </div>
      </div>

      {viewType === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-6">
          {leaveTypes.map((leave, index) => (
            <LeaveCard key={index} {...leave} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-6">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div 
                key={day} 
                className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500"
              >
                {day}
              </div>
            ))}

            {monthDates.map((date, index) => {
              const leave = getLeaveForDate(date);
              const isCurrentMonth = isSameMonth(date, calendarDate);
              const isCurrentDay = isToday(date);
              
              return (
                <motion.div
                  key={index}
                  className={`relative bg-white min-h-[100px] p-2 ${
                    !isCurrentMonth ? 'opacity-50' : ''
                  }`}
                  initial={false}
                >
                  <div className={`
                    h-full rounded-lg border p-2
                    ${isCurrentDay ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                    ${!leave ? 'bg-gray-50' : leave.calendarColor}
                  `}>
                    <div className="flex flex-col h-full">
                      <span className={`text-sm font-medium ${
                        !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {format(date, 'd')}
                      </span>
                      {leave && (
                        <div className="mt-2 text-xs">
                          <div className="font-medium">{leave.title}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <LeaveForm
        isOpen={showLeaveForm}
        onClose={() => setShowLeaveForm(false)}
        onSubmit={handleLeaveSubmit}
      />
    </div>
  );
}

export default LeaveSummary;