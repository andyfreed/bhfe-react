'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FixAdminTokenPage() {
  const [status, setStatus] = useState('Fixing admin token...');
  const router = useRouter();

  useEffect(() => {
    async function fixToken() {
      try {
        // Clear the old cookie by setting it with max age 0
        document.cookie = 'admin_token=; path=/; max-age=0';
        setStatus('Old token cleared...');
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Set the new token
        const response = await fetch('/api/auth/set-admin-token');
        if (response.ok) {
          setStatus('New token set! Redirecting...');
          
          // Wait a moment then redirect back
          await new Promise(resolve => setTimeout(resolve, 1000));
          router.back();
        } else {
          setStatus('Failed to set new token');
        }
      } catch (error) {
        setStatus('Error: ' + error);
      }
    }
    
    fixToken();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Fixing Admin Token</h1>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
} 