'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { productAPI } from '@/lib/api';
import { categories, sizes, colors } from '@/lib/utils';
import ImageUploader from '@/components/upload/ImageUploader';
import VideoUploader from '@/components/upload/VideoUploader';
import {
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  AlertCircle,
} from 'lucide-react';

interface Variant {
  size: string;
  color: string;
  stock: number;
  sku: string;
}

interface ProductForm {
  name: string;
  description: string;
  category: string;
  brand: string;
  gender: 'men' | 'women' | 'kids' | 'unisex';
  mrp: number;
  sellingPrice: number;
  vendorDiscount: number;
  images: string[];
  video: string | null;
  variants: Variant[];
  upperMaterial: string;
  soleMaterial: string;
  warranty: string;
  usp: string;
  technology: string;
  tags: string;
}

const initialForm: ProductForm = {
  name: '',
  description: '',
  category: '',
  brand: '',
  gender: 'men',
  mrp: 0,
  sellingPrice: 0,
  vendorDiscount: 0,
  images: [],
  video: null,
  variants: [{ size: '', color: '', stock: 0, sku: '' }],
  upperMaterial: '',
  soleMaterial: '',
  warranty: '',
  usp: '',
  technology: '',
  tags: '',
};

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateForm = (field: keyof ProductForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const newVariants = [...form.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    updateForm('variants', newVariants);
  };

  const addVariant = () => {
    updateForm('variants', [...form.variants, { size: '', color: '', stock: 0, sku: '' }]);
  };

  const removeVariant = (index: number) => {
    if (form.variants.length > 1) {
      const newVariants = form.variants.filter((_, i) => i !== index);
      updateForm('variants', newVariants);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = 'Product name is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.category) newErrors.category = 'Category is required';
    if (form.mrp <= 0) newErrors.mrp = 'MRP must be greater than 0';
    if (form.sellingPrice <= 0) newErrors.sellingPrice = 'Selling price must be greater than 0';
    if (form.sellingPrice > form.mrp) newErrors.sellingPrice = 'Selling price cannot exceed MRP';
    if (form.images.length < 3) newErrors.images = 'At least 3 images are required';

    // Validate variants
    const validVariants = form.variants.filter(
      (v) => v.size && v.color && v.stock >= 0 && v.sku
    );
    if (validVariants.length === 0) {
      newErrors.variants = 'At least one complete variant is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    try {
      setLoading(true);

      // Filter out incomplete variants
      const validVariants = form.variants.filter(
        (v) => v.size && v.color && v.stock >= 0 && v.sku
      );

      const productData = {
        name: form.name,
        description: form.description,
        category: form.category,
        brand: form.brand || undefined,
        gender: form.gender,
        mrp: form.mrp,
        sellingPrice: form.sellingPrice,
        vendorDiscount: form.vendorDiscount,
        images: form.images,
        video: form.video || undefined,
        variants: validVariants,
        upperMaterial: form.upperMaterial || undefined,
        soleMaterial: form.soleMaterial || undefined,
        warranty: form.warranty || undefined,
        usp: form.usp || undefined,
        technology: form.technology || undefined,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      await productAPI.createProduct(productData);
      router.push('/seller/products');
    } catch (error: any) {
      console.error('Failed to create product:', error);
      setSubmitError(
        error.response?.data?.message || 'Failed to create product. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Add New Product
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Fill in the details to list your product
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 dark:text-red-400 font-medium">Error</p>
            <p className="text-red-600 dark:text-red-300 text-sm">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.name
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g., Nike Air Max Running Shoes"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.description
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Describe your product..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Category, Brand, Gender */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => updateForm('category', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.category
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => updateForm('brand', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Nike"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gender *
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => updateForm('gender', e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="kids">Kids</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Media Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Product Images & Video
          </h2>

          <div className="space-y-6">
            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Images * (minimum 3)
              </label>
              <ImageUploader
                images={form.images}
                onChange={(urls) => updateForm('images', urls)}
                minImages={3}
                maxImages={8}
                disabled={uploading || loading}
                onUploadStart={() => setUploading(true)}
                onUploadEnd={() => setUploading(false)}
              />
              {errors.images && (
                <p className="mt-2 text-sm text-red-500">{errors.images}</p>
              )}
            </div>

            {/* Video */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Video (optional)
              </label>
              <VideoUploader
                video={form.video}
                onChange={(url) => updateForm('video', url)}
                disabled={uploading || loading}
                onUploadStart={() => setUploading(true)}
                onUploadEnd={() => setUploading(false)}
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pricing
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                MRP (INR) *
              </label>
              <input
                type="number"
                value={form.mrp || ''}
                onChange={(e) => updateForm('mrp', Number(e.target.value))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.mrp
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="1999"
                min="0"
              />
              {errors.mrp && (
                <p className="mt-1 text-sm text-red-500">{errors.mrp}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Selling Price (INR) *
              </label>
              <input
                type="number"
                value={form.sellingPrice || ''}
                onChange={(e) => updateForm('sellingPrice', Number(e.target.value))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.sellingPrice
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="1499"
                min="0"
              />
              {errors.sellingPrice && (
                <p className="mt-1 text-sm text-red-500">{errors.sellingPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vendor Discount (%)
              </label>
              <input
                type="number"
                value={form.vendorDiscount || ''}
                onChange={(e) => updateForm('vendorDiscount', Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="0"
                min="0"
                max="100"
              />
            </div>
          </div>

          {form.mrp > 0 && form.sellingPrice > 0 && form.sellingPrice <= form.mrp && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-400">
                Customer saves{' '}
                <strong>
                  {Math.round(((form.mrp - form.sellingPrice) / form.mrp) * 100)}%
                </strong>{' '}
                (₹{form.mrp - form.sellingPrice})
              </p>
            </div>
          )}
        </div>

        {/* Variants */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Variants (Size/Color/Stock)
            </h2>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600"
            >
              <Plus className="w-4 h-4" />
              Add Variant
            </button>
          </div>

          {errors.variants && (
            <p className="mb-4 text-sm text-red-500">{errors.variants}</p>
          )}

          <div className="space-y-4">
            {form.variants.map((variant, index) => (
              <div
                key={index}
                className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Size
                  </label>
                  <select
                    value={variant.size}
                    onChange={(e) => updateVariant(index, 'size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select</option>
                    {sizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Color
                  </label>
                  <select
                    value={variant.color}
                    onChange={(e) => updateVariant(index, 'color', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select</option>
                    {colors.map((color) => (
                      <option key={color.name} value={color.name}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={variant.stock || ''}
                    onChange={(e) =>
                      updateVariant(index, 'stock', Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={variant.sku}
                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="SKU-001"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    disabled={form.variants.length === 1}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Additional Details (Optional)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Upper Material
              </label>
              <input
                type="text"
                value={form.upperMaterial}
                onChange={(e) => updateForm('upperMaterial', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Mesh, Leather"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sole Material
              </label>
              <input
                type="text"
                value={form.soleMaterial}
                onChange={(e) => updateForm('soleMaterial', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Rubber, EVA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Warranty
              </label>
              <input
                type="text"
                value={form.warranty}
                onChange={(e) => updateForm('warranty', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 6 months"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Technology
              </label>
              <input
                type="text"
                value={form.technology}
                onChange={(e) => updateForm('technology', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Air Cushion, Flyknit"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                USP (Unique Selling Point)
              </label>
              <input
                type="text"
                value={form.usp}
                onChange={(e) => updateForm('usp', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="What makes this product special?"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => updateForm('tags', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="running, sports, comfortable"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
