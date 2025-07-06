'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProduction, setIsProduction] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if we're in production by looking at the URL
    setIsProduction(window.location.hostname !== 'localhost');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isProduction) {
        // Production authentication with email/password
        if (!email || !password) {
          setError('Please enter your email and password');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/admin/production-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include'
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Authentication failed');
        }

        // Success - redirect to admin dashboard
        router.push('/admin/users');
      } else {
        // Development authentication with token
        if (!token) {
          setError('Please enter your admin token');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          credentials: 'include'
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Authentication failed');
        }

        // Small delay to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Test authentication with a simple API call
        const testResponse = await fetch('/api/courses', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!testResponse.ok) {
          console.error('Auth test failed:', await testResponse.text());
          throw new Error('Authentication succeeded but session test failed');
        }
        
        // Success - redirect to admin dashboard
        router.push('/admin/courses');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {isProduction ? (
            <>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                  placeholder="admin@example.com"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                  placeholder="Enter your password"
                />
              </div>
            </>
          ) : (
            <div className="mb-4">
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Token
              </label>
              <Input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="w-full"
                placeholder="Enter your admin token"
              />
              <p className="mt-1 text-xs text-gray-500">
                In development mode, use: 'super-secure-admin-token-for-development'
              </p>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <p className="text-sm text-gray-600">
          Don&apos;t have admin access?{' '}
          <Link href="/contact" className="font-medium text-indigo-600 hover:text-indigo-500">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
