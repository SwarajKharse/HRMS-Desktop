import { useState } from "react"
import { FiSave } from "react-icons/fi"
import { organizationService } from "../../services/organizationService"

function OrganizationDetailsForm({ organization, onSubmit }) {
  const [orgData, setOrgData] = useState(organization)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setOrgData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await organizationService.updateOrganization(orgData)
      onSubmit && onSubmit()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <tr>
      <td colSpan="3" className="px-6 py-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>}

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
  )
}

export default OrganizationDetailsForm;