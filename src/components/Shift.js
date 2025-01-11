import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiMoreVertical } from 'react-icons/fi';

function Shift() {
  const [viewType, setViewType] = useState('weekly');
  
  // Sample data - replace with actual data from API
  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 5;
    return `${hour.toString().padStart(2, '0')}${hour >= 12 ? 'PM' : 'AM'}`;
  });

  const days = [
    { day: 'Sun', date: 5, shifts: [{ name: 'Kharade', startTime: '6:00 AM', endTime: '7:00 PM' }] },
    { day: 'Mon', date: 6, shifts: [{ name: 'General', startTime: '9:00 AM', endTime: '6:00 PM' }] },
    { day: 'Tue', date: 7, shifts: [{ name: 'General', startTime: '9:00 AM', endTime: '6:00 PM' }] },
    { day: 'Wed', date: 8, shifts: [{ name: 'General', startTime: '9:00 AM', endTime: '6:00 PM' }] },
    { day: 'Thu', date: 9, shifts: [{ name: 'General', startTime: '9:00 AM', endTime: '6:00 PM' }] },
    { day: 'Fri', date: 10, shifts: [{ name: 'General', startTime: '9:00 AM', endTime: '6:00 PM' }] },
    { day: 'Sat', date: 11, shifts: [] },
  ];

  const getShiftPosition = (startTime, endTime) => {
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]) + (endTime.includes('PM') ? 12 : 0);
    const startPosition = (startHour - 5) * 100; // 5 is the starting hour
    const width = (endHour - startHour) * 100;
    return { left: `${startPosition}px`, width: `${width}px` };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <FiChevronRight className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">05-Jan-2025 - 11-Jan-2025</span>
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
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Assign shift
          </motion.button>
          
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <FiMoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Time slots header */}
          <div className="flex border-b border-gray-200">
            <div className="w-24 flex-shrink-0 border-r border-gray-200"></div>
            {timeSlots.map((time, index) => (
              <div
                key={time}
                className="flex-1 px-2 py-2 text-xs text-gray-500 text-center border-r border-gray-200"
              >
                {time}
              </div>
            ))}
          </div>

          {/* Days and shifts */}
          {days.map((day, dayIndex) => (
            <div
              key={day.day}
              className={`flex relative ${
                dayIndex !== days.length - 1 ? 'border-b border-gray-200' : ''
              }`}
            >
              <div className="w-24 flex-shrink-0 p-4 border-r border-gray-200">
                <div className="font-medium text-gray-900">{day.day}</div>
                <div className="text-sm text-gray-500">{day.date}</div>
              </div>
              <div className="flex-1 h-20 relative">
                {day.shifts.map((shift, shiftIndex) => {
                  const position = getShiftPosition(shift.startTime, shift.endTime);
                  return (
                    <div
                      key={shiftIndex}
                      className="absolute top-2 h-16 bg-blue-100 rounded-lg px-3 py-2"
                      style={position}
                    >
                      <div className="text-sm font-medium text-blue-900">{shift.name}</div>
                      <div className="text-xs text-blue-700">
                        {shift.startTime} - {shift.endTime}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Shift;