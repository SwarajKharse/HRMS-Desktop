import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FiX, FiAlertCircle } from "react-icons/fi"

function PayrollDialog({ employee, payroll, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    id: null,
    employee: { id: employee.id },
    costToCompany: 0,
    basicSalaryPercent: 0,
    hraPercent: 0,
    daPercent: 0,
    ptValue: 0,
    pfPercent: 0,
    esicPercent: 0,
    gratuityPercent: 0,
    performanceBased: 0,
    overtime: 0,
    valueForDay: 0,
    advancePaymentsRecovery: 0,
    loansOrEmiRecovery: 0,
    latePenalty: 0,
  })

  const [calculatedValues, setCalculatedValues] = useState({
    basicSalary: 0,
    hra: 0,
    da: 0,
    pf: 0,
    esic: 0,
    gratuity: 0,
  })

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (payroll) {
      setFormData(payroll)
    }
  }, [payroll])

  useEffect(() => {
    calculateValues()
  }, [formData.costToCompany, formData.basicSalaryPercent, formData.hraPercent, formData.daPercent, 
      formData.pfPercent, formData.esicPercent, formData.gratuityPercent
  ]) // Only formData.costToCompany is needed here

  const calculateValues = () => {
    const ctc = Number.parseFloat(formData.costToCompany) || 0;
    const basicSalaryPercent = Number.parseFloat(formData.basicSalaryPercent) || 0;
    const hraPercent = Number.parseFloat(formData.hraPercent) || 0;
    const daPercent = Number.parseFloat(formData.daPercent) || 0;
    const pfPercent = Number.parseFloat(formData.pfPercent) || 0;
    const esicPercent = Number.parseFloat(formData.esicPercent) || 0;
    const gratuityPercent = Number.parseFloat(formData.gratuityPercent) || 0;
  
    // Calculate Basic Salary
    const basicSalary = (ctc * basicSalaryPercent) / 100;
  
    // Calculate HRA and DA as a percentage of Basic Salary
    const hra = (basicSalary * hraPercent) / 100;
    const da = (basicSalary * daPercent) / 100;
  
    // Calculate PF and Gratuity as a percentage of Basic Salary
    const pf = (basicSalary * pfPercent) / 100;
    const gratuity = (basicSalary * gratuityPercent) / 100;
  
    // Calculate ESIC as a percentage of Gross Salary (Basic + HRA + DA)
    const grossSalary = basicSalary + hra + da;
    const esic = (grossSalary * esicPercent) / 100;
  
    // Update calculated values
    setCalculatedValues({
      basicSalary,
      hra,
      da,
      pf,
      esic,
      gratuity,
    });
  
    // Update valueForDay
    if (ctc > 0) {
      setFormData((prev) => ({
        ...prev,
        valueForDay: Number.parseFloat((ctc / 30).toFixed(2)),
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.costToCompany) newErrors.costToCompany = "CTC is required"
    if (formData.basicSalaryPercent < 0 || formData.basicSalaryPercent > 100) {
      newErrors.basicSalaryPercent = "Percentage must be between 0 and 100"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setSubmitting(true)
      await onSubmit(formData)
      onClose()
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error.message,
      }))
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const renderPercentageInput = (label, name, value, calculatedValue) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="text-xs font-medium text-gray-500">Amount</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="number"
              name={name}
              value={value}
              onChange={handleChange}
              className="block w-full pl-3 pr-8 py-2 text-lg border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="100"
              step="0.01"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
          </div>
        </div>
        <div className="w-32 text-right">
          <div className="text-lg font-semibold text-gray-900">{formatCurrency(calculatedValue)}</div>
        </div>
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-gray-50 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white rounded-t-xl border-b border-gray-200 z-10">
          <div className="flex justify-between items-center p-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Payroll Settings</h2>
              <p className="text-sm text-gray-500 mt-1">
                {employee.firstName} {employee.lastName} - {employee.employeeCode}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <FiX className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly CTC</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="costToCompany"
                      value={formData.costToCompany}
                      onChange={handleChange}
                      className={`block w-full pl-8 pr-3 py-2 text-lg border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.costToCompany ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Enter monthly CTC"
                      min="0"
                    />
                  </div>
                  {errors.costToCompany && <p className="mt-1 text-sm text-red-500">{errors.costToCompany}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value Per Day</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="valueForDay"
                      value={formData.valueForDay}
                      readOnly
                      className="block w-full pl-8 pr-3 py-2 text-lg border border-gray-300 rounded-lg shadow-sm bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Salary Components */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Components</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderPercentageInput(
                  "Basic Salary",
                  "basicSalaryPercent",
                  formData.basicSalaryPercent,
                  calculatedValues.basicSalary,
                )}
                {renderPercentageInput("HRA", "hraPercent", formData.hraPercent, calculatedValues.hra)}
                {renderPercentageInput("DA", "daPercent", formData.daPercent, calculatedValues.da)}
                {renderPercentageInput("PF", "pfPercent", formData.pfPercent, calculatedValues.pf)}
                {renderPercentageInput("ESIC", "esicPercent", formData.esicPercent, calculatedValues.esic)}
                {renderPercentageInput(
                  "Gratuity",
                  "gratuityPercent",
                  formData.gratuityPercent,
                  calculatedValues.gratuity,
                )}
              </div>
            </div>

            {/* Additional Components */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Components</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Performance Based</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="performanceBased"
                      value={formData.performanceBased}
                      onChange={handleChange}
                      className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Rate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="overtime"
                      value={formData.overtime}
                      onChange={handleChange}
                      className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deductions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professional Tax</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="ptValue"
                      value={formData.ptValue}
                      onChange={handleChange}
                      className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Advance Payments Recovery</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="advancePaymentsRecovery"
                      value={formData.advancePaymentsRecovery}
                      onChange={handleChange}
                      className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loans/EMI Recovery</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="loansOrEmiRecovery"
                      value={formData.loansOrEmiRecovery}
                      onChange={handleChange}
                      className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Late Penalty</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="latePenalty"
                      value={formData.latePenalty}
                      onChange={handleChange}
                      className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-50 rounded-lg flex items-center text-red-500">
                <FiAlertCircle className="w-5 h-5 mr-2" />
                {errors.submit}
              </div>
            )}
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white rounded-b-xl border-t border-gray-200 p-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PayrollDialog;