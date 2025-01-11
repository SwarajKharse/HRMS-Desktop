import { motion } from 'framer-motion';
import { FiSearch, FiBell, FiSettings, FiUser } from 'react-icons/fi';

function Navbar() {
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
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <FiBell size={20} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <FiSettings size={20} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          <FiUser size={20} />
        </motion.button>
      </div>
    </motion.nav>
  );
}

export default Navbar;

