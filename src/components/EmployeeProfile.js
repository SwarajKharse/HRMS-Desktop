import { motion } from "framer-motion"
import { FiX, FiMail, FiPhone, FiCalendar, FiMapPin } from "react-icons/fi"

function EmployeeProfile({ employee, onClose }) {
  if (!employee) return null

  // Safely access nested properties
  const departmentName = employee.department?.name || "No Department"
  const designationName = employee.designation?.name || "No Designation"

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">Employee Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-6 mb-8">
            <div className="h-24 w-24 rounded-full bg-blue-900 flex items-center justify-center text-white text-2xl">
              {employee.profilePhotoUrl ? (
                <img
                  src={employee.profilePhotoUrl || "/placeholder.svg"}
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <span>
                  {employee.firstName?.[0] || ""}
                  {employee.lastName?.[0] || ""}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {employee.firstName} {employee.lastName}
              </h3>
              <p className="text-gray-500">{designationName}</p>
              <span
                className={`mt-2 px-3 py-1 inline-flex text-sm font-medium rounded-full 
                ${employee.empStatus === "Active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
              >
                {employee.empStatus || "Pending"}
              </span>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500 uppercase">Contact Information</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-600">
                  <FiMail className="w-5 h-5" />
                  <div>
                    <p className="text-sm">{employee.email || "No Email"}</p>
                    <p className="text-sm text-gray-500">{employee.personalEmail || "No Personal Email"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-gray-600">
                  <FiPhone className="w-5 h-5" />
                  <div>
                    <p className="text-sm">{employee.workPhone || "No Work Phone"}</p>
                    <p className="text-sm text-gray-500">{employee.personalPhone || "No Personal Phone"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500 uppercase">Work Information</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-600">
                  <FiMapPin className="w-5 h-5" />
                  <div>
                    <p className="text-sm">{departmentName}</p>
                    <p className="text-sm text-gray-500">{employee.location || "No Location"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-gray-600">
                  <FiCalendar className="w-5 h-5" />
                  <div>
                    <p className="text-sm">
                      {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "No Joining Date"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-500 uppercase">Additional Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Employee ID</p>
                <p className="font-medium">{employee.empId || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Reporting Manager</p>
                <p className="font-medium">
                  {typeof employee.reportingManager === "object"
                    ? `${employee.reportingManager?.firstName || ""} ${employee.reportingManager?.lastName || ""}`
                    : employee.reportingManager || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Work Type</p>
                <p className="font-medium">{employee.workType || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Shift</p>
                <p className="font-medium">{employee.shift || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default EmployeeProfile;