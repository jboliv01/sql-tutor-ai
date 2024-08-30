'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        console.log('Checking authentication...');
        const res = await fetch('/api/check-auth', {
          credentials: 'include',
        });
        console.log('Authentication check response status:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('Authentication check response:', data);
          setIsAuthenticated(data.authenticated);
          if (!data.authenticated) {
            console.log('User not authenticated, redirecting to login');
            router.push('/login');
          }
        } else {
          console.error('Authentication check failed:', await res.text());
          setIsAuthenticated(false);
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  return { isAuthenticated, isLoading };
}