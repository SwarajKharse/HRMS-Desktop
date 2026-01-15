"use client"
import { useState } from "react"
import { FiX } from "react-icons/fi"
import { storeService } from "../../services/storeService"

const AddVendor = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    vendorName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9\-+$$$$\s]{10,}$/
    return phoneRegex.test(phone)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: null,
      }))
    }
  }

  const handleCheckEmail = async () => {
    if (!formData.email.trim()) {
      return
    }

    if (!validateEmail(formData.email)) {
      setFieldErrors((prev) => ({
        ...prev,
        email: "Invalid email format",
      }))
      return
    }

    try {
      const response = await storeService.checkVendorEmailExists(formData.email)
      if (response.exists) {
        setFieldErrors((prev) => ({
          ...prev,
          email: "Email already exists",
        }))
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          email: null,
        }))
      }
    } catch (err) {
      console.error("Error checking email:", err)
    }
  }

  const handleCheckPhone = async () => {
    if (!formData.phone.trim()) {
      return
    }

    if (!validatePhone(formData.phone)) {
      setFieldErrors((prev) => ({
        ...prev,
        phone: "Invalid phone format (min 10 digits)",
      }))
      return
    }

    try {
      const response = await storeService.checkVendorPhoneExists(formData.phone)
      if (response.exists) {
        setFieldErrors((prev) => ({
          ...prev,
          phone: "Phone number already exists",
        }))
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          phone: null,
        }))
      }
    } catch (err) {
      console.error("Error checking phone:", err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const newErrors = {}

    // Validate required fields
    if (!formData.vendorName.trim()) {
      newErrors.vendorName = "Vendor name is required"
    }

    // Validate email if provided
    if (formData.email && formData.email.trim()) {
      if (!validateEmail(formData.email)) {
        newErrors.email = "Invalid email format"
      }
    }

    // Validate phone if provided
    if (formData.phone && formData.phone.trim()) {
      if (!validatePhone(formData.phone)) {
        newErrors.phone = "Invalid phone format (min 10 digits)"
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors)
      setLoading(false)
      return
    }

    try {
      await storeService.createVendor(formData)
      setLoading(false)
      onSuccess()
    } catch (err) {
      console.error("Error adding vendor:", err)
      let errorMessage = "Failed to add vendor."
      if (err.response && err.response.data && err.response.data.message) {
        const msg = err.response.data.message.toLowerCase()
        if (msg.includes("email")) {
          errorMessage = "Email already exists. Please use a different email address."
        } else if (msg.includes("phone")) {
          errorMessage = "Phone number already exists. Please use a different phone number."
        } else {
          errorMessage = err.response.data.message
        }
      } else if (err.message) {
        const msg = err.message.toLowerCase()
        if (msg.includes("email")) {
          errorMessage = "Email already exists. Please use a different email address."
        } else if (msg.includes("phone")) {
          errorMessage = "Phone number already exists. Please use a different phone number."
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4" onClick={onClose}>
      <div
        className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <FiX size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Vendor</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vendor Name */}
            <div>
              <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700 mb-2">
                Vendor Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="vendorName"
                name="vendorName"
                value={formData.vendorName}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {fieldErrors.vendorName && <p className="text-red-600 text-xs mt-1">{fieldErrors.vendorName}</p>}
            </div>

            {/* Contact Person */}
            <div>
              <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person
              </label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleCheckEmail}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="example@email.com"
                />
              </div>
              {fieldErrors.email && <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={handleCheckPhone}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              {fieldErrors.phone && <p className="text-red-600 text-xs mt-1">{fieldErrors.phone}</p>}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter vendor address"
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm mb-4 mt-4">{error}</p>}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Adding..." : "Add Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddVendor