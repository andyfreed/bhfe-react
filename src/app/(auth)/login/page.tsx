'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Alert from '@/components/ui/alert';
import AlertDescription from '@/components/ui/alert-description';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/lib/authService';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    setMounted(true);
    // Focus email input on mount
    emailRef.current?.focus();
    
    // Check URL parameters for success/error messages
    const urlError = searchParams.get('error');
    const urlSuccess = searchParams.get('success');
    
    if (urlError) setError(decodeURIComponent(urlError));
    if (urlSuccess) setSuccess(decodeURIComponent(urlSuccess));
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!mounted) return;

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const rememberMe = formData.get('remember-me') === 'on';
    const redirectTo = searchParams.get('redirect') || '/dashboard';

    // Basic client-side validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      emailRef.current?.focus();
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(email, password);

      if (result.error) {
        setError(result.error.message || 'An error occurred during login');
      } else {
        setSuccess('Login successful! Redirecting...');
        router.push(redirectTo);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        {/* Only render dynamic content after mounting */}
        {mounted && (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </>
        )}
        
        <form 
          onSubmit={handleLogin} 
          className="mt-8 space-y-6"
          autoComplete="on"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">
                Email address
              </Label>
              <Input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1"
                placeholder="name@example.com"
                disabled={isLoading}
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
                autoComplete="current-password"
                required
                className="mt-1"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                autoComplete="off"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link 
                href="/forgot-password" 
                className="font-medium text-indigo-600 hover:text-indigo-500"
                tabIndex={isLoading ? -1 : 0}
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              suppressHydrationWarning
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </Button>
          </div>
          
          <div className="text-center text-sm">
            Don't have an account?{' '}
            <Link 
              href="/register" 
              className="font-medium text-indigo-600 hover:text-indigo-500"
              tabIndex={isLoading ? -1 : 0}
            >
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 