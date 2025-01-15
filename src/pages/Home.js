import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FiUser, FiBriefcase, FiPhone, FiMail, FiMapPin, FiCalendar, FiClock, FiCheckCircle } from 'react-icons/fi';
import { fetchEmployee } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function Home() {
  const [activeTab, setActiveTab] = useState('activities');
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getEmployeeData = async () => {
      try {
        const employeeId = user?.sub;
        if (!employeeId) {
          throw new Error('No employee ID found');
        }
        const data = await fetchEmployee(employeeId);
        setEmployee(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getEmployeeData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 text-red-500 p-4 rounded-md max-w-lg">
          <p className="font-medium">Error loading employee data:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'NA';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getValue = (value, defaultValue = 'NA') => {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    return value;
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('activities')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'activities'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Activities
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Profile
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'activities' ? (
          <div className="space-y-6">
            {/* Greeting Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {getGreeting()}, {getValue(employee?.firstName)}!
                  </h2>
                  <p className="text-gray-600 mt-1">Have a productive day!</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {format(currentTime, 'HH:mm')}
                  </div>
                  <div className="text-gray-600">
                    {format(currentTime, 'EEEE, MMMM d, yyyy')}
                  </div>
                </div>
              </div>
            </div>

            {/* Check In/Out Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Today's Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Check In</div>
                  <div className="text-lg font-semibold mt-1">09:00 AM</div>
                  <div className="flex items-center gap-1 text-green-600 mt-1">
                    <FiCheckCircle className="w-4 h-4" />
                    <span className="text-sm">On Time</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Check Out</div>
                  <div className="text-lg font-semibold mt-1">--:-- --</div>
                  <div className="flex items-center gap-1 text-gray-500 mt-1">
                    <FiClock className="w-4 h-4" />
                    <span className="text-sm">Pending</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Total Hours</div>
                  <div className="text-lg font-semibold mt-1">07:42</div>
                  <div className="flex items-center gap-1 text-blue-600 mt-1">
                    <FiCalendar className="w-4 h-4" />
                    <span className="text-sm">Today</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Work Schedule */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Work Schedule</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-500">Current Shift</div>
                    <div className="text-lg font-semibold mt-1">General Shift</div>
                    <div className="text-sm text-gray-500 mt-1">09:00 AM - 06:00 PM</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Break Time</div>
                    <div className="text-lg font-semibold mt-1">01:00 PM - 02:00 PM</div>
                  </div>
                </div>
              </div>
            </div>

            
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Overview */}
            <motion.div 
              className="md:col-span-3 bg-white rounded-lg shadow-md p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 rounded-full bg-blue-900 flex items-center justify-center text-white text-2xl">
                  {getValue(employee?.firstName, '?')?.charAt(0)}{getValue(employee?.lastName, '')?.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {`${getValue(employee?.firstName)} ${getValue(employee?.middleName, '')} ${getValue(employee?.lastName)}`}
                  </h1>
                  <p className="text-gray-600">{getValue(employee?.designation?.name)}</p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <p>{getValue(employee?.gender)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Blood Group</label>
                    <p>{getValue(employee?.bloodGroup)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Marital Status</label>
                    <p>{getValue(employee?.maritalStatus)}</p>
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
                    <p>{getValue(employee?.empType)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Department</label>
                    <p>{getValue(employee?.department?.name)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Reporting Manager</label>
                    <p>{employee?.reportingManager ? 
                      `${getValue(employee.reportingManager.firstName)} ${getValue(employee.reportingManager.lastName)}` : 
                      'NA'}</p>
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
                    <p>{getValue(employee?.workPhone)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Personal Phone</label>
                    <p>{getValue(employee?.personalPhone)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Work Email</label>
                    <p>{getValue(employee?.email)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Personal Email</label>
                    <p>{getValue(employee?.personalEmail)}</p>
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
                  <FiMapPin className="mr-2" /> Additional Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-500">Present Address</label>
                    <p>{getValue(employee?.presentAddress)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Permanent Address</label>
                    <p>{getValue(employee?.permanentAddress)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">About Me</label>
                    <p>{getValue(employee?.aboutMe)}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default Home;