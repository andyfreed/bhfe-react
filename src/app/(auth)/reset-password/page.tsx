'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { AlertDescription } from '@/components/ui/alert-description';
import { supabase } from '@/lib/supabase';

function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check if we have all the required params for resetting
  useEffect(() => {
    const hasParams = searchParams.has('type') && searchParams.has('token');
    if (!hasParams) {
      setError('Invalid or expired password reset link');
    }
  }, [searchParams]);

  async function handleResetPassword(formData: FormData) {
    setIsLoading(true);
    setError(null);
    
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    // Validation
    if (!password || !confirmPassword) {
      setError('Please enter your new password');
      setIsLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }
    
    try {
      // Update the password
      // Note: Supabase should automatically validate the token in the URL
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setSuccess('Password reset successfully! Redirecting to login...');
      
      // Automatically redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?reset=true');
      }, 3000);
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
            Set New Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create a new password for your account
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="my-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success ? (
          <div className="space-y-6">
            <Alert variant="success" className="my-4">
              <AlertDescription>
                Your password has been successfully reset. You will be redirected to the login page shortly.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-center">
              <Link 
                href="/login" 
                className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Login
              </Link>
            </div>
          </div>
        ) : (
          <form action={handleResetPassword} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">
                  New Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters
                </p>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="mt-1"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !!error}
              >
                {isLoading ? 'Updating password...' : 'Reset Password'}
              </Button>
            </div>
            
            <div className="text-center text-sm">
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
} 