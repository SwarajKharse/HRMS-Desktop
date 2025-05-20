import React, { useState, useEffect } from "react";
import { FiSearch, FiDownload, FiUpload, FiX, FiCheck, FiAlertCircle } from "react-icons/fi";
import { storeService } from "../../services/storeService"
import { useNavigate } from "react-router-dom";
import { encryptId } from "../../utils/crypto"

function ImportSubCategory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showMigrateDialog, setShowMigrateDialog] = useState(false);

  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Function to fetch subcategories with server-side pagination
  const fetchSubCategories = async (page = 0, size = 10, search = "") => {
    try {
      setLoading(true);

      // The issue is here - you're not awaiting the response
      const response = await storeService.getSubCategories(page, size, search);

      if (response && response.data) {
        setSubCategories(response.data.content || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.totalElements || 0);
        setCurrentPage(page);
      } else {
        console.error("Invalid response format:", response);
        setError("Invalid response format from server");
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setError("Failed to fetch subcategories: " + (error.message || "Unknown error"));
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchSubCategories(currentPage, itemsPerPage, searchQuery);
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubCategories(0, itemsPerPage, searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePageChange = (pageNumber) => {
    fetchSubCategories(pageNumber, itemsPerPage, searchQuery);
  };

  const handleRowClick = (subCategory) => {
    navigate(`/store/subcategory/${encryptId(subCategory.id)}`);
  };

  const handleExportSubCategories = async () => {
    try {
      setIsExporting(true);
      const data = await storeService.exportSubCategories();
      const blob = new Blob(
        [data],
        { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "subcategories.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      setError("Error exporting subcategories: " + (error.response?.status === 403 ?
        "Permission denied. Please check your authorization." :
        "An unexpected error occurred."));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportSubCategories = async (file) => {
    try {
      setIsImporting(true);
      await storeService.importSubCategories(file);
      setShowMigrateDialog(false);
      setError(null);
      setSuccessMessage("Subcategories data imported successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
      //fetchSubCategories(currentPage, itemsPerPage, searchQuery);
    } catch (error) {
      console.log(error);
      setError("Error importing subcategories data. Please check your file and try again.");
    } finally {
      setIsImporting(false);
    }
  };

  if (loading && subCategories.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-white rounded-xl p-6 shadow-sm">

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowMigrateDialog(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:shadow-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 font-medium"
          >
            Migrate Data
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 border border-red-100">
          <FiAlertCircle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg border border-green-100 flex items-center shadow-sm">
          <FiCheck className="w-5 h-5 mr-2" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Subcategories List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400 w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search subcategories by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Subcategory Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Parent Category
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subCategories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-6 py-8 text-center text-gray-500 font-medium"
                    >
                      {loading ? "Loading subcategories..." : "No subcategories found"}
                    </td>
                  </tr>
                ) : (
                  subCategories.map((subCategory) => (
                    <tr
                      key={subCategory.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors group"
                      onClick={() => handleRowClick(subCategory)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm text-gray-900">
                              {subCategory.category_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {subCategory.productCategory ? (
                          <div className="text-sm text-gray-900">
                            {subCategory.productCategory.category_name || " "}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {/* {totalPages > 1 && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {subCategories.length} of {totalItems} subcategories
            </div>
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border text-sm disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show 5 page numbers at most, centered around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else {
                  const startPage = Math.max(1, currentPage - 2);
                  const endPage = Math.min(totalPages, startPage + 4);
                  pageNum = startPage + i;
                  if (pageNum > endPage) return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded-md border text-sm ${currentPage === pageNum ? "bg-indigo-600 text-white" : "bg-white text-gray-600"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              }).filter(Boolean)}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )} */}

        {/* Pagination Controls - Mobile Optimized */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Page info - stacked on mobile, side by side on larger screens */}
            <div className="text-sm text-gray-500 text-center sm:text-left w-full sm:w-auto">
              Showing {subCategories.length} of {totalItems} subcategories
            </div>

            {/* Pagination controls - simplified for mobile */}
            <div className="flex justify-center items-center gap-1 sm:gap-2 w-full sm:w-auto">
              {/* First page button - hidden on very small screens */}
              <button
                onClick={() => handlePageChange(0)}
                disabled={currentPage === 0}
                className="hidden sm:block px-2 sm:px-3 py-1 rounded-md border text-sm disabled:opacity-50"
                aria-label="First page"
              >
                First
              </button>

              {/* Previous button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-2 sm:px-3 py-1 rounded-md border text-sm disabled:opacity-50"
                aria-label="Previous page"
              >
                Prev
              </button>

              {/* Mobile-optimized page numbers */}
              <div className="flex items-center">
                {(() => {
                  // Calculate which page numbers to show based on screen size
                  let startPage = 0;
                  let endPage = totalPages - 1;
                  const maxVisible = window.innerWidth < 380 ? 3 : window.innerWidth < 640 ? 5 : 7;

                  if (totalPages > maxVisible) {
                    // Calculate start and end page to show a window around current page
                    const halfVisible = Math.floor(maxVisible / 2);
                    startPage = Math.max(0, currentPage - halfVisible);
                    endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);

                    // Adjust start if we're near the end
                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(0, endPage - maxVisible + 1);
                    }
                  }

                  // Create array of page numbers to display
                  const pageNumbers = [];
                  for (let i = startPage; i <= endPage; i++) {
                    pageNumbers.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`min-w-[32px] h-8 px-1 sm:px-3 py-1 rounded-md border text-sm ${currentPage === i ? "bg-indigo-600 text-white" : "bg-white text-gray-600"
                          }`}
                        aria-label={`Page ${i + 1}`}
                        aria-current={currentPage === i ? "page" : undefined}
                      >
                        {i + 1}
                      </button>
                    );
                  }

                  // Add ellipsis indicators if needed
                  if (startPage > 0) {
                    pageNumbers.unshift(
                      <span key="start-ellipsis" className="px-1 text-gray-500">
                        ...
                      </span>
                    );
                  }

                  if (endPage < totalPages - 1) {
                    pageNumbers.push(
                      <span key="end-ellipsis" className="px-1 text-gray-500">
                        ...
                      </span>
                    );
                  }

                  return pageNumbers;
                })()}
              </div>

              {/* Next button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="px-2 sm:px-3 py-1 rounded-md border text-sm disabled:opacity-50"
                aria-label="Next page"
              >
                Next
              </button>

              {/* Last page button - hidden on very small screens */}
              <button
                onClick={() => handlePageChange(totalPages - 1)}
                disabled={currentPage === totalPages - 1}
                className="hidden sm:block px-2 sm:px-3 py-1 rounded-md border text-sm disabled:opacity-50"
                aria-label="Last page"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Migrate Dialog */}
      {/* {showMigrateDialog && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setShowMigrateDialog(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-[600px] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowMigrateDialog(false)}
              className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Migrate Subcategories Data</h2>
              <p className="text-sm text-gray-500 mt-1">
                Export your current data or import new data
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FiDownload className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Export Data</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Download your current subcategories data as Excel file
                    </p>
                    <button
                      onClick={handleExportSubCategories}
                      disabled={isExporting}
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 ${
                        isExporting ? "cursor-not-allowed" : ""
                      }`}
                    >
                      {isExporting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Exporting...</span>
                        </div>
                      ) : (
                        <>
                          <FiDownload className="w-4 h-4 mr-2" />
                          Export Subcategories
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FiUpload className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Import Data</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Upload new subcategories data from Excel file
                    </p>
                    <label
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-green-600 text-white hover:bg-green-700 ${
                        isImporting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        disabled={isImporting}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          handleImportSubCategories(file);
                        }}
                      />
                      {isImporting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Importing...</span>
                        </div>
                      ) : (
                        "Choose File & Import"
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Important Notes</h4>
                <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
                  <li>Export your current data before importing new data</li>
                  <li>Make sure your import file follows the correct format</li>
                  <li>Only .xlsx or .xls files are supported</li>
                  <li>Maximum file size: 5MB</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Migrate Dialog - Mobile Responsive */}
      {showMigrateDialog && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"
          onClick={() => setShowMigrateDialog(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-[600px] max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowMigrateDialog(false)}
              className="absolute right-3 top-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>

            <div className="mb-6 pr-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Migrate Subcategories Data</h2>
              <p className="text-sm text-gray-500 mt-1">
                Export your current data or import new data
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                    <FiDownload className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Export Data</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Download your current subcategories data as Excel file
                    </p>
                    <button
                      onClick={handleExportSubCategories}
                      disabled={isExporting}
                      className={`inline-flex items-center px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 ${isExporting ? "cursor-not-allowed" : ""
                        }`}
                    >
                      {isExporting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Exporting...</span>
                        </div>
                      ) : (
                        <>
                          <FiDownload className="w-4 h-4 mr-2" />
                          <span className="hidden xs:inline">Export</span> Subcategories
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                    <FiUpload className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Import Data</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Upload new subcategories data from Excel file
                    </p>
                    <label
                      className={`inline-flex items-center px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-green-600 text-white hover:bg-green-700 ${isImporting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        }`}
                    >
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        disabled={isImporting}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          handleImportSubCategories(file);
                        }}
                      />
                      {isImporting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Importing...</span>
                        </div>
                      ) : (
                        <>
                          <FiUpload className="w-4 h-4 mr-2" />
                          Choose & Import
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 sm:p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Important Notes</h4>
                <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
                  <li>Export your current data before importing new data</li>
                  <li>Make sure your import file follows the correct format</li>
                  <li>Only .xlsx or .xls files are supported</li>
                  <li>Maximum file size: 5MB</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImportSubCategory;