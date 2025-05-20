import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiX, FiDownload, FiUpload } from "react-icons/fi";
import { storeService } from "../../services/storeService";
import ProductImportExport from "./ProductImportExport";

const BASE_URL = `${process.env.REACT_APP_API_URL}/store`;

const ProductList = () => {
  // State for products and pagination
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showImportExportDialog, setShowImportExportDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    leadProductType: "",
    productCategory: "",
    uom: ""
  });

  // State for filter options
  const [filterOptions, setFilterOptions] = useState({
    leadProductTypes: [],
    productCategories: [],
    uoms: ["Lot", "Mtrs", "Nos", "Set"]
  });

  // State for mobile filter visibility
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch products with filters and pagination
  const fetchProducts = async (page = 0, size = 10, search = "", filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await storeService.getProducts(page, size, search, filters);

      if (response && response.data) {
        setProducts(response.data.content || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.totalElements || 0);
        setCurrentPage(page);
      } else {
        setError("Invalid response format from server");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to fetch products: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      // Fetch lead product types
      const leadProductTypesResponse = await axios.get(`${BASE_URL}/getallleadproducttypes`, {
        headers: { "Content-Type": "application/json" }
      });

      // Fetch product categories
      const categoriesResponse = await storeService.getAllCategories();

      setFilterOptions({
        ...filterOptions,
        leadProductTypes: leadProductTypesResponse.data || [],
        productCategories: categoriesResponse || []
      });
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchProducts(currentPage, itemsPerPage, searchQuery, filters);
    fetchFilterOptions();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(0, itemsPerPage, searchQuery, filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    fetchProducts(0, itemsPerPage, searchQuery, newFilters);
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    fetchProducts(pageNumber, itemsPerPage, searchQuery, filters);
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      leadProductType: "",
      productCategory: "",
      uom: ""
    });
    fetchProducts(0, itemsPerPage, searchQuery, {
      leadProductType: "",
      productCategory: "",
      uom: ""
    });
  };

  // Handle import/export success
  const handleImportExportSuccess = () => {
    fetchProducts(currentPage, itemsPerPage, searchQuery, filters);
    setShowImportExportDialog(false);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-xl p-4 md:p-6 shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Products</h1>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowImportExportDialog(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:shadow-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 font-medium"
          >
            Import/Export Data
          </button>
        </div>

        {/* Mobile Filter Toggle */}
        <button
          className="md:hidden flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <FiFilter />
          {showMobileFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg flex items-center gap-3 border border-green-100">
          <span className="font-medium">{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 border border-red-100">
          <span className="font-medium">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <FiX />
          </button>
        </div>
      )}

      <div className=" grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 flex flex-col md:flex-row gap-6">
        {/* Filters - Desktop */}
        <div className="hidden md:block w-full bg-white rounded-xl shadow-sm p-4 min-w-[280px] max-w-[280px] hidden md:block w-full md:w-64 bg-white rounded-xl shadow-sm p-4">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-700 mb-3">Filters</h2>
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Reset all filters
            </button>
          </div>

          {/* Lead Product Type Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead Product Type
            </label>
            <select
              value={filters.leadProductType}
              onChange={(e) => handleFilterChange("leadProductType", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {filterOptions.leadProductTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Product Category Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Category
            </label>
            <select
              value={filters.productCategory}
              onChange={(e) => handleFilterChange("productCategory", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {filterOptions.productCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* UOM Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              UOM
            </label>
            <select
              value={filters.uom}
              onChange={(e) => handleFilterChange("uom", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {filterOptions.uoms.map((uom) => (
                <option key={uom} value={uom}>
                  {uom}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters - Mobile */}
        {showMobileFilters && (
          <div className="md:hidden w-full bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700">Filters</h2>
              <div className="flex gap-3">
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Reset all
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="text-gray-500"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Lead Product Type Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lead Product Type
              </label>
              <select
                value={filters.leadProductType}
                onChange={(e) => handleFilterChange("leadProductType", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {filterOptions.leadProductTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Category Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Category
              </label>
              <select
                value={filters.productCategory}
                onChange={(e) => handleFilterChange("productCategory", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {filterOptions.productCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* UOM Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UOM
              </label>
              <select
                value={filters.uom}
                onChange={(e) => handleFilterChange("uom", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All UOMs</option>
                {filterOptions.uoms.map((uom) => (
                  <option key={uom} value={uom}>
                    {uom}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Products List */}
        <div className="flex-1 min-w-0">
          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading && products.length === 0 ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                No products found matching your criteria
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[30%]">
                        Product Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                        UOM
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                        HSN Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]">
                        Category
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[300px]" title={product.productName}>
                            {product.productName}
                          </div>
                          <div
                            className="text-sm text-gray-500 overflow-hidden max-w-[300px] max-h-[40px]"
                            title={product.productDescription}
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {product.productDescription}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 truncate">{product.uom}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 truncate">{product.productQty}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 truncate">{product.hsnCode}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 truncate max-w-[200px]" title={product.leadProductTypeLabel || "N/A"}>
                            {product.leadProductTypeLabel || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-[200px]" title={product.categoryName || "N/A"}>
                            {product.categoryName || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-[200px]" title={product.subCategoryName || "N/A"}>
                            {product.subCategoryName || "N/A"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-700 mb-2 sm:mb-0">
                  Showing <span className="font-medium">{products.length}</span> of{" "}
                  <span className="font-medium">{totalItems}</span> products
                </div>
                <div className="flex justify-center items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => handlePageChange(0)}
                    disabled={currentPage === 0}
                    className="hidden sm:inline-flex items-center px-2 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Prev
                  </button>

                  {/* Page numbers */}
                  {(() => {
                    let startPage = 0;
                    let endPage = totalPages - 1;
                    const maxVisible = window.innerWidth < 640 ? 3 : 5;

                    if (totalPages > maxVisible) {
                      const halfVisible = Math.floor(maxVisible / 2);
                      startPage = Math.max(0, currentPage - halfVisible);
                      endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);

                      if (endPage - startPage + 1 < maxVisible) {
                        startPage = Math.max(0, endPage - maxVisible + 1);
                      }
                    }

                    const pageNumbers = [];
                    for (let i = startPage; i <= endPage; i++) {
                      pageNumbers.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`inline-flex items-center px-3 py-1 border ${currentPage === i
                            ? "border-blue-500 bg-blue-50 text-blue-600"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            } rounded-md text-sm font-medium`}
                        >
                          {i + 1}
                        </button>
                      );
                    }

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

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages - 1)}
                    disabled={currentPage === totalPages - 1}
                    className="hidden sm:inline-flex items-center px-2 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import/Export Dialog */}
      {showImportExportDialog && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"
          onClick={() => {
            // Simply close the dialog when clicking outside
            setShowImportExportDialog(false);
          }}
        >
          <ProductImportExport
            onClose={() => setShowImportExportDialog(false)}
            onSuccess={() => {
              setShowImportExportDialog(false);
              fetchProducts(currentPage, itemsPerPage, searchQuery, filters);
              setSuccessMessage("Products imported successfully!");
              setTimeout(() => setSuccessMessage(null), 5000);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ProductList;