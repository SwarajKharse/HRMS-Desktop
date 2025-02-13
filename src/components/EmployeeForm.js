import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { employeeService } from '../services/employeeService';
import { authService } from '../services/authService';
import { departmentService } from '../services/departmentService';
import { designationService } from '../services/designationService';
import ImageUploader from "./ImageUploader";

function EmployeeForm({ employee, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    middleName: '',
    lastName: '',
    profileImage: employee?.profileImage || null,
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    bloodGroup: '',
    personalPhone: '',
    personalEmail: '',
    presentAddress: '',
    permanentAddress: '',
    uan: '',
    pf: '',
    esic: '',
    bankName: '',
    bankAccountNo: '',
    ifscCode: '',
    empType: '',
    sourceOfHire: '',
    dateOfJoining: '',
    workPhone: '',
    aboutMe: '',
    isGeofenced: true,
    designation: {
      id: null
    },
    department: {
      id: null
    },
    reportingManager: {
      id: null
    },
    org :{
      id: authService.getUser().orgId
    }
  });
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [managerslist, setManagerslist] = useState([]);

  // Initialize form data when employee prop changes
  useEffect(() => {
    if (employee) {
      // Now we are getting the complete employee object from the parent component, 
      // But later, we need to fetch it from the API using the ID
      // write the code to fetch the employee object from the API using the ID
      // and set the employee object in the state
      setFormData({
        ...employee,
        dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split("T")[0] : "",
        dateOfJoining: employee.dateOfJoining ? new Date(employee.dateOfJoining).toISOString().split("T")[0] : "",
        department: {
          id: employee.department?.id || null,
        },
        designation: {
          id: employee.designation?.id || null,
        },
        reportingManager: {
          id: employee.reportingManager?.id || null
        }
      })
    }
  }, [employee]);

  useEffect(() => {
    fetchDepartmentsAndDesignations()
  }, [authService.getUser().orgId]);

  const fetchDepartmentsAndDesignations = async () => {
    try {
      const [deptData, desigData, managerslist] = await Promise.all([
        departmentService.getDepartmentsByOrgId(authService.getUser().orgId),
        designationService.getDesignationsByOrgId(authService.getUser().orgId),
        employeeService.getManagerList()
      ]);
      setDepartments(deptData);
      setDesignations(desigData);
      setManagerslist(managerslist);
    } catch (err) {
      setError("Failed to load departments and designations")
      console.error(err)
    } finally {
      setDataLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    // Handle department and designation select changes
    if (name === "department" || name === "designation" || name === "reportingManager") {
      setFormData((prev) => ({
        ...prev,
        [name]: {
          id: value || null,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    if (error) setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      const processedData = {
        ...formData,
        department: formData.department.id ? { id: formData.department.id } : null,
        designation: formData.designation.id ? { id: formData.designation.id } : null,
        reportingManager: formData.reportingManager.id ? { id: formData.reportingManager.id } : null,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        dateOfJoining: formData.dateOfJoining ? new Date(formData.dateOfJoining).toISOString() : null,
      };
  
      if (employee) {
        // Update existing employee
        await employeeService.updateEmployee(employee.id, processedData)
      } else {
        // Create new employee
        await employeeService.createEmployee(processedData)
      }
      await onSubmit(); // Wait for parent component to handle the response
      onClose(); // Only close after successful submission and parent handling
    } catch (err) {
      setError(err.message || 'Failed to create employee');
      window.scrollTo(0, 0); // Scroll to top to show error
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Add New Employee</h2>
          <div className="flex justify-end">
            {/* Clear Form Button */}
            <button
              type="button"
              onClick={() => setFormData({
                email: '',
                password: '',
                firstName: '',
                middleName: '',
                lastName: '',
                dateOfBirth: '',
                gender: '',
                maritalStatus: '',
                bloodGroup: '',
                personalPhone: '',
                personalEmail: '',
                presentAddress: '',
                permanentAddress: '',
                uan: '',
                pf: '',
                esic: '',
                bankName: '',
                bankAccountNo: '',
                ifscCode: '',
                empType: '',
                sourceOfHire: '',
                dateOfJoining: '',
                workPhone: '',
                isGeofenced: false,
                aboutMe: '',
                designation: {
                  id: null
                },
                department: {
                  id: null
                },
                reportingManager: {
                  id: null
                },
                org :{
                  id: authService.getUser().orgId
                }
              })}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
            >
              Clear Form
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information Section */}
          <div className="space-y-4 rounded-lg bg-gray-50 p-4">
            <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              {!employee && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
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
                  value={formData.lastName}
                  onChange={handleChange}
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
                  value={formData.middleName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              {/* Add this inside the form, after the Basic Information section */}
              <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                <h3 className="font-semibold text-lg border-b pb-2">Profile Photo</h3>
                <ImageUploader
                  currentImage={formData.profileImage}
                  onImageSelect={(imageData) => {
                    setFormData(prev => ({
                      ...prev,
                      profileImage: imageData
                    }));
                  }}
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
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
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
                  value={formData.maritalStatus}
                  onChange={handleChange}
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
                  value={formData.bloodGroup}
                  onChange={handleChange}
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
                <label className="block text-sm font-medium text-gray-700">Personal Phone</label>
                <input
                  type="tel"
                  name="personalPhone"
                  value={formData.personalPhone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Personal Email</label>
                <input
                  type="email"
                  name="personalEmail"
                  value={formData.personalEmail}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Present Address</label>
                <textarea
                  name="presentAddress"
                  value={formData.presentAddress}
                  onChange={handleChange}
                  rows="3"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Permanent Address</label>
                <textarea
                  name="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={handleChange}
                  rows="3"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Payment Information Section */}
          <div className="space-y-4 rounded-lg bg-white/80 border p-4">
            <h3 className="font-semibold text-lg border-b pb-2">Payroll Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Universal Account Number (UAN)</label>
                <input
                  type="text"
                  name="uan"
                  value={formData.uan}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">PF Number</label>
                <input
                  type="text"
                  name="pf"
                  value={formData.pf}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ESIC Number</label>
                <input
                  type="text"
                  name="esic"
                  value={formData.esic}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Account Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Account Number</label>
                <input
                  type="text"
                  name="bankAccountNo"
                  value={formData.bankAccountNo}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
          </div>

          
          <div className="space-y-4 rounded-lg bg-white border p-4">
            <h3 className="font-semibold text-lg border-b pb-2">Department & Designation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  name="department"
                  value={formData.department.id || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Designation</label>
                <select
                  name="designation"
                  value={formData.designation.id || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Designation</option>
                  {designations.map((desig) => (
                    <option key={desig.id} value={desig.id}>
                      {desig.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reporting Manager</label>
                <select
                  name="reportingManager"
                  value={formData.reportingManager.id || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Reporting Manager</option>
                  {managerslist.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.firstName} {manager.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg bg-white border p-4">
            <h3 className="font-semibold text-lg border-b pb-2">Geofencing Setting</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="isGeofenced" className="block text-sm font-medium text-gray-700">
                  Geofencing
                </label>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Enable location-based restrictions
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="isGeofenced"
                      name="isGeofenced"
                      checked={formData.isGeofenced}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, isGeofenced: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary">
                    </div>
                  </label>
                </div>
              </div>
              {formData.isGeofenced}
            </div>
          </div>

          {/* Employment Information Section */}
          <div className="space-y-4 rounded-lg bg-white/80 border p-4">
            <h3 className="font-semibold text-lg border-b pb-2">Employment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee Type <span className="text-red-500">*</span></label>
                <select
                  name="empType"
                  value={formData.empType}
                  onChange={handleChange}
                  required
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
                  value={formData.sourceOfHire}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Joining <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="dateOfJoining"
                  value={formData.dateOfJoining}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Work Phone</label>
                <input
                  type="tel"
                  name="workPhone"
                  value={formData.workPhone}
                  onChange={handleChange}
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
                value={formData.aboutMe}
                onChange={handleChange}
                rows="4"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : (
                employee ? "Update Employee" : "Add Employee"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default EmployeeForm;