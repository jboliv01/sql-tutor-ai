import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from "next-auth/react";
import Header from './Header';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const { data: session, status } = useSession();
  const [isSyncing, setIsSyncing] = useState(false);
  const isLoading = status === 'loading' || isSyncing;
  const isAuthenticated = status === 'authenticated';
  
  console.log('Rendering layout:', { isAuthenticated, isLoading, isAuthPage });

  // Sync session with backend when authenticated
  useEffect(() => {
    const syncSession = async () => {
      if (isAuthenticated && session?.user) {
        try {
          setIsSyncing(true);
          console.log('Syncing session with backend...');
          
          const response = await fetch('/api/sync-session');
          const data = await response.json();
          
          if (data.success) {
            console.log('Session synced successfully', data);
          } else {
            console.error('Failed to sync session:', data.message);
          }
        } catch (error) {
          console.error('Error syncing session:', error);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    if (isAuthenticated) {
      syncSession();
    }
  }, [isAuthenticated, session]);

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