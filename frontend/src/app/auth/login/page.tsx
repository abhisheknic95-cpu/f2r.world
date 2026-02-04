'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI, cartAPI } from '@/lib/api';
import useStore from '@/store/useStore';
import toast from 'react-hot-toast';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { setUser, setToken, sessionId } = useStore();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.sendOTP(phone);
      toast.success('OTP sent successfully!');
      setStep('otp');

      // For development - show OTP in toast
      if (response.data.otp) {
        toast.success(`Your OTP is: ${response.data.otp}`, { duration: 10000 });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOTP(phone, otp);
      setToken(response.data.token);
      setUser(response.data.user);

      // Merge guest cart with user cart
      try {
        await cartAPI.mergeCart(sessionId);
      } catch (e) {
        // Ignore merge errors
      }

      toast.success('Login successful!');
      router.push(redirect);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            F2R
          </h1>
          <p className="text-gray-500 mt-2">Login to continue shopping</p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOTP}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                  <Phone className="w-5 h-5 mr-2" />
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter your mobile number"
                  className="w-full pl-24 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                  maxLength={10}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
              </label>
              <p className="text-sm text-gray-500 mb-4">
                We've sent a 6-digit OTP to +91 {phone}
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-orange-500 ml-2 hover:underline"
                >
                  Change
                </button>
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Verify & Login'
              )}
            </button>

            <button
              type="button"
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full mt-4 text-orange-500 hover:underline text-sm"
            >
              Didn't receive OTP? Resend
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-sm text-gray-500">
            Are you a seller?{' '}
            <Link href="/seller/register" className="text-orange-500 hover:underline">
              Register here
            </Link>
          </p>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          By continuing, you agree to F2R's Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
