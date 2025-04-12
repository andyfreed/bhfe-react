'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import AdminNav from '@/components/AdminNav';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setMounted(true);
    
    // Check authentication status
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user && pathname !== '/admin/login') {
          router.replace('/admin/login');
          setIsAuthenticated(false);
          return;
        }

        if (session?.user) {
          // Verify if user has admin role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          const isAdmin = profile?.role === 'admin';
          setIsAuthenticated(isAdmin);

          if (!isAdmin && pathname !== '/admin/login') {
            router.replace('/admin/login');
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Authentication check error:', error);
        setIsAuthenticated(false);
        if (pathname !== '/admin/login') {
          router.replace('/admin/login');
        }
      }
    };

    checkAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          if (pathname !== '/admin/login') {
            router.replace('/admin/login');
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Verify admin role on sign in
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          const isAdmin = profile?.role === 'admin';
          setIsAuthenticated(isAdmin);

          if (!isAdmin && pathname !== '/admin/login') {
            router.replace('/admin/login');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname]);

  // Don't render anything until we've checked authentication
  if (!mounted || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If on login page or authenticated, show content
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

  // Show loading state while redirect happens
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
} 