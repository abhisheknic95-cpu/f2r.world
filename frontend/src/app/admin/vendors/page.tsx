'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import {
  Store,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Eye,
  Ban,
  Check,
  Percent,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Vendor {
  _id: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  gstin: string;
  panNumber: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  commissionRate: number;
  isActive: boolean;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  createdAt: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [commissionInput, setCommissionInput] = useState('');

  useEffect(() => {
    fetchVendors();
  }, [filter]);

  const fetchVendors = async () => {
    try {
      const params: any = {};
      if (filter !== 'all') params.status = filter;
      const response = await adminAPI.getVendors(params);
      setVendors(response.data.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (vendorId: string, approve: boolean) => {
    try {
      await adminAPI.approveVendor(vendorId, approve);
      toast.success(approve ? 'Vendor approved successfully' : 'Vendor rejected');
      fetchVendors();
    } catch (error) {
      toast.error('Failed to update vendor status');
    }
  };

  const handleToggleStatus = async (vendorId: string) => {
    try {
      await adminAPI.toggleVendorStatus(vendorId);
      toast.success('Vendor status updated');
      fetchVendors();
    } catch (error) {
      toast.error('Failed to toggle vendor status');
    }
  };

  const handleUpdateCommission = async (vendorId: string) => {
    const commission = parseFloat(commissionInput);
    if (isNaN(commission) || commission < 0 || commission > 100) {
      toast.error('Please enter a valid commission rate (0-100)');
      return;
    }
    try {
      await adminAPI.updateCommission(vendorId, commission);
      toast.success('Commission rate updated');
      setShowModal(false);
      setCommissionInput('');
      fetchVendors();
    } catch (error) {
      toast.error('Failed to update commission');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Rejected</span>;
      case 'suspended':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Suspended</span>;
      default:
        return null;
    }
  };

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.businessName.toLowerCase().includes(search.toLowerCase()) ||
      vendor.user?.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-500">Manage and approve vendor registrations</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected', 'suspended'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg capitalize transition ${
                  filter === status
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
          </div>
        ) : filteredVendors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Store className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{vendor.businessName}</p>
                          <p className="text-sm text-gray-500">GSTIN: {vendor.gstin || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{vendor.user?.name}</p>
                      <p className="text-sm text-gray-500">{vendor.user?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(vendor.status)}
                      {vendor.status === 'approved' && !vendor.isActive && (
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{vendor.commissionRate}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setShowModal(true);
                          }}
                          className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg"
                          title="View details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {vendor.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(vendor._id, true)}
                              className="p-2 text-green-500 hover:bg-green-50 rounded-lg"
                              title="Approve"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleApprove(vendor._id, false)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {vendor.status === 'approved' && (
                          <button
                            onClick={() => handleToggleStatus(vendor._id)}
                            className={`p-2 rounded-lg ${
                              vendor.isActive
                                ? 'text-red-500 hover:bg-red-50'
                                : 'text-green-500 hover:bg-green-50'
                            }`}
                            title={vendor.isActive ? 'Disable' : 'Enable'}
                          >
                            {vendor.isActive ? <Ban className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Store className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No vendors found</p>
          </div>
        )}
      </div>

      {/* Vendor Details Modal */}
      {showModal && selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Vendor Details</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedVendor(null);
                    setCommissionInput('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Business Name</p>
                  <p className="font-medium">{selectedVendor.businessName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(selectedVendor.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business Email</p>
                  <p className="font-medium">{selectedVendor.businessEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business Phone</p>
                  <p className="font-medium">{selectedVendor.businessPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">GSTIN</p>
                  <p className="font-medium">{selectedVendor.gstin || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">PAN Number</p>
                  <p className="font-medium">{selectedVendor.panNumber || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Address</p>
                <p className="font-medium">
                  {selectedVendor.address?.street}, {selectedVendor.address?.city},{' '}
                  {selectedVendor.address?.state} - {selectedVendor.address?.pincode}
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-1">Owner Details</p>
                <p className="font-medium">{selectedVendor.user?.name}</p>
                <p className="text-sm text-gray-600">{selectedVendor.user?.email}</p>
                <p className="text-sm text-gray-600">{selectedVendor.user?.phone}</p>
              </div>

              {selectedVendor.status === 'approved' && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-2">Commission Rate</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={commissionInput}
                        onChange={(e) => setCommissionInput(e.target.value)}
                        placeholder={selectedVendor.commissionRate.toString()}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <button
                      onClick={() => handleUpdateCommission(selectedVendor._id)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                    >
                      Update
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
