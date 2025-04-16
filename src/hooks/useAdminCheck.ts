import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { isUserAdmin } from '@/lib/auth';
import { hasAdminCookie, setAdminToken } from '@/lib/clientCookies';

export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        // First check if the admin cookie is set
        if (hasAdminCookie()) {
          setIsAdmin(true);
          // Refresh the token whenever we verify it to extend session duration
          setAdminToken();
          setIsLoading(false);
          return;
        }
        
        // Check with Supabase if the user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email) {
          // Check if the user's email is in the admin list
          const admin = await isUserAdmin(session.user.email);
          
          if (admin) {
            // Set the client-side admin cookie
            setAdminToken();
          }
          
          setIsAdmin(admin);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminStatus();
  }, []);

  return { isAdmin, isLoading };
} 