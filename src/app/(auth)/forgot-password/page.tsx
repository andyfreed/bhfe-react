'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Alert from '@/components/ui/alert';
import AlertDescription from '@/components/ui/alert-description';
import { resetPassword } from '@/lib/authService';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    const email = formData.get('email') as string;
    
    if (!email) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await resetPassword(email);
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      setSuccess(true);
      setEmail(email);
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
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {success 
              ? `We've sent a password reset link to ${email}` 
              : "Enter your email address and we'll send you a link to reset your password"
            }
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
                Please check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col space-y-4">
              <Button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                className="w-full"
              >
                Try another email
              </Button>
              
              <div className="text-center text-sm">
                <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Return to login
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <form action={handleSubmit} className="mt-8 space-y-6">
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
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Sending reset link...' : 'Send reset link'}
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