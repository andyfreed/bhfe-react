'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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
  admin?: User;
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

  // Fetch enrollments, users, and courses on page load
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch enrollments
        const enrollmentsResponse = await fetch('/api/admin/enrollments');
        if (!enrollmentsResponse.ok) {
          throw new Error(`Error fetching enrollments: ${enrollmentsResponse.status}`);
        }
        const enrollmentsData = await enrollmentsResponse.json();
        setEnrollments(enrollmentsData);

        // Fetch users from Supabase
        const { data: usersData, error: usersError } = await supabase
          .from('auth.users')
          .select('id, email')
          .order('email');
        
        if (usersError) throw usersError;
        setUsers(usersData || []);

        // Fetch courses from Supabase
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, main_subject')
          .order('title');
        
        if (coursesError) throw coursesError;
        setCourses(coursesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Function to create a new enrollment
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
      const response = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser,
          course_id: selectedCourse,
          notes: enrollmentNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create enrollment');
      }

      const newEnrollment = await response.json();

      // Refresh enrollments list
      const updatedEnrollmentsResponse = await fetch('/api/admin/enrollments');
      const updatedEnrollments = await updatedEnrollmentsResponse.json();
      setEnrollments(updatedEnrollments);

      // Reset form
      setSelectedUser('');
      setSelectedCourse('');
      setEnrollmentNotes('');
      setSuccessMessage('Enrollment created successfully!');
    } catch (error) {
      console.error('Error creating enrollment:', error);
      setErrorMessage((error as Error).message || 'Failed to create enrollment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to delete an enrollment
  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to remove this enrollment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete enrollment');
      }

      // Remove enrollment from state
      setEnrollments(enrollments.filter(e => e.id !== enrollmentId));
      setSuccessMessage('Enrollment deleted successfully!');
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      setErrorMessage((error as Error).message || 'Failed to delete enrollment');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Manage User Enrollments</h1>
      
      {/* Success and error messages */}
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          {successMessage}
        </div>
      )}
      {errorMessage && (
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
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {enrollment.user?.email || 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {enrollment.course?.title || 'Unknown Course'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1 max-w-[100px]">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full"
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{enrollment.progress}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        enrollment.completed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {enrollment.completed ? 'Completed' : 'In Progress'}
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