"use client"

import { useState } from "react"
import { FiSearch, FiX, FiPackage } from "react-icons/fi"
import { motion } from "framer-motion"

function ProductBOQSelector({ availableProducts, leadProductTypes, onProductSelect, onClose }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLeadProductType, setSelectedLeadProductType] = useState("")
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productDetails, setProductDetails] = useState({
    qty: "",
    make: "",
    uom: "",
    leadProductTypeId: null,
  })

  /* const filteredProducts = availableProducts.filter((product) => {
    const matchesSearch =
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.hsn_code && product.hsn_code.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filter by lead product type if selected
    const matchesLeadProductType =
      !selectedLeadProductType ||
      (product.categoryId &&
        product.categoryId.productCategory &&
        product.categoryId.productCategory.leadProductType &&
        product.categoryId.productCategory.leadProductType.id.toString() === selectedLeadProductType)

    return matchesSearch && matchesLeadProductType
  }) */
  
  const filteredProducts = availableProducts;

  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setProductDetails((prev) => ({
      ...prev,
      uom: product.uom || "",
      leadProductTypeId:
        selectedLeadProductType || product.categoryId?.productCategory?.leadProductType?.id?.toString() || null,
    }))
  }

  const handleAddProduct = () => {
    if (!selectedProduct || !productDetails.qty) {
      alert("Please select a product and enter quantity")
      return
    }

    const productToAdd = {
      ...selectedProduct,
      qty: Number.parseInt(productDetails.qty) || 0,
      make: productDetails.make,
      uom: productDetails.uom,
      leadProductTypeId: productDetails.leadProductTypeId,
      // Include the full lead product type object
      /* leadProductType: productDetails.leadProductTypeId
        ? leadProductTypes.find((type) => type.id.toString() === productDetails.leadProductTypeId)
        : null, */
    }

    onProductSelect(productToAdd)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-xl font-bold text-blue-600">Add New Billable Product</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/50 transition-colors">
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Product Selection */}
            <div className="flex flex-col h-full">
              <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                <FiPackage className="text-blue-600" />
                Select Product
              </h4>

              {/* Lead Product Type Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Lead Product Type</label>
                <select
                  value={selectedLeadProductType}
                  onChange={(e) => {
                    setSelectedLeadProductType(e.target.value)
                    setSelectedProduct(null) // Reset selection when filter changes
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Product Types</option>
                  {leadProductTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search products by name or HSN code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Product List - Fixed height with proper scrolling */}
              <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden bg-white">
                <div className="h-full overflow-y-auto">
                  <div className="divide-y divide-gray-200">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleProductSelect(product)}
                          className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                            selectedProduct?.id === product.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{product.product_name}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                HSN: {product.hsn_code || "N/A"} | UOM: {product.uom || "N/A"}
                              </div>
                              {product.product_description && (
                                <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                                  {product.product_description}
                                </div>
                              )}
                              {product.categoryId?.productCategory?.leadProductType && (
                                <div className="text-xs text-blue-600 mt-1 bg-blue-100 px-2 py-1 rounded inline-block">
                                  {product.categoryId.productCategory.leadProductType.label}
                                </div>
                              )}
                            </div>
                            <div className="ml-3 flex-shrink-0">
                              <FiPackage className="text-gray-400" size={16} />
                              {selectedProduct?.id === product.id && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 ml-2"></div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <FiPackage size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">No products found</p>
                        <p className="text-sm">
                          {searchTerm
                            ? "Try adjusting your search criteria or filters"
                            : "No products are available"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Results count */}
              <div className="mt-2 text-sm text-gray-500">
                Showing {filteredProducts.length} of {availableProducts.length} products
                {selectedLeadProductType}
              </div>
            </div>

            {/* Product Details */}
            <div className="flex flex-col h-full">
              <h4 className="font-medium text-gray-800 mb-4">Product Configuration</h4>

              {selectedProduct ? (
                <div className="space-y-6 flex-1">
                  {/* Selected Product Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                      <FiPackage className="text-blue-600" />
                      Selected Product
                    </h5>
                    <div className="space-y-2">
                      <div className="font-medium text-gray-900">{selectedProduct.product_name}</div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">HSN:</span> {selectedProduct.hsn_code || "N/A"}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Default UOM:</span> {selectedProduct.uom || "N/A"}
                      </div>
                      {selectedProduct.product_description && (
                        <div className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Description:</span>
                          <p className="mt-1">{selectedProduct.product_description}</p>
                        </div>
                      )}
                      {selectedProduct.categoryId?.productCategory?.leadProductType && (
                        <div className="text-sm">
                          <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {selectedProduct.categoryId.productCategory.leadProductType.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Configuration */}
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={productDetails.qty}
                        onChange={(e) => setProductDetails((prev) => ({ ...prev, qty: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter quantity"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                      <input
                        type="text"
                        value={productDetails.make}
                        onChange={(e) => setProductDetails((prev) => ({ ...prev, make: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter make (optional)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit of Measurement</label>
                      <input
                        type="text"
                        value={productDetails.uom}
                        onChange={(e) => setProductDetails((prev) => ({ ...prev, uom: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter UOM"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lead Product Type</label>
                      <select
                        value={productDetails.leadProductTypeId || ""}
                        onChange={(e) =>
                          setProductDetails((prev) => ({ ...prev, leadProductTypeId: e.target.value || null }))
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Lead Product Type</option>
                        {leadProductTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center text-gray-500 bg-gray-50 rounded-lg">
                  <div>
                    <FiPackage size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Select a Product</p>
                    <p className="text-sm">Choose a product from the list to configure its details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {selectedProduct ? (
              <span className="text-green-600 font-medium">✓ Product selected</span>
            ) : (
              "Please select a product and enter quantity"
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddProduct}
              disabled={!selectedProduct || !productDetails.qty}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiPackage size={16} />
              Add Product to BOQ
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ProductBOQSelector
