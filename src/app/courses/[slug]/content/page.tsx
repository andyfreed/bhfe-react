'use client';

import React, { use } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/authService';
import type { User } from '@supabase/supabase-js';

interface Course {
  id: string;
  title: string;
  description: string;
  author?: string;
  main_subject?: string;
  image_url?: string;
  course_content_url?: string;
  table_of_contents_url?: string;
  credits?: {
    id: string;
    amount: number;
    credit_type: string;
  }[];
}

interface Enrollment {
  id: string;
  course_id: string;
  progress: number;
  completed: boolean;
  enrolled_at: string;
  course: Course;
}

// Define params interface
interface CourseParams {
  slug: string;
}

export default function CourseContentPage() {
  // Get slug from URL params using the useParams hook and unwrap it properly
  const params = useParams();
  // Properly unwrap the params object
  const courseId = Array.isArray(params.slug) ? params.slug[0] : (params.slug as string);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'exam'>('content');
  const [exams, setExams] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchCourseAndEnrollment() {
      try {
        setIsLoading(true);
        setError(null);

        // Check if user is logged in
        const { data: user, error: userError } = await getUser();
        console.log('User login check result:', user ? 'Logged in' : 'Not logged in', userError ? `Error: ${userError.message}` : '');
        
        if (userError || !user) {
          console.error('User not logged in or error:', userError);
          router.push('/auth/login');
          return;
        }

        const typedUser = user as User;
        if (!typedUser.email) {
          console.error('User has no email address');
          router.push('/auth/login');
          return;
        }

        // First check if the user is enrolled in this course
        const enrollmentCheckUrl = `/api/user/enrollments/check?courseId=${courseId}&email=${encodeURIComponent(typedUser.email)}`;
        console.log('Checking enrollment with URL:', enrollmentCheckUrl);
        
        const enrollmentCheckResponse = await fetch(enrollmentCheckUrl, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          credentials: 'include'
        });
        
        console.log('Enrollment check response status:', enrollmentCheckResponse.status);
        
        let enrollmentCheckData;
        try {
          enrollmentCheckData = await enrollmentCheckResponse.json();
          console.log('Enrollment check result:', enrollmentCheckData);
        } catch (jsonError) {
          console.error('Failed to parse enrollment check JSON response:', jsonError);
          router.push(`/courses/${courseId}`);
          return;
        }
        
        if (!enrollmentCheckResponse.ok || !enrollmentCheckData.isEnrolled) {
          console.error('Enrollment check failed:', JSON.stringify(enrollmentCheckData));
          // Not enrolled, redirect to course page
          router.push(`/courses/${courseId}`);
          return;
        }
        
        console.log('User is enrolled in this course, proceeding to fetch content');

        // Fetch course details with auth credentials
        const courseResponse = await fetch(`/api/courses/${courseId}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Accept': 'application/json'
          },
          credentials: 'include',
          mode: 'cors'
        });
        
        console.log('Course response status:', courseResponse.status);
        
        if (!courseResponse.ok) {
          console.error('Course fetch error:', courseResponse.status);
          
          // Try to get more detailed error info
          try {
            const errorData = await courseResponse.json();
            console.error('Course fetch error details:', errorData);
            throw new Error(`Failed to fetch course: ${courseResponse.status} - ${errorData.error || 'Unknown error'}`);
          } catch (parseError) {
            // If we can't parse the error, just throw with the status code
            throw new Error(`Failed to fetch course: ${courseResponse.status}`);
          }
        }
        
        const courseData = await courseResponse.json();
        console.log('Course data received:', courseData ? 'Data received' : 'No data', 
                   'Course ID:', courseData?.id,
                   'Title:', courseData?.title);
        setCourse(courseData);

        // Fetch course exams with auth credentials
        const examsResponse = await fetch(`/api/courses/${courseId}/exams`, {
          credentials: 'include'
        });
        
        if (examsResponse.ok) {
          const examsData = await examsResponse.json();
          setExams(examsData);
          console.log('Course exams:', examsData);
        } else {
          console.error('Failed to fetch exams:', examsResponse.status);
        }

        // Set enrollment information from the check data
        setEnrollment({
          id: enrollmentCheckData.enrollment.id,
          course_id: courseId,
          progress: enrollmentCheckData.enrollment.progress,
          completed: enrollmentCheckData.enrollment.completed,
          enrolled_at: new Date().toISOString(), // We don't have this from check, use current date
          course: courseData
        });

      } catch (error: any) {
        console.error('Error fetching course data:', error);
        setError(`Failed to load course content. Please try again later. (${error.message})`);
      } finally {
        setIsLoading(false);
      }
    }

    if (courseId) {
      fetchCourseAndEnrollment();
    }
  }, [courseId, router]);

  const handleMarkComplete = async () => {
    try {
      if (!enrollment) return;
      
      const response = await fetch(`/api/user/enrollments/${enrollment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: true,
          progress: 100
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update enrollment status');
      }
      
      // Update local state
      setEnrollment({
        ...enrollment,
        completed: true,
        progress: 100
      });
      
      alert('Course marked as completed!');
    } catch (error) {
      console.error('Error marking course as complete:', error);
      alert('Failed to mark course as complete. Please try again.');
    }
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link 
              href="/account?tab=courses"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Return to My Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!course || !enrollment) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Course Not Found</h2>
            <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or you're not enrolled.</p>
            <Link 
              href="/account?tab=courses"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Return to My Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-6">
          <Link 
            href="/account?tab=courses"
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to My Courses
          </Link>
        </div>

        {/* Course header */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-6 sm:p-8">
            {course.main_subject && (
              <div className="mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {course.main_subject}
                </span>
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>

            {/* Course credits */}
            {course.credits && course.credits.length > 0 && (
              <div className="mb-2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Credits Offered:</h3>
                <div className="flex flex-wrap gap-2">
                  {course.credits.map((credit, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-blue-50 text-blue-700"
                    >
                      {credit.credit_type}: {credit.amount}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto scrollbar-hide pb-px" aria-label="Course content navigation">
              <button 
                className={`py-4 px-6 font-medium text-sm border-b-2 flex-shrink-0 whitespace-nowrap ${
                  activeTab === 'content' 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('content')}
                aria-current={activeTab === 'content' ? 'page' : undefined}
              >
                Course Content
              </button>
              <button 
                className={`py-4 px-6 font-medium text-sm border-b-2 flex-shrink-0 whitespace-nowrap ${
                  activeTab === 'exam' 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('exam')}
                aria-current={activeTab === 'exam' ? 'page' : undefined}
              >
                Take Exam
              </button>
            </nav>
          </div>
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {activeTab === 'content' && (
            <div className="p-6 sm:p-8">
              <div className="prose max-w-none">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Description</h2>
                <div dangerouslySetInnerHTML={{ __html: course.description.replace(/_x000D_/g, '').replace(/\r\n/g, '<br>') }} />
              </div>
              
              <div className="mt-8">
                {/* Course PDF */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Course Material</h3>
                  <p className="text-gray-600 mb-4">Access the full course content in PDF format.</p>
                  
                  {course.course_content_url && !course.course_content_url.includes('error') ? (
                    <a 
                      href={course.course_content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 00-1.414-1.414L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Download Course PDF
                    </a>
                  ) : (
                    <button 
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-not-allowed"
                      disabled
                    >
                      Course PDF Not Available
                    </button>
                  )}
                  
                  {/* Table of contents link if available */}
                  {course.table_of_contents_url && !course.table_of_contents_url.includes('error') ? (
                    <a 
                      href={course.table_of_contents_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ml-4"
                    >
                      <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      View Table of Contents
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'exam' && (
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Exam</h2>
              
              <div className="space-y-6">
                <p className="text-gray-600">
                  Complete this exam to earn your continuing education credits. You must score at least 70% to pass.
                </p>
                
                <div className="flex flex-col sm:flex-row sm:space-x-4">
                  {exams && exams.length > 0 ? (
                    <Link
                      href={`/courses/${courseId}/exam?examId=${exams[0].id}`}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto mb-3 sm:mb-0"
                    >
                      <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Start Exam Now
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-gray-100 cursor-not-allowed w-full sm:w-auto mb-3 sm:mb-0"
                    >
                      <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      No Exams Available
                    </button>
                  )}
                  
                  <button
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto"
                    disabled={!(exams && exams.length > 0)}
                  >
                    <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download Exam PDF
                  </button>
                </div>
                
                {exams && exams.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Exam Information</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{exams[0].title}</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>No time limit</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{exams[0].passing_score}% passing score required</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Unlimited attempts</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 