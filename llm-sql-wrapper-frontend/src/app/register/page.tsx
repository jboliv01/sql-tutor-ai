'use client';
import React from 'react';
import Link from 'next/link';
import Registration from '../components/Registration';
import { Database } from 'lucide-react';
import "../globals.css";

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <div className="flex justify-center">
            <Database className="h-12 w-12 text-blue-500" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            SQL Challenge AI
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Master SQL with AI-powered challenges
          </p>
        </div>
        <Registration />
        <div className="text-center">
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 transition duration-150 ease-in-out">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;