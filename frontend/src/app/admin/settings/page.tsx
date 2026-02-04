'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import {
  Settings,
  Save,
  Bell,
  Mail,
  Shield,
  CreditCard,
  Truck,
  Percent,
  Globe,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PlatformSettings {
  siteName: string;
  siteEmail: string;
  supportPhone: string;
  defaultCommission: number;
  minOrderAmount: number;
  freeShippingThreshold: number;
  taxRate: number;
  maintenanceMode: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  orderConfirmation: boolean;
  vendorApprovalRequired: boolean;
  productApprovalRequired: boolean;
  maxImagesPerProduct: number;
  allowCOD: boolean;
  allowOnlinePayment: boolean;
  razorpayEnabled: boolean;
  autoApproveVendors: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    siteName: 'F2R Marketplace',
    siteEmail: 'support@f2r.com',
    supportPhone: '+91 1234567890',
    defaultCommission: 10,
    minOrderAmount: 100,
    freeShippingThreshold: 499,
    taxRate: 18,
    maintenanceMode: false,
    emailNotifications: true,
    smsNotifications: true,
    orderConfirmation: true,
    vendorApprovalRequired: true,
    productApprovalRequired: false,
    maxImagesPerProduct: 5,
    allowCOD: true,
    allowOnlinePayment: true,
    razorpayEnabled: true,
    autoApproveVendors: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await adminAPI.getSettings();
      if (response.data) {
        setSettings((prev) => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Use default settings if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateSettings(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof PlatformSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-500">Configure your marketplace settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold">General Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleChange('siteName', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Support Email
              </label>
              <input
                type="email"
                value={settings.siteEmail}
                onChange={(e) => handleChange('siteEmail', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Support Phone
              </label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={(e) => handleChange('supportPhone', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Maintenance Mode</p>
                <p className="text-sm text-gray-500">Temporarily disable the site</p>
              </div>
              <button
                onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
                className={`relative w-12 h-6 rounded-full transition ${
                  settings.maintenanceMode ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.maintenanceMode ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Commission & Fees */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Percent className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Commission & Fees</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Commission (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.defaultCommission}
                onChange={(e) => handleChange('defaultCommission', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">Platform commission for each sale</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.taxRate}
                onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Order Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={settings.minOrderAmount}
                onChange={(e) => handleChange('minOrderAmount', parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Shipping Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Shipping Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Free Shipping Threshold (₹)
              </label>
              <input
                type="number"
                min="0"
                value={settings.freeShippingThreshold}
                onChange={(e) => handleChange('freeShippingThreshold', parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">Orders above this amount get free shipping</p>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Payment Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Cash on Delivery</p>
                <p className="text-sm text-gray-500">Allow COD payment</p>
              </div>
              <button
                onClick={() => handleChange('allowCOD', !settings.allowCOD)}
                className={`relative w-12 h-6 rounded-full transition ${
                  settings.allowCOD ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.allowCOD ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Online Payment</p>
                <p className="text-sm text-gray-500">Allow online payments</p>
              </div>
              <button
                onClick={() => handleChange('allowOnlinePayment', !settings.allowOnlinePayment)}
                className={`relative w-12 h-6 rounded-full transition ${
                  settings.allowOnlinePayment ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.allowOnlinePayment ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Razorpay Integration</p>
                <p className="text-sm text-gray-500">Enable Razorpay payments</p>
              </div>
              <button
                onClick={() => handleChange('razorpayEnabled', !settings.razorpayEnabled)}
                className={`relative w-12 h-6 rounded-full transition ${
                  settings.razorpayEnabled ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.razorpayEnabled ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Vendor Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Vendor Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Vendor Approval Required</p>
                <p className="text-sm text-gray-500">New vendors need admin approval</p>
              </div>
              <button
                onClick={() => handleChange('vendorApprovalRequired', !settings.vendorApprovalRequired)}
                className={`relative w-12 h-6 rounded-full transition ${
                  settings.vendorApprovalRequired ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.vendorApprovalRequired ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Product Approval Required</p>
                <p className="text-sm text-gray-500">New products need admin approval</p>
              </div>
              <button
                onClick={() => handleChange('productApprovalRequired', !settings.productApprovalRequired)}
                className={`relative w-12 h-6 rounded-full transition ${
                  settings.productApprovalRequired ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.productApprovalRequired ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Images Per Product
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.maxImagesPerProduct}
                onChange={(e) => handleChange('maxImagesPerProduct', parseInt(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Notification Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Send email updates</p>
              </div>
              <button
                onClick={() => handleChange('emailNotifications', !settings.emailNotifications)}
                className={`relative w-12 h-6 rounded-full transition ${
                  settings.emailNotifications ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.emailNotifications ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">SMS Notifications</p>
                <p className="text-sm text-gray-500">Send SMS updates</p>
              </div>
              <button
                onClick={() => handleChange('smsNotifications', !settings.smsNotifications)}
                className={`relative w-12 h-6 rounded-full transition ${
                  settings.smsNotifications ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.smsNotifications ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Order Confirmation</p>
                <p className="text-sm text-gray-500">Auto-send order confirmations</p>
              </div>
              <button
                onClick={() => handleChange('orderConfirmation', !settings.orderConfirmation)}
                className={`relative w-12 h-6 rounded-full transition ${
                  settings.orderConfirmation ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.orderConfirmation ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
