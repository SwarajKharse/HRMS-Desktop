"use client"
import { useState, useEffect } from "react"
import { FiX, FiPlus, FiTrash2 } from "react-icons/fi"
import { storeService } from "../../services/storeService"
import { getErrorMessage } from "../../utils/errorUtils"

const emptyContact = (isPrimary = false) => ({
  name: "",
  mobileNumber: "",
  email: "",
  designation: "",
  isPrimary,
})

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
// Fixed from the old broken regex (which literally could not match a
// phone number containing parentheses, e.g. "+1 (555) 123-4567").
const validatePhone = (phone) => /^[0-9\-+()\s]{10,}$/.test(phone)
const validateGst = (gst) => /^[0-9]{2}[A-Z0-9]{10}[0-9A-Z]{3}$/.test(gst)
const validatePan = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)

const derivePanFromGst = (gst) => (gst && gst.length >= 12 ? gst.substring(2, 12).toUpperCase() : "")

const AddVendor = ({ onClose, onSuccess }) => {
  const [vendorName, setVendorName] = useState("")
  const [gstStatus, setGstStatus] = useState("") // "" forces an explicit choice
  const [gstNumber, setGstNumber] = useState("")
  const [panNumber, setPanNumber] = useState("")
  const [msmeStatus, setMsmeStatus] = useState("NOT_REGISTERED")
  const [address, setAddress] = useState("")
  const [vendorType, setVendorType] = useState("")
  const [mainGroups, setMainGroups] = useState([])
  const [selectedMainGroupIds, setSelectedMainGroupIds] = useState([])
  const [bankAccountHolderName, setBankAccountHolderName] = useState("")
  const [bankAccountNumber, setBankAccountNumber] = useState("")
  const [bankIfscCode, setBankIfscCode] = useState("")
  const [upiId, setUpiId] = useState("")
  const [contacts, setContacts] = useState([emptyContact(true)])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const requiresProductTags = vendorType === "MATERIAL" || vendorType === "MATERIAL_LABOUR"

  useEffect(() => {
    // Confirmed via grep: storeService.getAllMainGroups()
    storeService
      .getAllMainGroups()
      .then((res) => setMainGroups(res.data || res || []))
      .catch((err) => console.error("Failed to load main groups:", err))
  }, [])

  const handleGstStatusChange = (value) => {
    setGstStatus(value)
    setFieldErrors((prev) => ({ ...prev, gstNumber: null, panNumber: null }))
    if (value === "REGISTERED") {
      setPanNumber(derivePanFromGst(gstNumber))
    } else {
      setGstNumber("")
    }
  }

  const handleGstNumberChange = (value) => {
    const upper = value.toUpperCase()
    setGstNumber(upper)
    setPanNumber(derivePanFromGst(upper))
    if (fieldErrors.gstNumber) setFieldErrors((prev) => ({ ...prev, gstNumber: null }))
  }

  const toggleMainGroup = (id) => {
    setSelectedMainGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))
  }

  const updateContact = (index, field, value) => {
    setContacts((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addContact = () => setContacts((prev) => [...prev, emptyContact(false)])

  const removeContact = (index) => {
    if (contacts[index].isPrimary) return // primary contact cannot be removed
    setContacts((prev) => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    const errors = {}

    if (!vendorName.trim()) errors.vendorName = "Vendor name is required"
    if (!gstStatus) errors.gstStatus = "Select GST status"
    if (!vendorType) errors.vendorType = "Select vendor type"
    if (!address.trim()) errors.address = "Address is required"

    if (gstStatus === "REGISTERED") {
      if (!gstNumber.trim()) errors.gstNumber = "GST number is required"
      else if (!validateGst(gstNumber)) errors.gstNumber = "Invalid GST number format"
    } else if (gstStatus === "UNREGISTERED") {
      if (!panNumber.trim()) errors.panNumber = "PAN is required for unregistered vendors"
      else if (!validatePan(panNumber)) errors.panNumber = "Invalid PAN format"
    }

    const hasBank = bankAccountNumber.trim() && bankIfscCode.trim()
    const hasUpi = upiId.trim()
    if (gstStatus === "REGISTERED" && !hasBank && !hasUpi) {
      errors.bank = "Bank account details or UPI ID is required for GST-registered vendors"
    }

    if (requiresProductTags && selectedMainGroupIds.length === 0) {
      errors.mainGroups = "Select at least one product category"
    }

    contacts.forEach((c, i) => {
      if (!c.name.trim()) errors[`contact_${i}_name`] = "Name required"
      if (!c.mobileNumber.trim()) errors[`contact_${i}_mobile`] = "Mobile required"
      else if (!validatePhone(c.mobileNumber)) errors[`contact_${i}_mobile`] = "Invalid phone format"
      if (!c.email.trim()) errors[`contact_${i}_email`] = "Email required"
      else if (!validateEmail(c.email)) errors[`contact_${i}_email`] = "Invalid email format"
    })

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return

    setLoading(true)
    try {
      const payload = {
        vendorName: vendorName.trim(),
        gstStatus,
        gstNumber: gstStatus === "REGISTERED" ? gstNumber.trim() : null,
        panNumber: panNumber.trim(),
        msmeStatus,
        address: address.trim(),
        vendorType,
        productMainGroupIds: requiresProductTags ? selectedMainGroupIds : [],
        bankAccountHolderName: bankAccountHolderName.trim() || null,
        bankAccountNumber: bankAccountNumber.trim() || null,
        bankIfscCode: bankIfscCode.trim() || null,
        upiId: upiId.trim() || null,
        contacts: contacts.map((c) => ({
          name: c.name.trim(),
          mobileNumber: c.mobileNumber.trim(),
          email: c.email.trim(),
          designation: c.designation.trim() || null,
          isPrimary: c.isPrimary,
        })),
        // Confirmed via console: localStorage.userData = {id, firstName, lastName, designation:{...}, employeeCode}
        createdBy: (() => {
          const userData = JSON.parse(localStorage.getItem("userData") || "{}")
          const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(" ")
          return fullName || "system"
        })(),
      }

      await storeService.createVendor(payload)
      setLoading(false)
      onSuccess()
    } catch (err) {
      console.error("Error adding vendor:", err)
      setError(getErrorMessage(err, "Failed to add vendor."))
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4" onClick={onClose}>
      <div
        className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-3xl mx-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <FiX size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Vendor</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vendor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fieldErrors.vendorName && <p className="text-red-600 text-xs mt-1">{fieldErrors.vendorName}</p>}
          </div>

          {/* GST / PAN / MSME */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Status <span className="text-red-600">*</span>
              </label>
              <select
                value={gstStatus}
                onChange={(e) => handleGstStatusChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Select status</option>
                <option value="REGISTERED">Registered</option>
                <option value="UNREGISTERED">Unregistered</option>
              </select>
              {fieldErrors.gstStatus && <p className="text-red-600 text-xs mt-1">{fieldErrors.gstStatus}</p>}
            </div>

            {gstStatus === "REGISTERED" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={gstNumber}
                  maxLength={15}
                  onChange={(e) => handleGstNumberChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="22AAAAA0000A1Z5"
                />
                {fieldErrors.gstNumber && <p className="text-red-600 text-xs mt-1">{fieldErrors.gstNumber}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PAN {gstStatus === "UNREGISTERED" && <span className="text-red-600">*</span>}
              </label>
              <input
                type="text"
                value={panNumber}
                maxLength={10}
                readOnly={gstStatus === "REGISTERED"}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  gstStatus === "REGISTERED" ? "bg-gray-100" : ""
                }`}
                placeholder={gstStatus === "REGISTERED" ? "Auto-filled from GST" : "AAAAA0000A"}
              />
              {fieldErrors.panNumber && <p className="text-red-600 text-xs mt-1">{fieldErrors.panNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">MSME Status</label>
              <select
                value={msmeStatus}
                onChange={(e) => setMsmeStatus(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MICRO">Micro</option>
                <option value="SMALL">Small</option>
                <option value="MEDIUM">Medium</option>
                <option value="NOT_REGISTERED">Not Registered</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registered Address <span className="text-red-600">*</span>
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fieldErrors.address && <p className="text-red-600 text-xs mt-1">{fieldErrors.address}</p>}
          </div>

          {/* Vendor Type + Product Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Type <span className="text-red-600">*</span>
            </label>
            <select
              value={vendorType}
              onChange={(e) => {
                setVendorType(e.target.value)
                if (e.target.value === "LABOUR") setSelectedMainGroupIds([])
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Select vendor type</option>
              <option value="MATERIAL">Material</option>
              <option value="LABOUR">Labour</option>
              <option value="MATERIAL_LABOUR">Material + Labour</option>
            </select>
            {fieldErrors.vendorType && <p className="text-red-600 text-xs mt-1">{fieldErrors.vendorType}</p>}

            {requiresProductTags && (
              <div className="mt-3 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Product Dealings <span className="text-red-600">*</span>
                </p>
                {mainGroups.length === 0 ? (
                  <p className="text-sm text-gray-400">Loading categories...</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {mainGroups.map((g) => (
                      <label key={g.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedMainGroupIds.includes(g.id)}
                          onChange={() => toggleMainGroup(g.id)}
                        />
                        {g.group_name}
                      </label>
                    ))}
                  </div>
                )}
                {fieldErrors.mainGroups && <p className="text-red-600 text-xs mt-1">{fieldErrors.mainGroups}</p>}
              </div>
            )}
          </div>

          {/* Bank / UPI */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Bank Details {gstStatus === "REGISTERED" && <span className="text-red-600">*</span>}
              <span className="text-gray-400 font-normal"> (bank OR UPI required if GST registered)</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Account Holder Name"
                value={bankAccountHolderName}
                onChange={(e) => setBankAccountHolderName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Account Number"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="IFSC Code"
                value={bankIfscCode}
                onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="UPI ID (optional)"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {fieldErrors.bank && <p className="text-red-600 text-xs mt-1">{fieldErrors.bank}</p>}
          </div>

          {/* Contacts */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700">
                Contacts <span className="text-red-600">*</span>
              </p>
              <button
                type="button"
                onClick={addContact}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <FiPlus size={14} /> Add Contact
              </button>
            </div>

            {contacts.map((c, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs font-medium ${c.isPrimary ? "text-blue-600" : "text-gray-400"}`}>
                    {c.isPrimary ? "Primary Contact" : `Contact ${i + 1}`}
                  </span>
                  {!c.isPrimary && (
                    <button
                      type="button"
                      onClick={() => removeContact(i)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Name *"
                      value={c.name}
                      onChange={(e) => updateContact(i, "name", e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {fieldErrors[`contact_${i}_name`] && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors[`contact_${i}_name`]}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Mobile Number *"
                      value={c.mobileNumber}
                      onChange={(e) => updateContact(i, "mobileNumber", e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {fieldErrors[`contact_${i}_mobile`] && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors[`contact_${i}_mobile`]}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email *"
                      value={c.email}
                      onChange={(e) => updateContact(i, "email", e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {fieldErrors[`contact_${i}_email`] && (
                      <p className="text-red-600 text-xs mt-1">{fieldErrors[`contact_${i}_email`]}</p>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Designation (optional)"
                    value={c.designation}
                    onChange={(e) => updateContact(i, "designation", e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3">
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