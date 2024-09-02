'use client';
import React from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { LogIn } from 'lucide-react';
import "../globals.css";

const LoginPage: React.FC = () => {
  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/home' });
  };

  const handleEmailLogin = () => {
    signIn('email', { callbackUrl: '/home' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <div className="flex justify-center">
            <LogIn className="h-12 w-12 text-indigo-500" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            SQL Challenge AI
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Log in to continue your SQL journey
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign in with Google
          </button>
          <button
            onClick={handleEmailLogin}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Sign in with Email
          </button>
        </div>
        <div className="text-center">
          <p className="mt-2 text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150 ease-in-out">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;