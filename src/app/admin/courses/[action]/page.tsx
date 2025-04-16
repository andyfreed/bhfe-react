'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Course, CourseFormatEntry, CourseCredit, CourseState, CourseFormat } from '@/types/database';
import ExamManager from '@/components/admin/ExamManager';

const initialCourseState: Omit<Course, 'id' | 'created_at'> & {
  formats: CourseFormatEntry[];
  credits: CourseCredit[];
  states: CourseState[];
  table_of_contents_file?: File | null;
  course_content_file?: File | null;
} = {
  sku: '',
  title: '',
  description: '',
  main_subject: '',
  author: '',
  table_of_contents_url: '',
  course_content_url: '',
  formats: [],
  credits: [],
  states: [],
  table_of_contents_file: null,
  course_content_file: null
};

// Valid course formats from the enum
const VALID_FORMATS: CourseFormat[] = ['online', 'hardcopy', 'video'];

// Valid credit types
const VALID_CREDIT_TYPES = ['CPA', 'CFP', 'CDFA', 'EA/OTRP', 'ERPA'];

type TabType = 'details' | 'exams';

type PageParams = {
  params: Promise<{ action: string }>;
};

export default function CourseForm({ params }: PageParams) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Omit<Course, 'id' | 'created_at'> & {
    id?: string;
    formats: CourseFormatEntry[];
    credits: CourseCredit[];
    states: CourseState[];
    table_of_contents_file?: File | null;
    course_content_file?: File | null;
  }>(initialCourseState);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const { action } = use(params);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (action === 'edit') {
      // Check if the ID is in the URL path directly, which would be the case
      // when coming from the courses page
      if (window.location.pathname.includes('/edit/')) {
        const pathParts = window.location.pathname.split('/');
        const courseId = pathParts[pathParts.length - 1];
        if (courseId && courseId !== 'edit') {
          fetchCourse(courseId);
          return;
        }
      }
      
      // Otherwise check for ID in the query parameters
      const courseId = new URLSearchParams(window.location.search).get('id');
      if (courseId) {
        fetchCourse(courseId);
      }
    }
  }, [action]);

  const fetchCourse = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${id}`);
      if (!response.ok) throw new Error('Failed to fetch course');
      const data = await response.json();
      
      // Ensure all string fields have a value (empty string if null)
      const sanitizedData = {
        ...data,
        // Replace nulls with empty strings for string fields
        sku: data.sku || '',
        title: data.title || '',
        description: data.description || '',
        main_subject: data.main_subject || '',
        author: data.author || '',
        table_of_contents_url: data.table_of_contents_url || '',
        course_content_url: data.course_content_url || '',
        // Ensure arrays are initialized
        formats: Array.isArray(data.formats) ? data.formats : [],
        credits: Array.isArray(data.credits) ? data.credits : [],
        states: Array.isArray(data.states) ? data.states : [],
        id: data.id // Keep the ID for the exams component
      };
      
      setCourse(sanitizedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Create FormData to handle file uploads
      const formData = new FormData();
      
      // Add all the text fields
      const { id, table_of_contents_file, course_content_file, ...courseData } = course;
      
      if (action === 'edit' && id) {
        formData.append('id', id);
      }
      
      // Add text fields
      Object.entries(courseData).forEach(([key, value]) => {
        if (key !== 'formats' && key !== 'credits' && key !== 'states') {
          formData.append(key, value as string);
        }
      });
      
      // Add nested data as JSON strings
      formData.append('formats', JSON.stringify(course.formats));
      formData.append('credits', JSON.stringify(course.credits));
      formData.append('states', JSON.stringify(course.states));
      
      // Add files if they exist
      if (table_of_contents_file) {
        formData.append('table_of_contents_file', table_of_contents_file);
      }
      
      if (course_content_file) {
        formData.append('course_content_file', course_content_file);
      }
      
      // Determine the correct endpoint URL
      // For editing, use /api/courses/{id}
      // For new courses, use /api/courses
      const url = action === 'edit' && id 
        ? `/api/courses/${id}` 
        : '/api/courses';
        
      const method = action === 'edit' ? 'PUT' : 'POST';
      
      console.log(`Submitting ${method} request to ${url}`);
      
      const response = await fetch(url, {
        method: method,
        body: formData
        // Don't set Content-Type header, as it will be automatically set with FormData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API error response:', errorData);
        throw new Error(`Failed to save course: ${errorData?.error || response.statusText}`);
      }
      
      // For edit action, stay on the same page and show success message
      if (action === 'edit') {
        // Refresh the course data
        if (id) {
          fetchCourse(id);
        }
        
        // Show success message by setting a success state
        setSuccess('Course updated successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        // For new course creation, redirect to the course list
        router.push('/admin/courses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCourse(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setCourse(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const addFormat = () => {
    setCourse(prev => ({
      ...prev,
      formats: [...prev.formats, { format: '', price: 0 }]
    }));
  };

  const updateFormat = (index: number, field: keyof CourseFormatEntry, value: string | number) => {
    setCourse(prev => ({
      ...prev,
      formats: prev.formats.map((format, i) => 
        i === index ? { ...format, [field]: value } : format
      )
    }));
  };

  const removeFormat = (index: number) => {
    setCourse(prev => ({
      ...prev,
      formats: prev.formats.filter((_, i) => i !== index)
    }));
  };

  const addCredit = () => {
    setCourse(prev => ({
      ...prev,
      credits: [...prev.credits, { credit_type: '', amount: 0, course_number: '' }]
    }));
  };

  const updateCredit = (index: number, field: keyof CourseCredit, value: string | number) => {
    setCourse(prev => ({
      ...prev,
      credits: prev.credits.map((credit, i) => 
        i === index ? { ...credit, [field]: value } : credit
      )
    }));
  };

  const removeCredit = (index: number) => {
    setCourse(prev => ({
      ...prev,
      credits: prev.credits.filter((_, i) => i !== index)
    }));
  };

  const addState = () => {
    setCourse(prev => ({
      ...prev,
      states: [...prev.states, { state_code: '' }]
    }));
  };

  const updateState = (index: number, value: string) => {
    setCourse(prev => ({
      ...prev,
      states: prev.states.map((state, i) => 
        i === index ? { state_code: value } : state
      )
    }));
  };

  const removeState = (index: number) => {
    setCourse(prev => ({
      ...prev,
      states: prev.states.filter((_, i) => i !== index)
    }));
  };

  if (loading && !course.id) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-8 bg-white p-8 rounded-lg shadow-sm">
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{success}</span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setSuccess(null)}
          >
            <svg className="h-5 w-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="flex justify-between items-center border-b border-indigo-100 pb-4">
        <h1 className="text-2xl font-bold text-indigo-800">
          {action === 'edit' ? 'Edit Course' : 'Create Course'}
        </h1>
        
        {action === 'edit' && (
          <div>
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-4 px-3 border-b-2 font-medium ${
                  activeTab === 'details'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-indigo-500 hover:border-indigo-300'
                }`}
              >
                Course Details
              </button>
              <button
                onClick={() => setActiveTab('exams')}
                className={`pb-4 px-3 border-b-2 font-medium ${
                  activeTab === 'exams'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-indigo-500 hover:border-indigo-300'
                }`}
              >
                Exams
              </button>
            </nav>
          </div>
        )}
      </div>

      {activeTab === 'details' ? (
        <form onSubmit={handleSubmit} className="space-y-8" encType="multipart/form-data">
          <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
            <h2 className="text-lg font-semibold text-indigo-700 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={course.sku || ''}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={course.title || ''}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                id="description"
                name="description"
                value={course.description || ''}
                onChange={handleChange}
                rows={3}
                className="block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label htmlFor="main_subject" className="block text-sm font-medium text-gray-700 mb-1">Main Subject</label>
                <input
                  type="text"
                  id="main_subject"
                  name="main_subject"
                  value={course.main_subject || ''}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={course.author || ''}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-700 mb-4">Course Materials</h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="table_of_contents_file" className="block text-sm font-medium text-gray-700 mb-1">Table of Contents PDF</label>
                <div className="flex items-center">
                  <input
                    type="file"
                    id="table_of_contents_file"
                    name="table_of_contents_file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {course.table_of_contents_url && (
                    <a 
                      href={course.table_of_contents_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-3 text-sm text-indigo-600 hover:text-indigo-500 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Current PDF
                    </a>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">Upload a PDF file for the table of contents</p>
                <input 
                  type="hidden" 
                  name="table_of_contents_url" 
                  value={course.table_of_contents_url || ''} 
                />
              </div>

              <div>
                <label htmlFor="course_content_file" className="block text-sm font-medium text-gray-700 mb-1">Course Content PDF</label>
                <div className="flex items-center">
                  <input
                    type="file"
                    id="course_content_file"
                    name="course_content_file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {course.course_content_url && (
                    <a 
                      href={course.course_content_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-3 text-sm text-indigo-600 hover:text-indigo-500 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Current PDF
                    </a>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">Upload a PDF file for the course content</p>
                <input 
                  type="hidden" 
                  name="course_content_url" 
                  value={course.course_content_url || ''} 
                />
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-100">
            <h2 className="text-lg font-semibold text-green-700 mb-4">Course Formats and Pricing</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Formats</label>
              {course.formats.map((format, index) => (
                <div key={index} className="flex gap-4 mb-3 items-center">
                  <select
                    value={format.format || ''}
                    onChange={(e) => updateFormat(index, 'format', e.target.value)}
                    className="flex-1 rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Select Format</option>
                    {VALID_FORMATS.map(formatOption => (
                      <option key={formatOption} value={formatOption}>
                        {formatOption.charAt(0).toUpperCase() + formatOption.slice(1)}
                      </option>
                    ))}
                  </select>
                  <div className="relative w-36">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                    <input
                      type="number"
                      value={format.price || 0}
                      onChange={(e) => updateFormat(index, 'price', parseFloat(e.target.value))}
                      placeholder="Price"
                      className="w-full pl-7 rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFormat(index)}
                    className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFormat}
                className="mt-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Format
              </button>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
            <h2 className="text-lg font-semibold text-purple-700 mb-4">Credits and Qualifications</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Credits</label>
                  <span className="text-xs text-gray-500">Add credit types with their corresponding amounts and course numbers</span>
                </div>
                {course.credits.map((credit, index) => (
                  <div key={index} className="flex gap-4 mb-3 items-center">
                    <select
                      value={credit.credit_type || ''}
                      onChange={(e) => updateCredit(index, 'credit_type', e.target.value)}
                      className="w-1/3 rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Select Credit Type</option>
                      {VALID_CREDIT_TYPES.map(creditType => (
                        <option key={creditType} value={creditType}>
                          {creditType}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={credit.amount || 0}
                      onChange={(e) => updateCredit(index, 'amount', parseFloat(e.target.value))}
                      placeholder="Amount"
                      className="w-1/4 rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={credit.course_number || ''}
                      onChange={(e) => updateCredit(index, 'course_number', e.target.value)}
                      placeholder="Course Number"
                      className="w-1/3 rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeCredit(index)}
                      className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCredit}
                  className="mt-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 inline-flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Credit
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State Approvals</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {course.states.map((stateObj, index) => (
                    <div key={index} className="inline-flex items-center pl-3 pr-1 py-1 bg-white border border-gray-300 rounded-md">
                      <span>{stateObj.state_code || ''}</span>
                      <button
                        type="button"
                        onClick={() => removeState(index)}
                        className="ml-1 p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="new-state"
                    placeholder="Enter state code (e.g., CA, NY)"
                    className="flex-1 rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addState();
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addState();
                      const input = document.getElementById('new-state') as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Add State
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.push('/admin/courses')}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : action === 'edit' ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      ) : (
        course.id ? (
          <ExamManager courseId={course.id} />
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No exams available</h3>
            <p className="mt-1 text-sm text-gray-500">Please save the course details first to manage exams.</p>
            <button
              onClick={() => setActiveTab('details')}
              className="mt-6 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Course Details
            </button>
          </div>
        )
      )}
    </div>
  );
} 