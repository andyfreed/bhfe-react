'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ForceLogoutPage() {
  const [status, setStatus] = useState<string>('Initiating force logout...');
  const [isComplete, setIsComplete] = useState<boolean>(false);

  useEffect(() => {
    async function forceLogout() {
      try {
        // Step 1: Log all storage items for debugging
        setStatus('Checking storage items...');
        console.log('Storage items before cleanup:');
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            console.log(`${key}: ${localStorage.getItem(key)}`);
          }
        }

        // Step 2: Try direct call to Supabase signOut with global scope
        setStatus('Executing Supabase global signOut...');
        try {
          await supabase.auth.signOut({ scope: 'global' });
          console.log('Supabase global signOut executed');
        } catch (error) {
          console.error('Supabase signOut error:', error);
        }

        // Step 3: Clear all Supabase-related localStorage items
        setStatus('Clearing Supabase localStorage items...');
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (
            key.includes('supabase') || 
            key.includes('auth') || 
            key.includes('token') || 
            key.includes('session')
          )) {
            console.log(`Removing: ${key}`);
            localStorage.removeItem(key);
          }
        }

        // Step 4: Clear all cookies
        setStatus('Clearing all cookies...');
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          console.log(`Cleared cookie: ${name}`);
        });

        // Step 5: Brute force clear of all storage
        setStatus('Performing full storage reset...');
        localStorage.clear();
        sessionStorage.clear();
        
        // Step 6: Remove specific Supabase items directly
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('bhfe-auth-token');

        // Final check
        setStatus('Checking if cleanup was successful...');
        const session = await supabase.auth.getSession();
        if (session.data.session) {
          setStatus('WARNING: Still detected an active session. Preparing redirect...');
        } else {
          setStatus('No active session detected. Logout successful!');
        }

        setIsComplete(true);
      } catch (error) {
        console.error('Error during force logout:', error);
        setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsComplete(true);
      }
    }

    forceLogout();
  }, []);

  const redirectToHome = () => {
    window.location.href = '/';
  };

  const redirectToLogin = () => {
    window.location.href = '/login';
  };

  // Add a secondary effect to force navigation after 5 seconds
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        window.location.href = '/login';
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Emergency Logout</h1>
        
        <div className={`mb-6 p-4 rounded-lg ${isComplete ? 'bg-green-50' : 'bg-blue-50'}`}>
          <p className="text-lg">{status}</p>
          
          {isComplete && (
            <p className="mt-2 text-sm text-gray-600">
              You will be redirected to the login page in 5 seconds.
            </p>
          )}
        </div>
        
        {isComplete && (
          <div className="flex flex-col gap-3">
            <button
              onClick={redirectToLogin}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Go to Login Page
            </button>
            
            <button
              onClick={redirectToHome}
              className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Go to Home Page
            </button>
          </div>
        )}
        
        {!isComplete && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}
      </div>
    </div>
  );
} 