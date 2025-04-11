'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUser } from '@/lib/authService';

export default function AccountPage() {
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserData() {
      try {
        setIsLoading(true);
        
        // Check if the user is logged in
        const { data: user, error } = await getUser();
        
        if (error || !user) {
          console.error('No user found:', error);
          router.push('/login');
          return;
        }
        
        setUserEmail(user.email || '');
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserData();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Account</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <dl className="divide-y divide-gray-200">
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900 col-span-2">{userEmail}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Account Settings</h2>
              <div className="mt-4 space-y-4">
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 