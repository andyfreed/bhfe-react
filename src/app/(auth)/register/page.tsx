'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { AlertDescription } from '@/components/ui/alert-description';
import { register } from '@/lib/authService';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  async function handleRegistration(formData: FormData) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Client-side validation
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const result = await register({
        email,
        password,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // For Supabase, when confirmation is required,
      // we show a success message but don't redirect yet
      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="container flex flex-col items-center justify-center w-screen h-screen">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] bg-white p-8 rounded-xl shadow-md">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Registration Successful</h1>
            <p className="text-sm text-muted-foreground">
              Please check your email to confirm your account.
            </p>
          </div>
          
          <Alert variant="success">
            <AlertDescription>
              A confirmation link has been sent to your email address. Please check your inbox.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col space-y-4">
            <Link 
              href="/login" 
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Return to Login
            </Link>
            
            <Link 
              href="/" 
              className="text-center text-sm text-indigo-600 hover:text-indigo-500"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex flex-col items-center justify-center w-screen h-screen">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] bg-white p-8 rounded-xl shadow-md">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Enter your details to create your account
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form action={handleRegistration} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" placeholder="name@example.com" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
            <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Register'}
          </Button>
        </form>

        <div className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="underline text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
} 