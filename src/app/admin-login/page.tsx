'use client';

import { useState } from 'react';
import { setAdminToken } from '@/lib/clientCookies';

export default function AdminLoginPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    try {
      // Set the admin token client-side
      document.cookie = "admin_token=temporary-token; path=/; max-age=86400; samesite=lax";
      setSuccess(true);
      setError('');
    } catch (err) {
      console.error('Error setting admin token:', err);
      setError('Failed to set admin token');
    }
  };

  return (
    <div className="container mx-auto max-w-md py-12">
      <h1 className="text-2xl font-bold mb-6">Admin Access</h1>
      
      <div className="bg-white shadow-md rounded p-6">
        {success ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Admin token set successfully! You now have admin access.
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <p className="mb-4">Click the button below to gain admin access:</p>
            <button
              onClick={handleLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
            >
              Set Admin Token
            </button>
          </>
        )}
        
        {success && (
          <a 
            href="/"
            className="block mt-4 text-center text-blue-600 hover:underline"
          >
            Return to Home
          </a>
        )}
      </div>
    </div>
  );
} 