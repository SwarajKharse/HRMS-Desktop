import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FiUser,
  FiBriefcase,
  FiPhone,
  FiMapPin,
  FiLogOut,
  FiAlertTriangle,
  FiXCircle,
  FiAlertOctagon,
} from "react-icons/fi"
import ResignationForm from "../Forms/ResignationForm"
import { warningService } from "../../services/warningService"
import { terminationService } from "../../services/terminationService"
import { resignationService } from "../../services/resignationService"

function Profile({ employee }) {
  const [showResignationForm, setShowResignationForm] = useState(false)
  const [warnings, setWarnings] = useState([])
  const [termination, setTermination] = useState(null)
  const [resignation, setResignation] = useState(null)
  const [loading, setLoading] = useState({
    warnings: true,
    terminations: true,
    resignations: true,
  })

  useEffect(() => {
    const fetchEmployeeRecords = async () => {
      try {
        const [warningsData, terminationData, resignationData] = await Promise.all([
          warningService.getWarningsByEmployeeId(employee.id),
          terminationService.getTerminationsByEmployeeId(employee.id),
          resignationService.getResignationByEmployeeId(employee.id),
        ])

        setWarnings(Array.isArray(warningsData) ? warningsData : [])
        setTermination(...terminationData)
        setResignation(resignationData)
        console.log(terminationData)
      } catch (error) {
        console.error("Error fetching employee records:", error)
        setWarnings([])
        setTermination(null)
        setResignation(null)
      } finally {
        setLoading({
          warnings: false,
          terminations: false,
          resignations: false,
        })
      }
    }

    fetchEmployeeRecords()
  }, [employee.id])

  const formatDate = (dateString) => {
    if (!dateString) return "NA"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getValue = (value, defaultValue = "NA") => {
    if (value === null || value === undefined || value === "") {
      return defaultValue
    }
    return value
  }

  const handleResignationSubmit = () => {
    setShowResignationForm(false)
  }

  const RecordsList = ({ title, icon: Icon, data = [], loading, columns }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="w-5 h-5" />
        <h3>{title}</h3>
      </div>
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : !Array.isArray(data) || data.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No records found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((record, index) => (
                <tr key={index}>
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {column.render(record)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Overview */}
      <motion.div
        className="md:col-span-3 bg-white rounded-lg shadow-md p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-blue-900 flex items-center justify-center text-white text-2xl">
              {employee.profilePhotoUrl ? (
                <img
                  src={employee.profilePhotoUrl || "/placeholder.svg"}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                employee.firstName.charAt(0).toUpperCase() + employee.lastName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {`${getValue(employee?.firstName)} ${getValue(employee?.middleName, "")} ${getValue(employee?.lastName)}`}
              </h1>
              <p className="text-gray-600">{getValue(employee?.designation?.name)}</p>
            </div>
          </div>
          {!employee.dateOfLeaving && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowResignationForm(true)}
              className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <FiLogOut className="mr-2" />
              Apply Resignation
            </motion.button>
          )}
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
              <p>
                {employee?.reportingManager
                  ? `${getValue(employee.reportingManager.firstName)} ${getValue(employee.reportingManager.lastName)}`
                  : "NA"}
              </p>
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

        {/* Warning Letters */}
        <motion.div
          className="md:col-span-3 bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <RecordsList
            title="Warning Letters"
            icon={FiAlertTriangle}
            data={warnings}
            loading={loading.warnings}
            columns={[
              {
                header: "Issue Date",
                render: (record) => formatDate(record.warningDate),
              },
              {
                header: "Reason",
                render: (record) => record.reason,
              },
            ]}
          />
        </motion.div>

        {/* Terminations */}
        <motion.div
          className="md:col-span-3 bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <FiXCircle className="w-5 h-5" />
              <h3>Termination</h3>
            </div>
            {loading.terminations ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : !termination ? (
              <p className="text-gray-500 text-center py-4">No termination record found</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Notice Date</label>
                      <p className="font-medium">{formatDate(termination.terminationDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Last Working Day</label>
                      <p className="font-medium">{formatDate(employee.dateOfLeaving)}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-gray-500">Reason</label>
                      <p className="font-medium">{termination.reason}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Resignations */}
        <motion.div
          className="md:col-span-3 bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <FiAlertOctagon className="w-5 h-5" />
              <h3>Resignation</h3>
            </div>
            {loading.resignations ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : !resignation ? (
              <p className="text-gray-500 text-center py-4">No resignation record found</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Application Date</label>
                      <p className="font-medium">{formatDate(resignation.resignationDate)}</p>
                    </div>
                    <div className="">
                      <label className="text-sm text-gray-500">Reason</label>
                      <p className="font-medium">{resignation.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-500">Status</label>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs ${
                          resignation.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : resignation.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {resignation.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showResignationForm && (
          <ResignationForm
            employee={employee}
            onClose={() => setShowResignationForm(false)}
            onSubmit={handleResignationSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Profile;