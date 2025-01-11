import { useState } from 'react';
import { motion } from 'framer-motion';
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
import LeaveCard from './LeaveCard';
import { leaveService } from '../services/leaveService';
import LeaveForm from './LeaveForm';

function LeaveSummary({ leaves, onLeaveApplied }) {
  const [viewType, setViewType] = useState('list'); // 'list' or 'calendar'
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const currentYear = new Date().getFullYear();

  const leaveTypes = [
    { 
      title: 'Casual Leave', 
      icon: <FiSun className="w-6 h-6 text-blue-600" />, 
      color: 'bg-blue-100',
      available: 12,
      booked: 0
    },
    { 
      title: 'Earned Leave', 
      icon: <FiClock className="w-6 h-6 text-green-600" />, 
      color: 'bg-green-100',
      available: 12,
      booked: 0
    },
    { 
      title: 'Leave Without Pay', 
      icon: <FiDollarSign className="w-6 h-6 text-red-600" />, 
      color: 'bg-red-100',
      available: 0,
      booked: 0
    },
    { 
      title: 'Paternity Leave', 
      icon: <FiUser className="w-6 h-6 text-orange-600" />, 
      color: 'bg-orange-100',
      available: 0,
      booked: 0
    },
    { 
      title: 'Sabbatical Leave', 
      icon: <FiBook className="w-6 h-6 text-yellow-600" />, 
      color: 'bg-yellow-100',
      available: 0,
      booked: 0
    },
    { 
      title: 'Sick Leave', 
      icon: <FiActivity className="w-6 h-6 text-purple-600" />, 
      color: 'bg-purple-100',
      available: 12,
      booked: 0
    }
  ];

  const handleLeaveSubmit = async (leaveData) => {
    try {
      await leaveService.applyLeave(leaveData);
      setShowLeaveForm(false);
      if (onLeaveApplied) {
        onLeaveApplied();
      }
    } catch (error) {
      console.error('Error applying leave:', error);
      // Handle error appropriately
    }
  };

  return (
    <div className="space-y-6">
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
          <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 px-4 py-2">
            <button className="text-gray-600">
              <FiChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium">
              01-Jan-{currentYear} - 31-Dec-{currentYear}
            </span>
            <button className="text-gray-600">
              <FiChevronRight size={20} />
            </button>
          </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {leaveTypes.map((leave, index) => (
          <LeaveCard key={index} {...leave} />
        ))}
      </div>

      {viewType === 'calendar' ? (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-center text-gray-500">Calendar View Coming Soon</p>
        </div>
      ) : null}

      <LeaveForm
        isOpen={showLeaveForm}
        onClose={() => setShowLeaveForm(false)}
        onSubmit={handleLeaveSubmit}
      />
    </div>
  );
}

export default LeaveSummary;