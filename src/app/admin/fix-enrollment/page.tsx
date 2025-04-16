'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Course {
  id: string;
  title: string;
  sku: string;
}

export default function FixEnrollmentPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string>('');
  const router = useRouter();

  // Load all courses
  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch('/api/admin/courses?limit=100');
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        const data = await response.json();
        setCourses(data || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Failed to load courses. Please try again.');
      }
    }

    fetchCourses();
  }, []);

  const fixEnrollment = async () => {
    if (!courseId) {
      setError('Please select a course');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/enrollments/fix-admin?courseId=${courseId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix enrollment');
      }

      setMessage(data.message || 'Enrollment fixed successfully');
      setCourseId('');
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Fix Admin Enrollment</h1>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <p className="text-yellow-700">
            This tool is for development purposes only. It will enroll the development admin user 
            (ID: a3b1c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d) in the selected course.
          </p>
        </div>
        
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-6">
            {message}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}
        
        <div className="bg-white shadow-sm rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Course
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3 py-2.5 text-gray-800 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            >
              <option value="">-- Select a course --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.sku} - {course.title}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={fixEnrollment}
              disabled={loading || !courseId}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Fix Enrollment'}
            </button>
            
            <button
              onClick={() => router.push('/my-courses')}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Go to My Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 