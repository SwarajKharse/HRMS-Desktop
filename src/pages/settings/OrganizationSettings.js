import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiLayers, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi"
import { organizationService } from "../../services/organizationService"
import { departmentService } from "../../services/departmentService"
import { designationService } from "../../services/designationService"
import { authService } from "../../services/authService"
import DepartmentForm from "../../components/Organization/DepartmentForm"
import DesignationForm from "../../components/Organization/DesignationForm"
import OrganizationDetailsForm from "../../components/Organization/OrganizationDetailsForm"

// List of valid tabs for validation
const VALID_TABS = ["details", "departments", "designations"]

function OrganizationSettings() {
  // Initialize activeTab from sessionStorage with validation
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTab = sessionStorage.getItem("orgSettingsActiveTab")
      return VALID_TABS.includes(savedTab) ? savedTab : "details"
    }
    return "details"
  })
  const [organization, setOrganization] = useState(null)
  const [departments, setDepartments] = useState([])
  const [designations, setDesignations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDepartmentForm, setShowDepartmentForm] = useState(false)
  const [showDesignationForm, setShowDesignationForm] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [selectedDesignation, setSelectedDesignation] = useState(null)

  // Update sessionStorage when activeTab changes
  useEffect(() => {
    sessionStorage.setItem("orgSettingsActiveTab", activeTab)
  }, [activeTab])

  const orgId = authService.getUser().orgId

  useEffect(() => {
    fetchData()
  }, [orgId]) //This line is updated

  const fetchData = async () => {
    try {
      setLoading(true)
      const [orgData, deptData, desigData] = await Promise.all([
        organizationService.getOrganization(orgId),
        departmentService.getDepartmentsByOrgId(orgId),
        designationService.getDesignationsByOrgId(orgId),
      ])
      setOrganization(orgData)
      setDepartments(deptData)
      setDesignations(desigData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDepartmentEdit = (dept) => {
    setSelectedDepartment(dept)
    setShowDepartmentForm(true)
  }

  const handleDepartmentDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      try {
        await departmentService.deleteDepartment(id)
        await fetchData()
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const handleDesignationEdit = (desig) => {
    setSelectedDesignation(desig)
    setShowDesignationForm(true)
  }

  const handleDesignationDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this designation?")) {
      try {
        await designationService.deleteDesignation(id)
        await fetchData()
      } catch (err) {
        setError(err.message)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <FiLayers className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
          <p className="text-sm text-gray-500">Manage departments, designations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("details")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "details"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("departments")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "departments"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            Departments
          </button>
          <button
            onClick={() => setActiveTab("designations")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "designations"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            Designations
          </button>
        </nav>
      </div>

      {error && <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>}

      {/* Content */}
      <div className="flex justify-end">
        {(activeTab === "departments" || activeTab === "designations") && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (activeTab === "departments") {
                setSelectedDepartment(null)
                setShowDepartmentForm(true)
              } else if (activeTab === "designations") {
                setSelectedDesignation(null)
                setShowDesignationForm(true)
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <FiPlus className="mr-2" />
            Add {activeTab === "departments" ? "Department" : "Designation"}
          </motion.button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          {activeTab === "details" ? (
            <OrganizationDetailsForm organization={organization} onSubmit={fetchData} />
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  {activeTab === "roles" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  )}
                  {activeTab !== "roles" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent {activeTab === "departments" ? "Department" : "Designation"}
                    </th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeTab === "departments" ? (
                  departments.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                        No departments found
                      </td>
                    </tr>
                  ) : (
                    departments.map((dept) => (
                      <motion.tr key={dept.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dept.parentDepartment?.name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDepartmentEdit(dept)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDepartmentDelete(dept.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )
                ) : activeTab === "designations" ? (
                  designations.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                        No designations found
                      </td>
                    </tr>
                  ) : (
                    designations.map((desig) => (
                      <motion.tr key={desig.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{desig.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {desig.parentDesignation?.name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDesignationEdit(desig)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDesignationDelete(desig.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )
                ) : (
                  ""
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Forms */}
      <AnimatePresence>
        {showDepartmentForm && (
          <DepartmentForm
            department={selectedDepartment}
            orgId={orgId}
            onClose={() => {
              setShowDepartmentForm(false)
              setSelectedDepartment(null)
            }}
            onSubmit={fetchData}
            departments={departments}
          />
        )}
        {showDesignationForm && (
          <DesignationForm
            designation={selectedDesignation}
            orgId={orgId}
            onClose={() => {
              setShowDesignationForm(false)
              setSelectedDesignation(null)
            }}
            onSubmit={fetchData}
            designations={designations}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default OrganizationSettings;