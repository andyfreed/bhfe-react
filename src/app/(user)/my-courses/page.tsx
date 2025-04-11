'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getUser } from '@/lib/authService';
import { supabase } from '@/lib/supabase';

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

// Fallback enrollments for demo purposes
const DEMO_ENROLLMENTS: Enrollment[] = [
  {
    id: '1',
    user_id: 'demo-user',
    course_id: '1',
    progress: 75,
    completed: false,
    enrolled_at: new Date().toISOString(),
    course: {
      id: '1',
      title: 'Introduction to Financial Planning',
      description: 'Learn the basics of personal financial planning and management',
      image_url: '/images/course-placeholder.jpg',
      main_subject: 'Finance'
    }
  },
  {
    id: '2',
    user_id: 'demo-user',
    course_id: '2',
    progress: 30,
    completed: false,
    enrolled_at: new Date().toISOString(),
    course: {
      id: '2',
      title: 'Investment Strategies',
      description: 'Explore different investment options and strategies for long-term growth',
      image_url: '/images/course-placeholder.jpg',
      main_subject: 'Investments'
    }
  },
  {
    id: '3',
    user_id: 'demo-user',
    course_id: '3',
    progress: 45,
    completed: false,
    enrolled_at: new Date().toISOString(),
    course: {
      id: '3',
      title: 'Retirement Planning',
      description: 'Prepare for a secure retirement with effective planning techniques',
      image_url: '/images/course-placeholder.jpg',
      main_subject: 'Planning'
    }
  }
];

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserEnrollments() {
      try {
        setIsLoading(true);
        
        // Check if user is logged in
        const { data: user, error: userError } = await getUser();
        
        if (userError || !user) {
          console.error('No user found:', userError);
          setEnrollments(DEMO_ENROLLMENTS); // Use demo data when not logged in
          setIsLoading(false);
          return;
        }
        
        try {
          // Fetch user enrollments from the API
          const response = await fetch('/api/user/enrollments');
          
          if (response.status === 401) {
            console.log('User not authenticated, using demo data');
            setEnrollments(DEMO_ENROLLMENTS);
            return;
          }
          
          if (!response.ok) {
            throw new Error(`Error fetching enrollments: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data && data.length > 0) {
            setEnrollments(data);
          } else {
            // Use demo enrollments if no data is returned
            console.log('No enrollments found, using demo data');
            setEnrollments(DEMO_ENROLLMENTS);
          }
        } catch (error) {
          // Use fallback demo data if API call fails
          console.error('Error fetching enrollments, using demo data:', error);
          setEnrollments(DEMO_ENROLLMENTS);
        }
      } catch (error) {
        console.error('Error in fetchUserEnrollments:', error);
        setEnrollments(DEMO_ENROLLMENTS); // Use demo data as fallback
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserEnrollments();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="mt-2 text-gray-600">Continue learning where you left off</p>
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