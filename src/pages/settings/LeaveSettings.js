import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiPlus, FiFileText } from "react-icons/fi"
import { leaveTypeService } from "../../services/leaveTypeService"
import LeaveTypeForm from "../../components/LeaveType/LeaveTypeForm";
import { authService } from "../../services/authService";

function LeaveSettings() {
  const [leaveTypes, setLeaveTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedLeaveType, setSelectedLeaveType] = useState(null)

  const [orgId] = useState(authService.getUser().orgId);

  useEffect(() => {
    fetchLeaveTypes();
  }, [])

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const data = await leaveTypeService.getLeaveTypesByOrgId(orgId);
      setLeaveTypes(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (leaveType) => {
    setSelectedLeaveType(leaveType);
    setShowForm(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          <FiFileText className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Settings</h1>
          <p className="text-sm text-gray-500">Configure leave types and policies</p>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={() => {
            setSelectedLeaveType(null)
            setShowForm(true)
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
        >
          <FiPlus className="mr-2" />
          Add Leave Policy
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave policy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Effective After
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveTypes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No leave types found
                  </td>
                </tr>
              ) : (
                leaveTypes.map((leaveType) => (
                  <motion.tr
                    key={leaveType.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleEdit(leaveType)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{leaveType.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100">
                        {leaveType.leaveCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leaveType.effectiveAfterCount} {leaveType.effectiveAfterUnit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leaveType.accrualCount}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <LeaveTypeForm
            leaveType={selectedLeaveType}
            orgId={orgId}
            onClose={() => {
              setShowForm(false)
              setSelectedLeaveType(null)
            }}
            onSubmit={fetchLeaveTypes}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default LeaveSettings;