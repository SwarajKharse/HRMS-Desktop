import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiX, FiAlertCircle } from "react-icons/fi";

function PayrollDialog({ employee, payroll, onClose, onSubmit }) {
  // Updated state includes employeePf, employerPf, and attendanceBonusValue.
  const [formData, setFormData] = useState({
    id: null,
    employee: { id: employee.id || employee.employeeId },
    costToCompany: 0,
    basicSalaryPercent: 0,
    basicSalaryFlat: 0,
    hraPercent: 0,
    hraFlat: 0,
    daPercent: 0,
    daFlat: 0,
    employeePfPercent: 0,
    employeePfFlat: 0,
    employerPfPercent: 0,
    employerPfFlat: 0,
    esicPercent: 0,
    esicFlat: 0,
    gratuityPercent: 0,
    gratuityFlat: 0,
    ptValue: 0,
    performanceBased: 0,
    advancePaymentsRecovery: 0,
    loansOrEmiRecovery: 0,
    attendanceBonusValue: 0,
  });

  // Track which input was last edited for each component to avoid circular updates.
  const [editingSource, setEditingSource] = useState({
    basicSalary: null,
    hra: null,
    da: null,
    employeePf: null,
    employerPf: null,
    esic: null,
    gratuity: null,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // When payroll data is loaded, prepopulate the state.
  useEffect(() => {
    if (payroll) {
      setFormData({
        id: payroll.id,
        employee: payroll.employee,
        costToCompany: payroll.costToCompany,
        basicSalaryFlat: payroll.basicSalary,
        basicSalaryPercent: payroll.costToCompany
          ? ((payroll.basicSalary * 100) / payroll.costToCompany).toFixed(2)
          : 0,
        hraFlat: payroll.hra,
        hraPercent: payroll.basicSalary
          ? ((payroll.hra * 100) / payroll.basicSalary).toFixed(2)
          : 0,
        daFlat: payroll.da,
        daPercent: payroll.basicSalary
          ? ((payroll.da * 100) / payroll.basicSalary).toFixed(2)
          : 0,
        employeePfFlat: payroll.employeePf,
        employeePfPercent: payroll.basicSalary
          ? ((payroll.employeePf * 100) / payroll.basicSalary).toFixed(2)
          : 0,
        employerPfFlat: payroll.employerPf,
        employerPfPercent: payroll.basicSalary
          ? ((payroll.employerPf * 100) / payroll.basicSalary).toFixed(2)
          : 0,
        esicFlat: payroll.esic,
        esicPercent:
          payroll.basicSalary + payroll.hra + payroll.da
            ? (
                (payroll.esic * 100) /
                (payroll.basicSalary + payroll.hra + payroll.da)
              ).toFixed(2)
            : 0,
        gratuityFlat: payroll.gratuity,
        gratuityPercent: payroll.basicSalary
          ? ((payroll.gratuity * 100) / payroll.basicSalary).toFixed(2)
          : 0,
        ptValue: payroll.ptValue,
        performanceBased: payroll.performanceBased,
        advancePaymentsRecovery: payroll.advancePaymentsRecovery,
        loansOrEmiRecovery: payroll.loansOrEmiRecovery,
        attendanceBonusValue: payroll.attendanceBonusValue,
      });
    }
  }, [payroll]);

  // --- HANDLERS ---

  // When CTC changes, update basic salary accordingly.
  const handleCostToCompanyChange = (e) => {
    const { value } = e.target;
    const newCTC = parseFloat(value) || 0;
    setFormData((prev) => {
      let newBasicSalaryFlat = prev.basicSalaryFlat;
      let newBasicSalaryPercent = prev.basicSalaryPercent;
      if (editingSource.basicSalary === "percentage" || editingSource.basicSalary === null) {
        newBasicSalaryFlat = (newCTC * parseFloat(prev.basicSalaryPercent)) / 100;
      } else if (editingSource.basicSalary === "flat") {
        newBasicSalaryPercent = newCTC ? ((parseFloat(prev.basicSalaryFlat) * 100) / newCTC) : 0;
      }
      return {
        ...prev,
        costToCompany: value,
        basicSalaryFlat: newBasicSalaryFlat,
        basicSalaryPercent: newBasicSalaryPercent,
      };
    });
  };

  // Update the counterpart when percentage input changes.
  const handleComponentPercentageChange = (field, value) => {
    const newPercent = parseFloat(value) || 0;
    setEditingSource((prev) => ({ ...prev, [field]: "percentage" }));
    setFormData((prev) => {
      if (field === "basicSalary") {
        const ctc = parseFloat(prev.costToCompany) || 0;
        const newFlat = (ctc * newPercent) / 100;
        return { ...prev, basicSalaryPercent: value, basicSalaryFlat: newFlat };
      } else if (["hra", "da", "gratuity"].includes(field)) {
        const base = parseFloat(prev.basicSalaryFlat) || 0;
        const newFlat = (base * newPercent) / 100;
        return { ...prev, [`${field}Percent`]: value, [`${field}Flat`]: newFlat };
      } else if (["employeePf", "employerPf"].includes(field)) {
        const base = parseFloat(prev.basicSalaryFlat) || 0;
        const newFlat = (base * newPercent) / 100;
        return { ...prev, [`${field}Percent`]: value, [`${field}Flat`]: newFlat };
      } else if (field === "esic") {
        // For ESIC, base = basicSalaryFlat + hraFlat + daFlat.
        const base =
          (parseFloat(prev.basicSalaryFlat) || 0) +
          (parseFloat(prev.hraFlat) || 0) +
          (parseFloat(prev.daFlat) || 0);
        const newFlat = (base * newPercent) / 100;
        return { ...prev, esicPercent: value, esicFlat: newFlat };
      }
      return prev;
    });
  };

  // Update the counterpart when flat input changes.
  const handleComponentFlatChange = (field, value) => {
    const newFlat = parseFloat(value) || 0;
    setEditingSource((prev) => ({ ...prev, [field]: "flat" }));
    setFormData((prev) => {
      if (field === "basicSalary") {
        const ctc = parseFloat(prev.costToCompany) || 0;
        const newPercent = ctc ? (newFlat * 100) / ctc : 0;
        return { ...prev, basicSalaryFlat: value, basicSalaryPercent: newPercent.toFixed(2) };
      } else if (["hra", "da", "gratuity"].includes(field)) {
        const base = parseFloat(prev.basicSalaryFlat) || 0;
        const newPercent = base ? (newFlat * 100) / base : 0;
        return { ...prev, [`${field}Flat`]: value, [`${field}Percent`]: newPercent.toFixed(2) };
      } else if (["employeePf", "employerPf"].includes(field)) {
        const base = parseFloat(prev.basicSalaryFlat) || 0;
        const newPercent = base ? (newFlat * 100) / base : 0;
        return { ...prev, [`${field}Flat`]: value, [`${field}Percent`]: newPercent.toFixed(2) };
      } else if (field === "esic") {
        const base =
          (parseFloat(prev.basicSalaryFlat) || 0) +
          (parseFloat(prev.hraFlat) || 0) +
          (parseFloat(prev.daFlat) || 0);
        const newPercent = base ? (newFlat * 100) / base : 0;
        return { ...prev, esicFlat: value, esicPercent: newPercent.toFixed(2) };
      }
      return prev;
    });
  };

  // For inputs that do not require dual calculation.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.costToCompany) newErrors.costToCompany = "CTC is required";
    if (formData.basicSalaryPercent < 0 || formData.basicSalaryPercent > 100) {
      newErrors.basicSalaryPercent = "Percentage must be between 0 and 100";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    // Build the payload using the flat (computed) values.
    const payload = {
      id: formData.id,
      employee: formData.employee,
      costToCompany: parseFloat(formData.costToCompany) || 0,
      basicSalary: parseFloat(formData.basicSalaryFlat) || 0,
      hra: parseFloat(formData.hraFlat) || 0,
      da: parseFloat(formData.daFlat) || 0,
      ptValue: parseFloat(formData.ptValue) || 0,
      employeePf: parseFloat(formData.employeePfFlat) || 0,
      employerPf: parseFloat(formData.employerPfFlat) || 0,
      esic: parseFloat(formData.esicFlat) || 0,
      gratuity: parseFloat(formData.gratuityFlat) || 0,
      performanceBased: parseFloat(formData.performanceBased) || 0,
      advancePaymentsRecovery: parseFloat(formData.advancePaymentsRecovery) || 0,
      loansOrEmiRecovery: parseFloat(formData.loansOrEmiRecovery) || 0,
      attendanceBonusValue: parseFloat(formData.attendanceBonusValue) || 0,
    };
    try {
      setSubmitting(true);
      await onSubmit(payload);
      onClose();
    } catch (error) {
      setErrors((prev) => ({ ...prev, submit: error.message }));
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Renders a dual-input field for components that use percentages and flat values.
  const renderComponentInput = (label, field, percentageOf) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {/* Percentage Input */}
        <div>
          <label className="block text-xs font-medium text-gray-500">
            % of {percentageOf || "CTC"}
          </label>
          <div className="relative">
            <input
              type="number"
              name={`${field}Percent`}
              value={formData[`${field}Percent`]}
              onChange={(e) => handleComponentPercentageChange(field, e.target.value)}
              className="block w-full pl-3 pr-8 py-2 text-lg border border-gray-300 rounded-lg shadow-sm"
              min="0"
              max="100"
              step="0.01"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
          </div>
        </div>
        {/* Flat Amount Input */}
        <div>
          <label className="block text-xs font-medium text-gray-500">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              name={`${field}Flat`}
              value={formData[`${field}Flat`]}
              onChange={(e) => handleComponentFlatChange(field, e.target.value)}
              className="block w-full pl-3 pr-8 py-2 text-lg border border-gray-300 rounded-lg shadow-sm"
              min="0"
              step="0.01"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
          </div>
        </div>
      </div>
    </div>
  );

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
        {/* Header */}
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
        {/* Form Content */}
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
                      onChange={handleCostToCompanyChange}
                      className={`block w-full pl-8 pr-3 py-2 text-lg border ${
                        errors.costToCompany ? "border-red-300" : "border-gray-300"
                      } rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Enter monthly CTC"
                      min="0"
                    />
                  </div>
                  {errors.costToCompany && (
                    <p className="mt-1 text-sm text-red-500">{errors.costToCompany}</p>
                  )}
                </div>
              </div>
            </div>
            {/* Salary Components */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Components</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderComponentInput("Basic Salary", "basicSalary", "CTC")}
                {renderComponentInput("HRA", "hra", "Basic Salary")}
                {renderComponentInput("DA", "da", "Basic Salary")}
                {renderComponentInput("Employee PF", "employeePf", "Basic Salary")}
                {renderComponentInput("Employer PF", "employerPf", "Basic Salary")}
                {renderComponentInput("ESIC", "esic", "Gross Salary")}
                {renderComponentInput("Gratuity", "gratuity", "Basic Salary")}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Bonus</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="attendanceBonusValue"
                      value={formData.attendanceBonusValue}
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
        {/* Footer */}
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
  );
}

export default PayrollDialog;