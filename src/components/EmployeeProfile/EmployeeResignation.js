import { useState, useEffect } from "react"
import { resignationService } from "../../services/resignationService"
import { format } from "date-fns"

function EmployeeResignation({ employeeId }) {
  const [resignation, setResignation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchResignation()
  }, [])

  const fetchResignation = async () => {
    try {
      setLoading(true)
      const data = await resignationService.getResignationByEmployeeId(employeeId)
      setResignation(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        <p>{error}</p>
      </div>
    )
  }

  if (!resignation && !showApplyForm) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No resignation application found</p>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm max-w-2xl mx-auto">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900">Resignation Details</h3>
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              resignation.status === "Approved"
                ? "bg-green-100 text-green-800"
                : resignation.status === "Rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {resignation.status}
          </span>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Applied Date: {format(new Date(resignation.resignationDate), "dd/MM/yyyy")}
          </p>
          <div className="border-t pt-2">
            <p className="text-sm text-gray-600">Reason:</p>
            <p className="mt-1 text-sm text-gray-900">{resignation.reason}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeResignation;