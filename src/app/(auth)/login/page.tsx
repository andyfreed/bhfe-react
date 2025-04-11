'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Alert from '@/components/ui/alert';
import AlertDescription from '@/components/ui/alert-description';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { login } from '@/lib/authService';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Handle URL parameters (like ?registered=true or ?error=invalid)
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Registration successful! You can now log in with your credentials.');
    } else if (searchParams.get('error') === 'invalid') {
      setError('Invalid email or password. Please try again.');
    } else if (searchParams.get('reset') === 'true') {
      setSuccessMessage('Your password has been reset successfully.');
    }
  }, [searchParams]);

  async function handleLogin(formData: FormData) {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Client-side validation
    if (!email || !password) {
      setError('Email and password are required');
      setIsLoading(false);
      return;
    }

    try {
      const result = await login({ email, password });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Login successful - redirect to dashboard or home
      router.push('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        {successMessage && (
          <Alert variant="success" className="my-4">
            <AlertDescription>
              {successMessage}
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="my-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form action={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
          
          <div className="text-center text-sm">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 