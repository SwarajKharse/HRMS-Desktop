import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { FiBell, FiSettings, FiLogOut } from 'react-icons/fi';
import { HiHome, HiChartPie, HiArchive, HiCalendar, HiCash, HiDocumentAdd, HiViewList  } from 'react-icons/hi';
import { FaUsers } from 'react-icons/fa';
import { HiOutlineBuildingStorefront, HiMiniShoppingBag } from "react-icons/hi2";
import { GrProjects } from "react-icons/gr";
import { RiProductHuntLine, RiMoneyRupeeCircleLine } from "react-icons/ri";
import { MdOutlineAccountBalance } from "react-icons/md";
import { authService } from '../services/authService';
import { useNotifications } from '../contexts/NotificationsContext';
import { format } from 'date-fns';
import { usePermissions } from '../contexts/PermissionsContext';
import NotificationBell from './NotificationBell';

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

function Navbar({userData}) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [navItems, setNavItems] = useState([
    { icon: HiHome, label: 'Home', path: '/' }
  ]);
  const { permissions } = usePermissions();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Detect mobile (<768px)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    authService.logout();
  };

  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  useEffect(() => {
      const updatedNavItems = [
        { icon: HiHome, label: 'Home', path: '/' }
      ];
      if (permissions?.webReports) {
        updatedNavItems.push({ icon: HiChartPie, label: 'Reports', path: '/reports' });
      }
      if (permissions?.webOnboarding) {
        updatedNavItems.push({ icon: FaUsers, label: 'Onboarding', path: '/onboarding' });
      }      
      if (permissions?.webLeave) {
        updatedNavItems.push({ icon: HiArchive, label: 'Leave Tracker', path: '/leave-tracker' });
      }
      if (permissions?.webAttendance) {
        updatedNavItems.push({ icon: HiCalendar, label: 'Attendance', path: '/attendance' });
      }
      if (permissions?.webPayroll) {
        updatedNavItems.push({ icon: HiCash, label: 'Payroll', path: '/payroll' });
      }
          if (permissions?.webAddLeads) {
        updatedNavItems.push({ icon: HiDocumentAdd, label: 'Add New Lead', path: '/add-lead' });
      }
          if (permissions?.webLeadsListing) {
        updatedNavItems.push({ icon: HiViewList, label: 'Leads', path: '/leads' });
      }
      if (permissions?.webProject) {
        updatedNavItems.push({ icon: GrProjects, label: 'Projects', path: '/projects' });
      }
      if (permissions?.webStore) {
        updatedNavItems.push({ icon: HiOutlineBuildingStorefront, label: 'Store', path: '/store' });
      }
      if (permissions?.webPurchase) {
        updatedNavItems.push({ icon: HiMiniShoppingBag, label: 'Purchase', path: '/purchase' });
      }
      if (permissions?.webProductManagement) {
        updatedNavItems.push({ icon: RiProductHuntLine, label: 'Product Management', path: '/product-management' });
      }
      if (permissions?.webAccounts) {
        updatedNavItems.push({ icon: MdOutlineAccountBalance, label: 'Accounts', path: '/accounts' });
      }
      if (permissions?.webFinance) {
        updatedNavItems.push({ icon: RiMoneyRupeeCircleLine, label: 'Finance', path: '/finance' });
      }

      setNavItems(updatedNavItems);
    }, [permissions]);

  return (
    <motion.nav 
      className="bg-white shadow-md h-16 flex items-center justify-between px-4 relative"
      initial={{ y: -20 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {isMobile && (
        <div className="relative min-h-[52px] border-gray-700 flex items-center justify-center mr-2">
          {userData?.org?.logoUrl ? (
            <img src={userData?.org?.logoUrl} alt="logo" className="h-16" />
          ) : (
            <div className="flex items-center justify-center rounded-full bg-gray-300 text-gray-800 h-14 w-14">
              <span className="text-xl font-semibold">LOGO</span>
            </div>
          )}
        </div>
      )}

      {/* Show the org name on the leftmost side */}
      <div className="flex items-center space-x-2">
        <span className="text-lg font-semibold">{userData?.org?.name}</span>
      </div>

      <div className="flex items-center space-x-4 ml-auto">
        <div className="relative">
          {/* <Tooltip text="Notifications">
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
          </Dropdown> */}
          <NotificationBell userId={userData?.id} />
        </div>

        {permissions?.webSettings && (
          <div className="relative">
            <Tooltip text="Settings">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => navigate('/settings')}
              >
                <FiSettings size={20} />
              </motion.button>
            </Tooltip>
          </div>
        )}

        <div className="relative">
          <Tooltip text="Profile">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              onClick={() => toggleDropdown('profile')}
            >
              <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-white text-sm">
                {userData?.profilePhotoUrl ? (
                  <img
                    src={userData.profilePhotoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  `${userData?.firstName?.[0] || ''}${userData?.lastName?.[0] || ''}`.toUpperCase()
                )}
              </div>
            </motion.button>
          </Tooltip>
          <Dropdown 
            isOpen={activeDropdown === 'profile'} 
            onClose={() => setActiveDropdown(null)}
            className="w-80"
          >
            {/* For mobile, display nav links at the top of the dropdown */}
            {isMobile && (
              <>
                <div className="py-2">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <motion.div 
                        key={item.path} 
                        whileHover={{ scale: 1.02 }} 
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link 
                          to={item.path}
                          onClick={() => setActiveDropdown(null)}
                          className={`flex items-center px-4 py-2 text-sm transition-colors ${
                            isActive 
                              ? "bg-blue-500 text-white" 
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <item.icon className="mr-2" />
                          {item.label}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="border-t border-gray-200"></div>
              </>
            )}

            {/* Profile details */}
            <div className="py-2">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center text-white">
                    {userData?.profilePhotoUrl ? (
                      <img
                        src={userData.profilePhotoUrl}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      `${userData?.firstName?.[0] || ''}${userData?.lastName?.[0] || ''}`.toUpperCase()
                    )}
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
              <motion.button
                onClick={() => {
                  window.open("https://docs.safetysaarthi.in", "_blank", "noopener,noreferrer");
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-['Montserrat'] flex items-center space-x-2"
              >
                <HelpCircle size={20} />
                <span>Help</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <FiLogOut size={16} />
                Logout
              </motion.button>
            </div>
          </Dropdown>
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;