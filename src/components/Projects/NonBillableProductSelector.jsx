"use client"

import { useState, useEffect } from "react"
import { storeService } from "../../services/storeService"

const NonBillableProductSelector = ({ isOpen, onClose, onSave, selectedProducts = [], projectId, currentUserId }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItems, setSelectedItems] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadProducts()
      setSelectedItems(selectedProducts.map((p) => p.id))
    }
  }, [isOpen, selectedProducts])

  const loadProducts = async (searchQuery = "", pageNum = 0) => {
    try {
      setLoading(true)
      console.log("[v0] Loading non-billable products with search:", searchQuery, "page:", pageNum)

      const response = await storeService.getProducts(pageNum, 20, searchQuery, {
        leadProductType: "nonBillable",
      })
      console.log("[v0] Non-billable products API response:", response)

      let productsData = []
      let isLastPage = true

      if (response && response.data && response.data.content) {
        productsData = response.data.content
        isLastPage = response.data.last
      } else if (response && Array.isArray(response.data)) {
        productsData = response.data
        isLastPage = true // Assume no pagination if it's just an array
      } else if (Array.isArray(response)) {
        productsData = response
        isLastPage = true
      } else if (response && Array.isArray(response.products)) {
        productsData = response.products
        isLastPage = true
      }

      console.log("[v0] Processed non-billable products data:", productsData)

      if (pageNum === 0) {
        setProducts(productsData)
      } else {
        setProducts((prev) => [...prev, ...productsData])
      }

      setHasMore(!isLastPage)
      setPage(pageNum)
    } catch (error) {
      console.error("[v0] Error loading non-billable products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setPage(0)
    loadProducts(value, 0)
  }

  const handleProductSelect = (productId) => {
    setSelectedItems((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
  }

  const handleSave = () => {
    const selectedProductsData = products.filter((p) => selectedItems.includes(p.id))
    const formattedProducts = selectedProductsData.map((product) => ({
      id: product.id,
      product_name: product.productName,
      product_code: product.itemCode,
      uom: product.uom,
      quantity: 1,
      rate: product.rate || 0,
      categoryType: "nonBillable",
      pmApprovalStatus: "PENDING",
      pmApprovalDate: null,
      pmApprovalRemarks: "",
    }))

    onSave(formattedProducts)
    onClose()
  }

  const loadMore = () => {
    loadProducts(searchTerm, page + 1)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Select Non-Billable Products</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search non-billable products..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="overflow-y-auto max-h-96 mb-4">
          {loading && page === 0 ? (
            <div className="text-center py-4">Loading products...</div>
          ) : (
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedItems.includes(product.id)
                      ? "bg-orange-50 border-orange-300"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => handleProductSelect(product.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{product.productName}</div>
                      <div className="text-sm text-gray-600">
                        Code: {product.itemCode} | UOM: {product.uom} | HSN: {product.hsnCode}
                      </div>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(product.id)}
                        onChange={() => handleProductSelect(product.id)}
                        className="w-4 h-4 text-orange-600"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            disabled={selectedItems.length === 0}
          >
            Save Selection ({selectedItems.length})
          </button>
        </div>
      </div>
    </div>
  )
}

export default NonBillableProductSelector