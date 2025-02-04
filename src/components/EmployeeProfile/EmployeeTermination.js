import { useState, useEffect } from "react"
import { terminationService } from "../../services/terminationService"
import { format } from "date-fns"

function EmployeeTermination({ employeeId }) {
  const [termination, setTermination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTermination()
  }, [])

  const fetchTermination = async () => {
    try {
      setLoading(true)
      const data = await terminationService.getTerminationsByEmployeeId(employeeId)
      setTermination(Array.isArray(data) ? data[0] : data) // Handle both array and single object response
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

  if (!termination) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No termination record found</p>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm max-w-2xl mx-auto">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900">Termination Details</h3>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Initiated Date: {format(new Date(termination.terminationDate), "dd/MM/yyyy")}
          </p>
          <div className="border-t pt-2">
            <p className="text-sm text-gray-600">Reason:</p>
            <p className="mt-1 text-sm text-gray-900">{termination.reason}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeTermination;