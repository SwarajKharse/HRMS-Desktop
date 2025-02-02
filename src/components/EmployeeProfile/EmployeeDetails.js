import { FiMail, FiCalendar, FiUser, FiInfo } from "react-icons/fi"

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
    <div className="space-y-8">
      {/* Information Sections */}
      <div className="grid grid-cols-1 gap-8">
        {sections.map((section) => (
          <div key={section.title} className="space-y-4">
            <div className="flex items-center space-x-2">
              <section.icon className="w-5 h-5 text-gray-400" />
              <h4 className="text-lg font-medium text-gray-900">{section.title}</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map((field) => (
                <div key={field.label} className="space-y-1">
                  <p className="text-sm text-gray-500">{field.label}</p>
                  <p className="text-sm font-medium text-gray-900">{field.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EmployeeDetails;