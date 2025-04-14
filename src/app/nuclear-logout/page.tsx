'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function NuclearLogoutPage() {
  const [message, setMessage] = useState('Executing nuclear logout...');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const clearEverything = async () => {
      try {
        // This is the most aggressive way to log out without any dependencies
        
        // 1. Try to clear localStorage completely
        setMessage('Clearing localStorage...');
        try {
          window.localStorage.clear();
          console.log('LocalStorage cleared');
        } catch (e) {
          console.error('Error clearing localStorage:', e);
        }
        
        // 2. Try to clear sessionStorage
        setMessage('Clearing sessionStorage...');
        try {
          window.sessionStorage.clear();
          console.log('SessionStorage cleared');
        } catch (e) {
          console.error('Error clearing sessionStorage:', e);
        }
        
        // 3. Delete all cookies by setting expired dates
        setMessage('Removing cookies...');
        try {
          const cookies = document.cookie.split(";");
          for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            console.log(`Removed cookie: ${name}`);
          }
        } catch (e) {
          console.error('Error clearing cookies:', e);
        }
        
        // 4. Special focus on Supabase
        setMessage('Removing Supabase tokens...');
        try {
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('bhfe-auth-token');
          
          // Remove any keys that might be Supabase-related
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('supabase') || key.includes('auth') || key.includes('token'))) {
              localStorage.removeItem(key);
              console.log(`Removed key: ${key}`);
            }
          }
        } catch (e) {
          console.error('Error removing Supabase items:', e);
        }
        
        setMessage('Logout complete!');
        setDone(true);
        
        // Wait 2 seconds then redirect
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } catch (error) {
        setMessage(`Error during logout: ${error instanceof Error ? error.message : String(error)}`);
        setDone(true);
      }
    };
    
    clearEverything();
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold mb-6 text-red-600">Emergency Logout</h1>
        
        <div className="my-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xl font-medium">{message}</p>
        </div>
        
        {done && (
          <div className="flex flex-col gap-4">
            <p className="text-green-600 font-medium">Your session has been cleared.</p>
            <Link 
              href="/login" 
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Go to Login Page
            </Link>
          </div>
        )}
        
        {!done && (
          <div className="flex justify-center mt-6">
            <div className="w-12 h-12 border-4 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
} 