'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import AlertDescription from '@/components/ui/alert-description';
import { supabase } from '@/lib/supabase';

export default function VerifyPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the token and type from the URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || type !== 'email_confirmation') {
          setStatus('error');
          setMessage('Invalid verification link. Please check your email and try again.');
          return;
        }

        // Instead of assuming success, check if the user session exists
        // which would indicate Supabase successfully processed the verification
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session) {
          // User is authenticated, verification was successful
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          // Try to exchange the token for a session
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email',
          });

          if (error) {
            console.error('Error verifying email:', error);
            setStatus('error');
            setMessage('Invalid verification link. Please check your email and try again.');
          } else {
            setStatus('success');
            setMessage('Your email has been verified successfully!');
          }
        }
      } catch (error) {
        console.error('Error verifying email:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again later.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-lg text-gray-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <Alert variant="success" className="my-4">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {status === 'error' && (
          <Alert variant="destructive" className="my-4">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6 flex flex-col space-y-4">
          {status === 'success' && (
            <Button 
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Go to Login
            </Button>
          )}
          
          {status === 'error' && (
            <Button 
              onClick={() => router.push('/register')}
              className="w-full"
            >
              Back to Registration
            </Button>
          )}
          
          <div className="text-center text-sm mt-4">
            <Link href="/" className="text-indigo-600 hover:text-indigo-500">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 