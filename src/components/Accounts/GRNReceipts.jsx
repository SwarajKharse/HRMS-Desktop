import { useState, useEffect } from "react"
import { FiFileText, FiLoader, FiX, FiCalendar, FiDollarSign, FiClock, FiCheckCircle, FiAward } from "react-icons/fi"
import { grnService } from "../../services/grnService"

export default function GRNReceipts({ poId }) {
  const [grns, setGrns] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (showModal && poId) {
      fetchGRNs()
    }
  }, [showModal, poId])

  const fetchGRNs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await grnService.getGRNsByPO(poId)
      setGrns(Array.isArray(data) ? data : [])
    } catch (err) {
      console.log("[v0] Error fetching GRNs:", err)
      setError("Failed to load GRNs")
      setGrns([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return "N/A"
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return date
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const formatDateTime = (date) => {
    if (!date) return "N/A"
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return date
    }
  }

  return (
    <>
      {/* GRNs Button */}
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium inline-flex items-center gap-2"
        title="View GRN Receipts"
      >
        <FiFileText size={16} />
        GRNs
        {grns.length > 0 && (
          <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">
            ({grns.length})
          </span>
        )}
      </button>

      {/* GRN Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-900 px-6 py-6 flex items-center justify-between border-b border-blue-200">
              <div>
                <h2 className="text-2xl font-bold text-blue-900">GRN Receipts</h2>
                <p className="text-blue-700 text-sm mt-1">
                  {grns.length} {grns.length === 1 ? "receipt" : "receipts"} found
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-blue-200 rounded-lg transition-colors text-blue-900"
                title="Close"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading && (
                <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
                  <FiLoader size={20} className="animate-spin" />
                  Loading GRNs...
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  {error}
                </div>
              )}

              {!loading && !error && grns.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No GRN receipts found
                </div>
              )}

              {!loading && !error && grns.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-blue-300 bg-blue-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">GRN Number</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Expected Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Payable Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Uploaded At</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">PM Approval</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Test Certificate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grns.map((grn, idx) => (
                        <tr key={idx} className="border-b border-blue-200 hover:bg-blue-50 transition-colors">
                          {/* GRN Number */}
                          <td className="px-4 py-3">
                            {grn.grnCopyUrl ? (
                              <a
                                href={grn.grnCopyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-800 font-medium text-sm"
                              >
                                {grn.grnNumber || "View"}
                              </a>
                            ) : (
                              <span className="text-slate-700 font-medium text-sm">{grn.grnNumber || "N/A"}</span>
                            )}
                          </td>

                          {/* Expected Date */}
                          <td className="px-4 py-3 text-sm text-slate-900">
                            {formatDate(grn.expectedPayableDate)}
                          </td>

                          {/* Payable Amount */}
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                            {formatCurrency(grn.payableAmount)}
                          </td>

                          {/* Uploaded At */}
                          <td className="px-4 py-3 text-sm text-slate-900">
                            {formatDateTime(grn.createdAt)}
                          </td>

                          {/* PM Approval */}
                          <td className="px-4 py-3">
                            {grn.purchaseManagerApprovalStatus === "APPROVED" ? (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Approved
                                </span>
                                {grn.purchaseManagerApprovalDate && (
                                  <span className="text-xs text-slate-500">
                                    {formatDate(grn.purchaseManagerApprovalDate)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                Pending
                              </span>
                            )}
                          </td>

                          {/* Test Certificate */}
                          <td className="px-4 py-3">
                            {grn.testCertificateUrl ? (
                              <a
                                href={grn.testCertificateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-800 text-sm"
                              >
                                {grn.testCertificateFilename ? grn.testCertificateFilename.substring(0, 20) + "..." : "View"}
                              </a>
                            ) : (
                              <span className="text-slate-500 text-sm">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}