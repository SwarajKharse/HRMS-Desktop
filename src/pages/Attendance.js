import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { attendanceService } from '../services/attendanceService';
import AttendanceSummary from '../components/Attendance/AttendanceSummary';
import Shift from '../components/Shift';

function Attendance() {
  const [activeTab, setActiveTab] = useState('summary');
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'summary', label: 'Attendance Summary' },
    { id: 'shift', label: 'Shift' },
  ];

  // Sample data - replace with actual API call
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Mock data for demonstration
        const data = [
          {
            date: '2025-01-05',
            firstIn: null,
            lastOut: null,
            totalHours: null,
            payableHours: '08:00',
            status: 'Weekend',
            shift: 'Kharade',
            regularization: null
          },
          {
            date: '2025-01-06',
            firstIn: null,
            lastOut: null,
            totalHours: null,
            payableHours: null,
            status: 'Absent',
            shift: 'General',
            regularization: null
          },
          // Add more mock data as needed
        ];
        setAttendanceData(data);
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

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'summary' ? (
          <AttendanceSummary data={attendanceData} />
        ) : (
          <Shift />
        )}
      </motion.div>
    </div>
  );
}

export default Attendance;

