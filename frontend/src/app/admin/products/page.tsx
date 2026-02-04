'use client';

import { useEffect, useState } from 'react';
import { adminAPI, productAPI } from '@/lib/api';
import {
  Package,
  Search,
  Eye,
  Ban,
  CheckCircle,
  Star,
  TrendingUp,
  Filter,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category: string;
  brand?: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  vendor: {
    _id: string;
    businessName: string;
  };
  ratings: {
    average: number;
    count: number;
  };
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [filter, page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 12 };
      if (filter === 'featured') params.isFeatured = true;
      if (filter === 'inactive') params.isActive = false;
      if (filter === 'lowstock') params.stock = { $lt: 10 };

      const response = await adminAPI.getAllProducts(params);
      setProducts(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      await adminAPI.updateProduct(productId, { isActive: !currentStatus });
      toast.success(`Product ${currentStatus ? 'deactivated' : 'activated'}`);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update product status');
    }
  };

  const handleToggleFeatured = async (productId: string, currentStatus: boolean) => {
    try {
      await adminAPI.updateProduct(productId, { isFeatured: !currentStatus });
      toast.success(`Product ${currentStatus ? 'removed from' : 'added to'} featured`);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.vendor?.businessName.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-500">View and manage all marketplace products</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'featured', 'inactive', 'lowstock'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg capitalize transition ${
                  filter === status
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'lowstock' ? 'Low Stock' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
          </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div
              key={product._id}
              className={`bg-white rounded-xl shadow-sm overflow-hidden ${
                !product.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="relative h-48">
                <img
                  src={product.images[0] || 'https://via.placeholder.com/300x200?text=No+Image'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
                {product.isFeatured && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Featured
                  </div>
                )}
                {!product.isActive && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
                    Inactive
                  </div>
                )}
                {product.stock < 10 && product.stock > 0 && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded">
                    Low Stock: {product.stock}
                  </div>
                )}
                {product.stock === 0 && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
                    Out of Stock
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                <p className="text-sm text-gray-500 truncate">{product.vendor?.businessName}</p>
                <div className="flex items-center gap-2 mt-2">
                  {product.discountPrice ? (
                    <>
                      <span className="font-bold text-orange-500">
                        {formatCurrency(product.discountPrice)}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        {formatCurrency(product.price)}
                      </span>
                    </>
                  ) : (
                    <span className="font-bold text-gray-900">{formatCurrency(product.price)}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>{product.ratings?.average?.toFixed(1) || '0.0'}</span>
                  <span>({product.ratings?.count || 0})</span>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowModal(true);
                    }}
                    className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg"
                    title="View details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleToggleFeatured(product._id, product.isFeatured)}
                    className={`p-2 rounded-lg ${
                      product.isFeatured
                        ? 'text-orange-500 hover:bg-orange-50'
                        : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'
                    }`}
                    title={product.isFeatured ? 'Remove from featured' : 'Add to featured'}
                  >
                    <TrendingUp className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(product._id, product.isActive)}
                    className={`p-2 rounded-lg ${
                      product.isActive
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-green-500 hover:bg-green-50'
                    }`}
                    title={product.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {product.isActive ? <Ban className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-xl">
            <Package className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Product Details Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Product Details</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedProduct(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex gap-4">
                <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={selectedProduct.images[0] || 'https://via.placeholder.com/150'}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedProduct.name}</h3>
                  <p className="text-gray-500">{selectedProduct.vendor?.businessName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {selectedProduct.isFeatured && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        Featured
                      </span>
                    )}
                    {selectedProduct.isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">{formatCurrency(selectedProduct.price)}</p>
                </div>
                {selectedProduct.discountPrice && (
                  <div>
                    <p className="text-sm text-gray-500">Discount Price</p>
                    <p className="font-medium text-orange-500">
                      {formatCurrency(selectedProduct.discountPrice)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{selectedProduct.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Brand</p>
                  <p className="font-medium">{selectedProduct.brand || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stock</p>
                  <p className={`font-medium ${selectedProduct.stock < 10 ? 'text-red-500' : ''}`}>
                    {selectedProduct.stock} units
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="font-medium flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    {selectedProduct.ratings?.average?.toFixed(1) || '0.0'} (
                    {selectedProduct.ratings?.count || 0} reviews)
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-700">{selectedProduct.description}</p>
              </div>

              <div className="border-t pt-4 flex gap-3">
                <button
                  onClick={() => {
                    handleToggleFeatured(selectedProduct._id, selectedProduct.isFeatured);
                    setShowModal(false);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    selectedProduct.isFeatured
                      ? 'border-orange-500 text-orange-500 hover:bg-orange-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {selectedProduct.isFeatured ? 'Remove from Featured' : 'Add to Featured'}
                </button>
                <button
                  onClick={() => {
                    handleToggleActive(selectedProduct._id, selectedProduct.isActive);
                    setShowModal(false);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    selectedProduct.isActive
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {selectedProduct.isActive ? 'Deactivate Product' : 'Activate Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
