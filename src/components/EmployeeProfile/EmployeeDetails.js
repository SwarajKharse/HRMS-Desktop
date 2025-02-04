import { FiMail, FiCalendar, FiUser, FiInfo } from "react-icons/fi"
import { motion } from "framer-motion"

function EmployeeDetails({ employee, formatDate }) {
  if (!employee) return null

  const sections = [
    {
      title: "Personal Information",
      icon: FiUser,
      fields: [
        { label: "Full Name", value: `${employee.firstName} ${employee.middleName || ""} ${employee.lastName}` },
        { label: "Date of Birth", value: formatDate(employee.dateOfBirth) },
        { label: "Gender", value: employee.gender || "-" },
        { label: "Marital Status", value: employee.maritalStatus || "-" },
        { label: "Blood Group", value: employee.bloodGroup || "-" },
        { label: "Ethnicity", value: employee.ethnicity || "-" },
      ],
    },
    {
      title: "Contact Information",
      icon: FiMail,
      fields: [
        { label: "Work Email", value: employee.email },
        { label: "Personal Email", value: employee.personalEmail || "-" },
        { label: "Work Phone", value: employee.workPhone || "-" },
        { label: "Personal Phone", value: employee.personalPhone || "-" },
        { label: "Present Address", value: employee.presentAddress || "-" },
        { label: "Permanent Address", value: employee.permanentAddress || "-" },
        { label: "Emergency Contact", value: employee.emergencyContact || "-" },
      ],
    },
    {
      title: "Employment Information",
      icon: FiInfo,
      fields: [
        { label: "Employee Code", value: employee.employeeCode || "-" },
        { label: "Department", value: employee.department?.name || "-" },
        { label: "Designation", value: employee.designation?.name || "-" },
        { label: "Employment Type", value: employee.empType || "-" },
        { label: "Employment Status", value: employee.empStatus || "-" },
        { label: "Source of Hire", value: employee.sourceOfHire || "-" },
        {
          label: "Reporting Manager",
          value: employee.reportingManager
            ? `${employee.reportingManager.firstName} ${employee.reportingManager.lastName}`
            : "-",
        },
        {
          label: "Second Reporting Manager",
          value: employee.secondReportingManager
            ? `${employee.secondReportingManager.firstName} ${employee.secondReportingManager.lastName}`
            : "-",
        },
      ],
    },
    {
      title: "Dates",
      icon: FiCalendar,
      fields: [
        { label: "Date of Joining", value: formatDate(employee.dateOfJoining) },
        { label: "Probation End Date", value: formatDate(employee.probationEndDate) },
        { label: "Date of Leaving", value: formatDate(employee.dateOfLeaving) },
      ],
    },
  ]

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {sections.map((section) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={section.title}
          className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <section.icon className="w-5 h-5 text-indigo-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900">{section.title}</h4>
          </div>
          <div className="grid grid-cols-1 gap-y-6">
            {section.fields.map((field) => (
              <div key={field.label} className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-gray-500">{field.label}</p>
                <p className="text-sm font-semibold text-gray-900">{field.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default EmployeeDetails;