import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { enquiryService } from "../../services/enquiryService"
import { getErrorMessage } from "../../utils/errorUtils"
import { FiAlertCircle, FiChevronRight, FiMail } from "react-icons/fi"

function WebsiteEnquiries() {
  const navigate = useNavigate()
  const [subTab, setSubTab] = useState("new") // "new" | "discarded"
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [enquiries, setEnquiries] = useState([])

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const enquiriesPerPage = 10

  const fetchEnquiries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data =
        subTab === "new"
          ? await enquiryService.getNewEnquiries(currentPage - 1, enquiriesPerPage)
          : await enquiryService.getDiscardedEnquiries(currentPage - 1, enquiriesPerPage)
      setEnquiries(data.content || [])
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      console.error("Error fetching website enquiries:", err)
      setError(getErrorMessage(err, "Failed to fetch website enquiries"))
    } finally {
      setLoading(false)
    }
  }, [subTab, currentPage])

  useEffect(() => {
    fetchEnquiries()
  }, [fetchEnquiries])

  const handleSubTabChange = (tab) => {
    setSubTab(tab)
    setCurrentPage(1)
  }

  const openEnquiry = (enquiry) => {
    navigate("/add-lead", { state: { enquiry } })
  }

  const enquiryCode = (id) => `ENQ-${String(id).padStart(5, "0")}`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-800">Website Enquiries</h2>
      </div>

      {/* Sub tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => handleSubTabChange("new")}
            className={`py-2 px-1 border-b-2 text-sm font-medium ${
              subTab === "new"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            New Enquiries
          </button>
          <button
            onClick={() => handleSubTabChange("discarded")}
            className={`py-2 px-1 border-b-2 text-sm font-medium ${
              subTab === "discarded"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Discarded Enquiries
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg p-4">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="text-center text-gray-500 py-16 border border-dashed border-gray-300 rounded-lg">
          {subTab === "new" ? "No new website enquiries right now." : "No discarded enquiries."}
        </div>
      ) : (
        <>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
            {enquiries.map((enquiry) => (
              <button
                key={enquiry.id}
                onClick={() => openEnquiry(enquiry)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FiMail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-medium text-gray-800">{enquiryCode(enquiry.id)}</span>
                  <span className="text-sm text-gray-500">
                    {enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleString() : "-"}
                  </span>
                </div>
                <FiChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default WebsiteEnquiries
