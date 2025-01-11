import { useState } from 'react';
import { FiCalendar, FiList } from 'react-icons/fi';
import AttendanceTable from './AttendanceTable';
import AttendanceCalendar from './AttendanceCalendar';

function AttendanceSummary({ data }) {
  const [viewType, setViewType] = useState('table');

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setViewType('table')}
            className={`p-2 rounded ${viewType === 'table' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
          >
            <FiList size={20} />
          </button>
          <button
            onClick={() => setViewType('calendar')}
            className={`p-2 rounded ${viewType === 'calendar' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
          >
            <FiCalendar size={20} />
          </button>
        </div>
      </div>

      {viewType === 'table' ? (
        <AttendanceTable data={data} />
      ) : (
        <AttendanceCalendar data={data} />
      )}
    </div>
  );
}

export default AttendanceSummary;

