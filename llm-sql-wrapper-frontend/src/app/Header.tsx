'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const pathname = usePathname();
  const [showHeader, setShowHeader] = useState(false);

  useEffect(() => {
    const isAuthPage = pathname === '/login' || pathname === '/register';
    setShowHeader(!isAuthPage);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        window.location.href = '/login';
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (!showHeader) {
    return null;
  }

  return (
    <nav className="bg-none shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-7">
            <div>
              <Link href="/dashboard" className="flex items-center py-4 px-2">
                <span className="font-semibold text-indigo-500 text-4xl">SQL Challenge AI</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleLogout}
              className="py-2 px-2 font-lg text-gray-500 rounded hover:bg-indigo-500 hover:text-white transition duration-300"
            >
              <LogOut className="h-8 w-8" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;