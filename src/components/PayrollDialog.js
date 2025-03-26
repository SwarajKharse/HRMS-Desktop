import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FiX, FiAlertCircle, FiRefreshCw, FiCheck, FiInfo, FiDollarSign } from "react-icons/fi"
import { payrollSettingsService } from "../services/payrollSettingsService"
import { useAuth } from "../contexts/AuthContext"

function PayrollDialog({ employee, payroll, onClose, onSubmit }) {
  const { user } = useAuth()
  const orgId = user.orgId

  // State for gross salary input
  const [grossSalary, setGrossSalary] = useState("")

  // State for calculated values from API
  const [calculatedValues, setCalculatedValues] = useState(null)

  // State for loading indicators
  const [calculating, setCalculating] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // State for form data
  const [formData, setFormData] = useState({
    id: null,
    employee: { id: employee.employeeId || employee.id },
    costToCompany: 0,
    basicDa: 0,
    hra: 0,
    otherAllowances: 0,
    fixedAllowances: [],
    incentives: 0,
    grossSalary: 0,
    employeePf: 0,
    employerPf: 0,
    employeeEsic: 0,
    employerEsic: 0,
    professionalTax: 0,
    gratuity: 0,
    bonus: 0,
    totalDeductions: 0,
    totalEmployerContribution: 0,
    netSalary: 0,
    // Include in CTC flags
    includeEmployerPf: true,
    includeEmployerEsic: true,
    includeGratuity: true,
    includeBonus: true,
  })

  // State for errors
  const [errors, setErrors] = useState({})

  // State to track if form has been edited
  const [isEdited, setIsEdited] = useState(false)

  // Initialize form data from existing payroll settings if available
  useEffect(() => {
    if (payroll) {
      setFormData({
        id: payroll.id,
        employee: payroll.employee || { id: employee.employeeId || employee.id },
        costToCompany: payroll.costToCompany || 0,
        basicDa: payroll.basicDa || 0,
        hra: payroll.hra || 0,
        otherAllowances: payroll.otherAllowances || 0,
        fixedAllowances: payroll.fixedAllowances || [],
        incentives: payroll.incentives || 0,
        grossSalary: payroll.grossSalary || 0,
        employeePf: payroll.employeePf || 0,
        employerPf: payroll.employerPf || 0,
        employeeEsic: payroll.employeeEsic || 0,
        employerEsic: payroll.employerEsic || 0,
        professionalTax: payroll.professionalTax || 0,
        gratuity: payroll.gratuity || 0,
        bonus: payroll.bonus || 0,
        totalDeductions: payroll.totalDeductions || 0,
        totalEmployerContribution: payroll.employerContribution || 0,
        netSalary: payroll.netSalary || 0,
        // Include in CTC flags with defaults if not provided
        includeEmployerPf: payroll.includeEmployerPf !== undefined ? payroll.includeEmployerPf : true,
        includeEmployerEsic: payroll.includeEmployerEsic !== undefined ? payroll.includeEmployerEsic : true,
        includeGratuity: payroll.includeGratuity !== undefined ? payroll.includeGratuity : true,
        includeBonus: payroll.includeBonus !== undefined ? payroll.includeBonus : true,
      })

      // Set initial gross salary if available
      if (payroll.grossSalary) {
        setGrossSalary(payroll.grossSalary.toString())
      }
    }
  }, [payroll, employee])

  // Function to calculate payroll details based on gross salary
  const calculateOnGross = async () => {
    if (!grossSalary || Number.parseFloat(grossSalary) <= 0) {
      setErrors({ grossSalary: "Please enter a valid gross salary" })
      return
    }

    try {
      setCalculating(true)
      setErrors({})

      const empId = employee.employeeId || employee.id
      const grossSalaryValue = Number.parseFloat(grossSalary)

      const result = await payrollSettingsService.calculateOnGross(orgId, empId, grossSalaryValue)

      setCalculatedValues(result)

      // Calculate employer contribution based on include flags
      let employerContribution = 0
      if (result.employerPf && formData.includeEmployerPf) employerContribution += result.employerPf
      if (result.employerEsic && formData.includeEmployerEsic) employerContribution += result.employerEsic
      if (result.gratuity && formData.includeGratuity) employerContribution += result.gratuity
      if (result.bonus && formData.includeBonus) employerContribution += result.bonus

      // Calculate CTC = grossSalary + employerContribution
      const ctc = grossSalaryValue + employerContribution

      // Update form data with calculated values
      setFormData({
        ...formData,
        basicDa: result.basicDa || 0,
        hra: result.hra || 0,
        otherAllowances: result.otherAllowances || 0,
        fixedAllowances: result.fixedAllowances || [],
        grossSalary: grossSalaryValue,
        employeePf: result.employeePf || 0,
        employerPf: result.employerPf || 0,
        employeeEsic: result.employeeEsic || 0,
        employerEsic: result.employerEsic || 0,
        professionalTax: result.professionalTax || 0,
        gratuity: result.gratuity || 0,
        totalDeductions: result.employeeContribution || 0,
        totalEmployerContribution: employerContribution,
        netSalary: result.netSalary || 0,
        costToCompany: ctc,
      })

      setIsEdited(true)
    } catch (error) {
      setErrors({ calculation: error.message || "Failed to calculate payroll details" })
    } finally {
      setCalculating(false)
    }
  }

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === "grossSalary") {
      setGrossSalary(value)
      return
    }

    setFormData((prev) => {
      const newData = { ...prev, [name]: value }

      // If changing include flags, recalculate employer contribution and CTC
      if (name.startsWith("include")) {
        let employerContribution = 0
        if (newData.employerPf && newData.includeEmployerPf)
          employerContribution += Number.parseFloat(newData.employerPf)
        if (newData.employerEsic && newData.includeEmployerEsic)
          employerContribution += Number.parseFloat(newData.employerEsic)
        if (newData.gratuity && newData.includeGratuity) employerContribution += Number.parseFloat(newData.gratuity)
        if (newData.bonus && newData.includeBonus) employerContribution += Number.parseFloat(newData.bonus)

        newData.totalEmployerContribution = employerContribution
        newData.costToCompany = Number.parseFloat(newData.grossSalary) + employerContribution
      }

      return newData
    })

    setIsEdited(true)

    // Clear error for this field if any
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handle checkbox changes for include flags
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target

    setFormData((prev) => {
      const newData = { ...prev, [name]: checked }

      // Recalculate employer contribution and CTC
      let employerContribution = 0
      if (newData.employerPf && newData.includeEmployerPf) employerContribution += Number.parseFloat(newData.employerPf)
      if (newData.employerEsic && newData.includeEmployerEsic)
        employerContribution += Number.parseFloat(newData.employerEsic)
      if (newData.gratuity && newData.includeGratuity) employerContribution += Number.parseFloat(newData.gratuity)
      if (newData.bonus && newData.includeBonus) employerContribution += Number.parseFloat(newData.bonus)

      newData.totalEmployerContribution = employerContribution
      newData.costToCompany = Number.parseFloat(newData.grossSalary) + employerContribution

      return newData
    })

    setIsEdited(true)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    const newErrors = {}
    if (!formData.grossSalary || formData.grossSalary <= 0) {
      newErrors.grossSalary = "Gross salary is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      setSubmitting(true)

      // Prepare payload
      const payload = {
        id: formData.id,
        employee: formData.employee,
        costToCompany: formData.costToCompany,
        basicDa: formData.basicDa,
        hra: formData.hra,
        otherAllowances: formData.otherAllowances,
        fixedAllowances: formData.fixedAllowances,
        incentives: formData.incentives,
        grossSalary: formData.grossSalary,
        employeePf: formData.employeePf,
        employerPf: formData.employerPf,
        employeeEsic: formData.employeeEsic,
        employerEsic: formData.employerEsic,
        professionalTax: formData.professionalTax,
        gratuity: formData.gratuity,
        bonus: formData.bonus,
        totalDeductions: formData.totalDeductions,
        totalEmployerContribution: formData.totalEmployerContribution,
        netSalary: formData.netSalary,
        includeEmployerPf: formData.includeEmployerPf,
        includeEmployerEsic: formData.includeEmployerEsic,
        includeGratuity: formData.includeGratuity,
        includeBonus: formData.includeBonus,
      }

      await onSubmit(payload)
      onClose()
    } catch (error) {
      setErrors({ submit: error.message || "Failed to save payroll settings" })
    } finally {
      setSubmitting(false)
    }
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Calculate total of fixed allowances
  const calculateTotalFixedAllowances = () => {
    return formData.fixedAllowances.reduce((total, allowance) => total + (allowance.amount || 0), 0)
  }

  // Calculate gross salary components total
  const calculateGrossSalaryComponents = () => {
    const totalFixedAllowances = calculateTotalFixedAllowances()
    return formData.basicDa + formData.hra + totalFixedAllowances + formData.otherAllowances + formData.incentives
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-gray-50 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-xl border-b border-gray-200 z-10">
          <div className="flex justify-between items-center p-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Payroll Settings</h2>
              <p className="text-sm text-gray-500 mt-1">
                {employee.firstName} {employee.lastName} - {employee.employeeCode}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <FiX className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Gross Salary Input and Calculate Button */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gross Salary</h3>

              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label htmlFor="grossSalary" className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Gross Salary
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      id="grossSalary"
                      name="grossSalary"
                      value={grossSalary}
                      onChange={handleChange}
                      className={`block w-full pl-8 pr-3 py-3 text-lg border ${
                        errors.grossSalary ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                      } rounded-lg shadow-sm focus:border-transparent focus:ring-2`}
                      placeholder="Enter monthly gross salary"
                      min="0"
                      step="1"
                    />
                  </div>
                  {errors.grossSalary && <p className="mt-1 text-sm text-red-500">{errors.grossSalary}</p>}
                </div>

                <button
                  type="button"
                  onClick={calculateOnGross}
                  disabled={calculating || !grossSalary}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-sm"
                >
                  {calculating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Calculating...</span>
                    </>
                  ) : (
                    <>
                      <FiRefreshCw className="w-4 h-4" />
                      <span>Calculate</span>
                    </>
                  )}
                </button>
              </div>

              {errors.calculation && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-center text-red-500 text-sm">
                  <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span>{errors.calculation}</span>
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start text-blue-700 text-sm">
                <FiInfo className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  Enter the gross salary and click "Calculate" to automatically determine all payroll components based
                  on organization policies. You can adjust the values after calculation if needed.
                </span>
              </div>
            </div>

            {/* Display existing or calculated values */}
            {(formData.grossSalary > 0 || isEdited) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Salary Components */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Components</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic + DA */}
                    <div>
                      <label htmlFor="basicDa" className="block text-sm font-medium text-gray-700 mb-1">
                        Basic + DA
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          id="basicDa"
                          name="basicDa"
                          value={formData.basicDa}
                          onChange={handleChange}
                          className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* HRA */}
                    <div>
                      <label htmlFor="hra" className="block text-sm font-medium text-gray-700 mb-1">
                        HRA
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          id="hra"
                          name="hra"
                          value={formData.hra}
                          onChange={handleChange}
                          className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Other Allowances */}
                    <div>
                      <label htmlFor="otherAllowances" className="block text-sm font-medium text-gray-700 mb-1">
                        Other Allowances
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          id="otherAllowances"
                          name="otherAllowances"
                          value={formData.otherAllowances}
                          onChange={handleChange}
                          className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Incentives */}
                    <div>
                      <label htmlFor="incentives" className="block text-sm font-medium text-gray-700 mb-1">
                        Incentives
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          id="incentives"
                          name="incentives"
                          value={formData.incentives}
                          onChange={handleChange}
                          className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fixed Allowances */}
                  {formData.fixedAllowances && formData.fixedAllowances.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-medium text-gray-700 mb-3">Fixed Allowances</h4>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-2 gap-4">
                          {formData.fixedAllowances.map((allowance, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">{allowance.allowanceName}</span>
                              <span className="text-sm font-medium">{formatCurrency(allowance.amount)}</span>
                            </div>
                          ))}
                          {/* <div className="flex justify-between items-center col-span-2 pt-2 mt-2 border-t border-gray-300">
                            <span className="text-sm font-medium text-gray-700">Total Fixed Allowances</span>
                            <span className="text-sm font-medium">
                              {formatCurrency(calculateTotalFixedAllowances())}
                            </span>
                          </div> */}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Deductions */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Deductions</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Employee PF */}
                    <div>
                      <label htmlFor="employeePf" className="block text-sm font-medium text-gray-700 mb-1">
                        Employee PF
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          id="employeePf"
                          name="employeePf"
                          value={formData.employeePf}
                          onChange={handleChange}
                          className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Employee ESIC */}
                    <div>
                      <label htmlFor="employeeEsic" className="block text-sm font-medium text-gray-700 mb-1">
                        Employee ESIC
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          id="employeeEsic"
                          name="employeeEsic"
                          value={formData.employeeEsic}
                          onChange={handleChange}
                          className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Professional Tax */}
                    <div>
                      <label htmlFor="professionalTax" className="block text-sm font-medium text-gray-700 mb-1">
                        Professional Tax
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          id="professionalTax"
                          name="professionalTax"
                          value={formData.professionalTax}
                          onChange={handleChange}
                          className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employer Contributions */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Employer Contributions</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Employer PF */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="employerPf" className="block text-sm font-medium text-gray-700">
                          Employer PF
                        </label>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="includeEmployerPf"
                            name="includeEmployerPf"
                            checked={formData.includeEmployerPf}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="includeEmployerPf" className="ml-2 text-xs text-gray-500">
                            Include in CTC
                          </label>
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          id="employerPf"
                          name="employerPf"
                          value={formData.employerPf}
                          onChange={handleChange}
                          className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Employer ESIC */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="employerEsic" className="block text-sm font-medium text-gray-700">
                          Employer ESIC
                        </label>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="includeEmployerEsic"
                            name="includeEmployerEsic"
                            checked={formData.includeEmployerEsic}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="includeEmployerEsic" className="ml-2 text-xs text-gray-500">
                            Include in CTC
                          </label>
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          id="employerEsic"
                          name="employerEsic"
                          value={formData.employerEsic}
                          onChange={handleChange}
                          className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Gratuity */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="gratuity" className="block text-sm font-medium text-gray-700">
                          Gratuity
                        </label>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="includeGratuity"
                            name="includeGratuity"
                            checked={formData.includeGratuity}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="includeGratuity" className="ml-2 text-xs text-gray-500">
                            Include in CTC
                          </label>
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          id="gratuity"
                          name="gratuity"
                          value={formData.gratuity}
                          onChange={handleChange}
                          className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Bonus */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="bonus" className="block text-sm font-medium text-gray-700">
                          Bonus
                        </label>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="includeBonus"
                            name="includeBonus"
                            checked={formData.includeBonus}
                            onChange={handleCheckboxChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="includeBonus" className="ml-2 text-xs text-gray-500">
                            Include in CTC
                          </label>
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          id="bonus"
                          name="bonus"
                          value={formData.bonus}
                          onChange={handleChange}
                          className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Summary */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Summary</h3>

                  <div className="space-y-6">
                    {/* Gross Salary Breakdown */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                        <FiDollarSign className="mr-2 text-blue-500" />
                        Gross Salary Breakdown
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Basic + DA</span>
                          <span className="text-sm font-medium">{formatCurrency(formData.basicDa)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">HRA</span>
                          <span className="text-sm font-medium">{formatCurrency(formData.hra)}</span>
                        </div>
                        {formData.fixedAllowances && formData.fixedAllowances.length > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Fixed Allowances</span>
                            <span className="text-sm font-medium">
                              {formatCurrency(calculateTotalFixedAllowances())}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Other Allowances</span>
                          <span className="text-sm font-medium">{formatCurrency(formData.otherAllowances)}</span>
                        </div>
                        {formData.incentives > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Incentives</span>
                            <span className="text-sm font-medium">{formatCurrency(formData.incentives)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-300">
                          <span className="text-sm font-medium text-gray-700">Total Gross Salary</span>
                          <span className="text-sm font-semibold">{formatCurrency(formData.grossSalary)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Employee Contribution */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="text-md font-medium text-gray-700 mb-3">Employee Contribution</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Employee PF</span>
                          <span className="text-sm font-medium text-red-600">
                            {formatCurrency(formData.employeePf)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Employee ESIC</span>
                          <span className="text-sm font-medium text-red-600">
                            {formatCurrency(formData.employeeEsic)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Professional Tax</span>
                          <span className="text-sm font-medium text-red-600">
                            {formatCurrency(formData.professionalTax)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-300">
                          <span className="text-sm font-medium text-gray-700">Total Deductions</span>
                          <span className="text-sm font-semibold text-red-600">
                            {formatCurrency(formData.totalDeductions)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-300">
                          <span className="text-sm font-medium text-gray-700">Net Salary</span>
                          <span className="text-sm font-semibold text-green-600">
                            {formatCurrency(formData.netSalary)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Employer Contribution & CTC */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="text-md font-medium text-gray-700 mb-3">Employer Contribution & CTC</h4>
                      <div className="space-y-2">
                        {formData.includeEmployerPf && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Employer PF</span>
                            <span className="text-sm font-medium">{formatCurrency(formData.employerPf)}</span>
                          </div>
                        )}
                        {formData.includeEmployerEsic && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Employer ESIC</span>
                            <span className="text-sm font-medium">{formatCurrency(formData.employerEsic)}</span>
                          </div>
                        )}
                        {formData.includeGratuity && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Gratuity</span>
                            <span className="text-sm font-medium">{formatCurrency(formData.gratuity)}</span>
                          </div>
                        )}
                        {formData.includeBonus && formData.bonus > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Bonus</span>
                            <span className="text-sm font-medium">{formatCurrency(formData.bonus)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-300">
                          <span className="text-sm font-medium text-gray-700">Total Employer Contribution</span>
                          <span className="text-sm font-semibold">
                            {formatCurrency(formData.totalEmployerContribution)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-300">
                          <span className="text-sm font-medium text-gray-700">Gross Salary</span>
                          <span className="text-sm font-semibold">{formatCurrency(formData.grossSalary)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-300">
                          <span className="text-sm font-medium text-gray-700">Cost To Company (CTC)</span>
                          <span className="text-sm font-semibold text-blue-600">
                            {formatCurrency(formData.costToCompany)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {errors.submit && (
              <div className="p-4 bg-red-50 rounded-lg flex items-center text-red-500">
                <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{errors.submit}</span>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white rounded-b-xl border-t border-gray-200 p-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || (!isEdited && !formData.grossSalary)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PayrollDialog;