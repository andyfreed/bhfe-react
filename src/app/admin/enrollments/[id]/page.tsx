'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
}

interface Course {
  id: string;
  title: string;
  main_subject?: string;
  description?: string;
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
  completed_at?: string;
  last_accessed_at?: string;
  user: User;
  course: Course;
}

export default function EnrollmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEnrollment() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/enrollments/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Enrollment not found');
          }
          throw new Error(`Error fetching enrollment: ${response.status}`);
        }
        const data = await response.json();
        setEnrollment(data);
        setProgress(data.progress);
        setCompleted(data.completed);
        setNotes(data.enrollment_notes || '');
      } catch (error) {
        console.error('Error fetching enrollment:', error);
        setErrorMessage((error as Error).message || 'Failed to load enrollment');
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      fetchEnrollment();
    }
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/enrollments/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progress,
          completed,
          enrollment_notes: notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update enrollment');
      }

      const updatedEnrollment = await response.json();
      setEnrollment(updatedEnrollment);
      setSuccessMessage('Enrollment updated successfully!');
    } catch (error) {
      console.error('Error updating enrollment:', error);
      setErrorMessage((error as Error).message || 'Failed to update enrollment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEnrollment = async () => {
    if (!confirm('Are you sure you want to delete this enrollment? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/enrollments/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete enrollment');
      }

      // Redirect back to enrollments list
      router.push('/admin/enrollments');
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      setErrorMessage((error as Error).message || 'Failed to delete enrollment');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
        <p>Loading enrollment details...</p>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {errorMessage || 'Enrollment not found'}
        </div>
        <Link href="/admin/enrollments" className="text-indigo-600 hover:text-indigo-900">
          ← Back to Enrollments
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Enrollment Details</h1>
        <Link href="/admin/enrollments" className="text-indigo-600 hover:text-indigo-900">
          ← Back to Enrollments
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

      {/* Enrollment summary card */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <p className="mb-2">
              <span className="font-medium">Email:</span> {enrollment.user?.email || 'Unknown'}
            </p>
            <p className="mb-2">
              <span className="font-medium">User ID:</span> {enrollment.user_id}
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Course Information</h2>
            <p className="mb-2">
              <span className="font-medium">Title:</span> {enrollment.course?.title || 'Unknown'}
            </p>
            <p className="mb-2">
              <span className="font-medium">Subject:</span> {enrollment.course?.main_subject || 'Not specified'}
            </p>
            <p className="mb-2">
              <span className="font-medium">Course ID:</span> {enrollment.course_id}
            </p>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="font-medium mb-2">Enrollment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded-md p-3">
              <p className="text-sm text-gray-500">Enrollment Date</p>
              <p>{new Date(enrollment.enrolled_at).toLocaleDateString()}</p>
            </div>
            <div className="border rounded-md p-3">
              <p className="text-sm text-gray-500">Last Accessed</p>
              <p>{enrollment.last_accessed_at ? new Date(enrollment.last_accessed_at).toLocaleDateString() : 'Never'}</p>
            </div>
            <div className="border rounded-md p-3">
              <p className="text-sm text-gray-500">Completion Date</p>
              <p>{enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString() : 'Not completed'}</p>
            </div>
            <div className="border rounded-md p-3">
              <p className="text-sm text-gray-500">Type</p>
              <p className="capitalize">{enrollment.enrollment_type}</p>
            </div>
            <div className="border rounded-md p-3">
              <p className="text-sm text-gray-500">Progress</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1 mb-1">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  style={{ width: `${enrollment.progress}%` }}
                ></div>
              </div>
              <p className="text-xs">{enrollment.progress}%</p>
            </div>
            <div className="border rounded-md p-3">
              <p className="text-sm text-gray-500">Status</p>
              <p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  enrollment.completed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {enrollment.completed ? 'Completed' : 'In Progress'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {enrollment.course?.description && (
          <div className="mt-6">
            <h3 className="font-medium mb-2">Course Description</h3>
            <p className="text-gray-700">{enrollment.course.description}</p>
          </div>
        )}
      </div>

      {/* Edit form */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Update Enrollment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Progress (%)
            </label>
            <input
              type="number"
              value={progress}
              onChange={(e) => setProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="completed"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="completed" className="ml-2 block text-sm text-gray-900">
              Mark as completed
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handleDeleteEnrollment}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Enrollment
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 