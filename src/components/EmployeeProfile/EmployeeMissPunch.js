import { useState, useEffect } from "react"
import { missPunchService } from "../../services/missPunchService"
import { format } from "date-fns"

function EmployeeMissPunch({ employeeId }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRequests()
  }, []) //Removed employeeId from dependency array

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const data = await missPunchService.getEmployeeRequests(employeeId)
      setRequests(data)
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

  if (requests.length === 0) {
    return <div className="text-center py-8 text-gray-500">No miss punch requests found</div>
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="bg-white border rounded-lg p-4 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">Date: {format(new Date(request.date), "dd/MM/yyyy")}</p>
              <div className="mt-1 flex gap-4">
                <p className="text-sm text-gray-600">Check In: {request.checkIn || "N/A"}</p>
                <p className="text-sm text-gray-600">Check Out: {request.checkOut || "N/A"}</p>
              </div>
            </div>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                request.status === "Approved"
                  ? "bg-green-100 text-green-800"
                  : request.status === "Rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {request.status}
            </span>
          </div>
          {request.comments && <p className="text-sm text-gray-600 border-t pt-2 mt-2">Comments: {request.comments}</p>}
        </div>
      ))}
    </div>
  )
}

export default EmployeeMissPunch;