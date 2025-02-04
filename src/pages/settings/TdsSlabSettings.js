import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiPlus, FiEdit2, FiTrash2, FiAlertCircle } from "react-icons/fi"
import { tdsSlabService } from "../../services/tdsSlabService"
import TdsSlabForm from "../../components/TdsSlabForm"
import { authService } from "../../services/authService";

function TdsSlabSettings() {
  const [tdsSlabs, setTdsSlabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingSlab, setEditingSlab] = useState(null)
  const [orgId] = useState(authService.getUser().orgId) // Replace with actual org ID from context or props

  useEffect(() => {
    fetchTdsSlabs()
  }, [])

  const fetchTdsSlabs = async () => {
    try {
      const data = await tdsSlabService.getTdsSlabsByOrgId(orgId)
      setTdsSlabs(data)
      setError(null)
    } catch (err) {
      setError("Failed to load TDS slabs")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (formData) => {
    try {
      await tdsSlabService.createTdsSlab({ ...formData, org: { id: orgId } })
      await fetchTdsSlabs()
      setShowForm(false)
    } catch (err) {
      setError("Failed to create TDS slab")
    }
  }

  const handleUpdate = async (formData) => {
    try {
      await tdsSlabService.updateTdsSlab({ ...formData, org: { id: orgId } })
      await fetchTdsSlabs()
      setShowForm(false)
      setEditingSlab(null)
    } catch (err) {
      setError("Failed to update TDS slab")
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this TDS slab?")) {
      try {
        await tdsSlabService.deleteTdsSlab(id)
        await fetchTdsSlabs()
      } catch (err) {
        setError("Failed to delete TDS slab")
      }
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TDS Slab Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage tax deduction slabs for your organization</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Add New Slab
        </motion.button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-500 p-4 rounded-lg flex items-center">
          <FiAlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TDS Percentage
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tdsSlabs.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    No TDS slabs found. Click "Add New Slab" to create one.
                  </td>
                </tr>
              ) : (
                tdsSlabs.map((slab, index) => (
                  <motion.tr
                    key={slab.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(slab.startSalary)} - {formatCurrency(slab.endSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slab.tdspercent}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingSlab(slab)
                          setShowForm(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(slab.id)} className="text-red-600 hover:text-red-900">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <TdsSlabForm
            onSubmit={editingSlab ? handleUpdate : handleCreate}
            onClose={() => {
              setShowForm(false)
              setEditingSlab(null)
            }}
            initialData={editingSlab}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default TdsSlabSettings;