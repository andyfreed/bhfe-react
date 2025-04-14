'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetAuthPage() {
  const [message, setMessage] = useState<string>('Resetting authentication state...');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    async function resetAuth() {
      try {
        // Clear all storage
        if (typeof window !== 'undefined') {
          setMessage('Clearing local storage...');
          
          // Clear Supabase-specific items
          const authKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('supabase.auth.') || 
            key.includes('token') || 
            key.includes('session')
          );
          
          authKeys.forEach(key => {
            console.log(`Removing: ${key}`);
            localStorage.removeItem(key);
          });
          
          // Try a broader approach to clear any other keys
          localStorage.clear();
          
          setMessage('Local storage cleared successfully.');
        }
        
        // Attempt to clear cookies
        setMessage('Clearing cookies...');
        document.cookie.split(';').forEach(c => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });
        
        setMessage('Authentication state has been reset successfully.');
        setIsComplete(true);
      } catch (error) {
        console.error('Error during reset:', error);
        setMessage(`Error during reset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsComplete(true);
      }
    }
    
    resetAuth();
  }, []);

  const handleGoHome = () => {
    router.push('/');
  };
  
  const handleGoToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Auth Reset</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          
          {isComplete && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Your authentication state has been reset. You should now be able to log in with any account.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleGoToLogin}
                  className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Go to Login
                </button>
                
                <button
                  onClick={handleGoHome}
                  className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Return to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 