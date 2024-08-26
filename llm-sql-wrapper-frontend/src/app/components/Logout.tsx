// src/app/components/Logout.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import "../globals.css";

const LogoutButton: React.FC = () => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Logout failed');
      }
  
      // Clear the username from local storage
      localStorage.removeItem('username');
  
      // Successful logout
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
          isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
  );
};

export default LogoutButton;
