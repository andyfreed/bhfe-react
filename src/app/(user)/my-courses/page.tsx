'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getUser } from '@/lib/authService';

interface Course {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  main_subject?: string;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  completed: boolean;
  enrolled_at: string;
  course: Course;
}

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchUserEnrollments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if user is logged in
      const { data: user, error: userError } = await getUser();
      
      if (userError || !user) {
        console.error('No user found:', userError);
        setError('Please log in to view your courses');
        return;
      }
      
      console.log('Fetching enrollments for user:', user.email);
      
      // Fetch user enrollments from the API
      const response = await fetch('/api/user/enrollments', {
        // Add cache: no-cache to ensure fresh data
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.status === 401) {
        setError('You need to be logged in to view your courses');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Error fetching enrollments: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Enrollment data received:', data);
      
      // Check if the response has the expected structure
      if (data && data.enrollments) {
        if (data.enrollments.length === 0) {
          console.log('No enrollments found for this user');
        } else {
          console.log(`Found ${data.enrollments.length} enrollments`);
          
          // Log each enrollment to help with debugging
          data.enrollments.forEach((enrollment, index) => {
            console.log(`Enrollment #${index + 1}:`, 
              `ID: ${enrollment.id}`,
              `Course: ${enrollment.course?.title || 'Unknown'}`,
              `Type: ${enrollment.enrollment_type || 'Unknown'}`
            );
          });
        }
        setEnrollments(data.enrollments || []);
      } else {
        console.error('Unexpected response format:', data);
        setError('Invalid enrollment data received');
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setError('Failed to load your courses. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch enrollments on page load
  useEffect(() => {
    fetchUserEnrollments();
  }, []);

  // Function to refresh enrollments
  const handleRefresh = () => {
    fetchUserEnrollments();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-4">
              <Link
                href="/auth/login"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign In
              </Link>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
            <p className="mt-2 text-gray-600">Continue learning where you left off</p>
          </div>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        
        {enrollments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-4">You haven't enrolled in any courses yet</h2>
            <p className="text-gray-600 mb-6">Browse our course catalog to find courses that interest you</p>
            <Link
              href="/courses"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="relative h-48">
                  <Image
                    src={enrollment.course.image_url || '/images/course-placeholder.jpg'}
                    alt={enrollment.course.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-0.5">
                    {enrollment.course.main_subject || 'Finance'}
                  </span>
                  <h2 className="mt-2 text-xl font-semibold text-gray-900">{enrollment.course.title}</h2>
                  <p className="mt-2 text-gray-600 line-clamp-2">{enrollment.course.description}</p>
                  
                  <div className="mt-4">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700">
                        {enrollment.progress}% complete
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Link
                      href={`/courses/${enrollment.course.id}`}
                      className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      {enrollment.completed ? 'Review Course' : 'Continue Learning'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 