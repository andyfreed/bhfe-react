'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import UserProfileForm from '@/components/admin/UserProfileForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Define interfaces to match UserProfileForm
interface Address {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// Import License type from components file to ensure compatibility
interface License {
  type: string;
  number: string;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  profile?: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    company?: string;
    phone?: string;
    shipping_address?: Address;
    billing_address?: Address;
    same_as_shipping?: boolean;
    licenses?: License[];
  };
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  completed: boolean;
  enrolled_at: string;
  completed_at?: string | null;
  enrollment_notes?: string;
  exam_passed?: boolean | null;
  exam_score?: number | null;
  exam_answers?: Record<string, string>;
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
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingEnrollment, setIsEditingEnrollment] = useState<string | null>(null);
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editCompletedDate, setEditCompletedDate] = useState<string | null>('');
  const [editEnrollmentNotes, setEditEnrollmentNotes] = useState<string>('');
  const [isUpdatingEnrollment, setIsUpdatingEnrollment] = useState(false);
  const [unhandledError, setUnhandledError] = useState<Error | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [examResults, setExamResults] = useState<number | null>(null);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(true);
  const [deletingEnrollmentId, setDeletingEnrollmentId] = useState<string | null>(null);

  // Suppress unhandled promise rejections caused by aborted fetches (Next dev overlay noise)
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const r = event?.reason as any;
      const isAbort = r?.name === 'AbortError' || r?.message === 'Aborted' || r?.canceled;
      if (isAbort) {
        event.preventDefault();
        event.stopImmediatePropagation();
      } else {
        // Capture non-abort errors and display them properly
        console.error('Unhandled promise rejection:', 
          r instanceof Error ? r.message : String(r));
        setUnhandledError(r instanceof Error ? r : new Error(String(r)));
        
        // Prevent default error handling to show our custom error UI instead
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  // Transform API address format to component format if needed
  function transformApiAddress(apiAddress: any): Address | undefined {
    try {
      if (!apiAddress) return undefined;
      
      return {
        address1: apiAddress.street || '',
        address2: '',
        city: apiAddress.city || '',
        state: apiAddress.state || '',
        zip: apiAddress.zip || '',
        country: apiAddress.country || 'US'
      };
    } catch (error) {
      console.error('Error transforming API address:', 
        error instanceof Error ? error.message : String(error));
      return undefined;
    }
  }

  // Transform API license format to component format
  function transformApiLicenses(apiLicenses: any[]): License[] {
    try {
      if (!apiLicenses || !Array.isArray(apiLicenses)) return [];
      
      return apiLicenses.map(license => ({
        type: license.license_type || '',
        number: license.license_number || ''
      }));
    } catch (error) {
      console.error('Error transforming API licenses:', 
        error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  // Fetch user details and enrollments
  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        // Fetch user details from API endpoint instead of direct table query
        const response = await fetch(`/api/users/${userId}`, {
          signal: abortController.signal,
        });
        if (!response.ok) {
          if (response.status === 404) {
            setErrorMessage('User not found');
            setIsLoading(false);
            setIsLoadingEnrollments(false);
            return;
          }
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }
        
        const userData = await response.json();
        
        // Transform API address format to component format if needed
        const shippingAddress = transformApiAddress(userData.shipping_address);
        const billingAddress = transformApiAddress(userData.billing_address);
        const licenses = transformApiLicenses(userData.licenses);
        
        // Set user state with API response data
        setUser({
          id: userData.id,
          email: userData.email,
          created_at: userData.created_at,
          last_sign_in_at: userData.last_sign_in_at,
          role: userData.role || 'user',
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          profile: {
            full_name: userData.full_name || '',
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            company: userData.company || '',
            phone: userData.phone || '',
            shipping_address: shippingAddress,
            billing_address: billingAddress,
            same_as_shipping: userData.same_as_shipping,
            licenses: licenses
          }
        });

        try {
          // Fetch user enrollments
          const enrollmentsResponse = await fetch(`/api/admin/enrollments?userId=${userId}`, {
            signal: abortController.signal,
          });
          if (!enrollmentsResponse.ok) {
            throw new Error(`Error fetching user enrollments: ${enrollmentsResponse.status}`);
          }
          const enrollmentData = await enrollmentsResponse.json();
          setEnrollments(enrollmentData.enrollments || []);
          setIsLoadingEnrollments(false);

          // Fetch all courses
          const coursesResponse = await fetch(`/api/admin/courses`, {
            signal: abortController.signal,
          });
          if (!coursesResponse.ok) {
            throw new Error(`Error fetching courses: ${coursesResponse.status}`);
          }
          const courseData = await coursesResponse.json();

          // Filter out courses the user is already enrolled in
          const enrolledCourseIds = new Set(enrollmentData.enrollments?.map((e: Enrollment) => e.course_id) || []);
          const availableCourses = courseData.courses?.filter((course: Course) => !enrolledCourseIds.has(course.id)) || [];
          
          setAvailableCourses(availableCourses);
          setIsLoadingEnrollments(false);
        } catch (enrollmentError) {
          console.error('Error fetching enrollments or courses:', 
            enrollmentError instanceof Error ? enrollmentError.message : String(enrollmentError));
          setIsLoadingEnrollments(false);
          // Show error but don't block the whole page since user data loaded successfully
          setErrorMessage('Warning: Could not load enrollment data. Please try refreshing the page.');
        }

        // If we got this far everything succeeded – clear any previous
        // error banner that may have been set by earlier attempts.
        setErrorMessage(null);
      } catch (error) {
        // Ignore fetches aborted due to rapid unmount / reloads
        if ((error as any)?.name === 'AbortError') {
          return;
        }
        console.error('Error fetching data:', 
          error instanceof Error ? error.message : String(error));
        
        // If this is a critical error that prevents rendering the page, set it as an unhandled error
        setIsLoadingEnrollments(false);
        if (isLoading && !user) {
          setUnhandledError(error instanceof Error ? error : new Error(String(error)));
        } else {
          // Otherwise just show it as a regular error message
          setErrorMessage('Failed to load user data. Please try again later.');
        }
      } finally {
        // Set a slight delay before removing the loading state
        // to prevent flashing the "user not found" message
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    }

    if (userId) {
      try {
        fetchData();
      } catch (error) {
        console.error('Unhandled error in fetchData:', 
          error instanceof Error ? error.message : String(error));
        setUnhandledError(error instanceof Error ? error : new Error(String(error)));
        setIsLoading(false);
      }
    }

    // Cleanup: abort any in‑flight requests if component unmounts or userId changes
    return () => {
      abortController.abort();
    };
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
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Failed to create enrollment: ${response.status}`);
      }

      const newEnrollment = await response.json().catch(() => {
        throw new Error('Failed to parse enrollment data');
      });

      // Update the enrollments list and available courses
      try {
        const { data: courseData, error } = await supabase
          .from('courses')
          .select('id, title, main_subject, description')
          .eq('id', selectedCourse)
          .single();

        if (error) throw new Error(`Failed to fetch course data: ${error.message}`);

        if (courseData) {
          const enrollment = {
            ...newEnrollment,
            course: courseData
          };
          
          setEnrollments([enrollment, ...enrollments]);
          setAvailableCourses(availableCourses.filter(c => c.id !== selectedCourse));
        }
      } catch (supabaseError) {
        console.error('Supabase error:', supabaseError);
        // Continue without throwing - we already created the enrollment
      }

      // Reset form
      setSelectedCourse('');
      setEnrollmentNotes('');
      setSuccessMessage('Enrollment created successfully!');
    } catch (error) {
      console.error('Error creating enrollment:', error);
      setErrorMessage((error as Error).message || 'Failed to create enrollment');
      
      // If this is a more serious error that might affect the app's stability, capture it
      if (!(error as Error).message.includes('Failed to create enrollment')) {
        setUnhandledError(error as Error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to delete an enrollment
  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to remove this enrollment?')) {
      return;
    }

    setDeletingEnrollmentId(enrollmentId);
    setIsDeleting(true);
    
    try {
      const enrollmentToDelete = enrollments.find(e => e.id === enrollmentId);
      
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'DELETE',
        headers: {
          'Admin-Token': 'temporary-token'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Failed to delete enrollment: ${response.status}`);
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
      console.error('Error deleting enrollment:', 
        error instanceof Error ? error.message : String(error));
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete enrollment');
      
      // If this looks like a more serious error, track it as unhandled
      if (error instanceof Error && 
          (error.message.includes('TypeError') || error.message.includes('unexpected'))) {
        setUnhandledError(error);
      }
    } finally {
      setIsDeleting(false);
      setDeletingEnrollmentId(null);
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
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
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
      // Role change completed
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
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      setSuccessMessage('User deleted successfully!');
      
      // Redirect back to users list after short delay
      setTimeout(() => {
        try {
          router.push('/admin/users');
        } catch (routerError) {
          console.error('Navigation error:', routerError);
          // If router.push fails, try a manual navigation
          window.location.href = '/admin/users';
        }
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
    console.log('Profile updated successfully, received data:', updatedData);
    
    try {
      // Transform address and license data if needed
      const transformedShippingAddress = transformApiAddress(updatedData.shipping_address) ||
        transformApiAddress({
          street: updatedData.shipping_address?.address1,
          city: updatedData.shipping_address?.city,
          state: updatedData.shipping_address?.state,
          zip: updatedData.shipping_address?.zip,
          country: updatedData.shipping_address?.country
        });

      const transformedBillingAddress = transformApiAddress(updatedData.billing_address) ||
        transformApiAddress({
          street: updatedData.billing_address?.address1,
          city: updatedData.billing_address?.city,
          state: updatedData.billing_address?.state,
          zip: updatedData.billing_address?.zip,
          country: updatedData.billing_address?.country
        });

      // Transform licenses if present
      const transformedLicenses = transformApiLicenses(updatedData.licenses) || [];
      
      // Update user state with received data, ensuring we correctly map fields
      setUser(prevUser => {
        if (!prevUser) return null;
        
        console.log('Updating user with data:', updatedData);
        return {
          ...prevUser,
          email: updatedData.email || prevUser.email,
          role: updatedData.role || prevUser.role,
          first_name: updatedData.first_name || '',
          last_name: updatedData.last_name || '',
          profile: {
            ...prevUser.profile,
            full_name: `${updatedData.first_name || ''} ${updatedData.last_name || ''}`.trim() || prevUser.profile?.full_name || '',
            first_name: updatedData.first_name || '',
            last_name: updatedData.last_name || '',
            company: updatedData.company || prevUser.profile?.company || '',
            phone: updatedData.phone || prevUser.profile?.phone || '',
            shipping_address: transformedShippingAddress || prevUser.profile?.shipping_address,
            billing_address: transformedBillingAddress || prevUser.profile?.billing_address,
            same_as_shipping: updatedData.same_as_shipping !== undefined ? updatedData.same_as_shipping : prevUser.profile?.same_as_shipping,
            licenses: transformedLicenses || prevUser.profile?.licenses || []
          }
        };
      });
      
      // Clear editing states to prevent dialogs from showing
      setSuccessMessage('User profile updated successfully!');
      
      // Schedule a delayed refetch to get the latest data from the server
      setTimeout(() => {
        const abortController = new AbortController();
        
        console.log('Refreshing user data from server...');
        fetch(`/api/users/${userId}`, {
          signal: abortController.signal,
          // Add cache busting to prevent stale data
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        .then(response => {
          if (response.ok) return response.json();
          throw new Error('Failed to refresh user data');
        })
        .then(userData => {
          try {
            console.log('Successfully refreshed user data:', userData);
            
            // Transform API address format to component format if needed
            const shippingAddress = transformApiAddress(userData.shipping_address);
            const billingAddress = transformApiAddress(userData.billing_address);
            const licenses = transformApiLicenses(userData.licenses);
            
            // Update with the refreshed data from the server
            setUser({
              id: userData.id,
              email: userData.email,
              created_at: userData.created_at,
              last_sign_in_at: userData.last_sign_in_at,
              role: userData.role || 'user',
              first_name: userData.first_name || '',
              last_name: userData.last_name || '',
              profile: {
                full_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.full_name || '',
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                company: userData.company || '',
                phone: userData.phone || '',
                shipping_address: shippingAddress,
                billing_address: billingAddress,
                same_as_shipping: userData.same_as_shipping,
                licenses: licenses
              }
            });
          } catch (transformError) {
            console.error('Error transforming user data:', 
              transformError instanceof Error ? transformError.message : String(transformError));
          }
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            console.error('Error refreshing user data:', 
              err instanceof Error ? err.message : String(err));
          }
        });
        
        return () => abortController.abort();
      }, 1000);
    } catch (error) {
      console.error('Error in profile update success handler:', 
        error instanceof Error ? error.message : String(error));
    }
  };

  // Function to start editing an enrollment
  const handleEditEnrollment = (enrollment: Enrollment) => {
    setIsEditingEnrollment(enrollment.id);
    setEditProgress(enrollment.progress);
    setEditCompletedDate(enrollment.completed_at ? enrollment.completed_at.split('T')[0] : null);
    setEditEnrollmentNotes(enrollment.enrollment_notes || '');
  };

  // Function to cancel editing
  const handleCancelEditEnrollment = () => {
    setIsEditingEnrollment(null);
  };

  // Function to save enrollment changes
  const handleSaveEnrollment = async (enrollmentId: string) => {
    setIsUpdatingEnrollment(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // If completion date is set, mark as completed with 100% progress
      // If completion date is empty, mark as in progress with existing progress
      const isCompleted = !!editCompletedDate;
      
      const updatedData = {
        progress: isCompleted ? 100 : editProgress,
        completed: isCompleted,
        completed_at: editCompletedDate || null,
        enrollment_notes: editEnrollmentNotes,
        exam_score: examResults,
        exam_passed: examResults !== null ? examResults >= 70 : null
      };

      const response = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Admin-Token': 'temporary-token'
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const updatedEnrollment = await response.json().catch(() => {
        throw new Error('Failed to parse response data');
      });
      
      // Update enrollments state with the updated enrollment
      setEnrollments(enrollments.map(e => 
        e.id === enrollmentId ? { ...e, ...updatedData } : e
      ));
      
      setSuccessMessage('Enrollment updated successfully!');
      setIsEditingEnrollment(null);
    } catch (error) {
      console.error('Error updating enrollment:', 
        error instanceof Error ? error.message : String(error));
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsUpdatingEnrollment(false);
    }
  };

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
      
      {/* Unhandled error display */}
      {unhandledError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <h2 className="text-xl font-bold mb-2">Something went wrong:</h2>
          <pre className="text-sm overflow-auto p-2 bg-red-50 rounded">{unhandledError.message}</pre>
          {unhandledError.stack && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium">View error details</summary>
              <pre className="text-xs mt-2 overflow-auto p-2 bg-red-50 rounded">{unhandledError.stack}</pre>
            </details>
          )}
          <div className="flex gap-4 mt-4">
            <button 
              onClick={() => {
                setUnhandledError(null);
                setIsLoading(true);
                setErrorMessage(null);
                setSuccessMessage(null);
                
                // Re-fetch data
                const fetchData = async () => {
                  try {
                    const response = await fetch(`/api/users/${userId}`);
                    if (!response.ok) throw new Error('Failed to fetch user data');
                    const userData = await response.json();
                    setUser({
                      id: userData.id,
                      email: userData.email,
                      created_at: userData.created_at,
                      last_sign_in_at: userData.last_sign_in_at,
                      role: userData.role || 'user',
                      first_name: userData.first_name || '',
                      last_name: userData.last_name || '',
                      profile: {
                        full_name: userData.full_name || '',
                        company: userData.company || '',
                        phone: userData.phone || '',
                        shipping_address: userData.shipping_address || { address1: '', address2: '', city: '', state: '', zip: '', country: '' },
                        billing_address: userData.billing_address || { address1: '', address2: '', city: '', state: '', zip: '', country: '' },
                        same_as_shipping: userData.same_as_shipping || false,
                        licenses: userData.licenses || []
                      }
                    });
                    setIsLoading(false);
                  } catch (error) {
                    console.error('Error re-fetching user data:', error);
                    setErrorMessage('Failed to refresh data. Please try again.');
                    setIsLoading(false);
                  }
                };
                
                fetchData();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Try again
            </button>
            <Link
              href="/admin/users"
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Return to users list
            </Link>
          </div>
        </div>
      )}
      
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

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600">Loading user data...</p>
          </div>
        </div>
      ) : !user ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p className="font-bold">User not found or may have been deleted.</p>
          <p className="mt-2">The user with ID {userId} does not exist in the database.</p>
          <div className="mt-4">
            <Link
              href="/admin/users"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Refresh Users List
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="space-y-6">
            {/* Summary card */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold mb-1">{user.email}</h2>
                  <p className="text-gray-500 text-sm">User ID: {user.id}</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-medium mb-2">Account Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                  <div><span className="font-medium">Email:</span> {user.email}</div>
                  {user.profile?.full_name && (
                    <div><span className="font-medium">Name:</span> {user.profile.full_name}</div>
                  )}
                  {user.profile?.company && (
                    <div><span className="font-medium">Company:</span> {user.profile.company}</div>
                  )}
                  {user.profile?.phone && (
                    <div><span className="font-medium">Phone:</span> {user.profile.phone}</div>
                  )}
                  <div><span className="font-medium">Role:</span> {user.role || 'user'}</div>
                </div>
                <div className="pt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={isSendingPasswordReset}
                    className="inline-flex justify-center px-3 py-2 border border-gray-300 text-sm rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    {isSendingPasswordReset ? 'Sending...' : 'Reset Password'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    disabled={isDeleting}
                    className="inline-flex justify-center px-3 py-2 border border-red-300 text-sm rounded-md shadow-sm text-red-700 bg-white hover:bg-red-50 focus:outline-none"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete User'}
                  </button>
                </div>
              </div>
            </div>

            {/* Enrollments card */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Course Enrollments</h2>
                {availableCourses.length > 0 && (
                  <button
                    onClick={() => setIsAddingCourse(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                  >
                    + Enroll in Course
                  </button>
                )}
              </div>

              {/* Add course form */}
              {isAddingCourse && (
                <div className="p-6 border-b">
                  <h3 className="text-lg font-medium mb-4">Enroll User in Course</h3>
                  <form onSubmit={handleCreateEnrollment}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                      <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select a course</option>
                        {availableCourses
                          .filter(course => !enrollments.some(enrollment => enrollment.course_id === course.id))
                          .map(course => (
                            <option key={course.id} value={course.id}>{course.title}</option>
                          ))
                        }
                      </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingCourse(false)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!selectedCourse || isSubmitting}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                      >
                        {isSubmitting ? 'Enrolling...' : 'Enroll User'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Enrollments table */}
              <div className="overflow-x-auto">
                {isLoadingEnrollments ? (
                  <div className="p-6 text-center">
                    <LoadingSpinner size="md" />
                    <p className="text-gray-500 mt-2">Loading enrollments...</p>
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">No course enrollments found for this user.</p>
                  </div>
                ) : (
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Enrolled On
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Completed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exam Results
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {enrollments.map((enrollment) => (
                        <tr key={enrollment.id} className={enrollment.id === isEditingEnrollment ? 'bg-blue-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{enrollment.course?.title || 'Unknown Course'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{enrollment.progress}%</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(enrollment.enrolled_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {enrollment.id === isEditingEnrollment ? (
                              <input 
                                type="date" 
                                value={editCompletedDate || ''}
                                onChange={(e) => setEditCompletedDate(e.target.value === '' ? null : e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            ) : (
                              <div className="text-sm text-gray-500">
                                {enrollment.completed_at 
                                  ? new Date(enrollment.completed_at).toLocaleDateString()
                                  : '—'}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {enrollment.id === isEditingEnrollment ? (
                              <input 
                                type="number" 
                                min="0"
                                max="100"
                                value={examResults || ''}
                                onChange={(e) => setExamResults(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Score (0-100)"
                              />
                            ) : (
                              <div className="text-sm text-gray-500">
                                {enrollment.exam_score !== undefined && `${enrollment.exam_score}%`}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              enrollment.progress === 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {enrollment.progress === 100 ? 'Completed' : 'In Progress'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {enrollment.id === isEditingEnrollment ? (
                              <div className="flex space-x-2 justify-end">
                                <button
                                  onClick={() => handleCancelEditEnrollment()}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEnrollment(enrollment.id)}
                                  disabled={isUpdatingEnrollment}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  {isUpdatingEnrollment ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            ) : (
                              <div className="flex space-x-3 justify-end">
                                <button
                                  onClick={() => handleEditEnrollment(enrollment)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteEnrollment(enrollment.id)}
                                  disabled={isDeleting}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  {isDeleting && deletingEnrollmentId === enrollment.id ? 'Removing...' : 'Remove'}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Full-width editable profile form */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mt-6">
            <UserProfileForm
              userId={userId as string}
              initialData={{
                email: user.email,
                first_name: user.first_name || user.profile?.first_name || '',
                last_name: user.last_name || user.profile?.last_name || '',
                full_name: user.profile?.full_name,
                company: user.profile?.company,
                phone: user.profile?.phone,
                role: user.role,
                shipping_address: user.profile?.shipping_address,
                billing_address: user.profile?.billing_address,
                licenses: user.profile?.licenses || []
              }}
              onSuccess={handleProfileUpdateSuccess}
              onCancel={() => null}
            />
          </div>
        </div>
      )}
    </div>
  );
} 