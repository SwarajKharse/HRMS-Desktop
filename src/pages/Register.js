import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { FiX, FiAlertCircle, FiArrowLeft, FiArrowRight } from "react-icons/fi"
import { useAuth } from "../contexts/AuthContext"
import { organizationService } from "../services/organizationService"

function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [step, setStep] = useState(1) // 1 for org, 2 for employee
  const [orgData, setOrgData] = useState({
    name: "",
    website: "",
    typeOfOrg: "",
    contactPerson: "",
    contactNumber: "",
    contactEmail: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  })

  const [employeeData, setEmployeeData] = useState({
    email: "",
    password: "",
    firstName: "",
    middleName: "",
    lastName: "",
    personalPhone: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    bloodGroup: "",
    personalEmail: "",
    presentAddress: "",
    permanentAddress: "",
    empType: "Full-time",
    sourceOfHire: "Direct",
    dateOfJoining: new Date().toISOString().split("T")[0],
    workPhone: "",
    aboutMe: "",
    empStatus: "ACTIVE", // Super admin is active by default
    org: null, // Will be set after org creation
    department: null,
    designation: null,
    role: null,
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleOrgChange = (e) => {
    const { name, value, type, checked } = e.target
    setOrgData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
    if (error) setError("")
  }

  const handleEmployeeChange = (e) => {
    const { name, value } = e.target
    setEmployeeData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (error) setError("")
  }

  const validateOrgForm = () => {
    if (!orgData.name) return "Organization name is required"
    if (!orgData.contactEmail) return "Contact email is required"
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (step === 1) {
        const orgError = validateOrgForm()
        if (orgError) {
          setError(orgError)
          setLoading(false)
          return
        }

        const createdOrg = await organizationService.createOrganization(orgData)
        setEmployeeData((prev) => ({
          ...prev,
          org: { id: createdOrg.id },
        }))
        setStep(2)
      } else {
        // Register employee with org reference
        await register(employeeData)
        navigate("/login", {
          state: { message: "Registration successful! Please login with your credentials." },
        })
      }
    } catch (err) {
      setError(err.message || "Registration failed")
      window.scrollTo(0, 0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to-gray-100 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">{step === 1 ? "Organization Details" : "Super Admin Details"}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className={`w-3 h-3 rounded-full ${step === 1 ? "bg-blue-600" : "bg-gray-300"}`} />
              <div className={`w-3 h-3 rounded-full ${step === 2 ? "bg-blue-600" : "bg-gray-300"}`} />
            </div>
          </div>
          <button onClick={() => navigate("/login")} className="p-2 hover:bg-gray-100 rounded-full">
            <FiX size={20} />
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="m-4 bg-red-50 text-red-500 p-4 rounded-md flex items-center"
          >
            <FiAlertCircle className="mr-2" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {step === 1 ? (
            <>
              {/* Organization Details */}
              <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                <h3 className="font-semibold text-lg border-b pb-2">Organization Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Organization Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={orgData.name}
                      onChange={handleOrgChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={orgData.website}
                      onChange={handleOrgChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type of Organization</label>
                    <select
                      name="typeOfOrg"
                      value={orgData.typeOfOrg}
                      onChange={handleOrgChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="">Select Type</option>
                      <option value="Private">Private</option>
                      <option value="Public">Public</option>
                      <option value="Government">Government</option>
                      <option value="NGO">NGO</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={orgData.contactPerson}
                      onChange={handleOrgChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={orgData.contactNumber}
                      onChange={handleOrgChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Contact Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      required
                      value={orgData.contactEmail}
                      onChange={handleOrgChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4 rounded-lg bg-white border p-4">
                <h3 className="font-semibold text-lg border-b pb-2">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Street Address</label>
                    <input
                      type="text"
                      name="street"
                      value={orgData.street}
                      onChange={handleOrgChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      name="city"
                      value={orgData.city}
                      onChange={handleOrgChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      name="state"
                      value={orgData.state}
                      onChange={handleOrgChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={orgData.postalCode}
                      onChange={handleOrgChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={orgData.country}
                      onChange={handleOrgChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Employee Form (existing form fields)
            <div className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={employeeData.email}
                      onChange={handleEmployeeChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Personal Phone <span className="text-red-500">*</span> </label>
                    <input
                      type="tel"
                      required
                      name="personalPhone"
                      value={employeeData.personalPhone}
                      onChange={handleEmployeeChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      value={employeeData.password}
                      onChange={handleEmployeeChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={employeeData.firstName}
                      onChange={handleEmployeeChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={employeeData.lastName}
                      onChange={handleEmployeeChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      value={employeeData.middleName}
                      onChange={handleEmployeeChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="space-y-4 rounded-lg bg-white border p-4">
                <h3 className="font-semibold text-lg border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={employeeData.dateOfBirth}
                      onChange={handleEmployeeChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <select
                      name="gender"
                      value={employeeData.gender}
                      onChange={handleEmployeeChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Marital Status</label>
                    <select
                      name="maritalStatus"
                      value={employeeData.maritalStatus}
                      onChange={handleEmployeeChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="">Select Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                    <select
                      name="bloodGroup"
                      value={employeeData.bloodGroup}
                      onChange={handleEmployeeChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4 rounded-lg bg-gray-50/50 p-4">
                <h3 className="font-semibold text-lg border-b pb-2">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Personal Email</label>
                    <input
                      type="email"
                      name="personalEmail"
                      value={employeeData.personalEmail}
                      onChange={handleEmployeeChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Present Address</label>
                    <textarea
                      name="presentAddress"
                      value={employeeData.presentAddress}
                      onChange={handleEmployeeChange}
                      rows="3"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Permanent Address</label>
                    <textarea
                      name="permanentAddress"
                      value={employeeData.permanentAddress}
                      onChange={handleEmployeeChange}
                      rows="3"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Employment Information Section */}
              <div className="space-y-4 rounded-lg bg-white/80 border p-4">
                <h3 className="font-semibold text-lg border-b pb-2">Employment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee Type</label>
                    <select
                      name="empType"
                      value={employeeData.empType}
                      onChange={handleEmployeeChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="">Select Type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Source of Hire</label>
                    <input
                      type="text"
                      name="sourceOfHire"
                      value={employeeData.sourceOfHire}
                      onChange={handleEmployeeChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Joining</label>
                    <input
                      type="date"
                      name="dateOfJoining"
                      value={employeeData.dateOfJoining}
                      onChange={handleEmployeeChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Work Phone</label>
                    <input
                      type="tel"
                      name="workPhone"
                      value={employeeData.workPhone}
                      onChange={handleEmployeeChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* About Section */}
              <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                <h3 className="font-semibold text-lg border-b pb-2">Additional Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">About Me</label>
                  <textarea
                    name="aboutMe"
                    value={employeeData.aboutMe}
                    onChange={handleEmployeeChange}
                    rows="4"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

            </div>
          )}

          <div className="flex justify-between space-x-4 pt-4">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <FiArrowLeft className="mr-2" />
                Back
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {step === 1 ? "Saving Organization..." : "Creating Account..."}
                </div>
              ) : (
                <>
                  {step === 1 ? "Next" : "Create Account"}
                  {step === 1 && <FiArrowRight className="ml-2" />}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default Register;