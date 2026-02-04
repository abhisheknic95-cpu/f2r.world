'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(
          errorParam === 'google_auth_failed'
            ? 'Google authentication failed. Please try again.'
            : 'An error occurred during authentication.'
        );
        setTimeout(() => router.push('/auth/login'), 3000);
        return;
      }

      if (!token) {
        setError('No authentication token received.');
        setTimeout(() => router.push('/auth/login'), 3000);
        return;
      }

      try {
        // Store the token
        localStorage.setItem('token', token);

        // Fetch user data
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://f2rworld-production.up.railway.app/api'}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success && data.user) {
          setAuth(data.user, token);

          // Redirect based on role
          if (data.user.role === 'admin') {
            router.push('/admin');
          } else if (data.user.role === 'seller') {
            router.push('/vendor/dashboard');
          } else {
            // Check if user needs to update phone number
            if (data.user.phone?.startsWith('google_')) {
              router.push('/profile?update_phone=true');
            } else {
              router.push('/');
            }
          }
        } else {
          setError('Failed to fetch user data.');
          setTimeout(() => router.push('/auth/login'), 3000);
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('An error occurred during authentication.');
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Authentication Error</h2>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">Completing Sign In...</h2>
            <p className="text-gray-600">Please wait while we set up your account.</p>
          </div>
        )}
      </div>
    </div>
  );
}
