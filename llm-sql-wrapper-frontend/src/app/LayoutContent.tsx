import React from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from "next-auth/react";
import Header from './Header';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  
  console.log('Rendering layout:', { isAuthenticated, isLoading, isAuthPage });

  return (
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
  );
}