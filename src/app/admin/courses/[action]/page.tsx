'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Course, CourseFormatEntry, CourseCredit, CourseState } from '@/types/database';

const initialCourseState: Omit<Course, 'id' | 'created_at'> = {
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

export default function CourseForm({ params }: { params: { action: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Omit<Course, 'id' | 'created_at'>>(initialCourseState);

  useEffect(() => {
    if (params.action === 'edit') {
      const courseId = new URLSearchParams(window.location.search).get('id');
      if (courseId) {
        fetchCourse(courseId);
      }
    }
  }, [params.action]);

  const fetchCourse = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${id}`);
      if (!response.ok) throw new Error('Failed to fetch course');
      const data = await response.json();
      const { id: _, created_at: __, ...courseData } = data;
      setCourse(courseData);
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
      
      const response = await fetch('/api/courses', {
        method: params.action === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course)
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
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
            <input
              type="text"
              value={format.format}
              onChange={(e) => updateFormat(index, 'format', e.target.value)}
              placeholder="Format"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
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
            <input
              type="text"
              value={credit.credit_type}
              onChange={(e) => updateCredit(index, 'credit_type', e.target.value)}
              placeholder="Credit Type"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
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
          {loading ? 'Saving...' : params.action === 'edit' ? 'Update Course' : 'Create Course'}
        </button>
      </div>
    </form>
  );
} 