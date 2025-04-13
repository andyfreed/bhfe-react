'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminNav from '@/components/AdminNav';
import { supabase } from '@/lib/supabase';
import { isUserAdmin } from '@/lib/auth';

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
        // Get current user directly from Supabase
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        // Debug log
        console.log('Client auth check:', { 
          hasUser: !!user, 
          userEmail: user?.email,
          userError 
        });

        if (userError || !user) {
          console.log('No authenticated user found');
          setIsAuthenticated(false);
          router.replace('/login?redirect=/admin');
          return;
        }

        // Check if admin directly
        const userIsAdmin = user.email ? await isUserAdmin(user.email) : false;
        console.log('Admin check:', { userIsAdmin, email: user.email });
        
        // If the user is an admin, allow access regardless of profile status
        if (userIsAdmin) {
          console.log('User is admin, allowing access');
          setIsAuthenticated(true);
          return;
        }
        
        // Only fetch profile if user isn't already confirmed as admin
        try {
          // Get profile data with error catching
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          console.log('Profile fetch result:', { hasProfile: !!profile, profileError });
            
          if (profileError) {
            console.error('Error fetching profile:', profileError);
            // Don't throw here, just log and deny access if not an admin
            setIsAuthenticated(false);
            router.replace('/');
            return;
          }
        } catch (profileFetchError) {
          console.error('Exception fetching profile:', profileFetchError);
          setIsAuthenticated(false);
          router.replace('/');
          return;
        }
        
        // If we got here and user is not admin, redirect
        if (!userIsAdmin) {
          console.log('User is not an admin');
          setIsAuthenticated(false);
          router.replace('/'); // Redirect to home if not admin
          return;
        }
        
        // If we got here, user is authenticated and admin
        setIsAuthenticated(true);
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