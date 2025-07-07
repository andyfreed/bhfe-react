'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminAccessPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [devToken, setDevToken] = useState('');
  const [prodEmail, setProdEmail] = useState('');
  const [prodPassword, setProdPassword] = useState('');
  const [isProduction, setIsProduction] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsProduction(window.location.hostname !== 'localhost');
  }, []);

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

  const handleDirectLogin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      if (isProduction) {
        // Production login
        if (!prodEmail || !prodPassword) {
          setMessage('Error: Please enter both email and password');
          setLoading(false);
          return;
        }
        
        const response = await fetch('/api/admin/production-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: prodEmail, password: prodPassword }),
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Authentication failed');
        }
        
        setMessage('Success! Redirecting to admin...');
        setTimeout(() => {
          router.push('/admin');
        }, 1000);
      } else {
        // Development login
        if (!devToken) {
          setMessage('Error: Please enter the development token');
          setLoading(false);
          return;
        }
        
        const response = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: devToken }),
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Authentication failed');
        }
        
        setMessage('Success! Redirecting to admin...');
        setTimeout(() => {
          router.push('/admin');
        }, 1000);
      }
      
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-8">Admin Access</h1>
        
        {/* Environment indicator */}
        <div className={`mb-6 p-4 rounded-lg ${isProduction ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <h3 className={`font-medium ${isProduction ? 'text-red-800' : 'text-green-800'}`}>
            Environment: {isProduction ? 'Production' : 'Development'}
          </h3>
        </div>
        
        {/* Method 1: If already logged in as admin */}
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Method 1: Already Logged In as Admin</h3>
          <p className="text-blue-700 mb-4">
            If you're already logged in as an admin user (a.freed@outlook.com), click below to set your admin session.
          </p>
          <Button 
            onClick={handleSetAdminSession}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Setting Admin Session...' : 'Set Admin Session'}
          </Button>
        </div>
        
        {/* Method 2: Direct admin login */}
        <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Method 2: Direct Admin Login</h3>
          
          {isProduction ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
                <input
                  type="email"
                  value={prodEmail}
                  onChange={(e) => setProdEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="a.freed@outlook.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={prodPassword}
                  onChange={(e) => setProdPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Development Token</label>
              <input
                type="password"
                value={devToken}
                onChange={(e) => setDevToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="super-secure-admin-token-for-development"
              />
              <p className="text-xs text-gray-500 mt-1">
                Development token: super-secure-admin-token-for-development
              </p>
            </div>
          )}
          
          <Button 
            onClick={handleDirectLogin}
            disabled={loading}
            className="w-full mt-4"
          >
            {loading ? 'Logging in...' : 'Login as Admin'}
          </Button>
        </div>
        
        {/* Method 3: Official admin login page */}
        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-medium text-green-900 mb-3">Method 3: Official Admin Login Page</h3>
          <p className="text-green-700 mb-4">
            Use the official admin login page for the most reliable access.
          </p>
          <Link 
            href="/admin/login"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 w-full"
          >
            Go to Admin Login Page
          </Link>
        </div>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Error') ? 'bg-red-100 border border-red-200 text-red-800' : 'bg-green-100 border border-green-200 text-green-800'
          }`}>
            {message}
          </div>
        )}
        
        {/* Debug info */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>Need help? Check the browser console for debug information.</p>
          <p>
            <Link href="/" className="text-blue-600 hover:underline">← Back to homepage</Link>
          </p>
        </div>
      </div>
    </div>
  );
} 