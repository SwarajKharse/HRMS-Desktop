import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiBell, FiSettings, FiUser, FiLogOut } from 'react-icons/fi';
import { authService } from '../services/authService';

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

function Dropdown({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-white shadow-lg z-50 overflow-hidden"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Navbar() {
  const [activeDropdown, setActiveDropdown] = useState(null);
  
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
            </motion.button>
          </Tooltip>
          <Dropdown 
            isOpen={activeDropdown === 'notifications'} 
            onClose={() => setActiveDropdown(null)}
          >
            <div className="p-4">
              <p className="text-gray-500 text-sm">No new notifications</p>
            </div>
          </Dropdown>
        </div>

        <div className="relative">
          <Tooltip text="Settings">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => toggleDropdown('settings')}
            >
              <FiSettings size={20} />
            </motion.button>
          </Tooltip>
          <Dropdown 
            isOpen={activeDropdown === 'settings'} 
            onClose={() => setActiveDropdown(null)}
          >
            <div className="p-4">
              <p className="text-gray-500 text-sm">Settings coming soon</p>
            </div>
          </Dropdown>
        </div>

        <div className="relative">
          <Tooltip text="Profile">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              onClick={() => toggleDropdown('profile')}
            >
              <FiUser size={20} />
            </motion.button>
          </Tooltip>
          <Dropdown 
            isOpen={activeDropdown === 'profile'} 
            onClose={() => setActiveDropdown(null)}
          >
            <div className="py-2">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">John Doe</p>
                <p className="text-xs text-gray-500">john.doe@example.com</p>
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