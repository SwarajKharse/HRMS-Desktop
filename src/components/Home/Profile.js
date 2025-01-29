import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiUser, FiBriefcase, FiPhone, FiMapPin, FiLogOut } from "react-icons/fi"
import ResignationForm from "../Forms/ResignationForm"

function Profile({ employee }) {
  const [showResignationForm, setShowResignationForm] = useState(false)

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
    // Optionally handle any updates needed after resignation submission
    setShowResignationForm(false)
  }

  return (
    <div className="space-y-6">
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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowResignationForm(true)}
            className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <FiLogOut className="mr-2" />
            Apply Resignation
          </motion.button>
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