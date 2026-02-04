'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { Image, Plus, Edit, Trash2, XCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  link?: string;
  position: number;
  isActive: boolean;
  createdAt: string;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    link: '',
    position: '1',
    isActive: true,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await adminAPI.getBanners();
      setBanners(response.data.banners || response.data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        title: formData.title,
        subtitle: formData.subtitle || undefined,
        imageUrl: formData.imageUrl,
        link: formData.link || undefined,
        position: parseInt(formData.position),
        isActive: formData.isActive,
      };

      if (editingBanner) {
        await adminAPI.updateBanner(editingBanner._id, data);
        toast.success('Banner updated successfully');
      } else {
        await adminAPI.createBanner(data);
        toast.success('Banner created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchBanners();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save banner');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await adminAPI.deleteBanner(id);
      toast.success('Banner deleted successfully');
      fetchBanners();
    } catch (error) {
      toast.error('Failed to delete banner');
    }
  };

  const toggleBannerStatus = async (banner: Banner) => {
    try {
      await adminAPI.updateBanner(banner._id, { isActive: !banner.isActive });
      toast.success(`Banner ${banner.isActive ? 'deactivated' : 'activated'}`);
      fetchBanners();
    } catch (error) {
      toast.error('Failed to update banner status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      imageUrl: '',
      link: '',
      position: '1',
      isActive: true,
    });
    setEditingBanner(null);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl,
      link: banner.link || '',
      position: banner.position.toString(),
      isActive: banner.isActive,
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
          <p className="text-gray-500">Manage homepage promotional banners</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <Plus className="w-5 h-5" />
          Add Banner
        </button>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
          </div>
        ) : banners.length > 0 ? (
          banners
            .sort((a, b) => a.position - b.position)
            .map((banner) => (
              <div
                key={banner._id}
                className={`bg-white rounded-xl shadow-sm overflow-hidden ${
                  !banner.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="relative h-48">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://via.placeholder.com/800x400?text=Banner+Image';
                    }}
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                    Position: {banner.position}
                  </div>
                  {!banner.isActive && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
                      Inactive
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{banner.title}</h3>
                  {banner.subtitle && (
                    <p className="text-sm text-gray-500 mt-1">{banner.subtitle}</p>
                  )}
                  {banner.link && (
                    <p className="text-xs text-blue-500 mt-1 truncate">{banner.link}</p>
                  )}
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => toggleBannerStatus(banner)}
                      className={`p-2 rounded-lg ${
                        banner.isActive
                          ? 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'
                          : 'text-green-500 hover:bg-green-50'
                      }`}
                      title={banner.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {banner.isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => openEditModal(banner)}
                      className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(banner._id)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-xl">
            <Image className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No banners found</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-orange-500 hover:underline"
            >
              Add your first banner
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
                  {editingBanner ? 'Edit Banner' : 'Add Banner'}
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
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="New Arrivals"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtitle (optional)
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="Discover the latest collection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="https://example.com/banner.jpg"
                  required
                />
                {formData.imageUrl && (
                  <div className="mt-2 h-32 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://via.placeholder.com/800x400?text=Invalid+URL';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link (optional)
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="/products?category=sneakers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Lower number = Higher priority</p>
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
                  {editingBanner ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
