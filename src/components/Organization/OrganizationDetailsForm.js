import { useState, useRef } from "react"
import { FiSave, FiUpload, FiX } from "react-icons/fi"
import { organizationService } from "../../services/organizationService"

function ImageUpload({ imagePreview, onImageChange, onRemoveImage, inputId, title, fileInputRef, uploadError }) {
  return (
    <div className="space-y-4 rounded-lg bg-gray-50 p-4">
      <h3 className="font-semibold text-lg border-b pb-2">{title}</h3>
      <div className="flex flex-col items-center gap-4">
        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview || "/placeholder.svg"}
              alt={title}
              className="w-128 h-32 object-contain rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={onRemoveImage}
              className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            <FiUpload className="w-8 h-8 text-gray-400" />
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={onImageChange}
            className="hidden"
            id={inputId}
          />
          <label
            htmlFor={inputId}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center gap-2"
          >
            <FiUpload className="w-4 h-4" />
            {imagePreview ? `Change ${title}` : `Upload ${title}`}
          </label>
          {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
          <p className="text-sm text-gray-500">Maximum file size: 5MB</p>
        </div>
      </div>
    </div>
  )
}

function OrganizationDetailsForm({ organization, onSubmit }) {
  const [orgData, setOrgData] = useState(organization)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(false)
  const [logoPreview, setLogoPreview] = useState(organization?.logoUrl || null)
  const [letterheadPreview, setLetterheadPreview] = useState(organization?.letterHeadUrl || null)
  const [logoError, setLogoError] = useState(null)
  const [letterheadError, setLetterheadError] = useState(null)
  const logoInputRef = useRef(null)
  const letterheadInputRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setOrgData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (file, type) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      type === "logo" ? setLogoError("Please upload an image file") : setLetterheadError("Please upload an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      type === "logo"
        ? setLogoError("Image size should be less than 5MB")
        : setLetterheadError("Image size should be less than 5MB")
      return
    }

    type === "logo" ? setLogoError(null) : setLetterheadError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64Data = reader.result
      if (type === "logo") {
        setLogoPreview(base64Data)
        setOrgData((prev) => ({
          ...prev,
          logoImage: base64Data,
        }))
      } else {
        setLetterheadPreview(base64Data)
        setOrgData((prev) => ({
          ...prev,
          letterHeadImage: base64Data,
        }))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleLogoChange = (e) => handleImageChange(e.target.files[0], "logo")
  const handleLetterheadChange = (e) => handleImageChange(e.target.files[0], "letterhead")

  const removeLogo = () => {
    setLogoPreview(null)
    setOrgData((prev) => ({
      ...prev,
      logoImage: null,
      logoUrl: null,
    }))
    if (logoInputRef.current) {
      logoInputRef.current.value = ""
    }
  }

  const removeLetterhead = () => {
    setLetterheadPreview(null)
    setOrgData((prev) => ({
      ...prev,
      letterHeadImage: null,
      letterHeadUrl: null,
    }))
    if (letterheadInputRef.current) {
      letterheadInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await organizationService.updateOrganization(orgData)
      window.scrollTo(0, 0)
      setSuccessMessage(true)
      setTimeout(() => {
        setSuccessMessage(false)
      }, 3000)
      onSubmit && onSubmit()
      window.location.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <tbody>
        <tr>
          <td colSpan="3" className="px-6 py-4">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {error && <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>}
              {successMessage && (
                <div className="bg-green-50 text-green-600 p-4 rounded-md font-medium">
                  Organization details updated successfully!
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Logo Upload Section */}
                <ImageUpload
                  imagePreview={logoPreview}
                  onImageChange={handleLogoChange}
                  onRemoveImage={removeLogo}
                  inputId="logo-upload"
                  title="Organization Logo"
                  fileInputRef={logoInputRef}
                  uploadError={logoError}
                />

                {/* Letterhead Upload Section */}
                <ImageUpload
                  imagePreview={letterheadPreview}
                  onImageChange={handleLetterheadChange}
                  onRemoveImage={removeLetterhead}
                  inputId="letterhead-upload"
                  title="Organization Letterhead"
                  fileInputRef={letterheadInputRef}
                  uploadError={letterheadError}
                />
              </div>

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
                      value={orgData.name || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={orgData.website || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type of Organization</label>
                    <select
                      name="typeOfOrg"
                      value={orgData.typeOfOrg || ""}
                      onChange={handleChange}
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
                      value={orgData.contactPerson || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={orgData.contactNumber || ""}
                      onChange={handleChange}
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
                      value={orgData.contactEmail || ""}
                      onChange={handleChange}
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
                      value={orgData.street || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      name="city"
                      value={orgData.city || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      name="state"
                      value={orgData.state || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={orgData.postalCode || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={orgData.country || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Notice Periods */}
              <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                <h3 className="font-semibold text-lg border-b pb-2">Notice Periods (in days)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Warning Extended Period</label>
                    <input
                      type="number"
                      name="warningExtendedPeriod"
                      value={orgData.warningExtendedPeriod || 30}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Termination Notice Period</label>
                    <input
                      type="number"
                      name="terminationNoticePeriod"
                      min={1}
                      value={orgData.terminationNoticePeriod || 30}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Resignation Notice Period</label>
                    <input
                      type="number"
                      name="resignationNoticePeriod"
                      value={orgData.resignationNoticePeriod || 30}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
                >
                  <FiSave className="mr-2" />
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export default OrganizationDetailsForm;