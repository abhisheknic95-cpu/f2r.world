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

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </a>
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
