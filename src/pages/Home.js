import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchEmployee } from '../services/api';
import { 
  FiUser, 
  FiBriefcase, 
  FiPhone, 
  FiMail, 
  FiMapPin, 
  FiCalendar,
  FiUsers,
  FiInfo
} from 'react-icons/fi';

function Home() {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect(() => {
  //   const getEmployeeData = async () => {
  //     try {
  //       // For demo purposes, we're using ID 1. In real app, get from auth context
  //       const data = await fetchEmployee(1);
  //       setEmployee(data);
  //     } catch (err) {
  //       setError(err.message);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   getEmployeeData();
  // }, []);

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center h-full">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
  //     </div>
  //   );
  // }

  // if (error) {
  //   return (
  //     <div className="flex items-center justify-center h-full text-red-500">
  //       {error}
  //     </div>
  //   );
  // }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Profile Overview */}
        <motion.div 
          className="md:col-span-3 bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-blue-900 flex items-center justify-center text-white text-2xl">
              {employee?.firstName?.charAt(0)}{employee?.lastName?.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {employee?.firstName} {employee?.middleName} {employee?.lastName}
              </h1>
              <p className="text-gray-600">{employee?.designation?.name}</p>
            </div>
          </div>
        </motion.div>

        {/* Personal Information */}
        <motion.div 
          className="bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FiUser className="mr-2" /> Personal Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Date of Birth</label>
              <p>{formatDate(employee?.dateOfBirth)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Gender</label>
              <p>{employee?.gender}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Blood Group</label>
              <p>{employee?.bloodGroup}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Marital Status</label>
              <p>{employee?.maritalStatus}</p>
            </div>
          </div>
        </motion.div>

        {/* Work Information */}
        <motion.div 
          className="bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FiBriefcase className="mr-2" /> Work Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Employee Type</label>
              <p>{employee?.empType}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Department</label>
              <p>{employee?.department?.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Reporting Manager</label>
              <p>{employee?.reportingManager?.firstName} {employee?.reportingManager?.lastName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Date of Joining</label>
              <p>{formatDate(employee?.dateOfJoining)}</p>
            </div>
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div 
          className="bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FiPhone className="mr-2" /> Contact Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Work Phone</label>
              <p>{employee?.workPhone}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Personal Phone</label>
              <p>{employee?.personalPhone}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Work Email</label>
              <p>{employee?.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Personal Email</label>
              <p>{employee?.personalEmail}</p>
            </div>
          </div>
        </motion.div>

        {/* Additional Information */}
        <motion.div 
          className="md:col-span-3 bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FiInfo className="mr-2" /> Additional Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-500">Present Address</label>
              <p>{employee?.presentAddress}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Permanent Address</label>
              <p>{employee?.permanentAddress}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">About Me</label>
              <p>{employee?.aboutMe}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Home;