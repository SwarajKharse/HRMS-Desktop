import { motion } from "framer-motion"
import { FiX, FiChevronLeft, FiChevronRight, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi"
import { format, addMonths, subMonths } from "date-fns"

function MonthlyDataDialog({ title, data, onClose, onAdd, onEdit, onDelete, currentDate, onDateChange, loading }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => onDateChange(subMonths(currentDate, 1))}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-lg font-medium">{format(currentDate, "MMMM yyyy")}</span>
                    <button
                        onClick={() => onDateChange(addMonths(currentDate, 1))}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FiChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <button
                    onClick={onAdd}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                    <FiPlus className="w-4 h-4" />
                Add New
                </button>
            </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No records found for this month</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(item.date), "dd MMM yyyy")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="line-clamp-2">{item.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900 mr-3">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-900">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default MonthlyDataDialog;