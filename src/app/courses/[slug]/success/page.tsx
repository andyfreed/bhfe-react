'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Props {
  params: {
    slug: string;
  };
}

export default function CourseSuccessPage({ params }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [courseTitle, setCourseTitle] = useState('');
  const searchParams = useSearchParams();
  const { slug } = params;

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      // Use the slug as a fallback course title
      setCourseTitle(slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
    }, 1500);
    
    // Here you would typically verify the purchase with your backend
    // and grant access to the course
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary-DEFAULT mx-auto mb-4"></div>
          <p className="text-theme-neutral-600">Confirming your purchase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-theme-neutral-50">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-4xl font-bold mb-4 primary-gradient-text">Thank You for Your Purchase!</h1>
          <p className="text-xl text-theme-neutral-600 mb-8">
            You now have access to {courseTitle}
          </p>
          
          <div className="bg-white border border-theme-neutral-200 rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-semibold text-theme-primary-DEFAULT mb-2">What's Next?</h2>
            <ul className="text-theme-neutral-600 space-y-2">
              <li>✓ Check your email for course access instructions</li>
              <li>✓ Set up your student profile</li>
              <li>✓ Begin your learning journey</li>
            </ul>
          </div>

          <div className="space-x-4">
            <Link
              href="/dashboard"
              className="inline-block bg-theme-primary-DEFAULT hover:bg-theme-primary-dark text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/courses"
              className="inline-block border border-theme-primary-DEFAULT text-theme-primary-DEFAULT hover:bg-theme-neutral-100 font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Browse More Courses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 