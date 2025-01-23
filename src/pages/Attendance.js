import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { attendanceService } from '../services/attendanceService';
import AttendanceCalendar from '../components/Attendance/AttendanceCalendar';

function Attendance() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <AttendanceCalendar data={attendanceData} />
      </motion.div>
  );
}

export default Attendance;

