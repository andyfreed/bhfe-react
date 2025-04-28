'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getUser } from '@/lib/authService';

// Define tab sections
type TabSection = 'overview' | 'courses' | 'certificates' | 'orders' | 'settings';

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

export default function AccountPage() {
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabSection>('overview');
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
      
      // Try the new simplified enrollment endpoint first
      try {
        const newResponse = await fetch(`/api/user/my-enrollments?email=${encodeURIComponent(user.email)}&t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (newResponse.ok) {
          const newData = await newResponse.json();
          console.log('Response from new enrollments endpoint:', newData);
          
          if (newData.enrollments && newData.enrollments.length > 0) {
            console.log(`Found ${newData.enrollments.length} enrollments using new endpoint`);
            setEnrollmentCount(newData.enrollments.length);
            setEnrollments(newData.enrollments);
            setIsLoading(false);
            return;
          } else {
            console.log('No enrollments found using new endpoint');
          }
        } else {
          console.log('New endpoint failed with status:', newResponse.status);
        }
      } catch (newEndpointError) {
        console.error('Error with new endpoint:', newEndpointError);
      }
      
      // Fall back to the original endpoint if the new one failed or returned no results
      console.log('Falling back to original enrollment endpoint');
      
      // Fetch user enrollments from the API with cache busting
      const response = await fetch(`/api/user/enrollments?t=${Date.now()}&include_course_details=true&debug_email=${encodeURIComponent(user.email)}`, {
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
      
      // Check if we got enrollments
      if (data && Array.isArray(data.enrollments)) {
        if (data.enrollments.length === 0) {
          console.log('No enrollments found for this user');
          
          // Try directly fixing enrollments
          console.log('Attempting to fix enrollments...');
          try {
            const fixResponse = await fetch(`/api/debug/fix-enrollments?email=${encodeURIComponent(user.email)}`);
            if (fixResponse.ok) {
              const fixResult = await fixResponse.json();
              console.log('Fix enrollments result:', fixResult);
              
              if (fixResult.fixedEnrollments > 0) {
                console.log(`Fixed ${fixResult.fixedEnrollments} enrollments, reloading...`);
                // Retry fetching enrollments after fix
                const retryResponse = await fetch(`/api/user/enrollments?t=${Date.now()}&include_course_details=true`, {
                  headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                  }
                });
                
                if (retryResponse.ok) {
                  const retryData = await retryResponse.json();
                  console.log('Retry enrollment data:', retryData);
                  
                  if (retryData.enrollments && retryData.enrollments.length > 0) {
                    setEnrollmentCount(retryData.enrollments.length);
                    setEnrollments(retryData.enrollments);
                    return;
                  }
                }
              }
            } else {
              console.log('Fix enrollments failed:', await fixResponse.text());
            }
          } catch (fixError) {
            console.error('Error fixing enrollments:', fixError);
          }
          
          setEnrollmentCount(0);
        } else {
          console.log(`Found ${data.enrollments.length} enrollments`);
          setEnrollmentCount(data.enrollments.length);
          
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
            href={`/courses/${enrollment.course.id}/content`}
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

  useEffect(() => {
    async function fetchUserData() {
      try {
        setIsLoading(true);
        
        // Check if the user is logged in
        const { data: user, error } = await getUser();
        
        if (error || !user) {
          console.error('No user found:', error);
          router.push('/auth/login');
          return;
        }
        
        setUserEmail(user.email || '');
        setUserName(user.user_metadata?.full_name || 'Student');
        
        // Fetch enrollment data
        await fetchUserEnrollments();
        
        // Check if there's a tab parameter in the URL
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const tabParam = urlParams.get('tab');
          
          // Set the active tab if a valid tab is specified
          if (tabParam && ['overview', 'courses', 'certificates', 'orders', 'settings'].includes(tabParam as TabSection)) {
            setActiveTab(tabParam as TabSection);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserData();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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
        {/* Account Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {userName}</h1>
              <p className="text-gray-600 mt-1">{userEmail}</p>
            </div>
            <button
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto scrollbar-hide pb-px" aria-label="Account navigation">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'courses', label: 'My Courses' },
                { id: 'certificates', label: 'Certificates' },
                { id: 'orders', label: 'Order History' },
                { id: 'settings', label: 'Account Settings' }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  className={`py-4 px-5 sm:px-6 font-medium text-sm border-b-2 flex-shrink-0 whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'border-indigo-500 text-indigo-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(tab.id as TabSection)}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Enrolled Courses */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">My Courses</h3>
                  <p className="text-3xl font-bold text-indigo-600 mb-4">{enrollmentCount}</p>
                  <button 
                    onClick={() => setActiveTab('courses')}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm inline-flex items-center"
                  >
                    View all courses
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                {/* Available Credits */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Available Credits</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">CPA</span>
                      <span className="font-medium text-gray-900">12 credits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CFP®</span>
                      <span className="font-medium text-gray-900">8 credits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">EA</span>
                      <span className="font-medium text-gray-900">4 credits</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('certificates')}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm inline-flex items-center"
                  >
                    View certificates
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                {/* Recent Activity */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Activity</h3>
                  <div className="space-y-3 mb-4">
                    <div className="border-l-4 border-indigo-500 pl-3">
                      <p className="text-sm text-gray-600">Enrolled in course</p>
                      <p className="font-medium">Ethical Frameworks in Accounting</p>
                      <p className="text-xs text-gray-500">2 days ago</p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-3">
                      <p className="text-sm text-gray-600">Completed course</p>
                      <p className="font-medium">Tax Planning for Small Businesses</p>
                      <p className="text-xs text-gray-500">1 week ago</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recommended Courses</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600 mb-4">Discover courses tailored to your interests and career goals</p>
                  <Link
                    href="/courses"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Browse Courses
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'courses' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : error ? (
                <div className="bg-white rounded-lg p-8 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={fetchUserEnrollments}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Try Again
                  </button>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">You haven't enrolled in any courses yet</h3>
                  <p className="text-gray-600 mb-4">Browse our catalog to find courses that match your interests</p>
                  <Link
                    href="/courses"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <>
                  {/* Active Courses Section */}
                  {activeEnrollments.length > 0 && (
                    <div className="mb-10">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Active Courses</h3>
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
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Completed Courses</h3>
                      <div className="space-y-4">
                        {completedEnrollments.map((enrollment) => (
                          <CourseCard key={enrollment.id} enrollment={enrollment} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {activeTab === 'certificates' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">My Certificates</h2>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Certificates will appear here</h3>
                <p className="text-gray-600 mb-4">Complete courses to earn certificates and continuing education credits</p>
              </div>
            </div>
          )}
          
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order History</h2>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent orders</h3>
                <p className="text-gray-600 mb-4">Your purchase history will appear here</p>
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={userName}
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={userEmail}
                          disabled
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                        Update Profile
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Password & Security</h3>
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <p className="text-gray-600 mb-4">Update your password or security settings</p>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                      Change Password
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Email Preferences</h3>
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <p className="text-gray-600 mb-4">Manage your email notification preferences</p>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="course-updates"
                            name="course-updates"
                            type="checkbox"
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="course-updates" className="font-medium text-gray-700">Course updates</label>
                          <p className="text-gray-500">Receive notifications about course content updates</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="new-courses"
                            name="new-courses"
                            type="checkbox"
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="new-courses" className="font-medium text-gray-700">New courses</label>
                          <p className="text-gray-500">Receive notifications about new courses</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
                  <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                    <p className="text-gray-700 mb-4">Permanently delete your account and all of your data</p>
                    <button
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 