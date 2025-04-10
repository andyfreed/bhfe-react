'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Course, CourseFormatEntry, CourseCredit, CourseState, CourseFormat } from '@/types/database';
import ExamManager from '@/components/admin/ExamManager';

const initialCourseState: Omit<Course, 'id' | 'created_at'> & {
  formats: CourseFormatEntry[];
  credits: CourseCredit[];
  states: CourseState[];
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
  states: []
};

// Valid course formats from the enum
const VALID_FORMATS: CourseFormat[] = ['online', 'hardcopy', 'video'];

// Valid credit types
const VALID_CREDIT_TYPES = ['CPA', 'CFP', 'CDFA', 'EA', 'OTRP', 'ERPA'];

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
  }>(initialCourseState);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const { action } = use(params);

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
      setCourse({
        ...data,
        id: data.id // Keep the ID for the exams component
      });
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
      
      const { id, ...courseData } = course;
      
      const response = await fetch('/api/courses', {
        method: action === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'edit' ? { id, ...courseData } : courseData)
      });

      if (!response.ok) throw new Error('Failed to save course');
      
      router.push('/admin/courses');
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
      credits: [...prev.credits, { credit_type: '', amount: 0 }]
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
      states: [...prev.states, { state: '' }]
    }));
  };

  const updateState = (index: number, value: string) => {
    setCourse(prev => ({
      ...prev,
      states: prev.states.map((state, i) => 
        i === index ? { state: value } : state
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
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200">
        <h1 className="text-2xl font-bold pb-4">
          {action === 'edit' ? 'Edit Course' : 'Create Course'}
        </h1>
        
        {action === 'edit' && (
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Course Details
              </button>
              <button
                onClick={() => setActiveTab('exams')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'exams'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Exams
              </button>
            </nav>
          </div>
        )}
      </div>

      {activeTab === 'details' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU</label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={course.sku}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={course.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              value={course.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="main_subject" className="block text-sm font-medium text-gray-700">Main Subject</label>
            <input
              type="text"
              id="main_subject"
              name="main_subject"
              value={course.main_subject}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700">Author</label>
            <input
              type="text"
              id="author"
              name="author"
              value={course.author}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="table_of_contents_url" className="block text-sm font-medium text-gray-700">Table of Contents URL</label>
            <input
              type="url"
              id="table_of_contents_url"
              name="table_of_contents_url"
              value={course.table_of_contents_url}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="course_content_url" className="block text-sm font-medium text-gray-700">Course Content URL</label>
            <input
              type="url"
              id="course_content_url"
              name="course_content_url"
              value={course.course_content_url}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Formats</label>
            {course.formats.map((format, index) => (
              <div key={index} className="flex gap-4 mt-2">
                <select
                  value={format.format}
                  onChange={(e) => updateFormat(index, 'format', e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select Format</option>
                  {VALID_FORMATS.map(formatOption => (
                    <option key={formatOption} value={formatOption}>
                      {formatOption.charAt(0).toUpperCase() + formatOption.slice(1)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={format.price}
                  onChange={(e) => updateFormat(index, 'price', parseFloat(e.target.value))}
                  placeholder="Price"
                  className="w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeFormat(index)}
                  className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addFormat}
              className="mt-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Add Format
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Credits</label>
            {course.credits.map((credit, index) => (
              <div key={index} className="flex gap-4 mt-2">
                <select
                  value={credit.credit_type}
                  onChange={(e) => updateCredit(index, 'credit_type', e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                  value={credit.amount}
                  onChange={(e) => updateCredit(index, 'amount', parseFloat(e.target.value))}
                  placeholder="Amount"
                  className="w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeCredit(index)}
                  className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addCredit}
              className="mt-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Add Credit
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">States</label>
            {course.states.map((stateObj, index) => (
              <div key={index} className="flex gap-4 mt-2">
                <input
                  type="text"
                  value={stateObj.state}
                  onChange={(e) => updateState(index, e.target.value)}
                  placeholder="State"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeState(index)}
                  className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addState}
              className="mt-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Add State
            </button>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/courses')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Saving...' : action === 'edit' ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      ) : (
        course.id ? (
          <ExamManager courseId={course.id} />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p>Please save the course details first to manage exams.</p>
            <button
              onClick={() => setActiveTab('details')}
              className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Back to Course Details
            </button>
          </div>
        )
      )}
    </div>
  );
} 