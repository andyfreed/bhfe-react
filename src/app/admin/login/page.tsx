'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AdminLoginPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // For development mode hint
      if (!token) {
        setError('Please enter your admin token');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Success - perform a test fetch to verify the cookie works
      setLoading(true);
      try {
        // Small delay to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Test authentication with a simple API call
        const testResponse = await fetch('/api/courses', {
          method: 'GET',
          credentials: 'include' // Important to send cookies
        });
        
        if (!testResponse.ok) {
          console.error('Auth test failed:', await testResponse.text());
          throw new Error('Authentication succeeded but session test failed');
        }
        
        // If we got here, authentication is working
        console.log('Authentication successful, redirecting to admin dashboard');
        router.push('/admin/courses');
      } catch (testError) {
        console.error('Test request failed:', testError);
        throw new Error('Login succeeded but session validation failed. Please try again.');
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
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
} 