'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function AdminAccessPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSetAdminSession = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/admin/set-session', {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to set admin session');
      }
      
      setMessage(`Success! Admin session created for ${data.email}. Redirecting...`);
      
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
      
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Access Helper</h1>
        
        <p className="text-gray-600 mb-6 text-center">
          If you're logged in as an admin user (a.freed@outlook.com), 
          click the button below to set your admin session.
        </p>
        
        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}>
            {message}
          </div>
        )}
        
        <Button 
          onClick={handleSetAdminSession}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Setting Admin Session...' : 'Set Admin Session'}
        </Button>
        
        <p className="mt-4 text-sm text-gray-500 text-center">
          Make sure you're logged in first at <a href="/login" className="text-blue-600 hover:underline">/login</a>
        </p>
      </div>
    </div>
  );
} 