'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/authService';

interface Course {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  main_subject?: string;
  credits?: {
    id: string;
    amount: number;
    credit_type: string;
  }[];
  formats?: {
    id: string;
    price: number;
    format: string;
  }[];
  creditsByType?: Record<string, number>;
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
      
      // Fetch user enrollments from the API with cache busting
      const response = await fetch(`/api/user/enrollments?t=${Date.now()}&include_course_details=true`, {
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
      console.log('Raw enrollment data received:', data);
      
      // The API returns { enrollments: [...] }
      if (data && Array.isArray(data.enrollments)) {
        if (data.enrollments.length === 0) {
          console.log('No enrollments found for this user');
        } else {
          console.log(`Found ${data.enrollments.length} enrollments`);
          
          // Get all course IDs from enrollments
          const courseIds = data.enrollments.map((e: Enrollment) => e.course_id);
          
          // Fetch all courses and filter for the ones we need
          try {
            const allCoursesResponse = await fetch('/api/public/courses');
            if (allCoursesResponse.ok) {
              const allCoursesData = await allCoursesResponse.json();
              
              // Create a map of course details by ID
              const courseDetailsMap: Record<string, Course> = {};
              allCoursesData.forEach((course: Course) => {
                courseDetailsMap[course.id] = course;
              });
              
              // Enhance enrollments with detailed course info
              const enhancedEnrollments = data.enrollments.map((enrollment: Enrollment) => {
                const detailedCourse = courseDetailsMap[enrollment.course_id];
                if (detailedCourse) {
                  return {
                    ...enrollment,
                    course: {
                      ...enrollment.course,
                      ...detailedCourse
                    }
                  };
                }
                return enrollment;
              });
              
              console.log('Enhanced enrollments:', enhancedEnrollments);
              setEnrollments(enhancedEnrollments);
            } else {
              console.error('Failed to fetch course details:', allCoursesResponse.status);
              setEnrollments(data.enrollments);
            }
          } catch (error) {
            console.error('Error fetching course details:', error);
            setEnrollments(data.enrollments);
          }
        }
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

  // Debug function to log course data
  useEffect(() => {
    if (enrollments.length > 0) {
      console.log('First course data:', enrollments[0].course);
      console.log('Credits structure:', enrollments[0].course.credits);
      console.log('CreditsByType structure:', enrollments[0].course.creditsByType);
    }
  }, [enrollments]);

  // Function to refresh enrollments
  const handleRefresh = () => {
    fetchUserEnrollments();
  };

  // Separate enrollments into active and completed
  const activeEnrollments = enrollments.filter(enrollment => !enrollment.completed);
  const completedEnrollments = enrollments.filter(enrollment => enrollment.completed);

  // Credit type colors
  const creditColors = {
    'CPA': 'bg-blue-50 text-blue-700',
    'CFP': 'bg-green-50 text-green-700',
    'EA': 'bg-amber-50 text-amber-700',
    'ERPA': 'bg-purple-50 text-purple-700',
    'CDFA': 'bg-rose-50 text-rose-700',
    'IWI': 'bg-teal-50 text-teal-700',
    'CIMA': 'bg-teal-50 text-teal-700',
    'CE': 'bg-gray-50 text-gray-700',
    'default': 'bg-gray-50 text-gray-700'
  };

  // Helper function to get the appropriate color for a credit type
  const getCreditColor = (creditType: string) => {
    for (const [key, value] of Object.entries(creditColors)) {
      if (creditType.includes(key)) {
        return value;
      }
    }
    return creditColors.default;
  };

  // Card component to avoid repetition
  const CourseCard = ({ enrollment }: { enrollment: Enrollment }) => (
    <div key={enrollment.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow mb-4">
      <div className="p-6 flex flex-row items-stretch">
        <div className="flex-grow pr-4">
          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{enrollment.course.title}</h2>
        </div>
        
        {/* Credits display - moved to right column */}
        <div className="w-1/3 flex flex-col justify-start pl-4 border-l border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Credits:</h3>
          <div className="flex flex-col space-y-2">
            {enrollment.course.credits && enrollment.course.credits.length > 0 ? (
              // Show actual credits from API
              enrollment.course.credits.map((credit, index) => (
                <span 
                  key={index} 
                  className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${getCreditColor(credit.credit_type)}`}
                >
                  {credit.credit_type}: {credit.amount}
                </span>
              ))
            ) : (
              // Show fallback credits based on course title hints
              <>
                {enrollment.course.title && enrollment.course.title.includes('CPA') && (
                  <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-blue-50 text-blue-700">
                    CPA: 2
                  </span>
                )}
                {enrollment.course.title && enrollment.course.title.includes('CFP') && (
                  <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-green-50 text-green-700">
                    CFP®: 2
                  </span>
                )}
                {enrollment.course.title && enrollment.course.title.includes('EA') && (
                  <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-amber-50 text-amber-700">
                    EA: 2
                  </span>
                )}
                {(!enrollment.course.title || 
                  (!enrollment.course.title.includes('CPA') && 
                   !enrollment.course.title.includes('CFP') && 
                   !enrollment.course.title.includes('EA'))) && (
                  <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-gray-50 text-gray-700">
                    CE Credits: 2
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Button Area */}
        <div className="flex items-center justify-center pl-4 border-l border-gray-100">
          <Link
            href={`/courses/${enrollment.course.id}`}
            className="flex flex-col items-center justify-center text-center group"
          >
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mb-2 transition-all duration-300 ease-in-out group-hover:bg-indigo-200 group-hover:shadow-md group-hover:scale-110">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-7 w-7 text-indigo-600 transition-transform duration-300 ease-in-out group-hover:translate-x-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M14 5l7 7m0 0l-7 7m7-7H3" 
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 transition-colors duration-300 group-hover:text-indigo-600">Enter</span>
          </Link>
        </div>
      </div>
    </div>
  );

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
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
          <div>
            {/* Active Courses Section */}
            {activeEnrollments.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">Active Courses</h2>
                <div className="space-y-4">
                  {activeEnrollments.map((enrollment) => (
                    <CourseCard key={enrollment.id} enrollment={enrollment} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Completed Courses Section */}
            {completedEnrollments.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">Completed Courses</h2>
                <div className="space-y-4">
                  {completedEnrollments.map((enrollment) => (
                    <CourseCard key={enrollment.id} enrollment={enrollment} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 