'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  return function WithAuth(props: P) {
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
      if (!isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) {
      return null; // or a loading component
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;