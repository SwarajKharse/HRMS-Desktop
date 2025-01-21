import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiBell, FiSettings, FiUser, FiLogOut } from 'react-icons/fi';
import { authService } from '../services/authService';
import { useNotifications } from '../contexts/NotificationsContext';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { fetchEmployee } from '../services/api'; // Import fetchEmployee

function NotificationsPanel({ setActiveDropdown }) {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearNotification,
    clearAllNotifications 
  } = useNotifications();

  return (
    <div className="w-[400px] max-h-[80vh] overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="sticky top-0 z-10 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium">Notifications</h3>
        <div className="flex gap-4">
          <button
            onClick={() => {
              markAllAsRead();
              setActiveDropdown(null);
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Mark all as read
          </button>
          <button
            onClick={() => {
              clearAllNotifications();
              setActiveDropdown(null);
            }}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Clear all
          </button>
        </div>
      </div>
      {notifications.length === 0 ? (
        <div className="p-4">
          <p className="text-gray-500 text-sm">No new notifications</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {notification.body}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(notification.timestamp), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex gap-3 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => {
                        markAsRead(notification.id);
                        setActiveDropdown(null);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => {
                      clearNotification(notification.id);
                      setActiveDropdown(null);
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Tooltip({ children, text }) {
  return (
    <div className="group relative">
      {children}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 hidden group-hover:block">
        <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {text}
        </div>
      </div>
    </div>
  );
}

function Dropdown({ isOpen, onClose, children, className }) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-full mt-2 rounded-lg bg-white shadow-lg z-50 border border-gray-200 ${className}`}
      >
        {children}
      </div>
    </>
  );
}

function Navbar() {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { notifications } = useNotifications();
  const [userData, setUserData] = useState(null);
  const { user } = useAuth();
  const unreadCount = notifications.filter(n => !n.read).length;

  const navigate = useNavigate();
  
  useEffect(() => {
    const getUserData = async () => {
      try {
        if (user?.sub) {
          const data = await fetchEmployee(user.sub);
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    getUserData();
  }, [user]);

  const handleLogout = () => {
    authService.logout();
  };

  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  return (
    <motion.nav 
      className="bg-white shadow-md h-16 flex items-center justify-between px-4"
      initial={{ y: -20 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Tooltip text="Notifications">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => toggleDropdown('notifications')}
            >
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </motion.button>
          </Tooltip>
          <Dropdown 
            isOpen={activeDropdown === 'notifications'} 
            onClose={() => setActiveDropdown(null)}
          >
            <NotificationsPanel setActiveDropdown={setActiveDropdown} />
          </Dropdown>
        </div>

        <div className="relative">
          <Tooltip text="Settings">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              // onClick={() => toggleDropdown('settings')}
              onClick={() => navigate('/settings')}
            >
              <FiSettings size={20} />
            </motion.button>
          </Tooltip>
          
        </div>

        <div className="relative">
          <Tooltip text="Profile">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              onClick={() => toggleDropdown('profile')}
            >
              <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-white text-sm">
                {userData?.firstName?.[0]}{userData?.lastName?.[0]}
              </div>
            </motion.button>
          </Tooltip>
          <Dropdown 
            isOpen={activeDropdown === 'profile'} 
            onClose={() => setActiveDropdown(null)}
            className="w-80"
          >
            <div className="py-2">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center text-white">
                    {userData?.firstName?.[0]}{userData?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {userData ? `${userData.firstName} ${userData.lastName}` : 'Loading...'}
                    </p>
                    <p className="text-xs text-gray-500">{userData?.email}</p>
                    <p className="text-xs text-gray-500">{userData?.designation?.name}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <FiLogOut size={16} />
                Logout
              </button>
            </div>
          </Dropdown>
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;