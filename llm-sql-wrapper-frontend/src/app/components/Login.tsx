'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Login() {
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const res = await fetch('/api/check-auth', { credentials: 'include' });
      if (res.ok) {
        router.push('/home');
      }
    };
    checkAuth();
  }, [router]);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn('google', { callbackUrl: '/home' });
      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  const handleEmailSignIn = async () => {
    try {
      const result = await signIn('email', { callbackUrl: '/home' });
      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-fit flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
        </div>
        <div className="mt-8 space-y-6">
          <button
            onClick={handleGoogleSignIn}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Sign in with Google
          </button>
          <button
            onClick={handleEmailSignIn}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign in with Email
          </button>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>
    </div>
  );
}