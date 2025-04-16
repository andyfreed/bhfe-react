'use client';
import { useState, useEffect } from 'react';
import { supabase, createServerSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
}

interface Course {
  id: string;
  title: string;
  main_subject?: string;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  completed: boolean;
  enrolled_at: string;
  enrollment_type: string;
  enrollment_notes?: string;
  user: User;
  course: Course;
}

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [enrollmentNotes, setEnrollmentNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [isDev, setIsDev] = useState(false);

  // Mock data to use if database connection fails
  const mockUsers: User[] = [
    { id: 'mock-user-1', email: 'student1@example.com' },
    { id: 'mock-user-2', email: 'student2@example.com' },
    { id: 'mock-user-3', email: 'instructor@example.com' },
  ];

  const mockCourses: Course[] = [
    { id: 'mock-course-1', title: 'Introduction to Accounting', main_subject: 'Accounting' },
    { id: 'mock-course-2', title: 'Tax Preparation Basics', main_subject: 'Tax' },
    { id: 'mock-course-3', title: 'Advanced Financial Planning', main_subject: 'Finance' },
  ];

  const mockEnrollments: Enrollment[] = [
    {
      id: 'mock-enrollment-1',
      user_id: 'mock-user-1',
      course_id: 'mock-course-1',
      progress: 35,
      completed: false,
      enrolled_at: new Date().toISOString(),
      enrollment_type: 'paid',
      user: mockUsers[0],
      course: mockCourses[0],
    },
    {
      id: 'mock-enrollment-2',
      user_id: 'mock-user-2',
      course_id: 'mock-course-2',
      progress: 100,
      completed: true,
      enrolled_at: new Date().toISOString(),
      enrollment_type: 'admin',
      enrollment_notes: 'Complimentary enrollment',
      user: mockUsers[1],
      course: mockCourses[1],
    },
  ];

  useEffect(() => {
    // Check if we're in development mode
    setIsDev(process.env.NODE_ENV === 'development');
    // In development, only use mock data if necessary (not by default)
    // if (process.env.NODE_ENV === 'development') {
    //   setUsingMockData(true);
    // }
  }, []);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        console.log('🔍 Fetching enrollments data...');
        // Fetch enrollments with users and courses from API
        const enrollmentsResponse = await fetch('/api/enrollments');
        const enrollmentsData = await enrollmentsResponse.json();

        console.log('📊 Enrollments response:', enrollmentsData);
        
        if (!enrollmentsResponse.ok) {
          const error = enrollmentsData.error || enrollmentsResponse.statusText;
          console.warn('Error fetching enrollments:', error);
          setUsingMockData(true);
        } else if (Array.isArray(enrollmentsData) && enrollmentsData.length > 0) {
          setEnrollments(enrollmentsData);
          setUsingMockData(false);
        } else {
          console.warn('No enrollment data returned');
          // Only use mock data if we specifically need to
          if (isDev) {
            console.log('Using mock data in development mode due to empty response');
            setUsingMockData(true);
          }
        }

        console.log('🔍 Fetching users...');
        // Fetch users
        const usersResponse = await fetch('/api/users');
        
        if (!usersResponse.ok) {
          console.warn('Error fetching users:', usersResponse.statusText);
          if (usingMockData) {
            setUsers(mockUsers);
          }
        } else {
          const usersData = await usersResponse.json();
          if (Array.isArray(usersData) && usersData.length > 0) {
            setUsers(usersData);
          } else if (usingMockData) {
            setUsers(mockUsers);
          }
        }

        console.log('🔍 Fetching courses...');
        // Fetch courses
        const coursesResponse = await fetch('/api/courses');
        
        if (!coursesResponse.ok) {
          console.warn('Error fetching courses:', coursesResponse.statusText);
          if (usingMockData) {
            setCourses(mockCourses);
          }
        } else {
          const coursesData = await coursesResponse.json();
          if (Array.isArray(coursesData) && coursesData.length > 0) {
            setCourses(coursesData);
          } else if (usingMockData) {
            setCourses(mockCourses);
          }
        }

        // If we're using mock data, set mock enrollments
        if (usingMockData) {
          setEnrollments(mockEnrollments);
          setErrorMessage('⚠️ Using demonstration data. Database connection issue or missing tables detected.');
        } else {
          setErrorMessage(null);
        }
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        setErrorMessage('Failed to load data. Using demonstration data instead.');
        // Use mock data on error
        setUsingMockData(true);
        setUsers(mockUsers);
        setCourses(mockCourses);
        setEnrollments(mockEnrollments);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [usingMockData, isDev]);

  // Handle enrollment creation
  const handleCreateEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedCourse) {
      setErrorMessage('Please select both a user and a course.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // If using mock data, create a mock enrollment
      if (usingMockData) {
        // Create a mock enrollment
        const mockEnrollment: Enrollment = {
          id: `mock-enrollment-${Date.now()}`,
          user_id: selectedUser,
          course_id: selectedCourse,
          progress: 0,
          completed: false,
          enrolled_at: new Date().toISOString(),
          enrollment_type: 'admin',
          enrollment_notes: enrollmentNotes || undefined,
          // Link to the selected user and course
          user: users.find(u => u.id === selectedUser) as User,
          course: courses.find(c => c.id === selectedCourse) as Course,
        };
        
        // Add to local state
        setEnrollments([...enrollments, mockEnrollment]);
        setSelectedUser('');
        setSelectedCourse('');
        setEnrollmentNotes('');
        setSuccessMessage('Enrollment created successfully! (DEMO MODE)');
        return;
      }

      const newEnrollment = {
        user_id: selectedUser,
        course_id: selectedCourse,
        progress: 0,
        completed: false,
        enrollment_type: 'admin',
        enrollment_notes: enrollmentNotes || null,
      };
      
      console.log('Creating new enrollment:', newEnrollment);
      
      // Create a server-side API request instead of client-side
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEnrollment),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response from API:', errorData);
        throw new Error(errorData.error || `Failed to create enrollment: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data) {
        console.log('Successfully created enrollment:', data);
        
        // Refresh enrollments to get the latest data
        fetchEnrollments();
        
        setSelectedUser('');
        setSelectedCourse('');
        setEnrollmentNotes('');
        setSuccessMessage('Enrollment created successfully!');
      } else {
        console.warn('No data returned after enrollment creation');
        setSuccessMessage('Enrollment created. Please refresh to see changes.');
      }
    } catch (error: any) {
      console.error('Error creating enrollment:', error);
      if (error.message?.includes('violates unique constraint') || error.message?.includes('duplicate key')) {
        setErrorMessage('This user is already enrolled in this course.');
      } else {
        setErrorMessage(error.message || 'Failed to create enrollment');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to fetch enrollments
  const fetchEnrollments = async () => {
    try {
      const response = await fetch('/api/enrollments');
      if (!response.ok) {
        throw new Error('Failed to fetch enrollments');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setEnrollments(data);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  // Handle enrollment deletion
  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to remove this enrollment?')) {
      return;
    }

    try {
      // If using mock data, just remove from local state
      if (usingMockData) {
        setEnrollments(enrollments.filter(e => e.id !== enrollmentId));
        setSuccessMessage('Enrollment deleted successfully! (DEMO MODE)');
        return;
      }

      console.log('Deleting enrollment with ID:', enrollmentId);
      
      // Delete via API endpoint
      const response = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response from API:', errorData);
        throw new Error(errorData.error || `Failed to delete enrollment: ${response.statusText}`);
      }
      
      console.log('Successfully deleted enrollment');
      setEnrollments(enrollments.filter(e => e.id !== enrollmentId));
      setSuccessMessage('Enrollment deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting enrollment:', error);
      setErrorMessage(error.message || 'Failed to delete enrollment');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Enrollments</h1>
        <Link
          href="/admin/enrollments/manual"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Manual Enrollment
        </Link>
      </div>
      
      {/* Mock data indicator */}
      {usingMockData && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <div className="flex items-center">
            <svg className="h-6 w-6 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">DEMONSTRATION MODE</span>
          </div>
          <p className="mt-1">
            {isDev ? (
              <>
                <strong>Development environment:</strong> Using demonstration data because the required database tables don't exist yet.
                <br />
                <span className="text-sm mt-1 block">
                  To fix this, create the <code className="bg-yellow-50 px-1 py-0.5 rounded">users</code> and <code className="bg-yellow-50 px-1 py-0.5 rounded">enrollments</code> tables in your Supabase database.
                  <br />
                  See the <code className="bg-yellow-50 px-1 py-0.5 rounded">create-tables.sql</code> file in the project root.
                </span>
              </>
            ) : (
              'Using mock data because the database connection failed. Changes made here will not be saved to the database.'
            )}
          </p>
          <div className="mt-2">
            <button 
              onClick={() => window.location.reload()} 
              className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}
      
      {/* Success and error messages */}
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          {successMessage}
        </div>
      )}
      {errorMessage && !usingMockData && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {errorMessage}
        </div>
      )}

      {/* Create enrollment form */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Enroll User in Course</h2>
        <form onSubmit={handleCreateEnrollment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">-- Select User --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">-- Select Course --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={enrollmentNotes}
              onChange={(e) => setEnrollmentNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Enrolling...' : 'Enroll User'}
            </button>
          </div>
        </form>
      </div>

      {/* Enrollments list */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b">Current Enrollments</h2>
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
            <p>Loading enrollments...</p>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No enrollments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrolled On
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{enrollment.user?.email || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{enrollment.course?.title || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{enrollment.course?.main_subject || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${enrollment.completed ? 'bg-green-600' : 'bg-blue-600'}`}
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {enrollment.progress}% {enrollment.completed && '(Completed)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        enrollment.enrollment_type === 'self' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {enrollment.enrollment_type === 'self' ? 'Self-enrolled' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteEnrollment(enrollment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 