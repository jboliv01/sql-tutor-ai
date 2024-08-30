'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './hooks/useAuth';
import Header from './Header';
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const { isAuthenticated, isLoading } = useAuth();

  console.log('Rendering layout:', { isAuthenticated, isLoading, isAuthPage });

  return (
    <html lang="en">
      <body>
        <div className={`min-h-screen flex flex-col ${isAuthPage ? '' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
          {!isAuthPage && <Header />}
          <main className={`flex-grow ${isAuthPage ? '' : 'container mx-auto px-4 py-8'}`}>
            {isLoading ? (
              <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl">Loading...</p>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </body>
    </html>
  );
}