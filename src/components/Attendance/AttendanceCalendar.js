import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isPast,
  isWeekend
} from 'date-fns';
import { FiChevronLeft, FiChevronRight, FiClock } from 'react-icons/fi';

function AttendanceCalendar({ data }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  // Get all days needed for the calendar grid (including padding days)
  const startingDayIndex = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const totalDays = daysInMonth.length;
  const totalCells = Math.ceil((totalDays + startingDayIndex) / 7) * 7;

  const calendarDays = Array.from({ length: totalCells }).map((_, index) => {
    const dayOffset = index - startingDayIndex;
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + dayOffset);
    return date;
  });

  const getAttendanceStatus = (date) => {
    if (!isPast(date) || !isSameMonth(date, currentDate)) return null;
    
    const dayData = data.find(item => 
      isSameDay(new Date(item.date), date)
    );

    if (dayData) return dayData.status;
    return isWeekend(date) ? 'Weekend' : 'Absent';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Weekend':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Half Day':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Holiday':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-400 border-gray-200';
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const renderTimeInfo = (date) => {
    const dayData = data.find(item => 
      isSameDay(new Date(item.date), date)
    );

    if (!dayData || !dayData.firstIn) return null;

    return (
      <div className="text-xs space-y-1">
        <div className="flex items-center gap-1">
          <FiClock className="w-3 h-3" />
          <span>{format(new Date(dayData.firstIn), 'hh:mm a')}</span>
        </div>
        {dayData.lastOut && (
          <div className="flex items-center gap-1">
            <FiClock className="w-3 h-3" />
            <span>{format(new Date(dayData.lastOut), 'hh:mm a')}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 bg-white rounded-lg border border-gray-200 p-4">
      {/* Calendar Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button 
            className="p-2 hover:bg-gray-100 rounded-lg"
            onClick={handlePreviousMonth}
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button 
            className="p-2 hover:bg-gray-100 rounded-lg"
            onClick={handleNextMonth}
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-100 border border-green-200"></div>
            <span>Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></div>
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-200"></div>
            <span>Weekend</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div 
            key={day} 
            className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((date, index) => {
          const status = getAttendanceStatus(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isCurrentDay = isToday(date);
          
          return (
            <motion.div
              key={index}
              className={`relative bg-white min-h-[100px] p-2 ${
                !isCurrentMonth ? 'opacity-50' : ''
              }`}
              onMouseEnter={() => setHoveredDate(date)}
              onMouseLeave={() => setHoveredDate(null)}
              initial={false}
              animate={{
                scale: isSameDay(date, hoveredDate) ? 0.98 : 1,
                transition: { duration: 0.1 }
              }}
            >
              <div className={`
                h-full rounded-lg border p-2 transition-colors
                ${getStatusColor(status)}
                ${isCurrentDay ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              `}>
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-medium ${
                    !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {format(date, 'd')}
                  </span>
                  {status && (
                    <span className="text-xs font-medium">
                      {status}
                    </span>
                  )}
                </div>

                {/* Time Information */}
                {isSameDay(date, hoveredDate) && renderTimeInfo(date)}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tooltip for future enhancement
      <AnimatePresence>
        {hoveredDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bg-white p-2 rounded-lg shadow-lg border border-gray-200 z-10"
            style={{
              pointerEvents: 'none'
            }}
          >
            {format(hoveredDate, 'EEEE, MMMM d, yyyy')}
          </motion.div>
        )}
      </AnimatePresence> */}
    </div>
  );
}

export default AttendanceCalendar;