'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { courses } from '@/data/courses';

interface Props {
  params: {
    slug: string;
  };
}

export default function CourseSuccessPage({ params }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const course = courses.find((c) => c.slug === params.slug);

  useEffect(() => {
    // Here you would typically verify the purchase with your backend
    // and grant access to the course
    setIsLoading(false);
  }, []);

  if (!course) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-brand-gray-nav">Confirming your purchase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-brand-gray-bg">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-4xl font-bold mb-4 text-brand-blue">Thank You for Your Purchase!</h1>
          <p className="text-xl text-brand-gray-nav mb-8">
            You now have access to {course.title}
          </p>
          
          <div className="bg-white border border-brand-gray-light rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-brand-blue mb-2">What's Next?</h2>
            <ul className="text-brand-gray-nav space-y-2">
              <li>✓ Check your email for course access instructions</li>
              <li>✓ Set up your student profile</li>
              <li>✓ Begin your learning journey</li>
            </ul>
          </div>

          <div className="space-x-4">
            <Link
              href="/dashboard"
              className="inline-block bg-brand-orange hover:bg-brand-dark-orange text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/courses"
              className="inline-block border border-brand-orange text-brand-orange hover:bg-brand-gray-light font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Browse More Courses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 