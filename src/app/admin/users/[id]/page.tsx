'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import UserProfileForm from '@/components/admin/UserProfileForm';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  role?: string;
  profile?: {
    full_name?: string;
    company?: string;
    phone?: string;
  };
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  completed: boolean;
  enrolled_at: string;
  completed_at?: string;
  enrollment_notes?: string;
  course: {
    id: string;
    title: string;
    main_subject?: string;
    description?: string;
  };
}

interface Course {
  id: string;
  title: string;
  main_subject?: string;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [enrollmentNotes, setEnrollmentNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch user details and enrollments
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch user details from API endpoint instead of direct table query
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }
        
        const userData = await response.json();
        
        // Set user state with API response data
        setUser({
          id: userData.id,
          email: userData.email,
          created_at: userData.created_at,
          last_sign_in_at: userData.last_sign_in_at,
          role: userData.role || 'user',
          profile: {
            full_name: userData.full_name || '',
            company: userData.company || '',
            phone: userData.phone || ''
          }
        });

        // Fetch user enrollments
        const enrollmentsResponse = await fetch(`/api/admin/enrollments?userId=${userId}`);
        if (!enrollmentsResponse.ok) {
          throw new Error(`Error fetching user enrollments: ${enrollmentsResponse.status}`);
        }
        const enrollmentData = await enrollmentsResponse.json();
        setEnrollments(enrollmentData.enrollments || []);

        // Fetch all courses
        const coursesResponse = await fetch(`/api/admin/courses`);
        if (!coursesResponse.ok) {
          throw new Error(`Error fetching courses: ${coursesResponse.status}`);
        }
        const courseData = await coursesResponse.json();

        // Filter out courses the user is already enrolled in
        const enrolledCourseIds = new Set(enrollmentData.enrollments?.map((e: Enrollment) => e.course_id) || []);
        const availableCourses = courseData.courses?.filter((course: Course) => !enrolledCourseIds.has(course.id)) || [];
        
        setAvailableCourses(availableCourses);
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage('Failed to load user data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      fetchData();
    }
  }, [userId]);

  // Function to create a new enrollment
  const handleCreateEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) {
      setErrorMessage('Please select a course.');
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
          user_id: userId,
          course_id: selectedCourse,
          notes: enrollmentNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create enrollment');
      }

      const newEnrollment = await response.json();

      // Update the enrollments list and available courses
      const { data: courseData } = await supabase
        .from('courses')
        .select('id, title, main_subject, description')
        .eq('id', selectedCourse)
        .single();

      if (courseData) {
        const enrollment = {
          ...newEnrollment,
          course: courseData
        };
        
        setEnrollments([enrollment, ...enrollments]);
        setAvailableCourses(availableCourses.filter(c => c.id !== selectedCourse));
      }

      // Reset form
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
      const enrollmentToDelete = enrollments.find(e => e.id === enrollmentId);
      
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete enrollment');
      }

      // Remove enrollment from state
      setEnrollments(enrollments.filter(e => e.id !== enrollmentId));
      
      // Add the course back to available courses if it was removed
      if (enrollmentToDelete) {
        setAvailableCourses([...availableCourses, {
          id: enrollmentToDelete.course_id,
          title: enrollmentToDelete.course.title,
          main_subject: enrollmentToDelete.course.main_subject
        }]);
      }
      
      setSuccessMessage('Enrollment deleted successfully!');
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      setErrorMessage((error as Error).message || 'Failed to delete enrollment');
    }
  };

  // Function to handle password reset
  const handlePasswordReset = async () => {
    if (!confirm('Are you sure you want to send a password reset email to this user?')) {
      return;
    }
    
    setIsSendingPasswordReset(true);
    setErrorMessage(null);
    
    try {
      const response = await fetch(`/api/users/${userId}/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send password reset email');
      }
      
      setSuccessMessage('Password reset email sent successfully!');
    } catch (error) {
      console.error('Error sending password reset:', error);
      setErrorMessage((error as Error).message || 'Failed to send password reset email');
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  // Function to toggle user role
  const handleRoleChange = async () => {
    const newRole = user?.role === 'admin' ? 'user' : 'admin';
    const confirmMessage = newRole === 'admin' 
      ? 'Are you sure you want to make this user an admin? They will have full access to the admin panel.'
      : 'Are you sure you want to remove admin privileges from this user?';
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    setIsChangingRole(true);
    setErrorMessage(null);
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.email,
          full_name: user?.profile?.full_name,
          company: user?.profile?.company,
          phone: user?.profile?.phone,
          role: newRole
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }
      
      const updatedUser = await response.json();
      
      // Update the user state with the new role
      setUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          role: updatedUser.role
        };
      });
      
      setSuccessMessage(`User role updated to ${newRole} successfully!`);
    } catch (error) {
      console.error('Error updating user role:', error);
      setErrorMessage((error as Error).message || 'Failed to update user role');
    } finally {
      setIsChangingRole(false);
    }
  };

  // Function to handle user deletion
  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone!')) {
      return;
    }
    
    if (!confirm('WARNING: All user data and enrollments will be permanently removed. Continue?')) {
      return;
    }
    
    setIsDeleting(true);
    setErrorMessage(null);
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      setSuccessMessage('User deleted successfully!');
      
      // Redirect back to users list after short delay
      setTimeout(() => {
        router.push('/admin/users');
      }, 2000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setErrorMessage((error as Error).message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to handle profile update success
  const handleProfileUpdateSuccess = (updatedData: any) => {
    // Update user state with new data
    setUser(prevUser => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        email: updatedData.email,
        role: updatedData.role,
        profile: {
          ...(prevUser.profile || {}),
          full_name: updatedData.full_name,
          company: updatedData.company,
          phone: updatedData.phone
        }
      };
    });
    
    setIsEditing(false);
    setSuccessMessage('User profile updated successfully!');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-2"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          User not found.
        </div>
        <Link href="/admin/users" className="text-indigo-600 hover:text-indigo-800">
          &larr; Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Details</h1>
        <Link
          href="/admin/users"
          className="text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          &larr; Back to Users
        </Link>
      </div>
      
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User profile information */}
        <div className="lg:col-span-1">
          {isEditing ? (
            <UserProfileForm
              userId={userId}
              initialData={{
                email: user.email,
                full_name: user.profile?.full_name,
                company: user.profile?.company,
                phone: user.profile?.phone,
                role: user.role
              }}
              onSuccess={handleProfileUpdateSuccess}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold mb-1">{user.email}</h2>
                  <p className="text-gray-500 text-sm">User ID: {user.id}</p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Edit Profile
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{user.profile?.full_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <p className="font-medium capitalize">{user.role || 'User'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Company</p>
                    <p className="font-medium">{user.profile?.company || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{user.profile?.phone || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Created</p>
                    <p className="font-medium">{new Date(user.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Sign In</p>
                    <p className="font-medium">
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleString() 
                        : 'Never signed in'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {/* Enroll in Course Form */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Enroll User in Course</h2>
            <form onSubmit={handleCreateEnrollment} className="space-y-4">
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
                  {availableCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                {availableCourses.length === 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    This user is already enrolled in all available courses.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={enrollmentNotes}
                  onChange={(e) => setEnrollmentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows={2}
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || availableCourses.length === 0}
                  className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    (isSubmitting || availableCourses.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Enrolling...' : 'Enroll User'}
                </button>
              </div>
            </form>
          </div>

          {/* User Enrollments */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Course Enrollments ({enrollments.length})</h2>
            </div>
            {enrollments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No enrollments found for this user.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
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
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {enrollment.course?.title || 'Unknown Course'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {enrollment.course?.main_subject || 'No category'}
                            </div>
                          </div>
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
                          {enrollment.completed && enrollment.completed_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              Completed on {new Date(enrollment.completed_at).toLocaleDateString()}
                            </div>
                          )}
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

          {/* Account Actions */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Account Actions</h2>
            </div>
            <div className="p-6 space-y-4">
              <button
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                onClick={handlePasswordReset}
                disabled={isSendingPasswordReset}
              >
                {isSendingPasswordReset ? 'Sending...' : 'Send Password Reset Email'}
              </button>
              <button
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50"
                onClick={handleRoleChange}
                disabled={isChangingRole}
              >
                {isChangingRole 
                  ? 'Updating...' 
                  : (user?.role === 'admin' ? 'Remove Admin Role' : 'Make Admin')}
              </button>
              <button
                className="w-full py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none disabled:opacity-50"
                onClick={handleDeleteUser}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 