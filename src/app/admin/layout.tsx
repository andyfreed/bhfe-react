'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSession } from '@/lib/authService';
import AdminNav from '@/components/AdminNav';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check authentication status
    const checkAuth = async () => {
      try {
        const { data: session, error: sessionError } = await getSession();
        
        if (sessionError || !session?.user) {
          setIsAuthenticated(false);
          router.replace('/login?redirect=/admin');
          return;
        }

        // Verify if user has admin role
        const response = await fetch('/api/user/profile');
        const result = await response.json();

        if (!response.ok || result.error) {
          throw new Error(result.error || 'Failed to fetch profile');
        }

        const isAdmin = result.data?.role === 'admin';
        setIsAuthenticated(isAdmin);

        if (!isAdmin) {
          router.replace('/'); // Redirect to home if not admin
        }
      } catch (error) {
        console.error('Authentication check error:', error);
        setIsAuthenticated(false);
        router.replace('/');
      }
    };

    checkAuth();
  }, [pathname]);

  // Don't render anything until we've checked authentication
  if (!mounted || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If authenticated as admin, show content
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminNav />
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Show loading state while redirect happens
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
} 