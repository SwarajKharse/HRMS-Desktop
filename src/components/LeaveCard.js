import { motion } from 'framer-motion';
import { FiInfo } from 'react-icons/fi';

function LeaveCard({ title, icon, available, booked, color }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
    >
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <div className={`w-12 h-12 rounded-lg ${color} bg-opacity-20 flex items-center justify-center mt-2`}>
        {icon}
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Available</span>
          <span className="text-sm font-medium text-green-600">{available}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Booked</span>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-900">{booked}</span>
            <button className="ml-1 text-gray-400 hover:text-gray-600">
              <FiInfo size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default LeaveCard;

