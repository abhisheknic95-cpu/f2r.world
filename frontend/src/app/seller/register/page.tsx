'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, vendorAPI } from '@/lib/api';
import useStore from '@/store/useStore';
import { indianStates } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Loader2, Store, ArrowRight, Check } from 'lucide-react';

export default function SellerRegisterPage() {
  const router = useRouter();
  const { isAuthenticated, setUser, setToken } = useStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Account Details
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // Step 2: Business Details
  const [businessData, setBusinessData] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    gstin: '',
    panNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

  // Step 3: Bank Details
  const [bankData, setBankData] = useState({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
  });

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (accountData.password !== accountData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!isAuthenticated) {
      setLoading(true);
      try {
        const response = await authAPI.registerSeller({
          name: accountData.name,
          email: accountData.email,
          phone: accountData.phone,
          password: accountData.password,
        });
        setToken(response.data.token);
        setUser(response.data.user);
        toast.success('Account created!');
        setStep(2);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    } else {
      setStep(2);
    }
  };

  const handleBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (bankData.accountNumber !== bankData.confirmAccountNumber) {
      toast.error('Account numbers do not match');
      return;
    }

    setLoading(true);
    try {
      await vendorAPI.register({
        ...businessData,
        bankDetails: {
          accountHolderName: bankData.accountHolderName,
          accountNumber: bankData.accountNumber,
          ifscCode: bankData.ifscCode,
          bankName: bankData.bankName,
        },
      });
      toast.success('Registration submitted! We will review and approve your account.');
      router.push('/seller');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Become a Seller on F2R</h1>
            <p className="text-gray-500 mt-2">
              Start selling your footwear to millions of customers
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    step > s
                      ? 'bg-green-500 text-white'
                      : step === s
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-20 h-1 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Forms */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            {/* Step 1: Account Details */}
            {step === 1 && (
              <form onSubmit={handleAccountSubmit}>
                <h2 className="text-xl font-semibold mb-6">Account Details</h2>

                {isAuthenticated ? (
                  <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">
                    <p>You're already logged in. Continue to business details.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name</label>
                      <input
                        type="text"
                        value={accountData.name}
                        onChange={(e) =>
                          setAccountData({ ...accountData, name: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={accountData.email}
                        onChange={(e) =>
                          setAccountData({ ...accountData, email: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={accountData.phone}
                        onChange={(e) =>
                          setAccountData({ ...accountData, phone: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Password</label>
                      <input
                        type="password"
                        value={accountData.password}
                        onChange={(e) =>
                          setAccountData({ ...accountData, password: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                        required
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Confirm Password</label>
                      <input
                        type="password"
                        value={accountData.confirmPassword}
                        onChange={(e) =>
                          setAccountData({ ...accountData, confirmPassword: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Business Details */}
            {step === 2 && (
              <form onSubmit={handleBusinessSubmit}>
                <h2 className="text-xl font-semibold mb-6">Business Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Business Name</label>
                    <input
                      type="text"
                      value={businessData.businessName}
                      onChange={(e) =>
                        setBusinessData({ ...businessData, businessName: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Business Email</label>
                      <input
                        type="email"
                        value={businessData.businessEmail}
                        onChange={(e) =>
                          setBusinessData({ ...businessData, businessEmail: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Business Phone</label>
                      <input
                        type="tel"
                        value={businessData.businessPhone}
                        onChange={(e) =>
                          setBusinessData({ ...businessData, businessPhone: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">GSTIN (Optional)</label>
                      <input
                        type="text"
                        value={businessData.gstin}
                        onChange={(e) =>
                          setBusinessData({ ...businessData, gstin: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">PAN Number</label>
                      <input
                        type="text"
                        value={businessData.panNumber}
                        onChange={(e) =>
                          setBusinessData({ ...businessData, panNumber: e.target.value.toUpperCase() })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                        required
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Business Address</label>
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={businessData.address.street}
                      onChange={(e) =>
                        setBusinessData({
                          ...businessData,
                          address: { ...businessData.address, street: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500 mb-2"
                      required
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="City"
                        value={businessData.address.city}
                        onChange={(e) =>
                          setBusinessData({
                            ...businessData,
                            address: { ...businessData.address, city: e.target.value },
                          })
                        }
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                        required
                      />
                      <select
                        value={businessData.address.state}
                        onChange={(e) =>
                          setBusinessData({
                            ...businessData,
                            address: { ...businessData.address, state: e.target.value },
                          })
                        }
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                        required
                      >
                        <option value="">State</option>
                        {indianStates.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={businessData.address.pincode}
                        onChange={(e) =>
                          setBusinessData({
                            ...businessData,
                            address: { ...businessData.address, pincode: e.target.value },
                          })
                        }
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                        required
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Bank Details */}
            {step === 3 && (
              <form onSubmit={handleFinalSubmit}>
                <h2 className="text-xl font-semibold mb-6">Bank Details</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Your payments will be transferred to this account
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={bankData.accountHolderName}
                      onChange={(e) =>
                        setBankData({ ...bankData, accountHolderName: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankData.bankName}
                      onChange={(e) =>
                        setBankData({ ...bankData, bankName: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Account Number</label>
                    <input
                      type="text"
                      value={bankData.accountNumber}
                      onChange={(e) =>
                        setBankData({ ...bankData, accountNumber: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm Account Number</label>
                    <input
                      type="text"
                      value={bankData.confirmAccountNumber}
                      onChange={(e) =>
                        setBankData({ ...bankData, confirmAccountNumber: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={bankData.ifscCode}
                      onChange={(e) =>
                        setBankData({ ...bankData, ifscCode: e.target.value.toUpperCase() })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-orange-500"
                      required
                      maxLength={11}
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Submit Registration
                        <Check className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Already a seller? */}
          <p className="text-center mt-6 text-gray-500">
            Already a seller?{' '}
            <Link href="/auth/login" className="text-orange-500 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
