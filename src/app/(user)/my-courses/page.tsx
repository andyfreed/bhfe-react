'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MyCoursesRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the account page with courses tab
    router.push('/account?tab=courses');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
} 