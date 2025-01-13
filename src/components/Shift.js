import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  isWeekend,
  addMonths,
  subMonths,
  isToday,
  parse
} from 'date-fns';
import { FiChevronLeft, FiChevronRight, FiMoreVertical } from 'react-icons/fi';

function Shift() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('weekly');
  const [showDropdown, setShowDropdown] = useState(false);

  // Shift definitions
  const shifts = {
    general: {
      name: 'General',
      startTime: '09:00',
      endTime: '18:00',
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    first: {
      name: 'First Shift',
      startTime: '06:00',
      endTime: '14:00',
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    extended: {
      name: 'Extended',
      startTime: '08:00',
      endTime: '20:00',
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    }
  };

  // Calculate time slot range
  const allStartTimes = Object.values(shifts).map(shift => 
    parseInt(shift.startTime.split(':')[0])
  );
  const allEndTimes = Object.values(shifts).map(shift => 
    parseInt(shift.endTime.split(':')[0])
  );
  const minStartHour = Math.min(...allStartTimes) - 1; // One hour before earliest start
  const maxEndHour = Math.max(...allEndTimes) + 1; // One hour after latest end

  // Generate time slots
  const timeSlots = Array.from(
    { length: maxEndHour - minStartHour + 1 }, 
    (_, i) => {
      const hour = minStartHour + i;
      return format(new Date().setHours(hour, 0), 'HH:mm');
    }
  );

  // Get dates for current week
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDates = eachDayOfInterval({ start: startDate, end: endDate });

  // Get dates for current month (for monthly view)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
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

  const getShiftForDay = (date) => {
    const dayOfWeek = format(date, 'E');
    if (isWeekend(date)) return null;
    return dayOfWeek === 'Fri' ? shifts.extended : dayOfWeek === 'Mon' ? shifts.first : shifts.general;
  };

  const calculatePosition = (time) => {
    const [hours] = time.split(':').map(Number);
    const totalSlots = timeSlots.length;
    const slotWidth = 100 / totalSlots;
    const position = (hours - minStartHour) * slotWidth;
    return `${position}%`;
  };

  const calculateWidth = (startTime, endTime) => {
    const [startHours] = startTime.split(':').map(Number);
    const [endHours] = endTime.split(':').map(Number);
    const totalSlots = timeSlots.length;
    const slotWidth = 100 / totalSlots;
    return `${(endHours - startHours + 1) * slotWidth}%`;
  };

  const handlePrevious = () => {
    if (viewType === 'weekly') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewType === 'weekly') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button 
            className="p-2 hover:bg-gray-100 rounded-lg"
            onClick={handlePrevious}
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button 
            className="p-2 hover:bg-gray-100 rounded-lg"
            onClick={handleNext}
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">
            {viewType === 'weekly' 
              ? `${format(startDate, 'dd-MMM-yyyy')} - ${format(endDate, 'dd-MMM-yyyy')}`
              : format(currentDate, 'MMMM yyyy')
            }
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewType('weekly')}
              className={`px-4 py-2 text-sm ${
                viewType === 'weekly'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewType('monthly')}
              className={`px-4 py-2 text-sm ${
                viewType === 'monthly'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Monthly
            </button>
          </div>
          
          <div className="relative">
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
      </div>

      {viewType === 'weekly' ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="w-full">
            {/* Time slots header */}
            <div className="grid grid-cols-[100px_1fr] border-b border-gray-200">
              <div className="border-r border-gray-200"></div>
              <div className={`grid grid-cols-${timeSlots.length}`} style={{ gridTemplateColumns: `repeat(${timeSlots.length}, 1fr)` }}>
                {timeSlots.map((time) => (
                  <div
                    key={time}
                    className="px-2 py-2 text-xs text-gray-500 text-center border-r border-gray-200 last:border-r-0"
                  >
                    {time}
                  </div>
                ))}
              </div>
            </div>

            {/* Days and shifts */}
            {weekDates.map((date, dayIndex) => {
              const shift = getShiftForDay(date);
              return (
                <div
                  key={dayIndex}
                  className={`grid grid-cols-[100px_1fr] ${
                    dayIndex !== weekDates.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
                >
                  <div className="p-4 border-r border-gray-200">
                    <div className="font-medium text-gray-900">{format(date, 'EEE')}</div>
                    <div className="text-sm text-gray-500">{format(date, 'd')}</div>
                  </div>
                  <div className="h-20 relative">
                    {shift && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`absolute top-2 h-16 rounded-lg px-3 py-2 ${shift.color}`}
                        style={{
                          left: calculatePosition(shift.startTime),
                          width: calculateWidth(shift.startTime, shift.endTime)
                        }}
                      >
                        <div className="text-sm font-medium">{shift.name}</div>
                        <div className="text-xs">
                          {shift.startTime} - {shift.endTime}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
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
          {monthDates.map((date, index) => {
            const shift = getShiftForDay(date);
            const isCurrentMonth = isSameMonth(date, currentDate);
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
                  ${!shift ? 'bg-gray-50' : shift.color}
                `}>
                  <div className="flex flex-col h-full">
                    <span className={`text-sm font-medium ${
                      !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {format(date, 'd')}
                    </span>
                    {shift && (
                      <div className="mt-2 text-xs">
                        <div className="font-medium">{shift.name}</div>
                        <div>{shift.startTime} - {shift.endTime}</div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Shift;