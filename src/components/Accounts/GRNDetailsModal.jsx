import { FiX, FiFileText, FiCalendar, FiDollarSign, FiClock, FiCheckCircle, FiAward } from "react-icons/fi"

export default function GRNDetailsModal({ grn, allGRNs = [], onGRNSelect, onClose }) {
  if (!grn) return null

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">GRN Details</h2>
            <p className="text-purple-100 text-sm mt-1">
              {grn.grnNumber ? `GRN: ${grn.grnNumber}` : "Goods Receipt Note"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-800 rounded-lg transition-colors"
            title="Close"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* GRN Number with File Link */}
          <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
            <div className="flex items-center gap-3 mb-2">
              <FiFileText className="text-purple-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">GRN Number</h3>
            </div>
            <div className="ml-8">
              {grn.fileUrl ? (
                <a
                  href={grn.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 text-base font-medium"
                >
                  {grn.grnNumber || "View GRN Document"}
                </a>
              ) : (
                <p className="text-gray-700 font-medium">{grn.grnNumber || "N/A"}</p>
              )}
            </div>
          </div>

          {/* Grid of Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expected Date */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-200 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <FiCalendar className="text-purple-600" size={18} />
                <h4 className="font-semibold text-gray-700">Expected Date</h4>
              </div>
              <p className="text-gray-900 font-medium ml-7">
                {formatDate(grn.expectedDate)}
              </p>
            </div>

            {/* Payable Amount */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-200 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <FiDollarSign className="text-green-600" size={18} />
                <h4 className="font-semibold text-gray-700">Payable Amount</h4>
              </div>
              <p className="text-green-600 font-bold text-lg ml-7">
                {formatCurrency(grn.payableAmount)}
              </p>
            </div>

            {/* Uploaded At */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-200 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <FiClock className="text-blue-600" size={18} />
                <h4 className="font-semibold text-gray-700">Uploaded At</h4>
              </div>
              <p className="text-gray-900 font-medium ml-7">
                {formatDateTime(grn.uploadedAt || grn.createdAt)}
              </p>
            </div>

            {/* PM Approval */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-200 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <FiCheckCircle className="text-green-600" size={18} />
                <h4 className="font-semibold text-gray-700">PM Approval</h4>
              </div>
              <div className="ml-7">
                {grn.pmApproval ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Approved
                    </span>
                    {grn.pmApprovedAt && (
                      <span className="text-xs text-gray-500">
                        {formatDate(grn.pmApprovedAt)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    ⏳ Pending
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Test Certificate */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-200 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <FiAward className="text-orange-600" size={18} />
              <h4 className="font-semibold text-gray-700">Test Certificate</h4>
            </div>
            <div className="ml-7">
              {grn.testCertificateUrl ? (
                <a
                  href={grn.testCertificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 text-sm font-medium"
                >
                  {grn.testCertificateFileName || "View Test Certificate"}
                </a>
              ) : (
                <p className="text-gray-500 text-sm">No test certificate attached</p>
              )}
            </div>
          </div>

          {/* All GRNs Grid Navigation */}
          {allGRNs.length > 1 && (
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">All GRNs</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {allGRNs.map((grnItem, idx) => (
                  <button
                    key={idx}
                    onClick={() => onGRNSelect(grnItem)}
                    className={`flex items-center gap-2 p-3 rounded border transition-all ${
                      grn.id === grnItem.id
                        ? "border-purple-600 bg-purple-50 ring-2 ring-purple-300"
                        : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50"
                    }`}
                    title={`Switch to ${grnItem.grnNumber}`}
                  >
                    <FiFileText
                      size={16}
                      className={grn.id === grnItem.id ? "text-purple-600" : "text-gray-600"}
                    />
                    <span
                      className={`text-sm font-medium truncate ${
                        grn.id === grnItem.id ? "text-purple-700" : "text-gray-700"
                      }`}
                    >
                      {grnItem.grnNumber || `GRN ${idx + 1}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}