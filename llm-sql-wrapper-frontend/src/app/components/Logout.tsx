'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import "../globals.css";

const LogoutButton: React.FC = () => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError('');

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

      const data = await response.json();
      console.log('Logout successful:', data);

      // Clear the username from local storage
      localStorage.removeItem('username');

      // Redirect to the login page after successful logout
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
          isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </div>
  );
};

export default LogoutButton;