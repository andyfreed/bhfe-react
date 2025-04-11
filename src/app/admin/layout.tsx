'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminNav from '@/components/AdminNav';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Handle mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check authentication on client-side
    const checkAuth = () => {
      try {
        const isAdmin = localStorage.getItem('admin_authenticated') === 'true';
        
        if (!isAdmin && pathname !== '/admin/login') {
          router.push('/admin/login');
        } else {
          setIsAuthenticated(isAdmin);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        // If there's an error (e.g., localStorage access denied), redirect to login
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router, pathname, mounted]);

  // Prevent any rendering until after mounting to avoid hydration issues
  if (!mounted) {
    return null;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If on the login page or authenticated, show content
  if (pathname === '/admin/login' || isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100">
        {isAuthenticated && <AdminNav />}
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // This shouldn't be reached since we redirect in the useEffect
  // But just in case, redirect here too
  router.push('/admin/login');
  return null;
} 