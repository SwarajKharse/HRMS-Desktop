import { useState, useEffect } from "react"
import { warningService } from "../../services/warningService"
import { format } from "date-fns"

function EmployeeWarnings({ employeeId }) {
  const [warnings, setWarnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchWarnings()
  }, [])

  const fetchWarnings = async () => {
    try {
      setLoading(true)
      const data = await warningService.getWarningsByEmployeeId(employeeId)
      setWarnings(data)
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

  if (warnings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No warning letters issued
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {warnings.map((warning) => (
        <div
          key={warning.id}
          className="bg-white border rounded-lg p-4 shadow-sm"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                Date: {format(new Date(warning.warningDate), "dd/MM/yyyy")}
              </p>
              <p className="text-sm font-medium text-gray-900">
                Warning Letter #{warning.id}
              </p>
              <p className="text-sm text-gray-600">Reason: {warning.reason}</p>
            </div>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
              Warning
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default EmployeeWarnings;