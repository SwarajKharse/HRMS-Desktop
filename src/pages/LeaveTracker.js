import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { leaveService } from '../services/leaveService';
import LeaveSummary from '../components/Leave/LeaveSummary';
import LeaveRequests from '../components/Leave/LeaveRequests';
import Shift from '../components/Shift';
import UpcomingLeaves from '../components/Leave/UpcomingLeaves';

function LeaveTracker() {
  const [activeTab, setActiveTab] = useState('summary');
  const [leaves, setLeaves] = useState(null);
  const [holidays, setHolidays] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'summary', label: 'Leave Summary' },
    { id: 'requests', label: 'Leave Requests' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'shift', label: 'Shift' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leavesData, holidaysData] = await Promise.all([
          leaveService.getEmployeeLeaves(1),
          leaveService.getHolidays()
        ]);
        setLeaves(leavesData);
        setHolidays(holidaysData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'summary' && <LeaveSummary leaves={leaves} />}
          {activeTab === 'requests' && <LeaveRequests />}
          {activeTab === 'upcoming' && <UpcomingLeaves leaves={leaves} holidays={holidays} />}
          {activeTab === 'shift' && <Shift />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default LeaveTracker;