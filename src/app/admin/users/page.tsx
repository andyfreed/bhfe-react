'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CheckIcon } from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  role?: string;
  enrollments_count?: number;
}

interface Course {
  id: string;
  title: string;
  main_subject?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userEnrollments, setUserEnrollments] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [enrollmentNotes, setEnrollmentNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkCourse, setBulkCourse] = useState<string>('');
  const [bulkNotes, setBulkNotes] = useState<string>('');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [usersPerPage] = useState(15);
  const [userStats, setUserStats] = useState({
    total: 0,
    activeRecently: 0,
    withEnrollments: 0
  });

  // Fetch users and courses on page load
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch users from Supabase
        const { data: usersData, error: usersError } = await supabase
          .from('auth.users')
          .select('id, email, created_at, last_sign_in_at')
          .order('email');
        
        if (usersError) throw usersError;
        
        // Get enrollment counts for each user
        const { data: userEnrollments, error: enrollmentsError } = await supabase
          .from('user_enrollments')
          .select('user_id')
          .then(result => {
            // Count enrollments per user manually
            const counts = new Map<string, number>();
            result.data?.forEach(item => {
              const userId = item.user_id;
              counts.set(userId, (counts.get(userId) || 0) + 1);
            });
            
            return {
              data: Array.from(counts.entries()).map(([user_id, count]) => ({ user_id, count })),
              error: result.error
            };
          });
        
        if (enrollmentsError) throw enrollmentsError;
        
        // Get user roles
        const { data: userRoles, error: rolesError } = await supabase
          .from('profiles')
          .select('id, role');
          
        if (rolesError) throw rolesError;
        
        // Merge data
        const enrollmentMap = new Map<string, number>();
        userEnrollments?.forEach(item => {
          enrollmentMap.set(item.user_id, item.count);
        });
        
        const roleMap = new Map();
        userRoles?.forEach(item => {
          roleMap.set(item.id, item.role);
        });
        
        const enhancedUsers = usersData?.map(user => ({
          ...user,
          enrollments_count: enrollmentMap.get(user.id) || 0,
          role: roleMap.get(user.id) || 'user'
        })) || [];
        
        setUsers(enhancedUsers);

        // Fetch courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, main_subject')
          .order('title');
        
        if (coursesError) throw coursesError;
        setCourses(coursesData || []);

        // Calculate user statistics
        if (users.length > 0) {
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
          
          const activeRecently = users.filter(user => 
            user.last_sign_in_at && new Date(user.last_sign_in_at) >= thirtyDaysAgo
          ).length;
          
          const withEnrollments = users.filter(user => 
            (user.enrollments_count || 0) > 0
          ).length;
          
          setUserStats({
            total: users.length,
            activeRecently,
            withEnrollments
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Function to handle user selection and fetch their enrollments
  const handleUserSelect = async (user: User) => {
    setSelectedUser(user);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      const response = await fetch(`/api/admin/enrollments?userId=${user.id}`);
      if (!response.ok) {
        throw new Error(`Error fetching user enrollments: ${response.status}`);
      }
      const data = await response.json();
      setUserEnrollments(data.enrollments || []);
    } catch (error) {
      console.error('Error fetching user enrollments:', error);
      setErrorMessage('Failed to load user enrollments.');
      setUserEnrollments([]);
    }
  };

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
          user_id: selectedUser.id,
          course_id: selectedCourse,
          notes: enrollmentNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create enrollment');
      }

      // Reset form field
      setSelectedCourse('');
      setEnrollmentNotes('');
      
      // Refresh user enrollments
      await handleUserSelect(selectedUser);
      
      // Update the user's enrollment count in the list
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, enrollments_count: (user.enrollments_count || 0) + 1 } 
          : user
      ));
      
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
      setUserEnrollments(userEnrollments.filter(e => e.id !== enrollmentId));
      
      // Update the user's enrollment count in the list
      if (selectedUser) {
        setUsers(users.map(user => 
          user.id === selectedUser.id 
            ? { ...user, enrollments_count: Math.max(0, (user.enrollments_count || 0) - 1) } 
            : user
        ));
      }
      
      setSuccessMessage('Enrollment deleted successfully!');
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      setErrorMessage((error as Error).message || 'Failed to delete enrollment');
    }
  };

  // Function to handle bulk enrollment
  const handleBulkEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0 || !bulkCourse) {
      setErrorMessage('Please select at least one user and a course.');
      return;
    }

    setIsBulkSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Create enrollment data for each selected user
      const enrollmentData = selectedUsers.map(userId => ({
        user_id: userId,
        course_id: bulkCourse,
        notes: bulkNotes,
      }));

      const response = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrollmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create enrollments');
      }

      // Reset form fields
      setSelectedUsers([]);
      setBulkCourse('');
      setBulkNotes('');
      setBulkMode(false);
      
      // Update users' enrollment counts
      setUsers(users.map(user => 
        selectedUsers.includes(user.id)
          ? { ...user, enrollments_count: (user.enrollments_count || 0) + 1 } 
          : user
      ));
      
      setSuccessMessage(`Successfully enrolled ${selectedUsers.length} users in the selected course.`);
    } catch (error) {
      console.error('Error creating bulk enrollments:', error);
      setErrorMessage((error as Error).message || 'Failed to create enrollments');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Helper function to toggle a user in the selected users array
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current users for pagination
  const indexOfLastUser = page * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Functions for pagination
  const goToPage = (pageNumber: number) => {
    setPage(pageNumber);
  };

  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setBulkMode(!bulkMode);
              setSelectedUsers([]);
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              bulkMode
                ? 'bg-gray-200 text-gray-800'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Enroll Users'}
          </button>
        </div>
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

      {/* Bulk Enrollment Form */}
      {bulkMode && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Bulk Enroll Users</h2>
          <p className="text-gray-500 mb-4">
            Selected {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} for enrollment
          </p>
          <form onSubmit={handleBulkEnrollment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Course
              </label>
              <select
                value={bulkCourse}
                onChange={(e) => setBulkCourse(e.target.value)}
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
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows={2}
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isBulkSubmitting || selectedUsers.length === 0}
                className={`flex-1 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  (isBulkSubmitting || selectedUsers.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isBulkSubmitting ? 'Enrolling...' : `Enroll ${selectedUsers.length} Users`}
              </button>
              <button
                type="button"
                onClick={() => setSelectedUsers([])}
                className="flex-1 py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Selection
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Users list */}
        <div className="md:col-span-1">
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold mb-2">Users</h2>
              <div className="flex space-x-2 mb-4">
                <div className="flex-1 bg-indigo-50 rounded-md p-3 text-center">
                  <div className="text-xl font-semibold text-indigo-700">{userStats.total}</div>
                  <div className="text-xs text-indigo-500">Total Users</div>
                </div>
                <div className="flex-1 bg-green-50 rounded-md p-3 text-center">
                  <div className="text-xl font-semibold text-green-700">{userStats.activeRecently}</div>
                  <div className="text-xs text-green-500">Active (30d)</div>
                </div>
                <div className="flex-1 bg-purple-50 rounded-md p-3 text-center">
                  <div className="text-xl font-semibold text-purple-700">{userStats.withEnrollments}</div>
                  <div className="text-xs text-purple-500">Enrolled</div>
                </div>
              </div>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset to first page on search
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                <p>Loading users...</p>
              </div>
            ) : currentUsers.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No users found.
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[500px]">
                <ul className="divide-y divide-gray-200">
                  {currentUsers.map((user) => (
                    <li 
                      key={user.id}
                      className={`flex items-center hover:bg-gray-50 ${
                        (selectedUser?.id === user.id && !bulkMode) ? 'bg-indigo-50' : ''
                      } ${
                        selectedUsers.includes(user.id) ? 'bg-indigo-100' : ''
                      }`}
                      onClick={() => bulkMode ? toggleUserSelection(user.id) : handleUserSelect(user)}
                    >
                      {bulkMode && (
                        <div className="flex-shrink-0 pl-4">
                          <div className={`w-5 h-5 rounded border ${
                            selectedUsers.includes(user.id) 
                              ? 'bg-indigo-600 border-indigo-600' 
                              : 'border-gray-300'
                          } flex items-center justify-center`}>
                            {selectedUsers.includes(user.id) && <CheckIcon className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                      )}
                      <div className={`px-4 py-3 ${bulkMode ? 'pl-2' : ''} flex-1 cursor-pointer`}>
                        <p className="text-sm font-medium text-indigo-600">{user.email}</p>
                        <div className="flex flex-wrap text-xs text-gray-500 mt-1">
                          <span className="mr-3">
                            Role: <span className="font-medium">{user.role || 'User'}</span>
                          </span>
                          <span className="mr-3">
                            Enrollments: <span className="font-medium">{user.enrollments_count || 0}</span>
                          </span>
                          <span className="mr-3">
                            Joined: <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                          </span>
                        </div>
                      </div>
                      {!bulkMode && (
                        <div className="px-4 flex items-center">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="text-indigo-600 hover:text-indigo-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                          </Link>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Pagination */}
            {!isLoading && currentUsers.length > 0 && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={prevPage}
                    disabled={page === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={nextPage}
                    disabled={page === totalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to <span className="font-medium">
                        {Math.min(indexOfLastUser, filteredUsers.length)}
                      </span> of <span className="font-medium">{filteredUsers.length}</span> users
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={prevPage}
                        disabled={page === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        &larr;
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        // Calculate the page number to display
                        let pageNum;
                        if (totalPages <= 5) {
                          // Show all pages if there are 5 or fewer
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          // Near the beginning
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          // Near the end
                          pageNum = totalPages - 4 + i;
                        } else {
                          // In the middle
                          pageNum = page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pageNum
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={nextPage}
                        disabled={page === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        &rarr;
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Details and Enrollments */}
        <div className="md:col-span-2">
          {bulkMode ? (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Bulk Enrollment Mode</h2>
              <p className="text-gray-600">
                Select users from the list on the left, then choose a course to enroll them in.
              </p>
              {selectedUsers.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Selected Users ({selectedUsers.length})</h3>
                  <ul className="border rounded-md divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
                    {selectedUsers.map(userId => {
                      const user = users.find(u => u.id === userId);
                      return (
                        <li key={userId} className="flex justify-between items-center px-4 py-2">
                          <span className="text-sm">{user?.email || userId}</span>
                          <button 
                            onClick={() => toggleUserSelection(userId)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          ) : selectedUser ? (
            <div>
              {/* User Details */}
              <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-2">{selectedUser.email}</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">User ID</p>
                    <p className="font-medium">{selectedUser.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Role</p>
                    <p className="font-medium">{selectedUser.role || 'User'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium">{new Date(selectedUser.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Sign In</p>
                    <p className="font-medium">
                      {selectedUser.last_sign_in_at 
                        ? new Date(selectedUser.last_sign_in_at).toLocaleString() 
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Enroll in Course Form */}
              <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Enroll in Course</h2>
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
                      rows={2}
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

              {/* User Enrollments */}
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <h2 className="text-xl font-semibold p-6 border-b">Course Enrollments</h2>
                {userEnrollments.length === 0 ? (
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
                        {userEnrollments.map((enrollment) => (
                          <tr key={enrollment.id}>
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
          ) : (
            <div className="bg-white shadow-md rounded-lg p-6 flex items-center justify-center h-40">
              <p className="text-gray-500">Select a user to view details and enrollments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 