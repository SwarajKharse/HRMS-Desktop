import { useState } from 'react';
import { motion } from 'framer-motion';

function UpcomingLeaves({ leaves, holidays }) {
  const [activeTab, setActiveTab] = useState('leaves');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'leaves'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upcoming Leaves
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'holidays'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Holidays
          </button>
        </div>
      </div>
      <div className="p-4">
        {activeTab === 'leaves' ? (
          <div className="space-y-4">
            <p className="text-gray-500 text-center py-4">No upcoming leaves</p>
          </div>
        ) : (
          <div className="space-y-4">
            {holidays?.length > 0 ? (
              holidays.map((holiday, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{holiday.name}</h4>
                    <p className="text-sm text-gray-500">{holiday.date}</p>
                  </div>
                  <span className="text-sm text-gray-500">{holiday.type}</span>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming holidays</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UpcomingLeaves;

