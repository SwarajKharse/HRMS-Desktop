"use client"

import { useState, useRef } from "react"
import { FiDownload, FiUpload, FiX, FiAlertTriangle } from "react-icons/fi"
import { storeService } from "../../services/storeService"

const ProductImportExport = ({ onClose, onSuccess }) => {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  const handleExportProducts = async () => {
    try {
      setIsExporting(true)
      setError(null)

      const data = await storeService.exportProducts()

      const blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "products.xlsx")
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)

      setSuccessMessage("Products exported successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Export error:", error)
      setError(
        "Error exporting products: " +
          (error.response?.status === 403
            ? "Permission denied. Please check your authorization."
            : "An unexpected error occurred."),
      )
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportProducts = async (file) => {
    if (!file) {
      setError("No file selected. Please select an Excel file to import.")
      return
    }

    // Validate file type
    const fileExtension = file.name.split(".").pop().toLowerCase()
    if (fileExtension !== "xlsx" && fileExtension !== "xls") {
      setError("Invalid file format. Please select an Excel file (.xlsx or .xls).")
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      setError("File is too large. Maximum file size is 5MB.")
      return
    }

    try {
      setIsImporting(true)
      setError(null)
      setImportResult(null)

      console.log("Starting import of file:", file.name)

      const response = await storeService.importProducts(file)
      console.log("Import response:", response)

      setImportResult(response)

      // Check if the response contains success information
      if (response && typeof response === "object") {
        if (response.success === false) {
          setError(response.message || "Import failed. Please check the file and try again.")
          return
        }

        if (response.successCount && response.totalCount) {
          setSuccessMessage(`Successfully imported ${response.successCount} out of ${response.totalCount} products.`)

          // Show error information if there are errors
          if (response.hasErrors && response.errors && response.errors.length > 0) {
            setSuccessMessage((prev) => prev + ` ${response.errors.length} errors occurred during import.`)
          }
        } else {
          setSuccessMessage("Products imported successfully!")
        }
      } else {
        setSuccessMessage("Products imported successfully!")
      }

      // Wait a moment before calling onSuccess to allow the user to see the success message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        }
      }, 6000)
    } catch (error) {
      console.error("Import error:", error)

      let errorMessage = "Error importing products: "

      if (error.response && error.response.data) {
        if (typeof error.response.data === "string") {
          errorMessage += error.response.data
        } else if (error.response.data.message) {
          errorMessage += error.response.data.message
        } else {
          errorMessage += JSON.stringify(error.response.data)
        }
      } else if (error.message) {
        errorMessage += error.message
      } else {
        errorMessage += "Please check your file and try again."
      }

      setError(errorMessage)
    } finally {
      setIsImporting(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDownloadErrorCsv = () => {
    if (!importResult || !importResult.errors || importResult.errors.length === 0) {
      return
    }

    try {
      // Create CSV content
      let csvContent = "Row Number,Error,Product Name,Item Code\n"

      importResult.errors.forEach((error) => {
        const rowNumber = error.rowNumber || ""
        const errorText = (error.error || error).replace(/"/g, '""') // Escape quotes
        const productName = (error.productName || "").replace(/"/g, '""')
        const itemCode = (error.itemCode || "").replace(/"/g, '""')
        csvContent += `${rowNumber},"${errorText}","${productName}","${itemCode}"\n`
      })

      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "import_errors.csv")
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)

      setSuccessMessage("Error CSV downloaded successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error downloading CSV:", error)
      setError("Failed to download error CSV")
    }
  }

  // Prevent dialog from closing when clicking inside it
  const handleDialogClick = (e) => {
    e.stopPropagation()
  }

  const handleCloseClick = () => {
    // Prevent closing if currently importing or exporting
    if (isImporting || isExporting) {
      return
    }

    if (onClose) {
      onClose()
    }
  }

  return (
    <div
      className="bg-white rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-[700px] max-h-[90vh] overflow-y-auto relative"
      onClick={handleDialogClick}
    >
      <button
        onClick={handleCloseClick}
        className={`absolute right-3 top-3 p-1 rounded-full transition-colors ${
          isImporting || isExporting ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
        }`}
        type="button"
        disabled={isImporting || isExporting}
      >
        <FiX className="w-5 h-5 text-gray-500" />
      </button>

      <div className="mb-6 pr-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Product Import/Export</h2>
        <p className="text-sm text-gray-500 mt-1">Export your current product data or import updated data</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
          <FiAlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMessage}
        </div>
      )}

      {/* Import Results Section */}
      {importResult && importResult.hasErrors && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-yellow-800">Import completed with errors</h4>
              <p className="text-sm text-yellow-700 mt-1">
                {importResult.errors?.length || 0} errors occurred during import
              </p>
            </div>
            <button
              onClick={handleDownloadErrorCsv}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
            >
              Download Error CSV
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
        {/* Export Section */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <FiDownload className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Export Products</h3>
              <p className="text-sm text-gray-500 mb-3">
                Download your current products data as Excel file with ID, Main Group, Category, and Product details
              </p>
              <button
                onClick={handleExportProducts}
                disabled={isExporting}
                className={`inline-flex items-center px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 ${isExporting ? "cursor-not-allowed" : ""}`}
                type="button"
              >
                {isExporting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Exporting...</span>
                  </div>
                ) : (
                  <>
                    <FiDownload className="w-4 h-4 mr-2" />
                    Export Products
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <FiUpload className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Import Products</h3>
              <p className="text-sm text-gray-500 mb-3">
                Upload updated products data from Excel file (supports both new products and updates to existing ones)
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const file = fileInputRef.current?.files?.[0]
                  handleImportProducts(file)
                }}
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    disabled={isImporting}
                    ref={fileInputRef}
                    onChange={(e) => {
                      // Clear previous errors when a new file is selected
                      if (error) setError(null)
                      if (importResult) setImportResult(null)
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isImporting}
                    className={`inline-flex items-center px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-green-600 text-white hover:bg-green-700 ${isImporting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isImporting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Importing...</span>
                      </div>
                    ) : (
                      <>
                        <FiUpload className="w-4 h-4 mr-2" />
                        Import
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Column Structure Information */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 sm:p-4">
          <h4 className="font-medium text-blue-800 mb-2">Excel Column Structure</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <strong>Column Order:</strong>
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                <strong>ID</strong> - For updates (leave empty for new products)
              </li>
              <li>
                <strong>Main Group</strong> - Display only (not editable during import)
              </li>
              <li>
                <strong>Category Name</strong> - Display only (not editable during import)
              </li>
              <li>
                <strong>Sub Category Name</strong> - Required for new products
              </li>
              <li>
                <strong>Product Name</strong> - Required for new products
              </li>
              <li>
                <strong>Item Code</strong> - Auto-generated if not provided
              </li>
              <li>
                <strong>UOM</strong> - Required for new products
              </li>
              <li>
                <strong>HSN Code</strong> - Optional
              </li>
              <li>
                <strong>Make</strong> - Optional
              </li>
              <li>
                <strong>Description</strong> - Optional
              </li>
            </ol>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 sm:p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Important Notes</h4>
          <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
            <li>Export your current data before importing new data</li>
            <li>
              <strong>To update existing products:</strong> Include the ID from the exported file
            </li>
            <li>
              <strong>To create new products:</strong> Leave the ID column empty or set to 0
            </li>
            <li>
              <strong>Main Group and Category Name</strong> columns are for reference only and will be ignored during
              import
            </li>
            <li>
              <strong>Sub Category Name</strong> must match existing subcategories exactly for new products
            </li>
            <li>
              <strong>Item Code</strong> will be auto-generated if not provided for new products
            </li>
            <li>
              <strong>Make</strong> field captures product manufacturer information
            </li>
            <li>Only .xlsx or .xls files are supported</li>
            <li>Maximum file size: 5MB</li>
            <li>Download error CSV if import fails to see detailed error information</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ProductImportExport
