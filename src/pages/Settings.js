import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiUser, 
  FiUsers, 
  FiCalendar, 
  FiClock,
  FiFileText,
  FiSearch,
  FiSettings,
  FiLayers
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

function Settings() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const services = [
    {
      id: "organization",
      name: "Organization Settings",
      icon: FiLayers,
      color: "text-purple-500",
      link: `/settings/organization`
    },
    {
      id: 'leave-tracker',
      name: 'Leave Tracker',
      icon: FiCalendar,
      color: 'text-green-500',
      link: '/settings/leave-tracker'
    },
    {
      id: 'attendance-settings',
      name: 'Attendance Settings',
      icon: FiCalendar,
      color: 'text-green-500',
      link: '/settings/attendance-settings'
    },
    {
      id: "holiday", 
      name: 'Holiday Settings',
      icon: FiCalendar,
      color: 'text-blue-500',
      link: '/settings/holiday'
    },
    {
      id: "geoFencing", 
      name: 'Geo Fencing Settings',
      icon: FiCalendar,
      color: 'text-red-500',
      link: '/settings/geoFencing'
    },
    {
      id: "payroll-settings", 
      name: 'Payroll Settings',
      icon: FiCalendar,
      color: 'text-red-500',
      link: '/settings/payroll-settings'
    },
    {
      id: "employee-payroll-settings", 
      name: 'Employee Payroll Settings',
      icon: FiCalendar,
      color: 'text-red-500',
      link: '/settings/employee-payroll-settings'
    },
  ];

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiSettings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Safety Saarthi</h1>
              <p className="text-sm text-gray-500">Settings</p>
            </div>
          </div>
          {/* <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
            <p className="text-sm text-gray-500">Super Administrator</p>
          </div> */}
        </div>
      </div>

      {/* Search and Services */}
      <div className="space-y-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredServices.map((service) => (
              <motion.div
                key={service.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={service.link}
                  className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <service.icon className={`w-8 h-8 ${service.color}`} />
                    <span className="text-sm font-medium text-gray-900">{service.name}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;