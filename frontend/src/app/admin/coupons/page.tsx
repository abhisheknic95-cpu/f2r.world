'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  XCircle,
  Percent,
  IndianRupee,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscount: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    isActive: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await adminAPI.getCoupons();
      setCoupons(response.data.coupons || response.data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        code: formData.code.toUpperCase(),
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
        usageLimit: parseInt(formData.usageLimit) || 0,
        isActive: formData.isActive,
      };

      if (editingCoupon) {
        await adminAPI.updateCoupon(editingCoupon._id, data);
        toast.success('Coupon updated successfully');
      } else {
        await adminAPI.createCoupon(data);
        toast.success('Coupon created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await adminAPI.deleteCoupon(id);
      toast.success('Coupon deleted successfully');
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderAmount: '',
      maxDiscount: '',
      validFrom: '',
      validUntil: '',
      usageLimit: '',
      isActive: true,
    });
    setEditingCoupon(null);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minOrderAmount: coupon.minOrderAmount.toString(),
      maxDiscount: coupon.maxDiscount?.toString() || '',
      validFrom: coupon.validFrom.split('T')[0],
      validUntil: coupon.validUntil.split('T')[0],
      usageLimit: coupon.usageLimit.toString(),
      isActive: coupon.isActive,
    });
    setShowModal(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isExpired = (date: string) => new Date(date) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-500">Create and manage discount coupons</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <Plus className="w-5 h-5" />
          Create Coupon
        </button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
          </div>
        ) : coupons.length > 0 ? (
          coupons.map((coupon) => (
            <div
              key={coupon._id}
              className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
                coupon.isActive && !isExpired(coupon.validUntil)
                  ? 'border-green-500'
                  : 'border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-orange-500" />
                    <span className="font-bold text-lg">{coupon.code}</span>
                  </div>
                  {!coupon.isActive && (
                    <span className="text-xs text-red-500">Inactive</span>
                  )}
                  {isExpired(coupon.validUntil) && (
                    <span className="text-xs text-red-500">Expired</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(coupon)}
                    className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(coupon._id)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {coupon.discountType === 'percentage' ? (
                    <Percent className="w-4 h-4 text-gray-400" />
                  ) : (
                    <IndianRupee className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-gray-600">
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}% off`
                      : `₹${coupon.discountValue} off`}
                    {coupon.maxDiscount && ` (Max ₹${coupon.maxDiscount})`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Min order: ₹{coupon.minOrderAmount}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}
                  </span>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Usage</span>
                    <span>
                      {coupon.usedCount} / {coupon.usageLimit === 0 ? 'Unlimited' : coupon.usageLimit}
                    </span>
                  </div>
                  {coupon.usageLimit > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((coupon.usedCount / coupon.usageLimit) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-xl">
            <Tag className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No coupons found</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-orange-500 hover:underline"
            >
              Create your first coupon
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500 uppercase"
                  placeholder="SAVE20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                    placeholder={formData.discountType === 'percentage' ? '20' : '100'}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Order Amount
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Discount (optional)
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                    placeholder="200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usage Limit (0 for unlimited)
                </label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="100"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  {editingCoupon ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
