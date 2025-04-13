'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import type { Course, CourseWithRelations } from '@/types/database';

type ColumnConfig = {
  id: string;
  name: string;
  visible: boolean;
  renderFn: (course: CourseWithRelations) => React.ReactNode;
  width?: string;
  group: string;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const columnSelectorRef = useRef<HTMLDivElement>(null);
  
  const [columns, setColumns] = useState<ColumnConfig[]>([
    // Basic Info
    { 
      id: 'sku', 
      name: 'SKU', 
      visible: true, 
      renderFn: (course) => course.sku,
      width: 'w-32',
      group: 'basic'
    },
    { 
      id: 'title', 
      name: 'Title', 
      visible: true, 
      renderFn: (course) => course.title,
      group: 'basic'
    },
    { 
      id: 'author', 
      name: 'Author', 
      visible: true, 
      renderFn: (course) => course.author,
      width: 'w-40',
      group: 'basic'
    },
    { 
      id: 'main_subject', 
      name: 'Subject', 
      visible: false, 
      renderFn: (course) => course.main_subject || 'N/A',
      width: 'w-32',
      group: 'basic'
    },
    // Course Details
    { 
      id: 'formats', 
      name: 'Formats', 
      visible: false, 
      renderFn: (course) => course.formats?.map(f => `${f.format} ($${f.price})`).join(', ') || 'None',
      width: 'w-52',
      group: 'details' 
    },
    { 
      id: 'credits', 
      name: 'Credits', 
      visible: false, 
      renderFn: (course) => course.credits?.map(c => `${c.credit_type}: ${c.amount}`).join(', ') || 'None',
      width: 'w-40',
      group: 'details'
    },
    { 
      id: 'states', 
      name: 'States', 
      visible: false, 
      renderFn: (course) => course.states?.map(s => s.state_code).join(', ') || 'None',
      width: 'w-40',
      group: 'details'
    },
    // Files
    {
      id: 'toc_file',
      name: 'TOC PDF',
      visible: false,
      renderFn: (course) => course.table_of_contents_url ? (
        <a 
          href={course.table_of_contents_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
          View
        </a>
      ) : 'Not Uploaded',
      width: 'w-24',
      group: 'files'
    },
    {
      id: 'content_file',
      name: 'Content PDF',
      visible: false,
      renderFn: (course) => course.course_content_url ? (
        <a 
          href={course.course_content_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
          View
        </a>
      ) : 'Not Uploaded',
      width: 'w-28',
      group: 'files'
    },
    // Dates
    { 
      id: 'created', 
      name: 'Created', 
      visible: false, 
      renderFn: (course) => new Date(course.created_at).toLocaleDateString(),
      width: 'w-32',
      group: 'dates'
    },
    { 
      id: 'updated', 
      name: 'Last Updated', 
      visible: true, 
      renderFn: (course) => new Date(course.updated_at || course.created_at).toLocaleDateString(),
      width: 'w-32',
      group: 'dates'
    }
  ]);

  const toggleColumn = (id: string) => {
    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.id === id ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const selectAllColumns = () => {
    setColumns(prevColumns =>
      prevColumns.map(col => ({ ...col, visible: true }))
    );
  };
  
  const deselectAllColumns = () => {
    setColumns(prevColumns =>
      prevColumns.map(col => 
        // Keep at least SKU and Title visible
        col.id === 'sku' || col.id === 'title' 
          ? { ...col, visible: true } 
          : { ...col, visible: false }
      )
    );
  };

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const response = await fetch('/api/courses');
        
        if (!response.ok) {
          // Try to get error details from response
          let errorMessage = 'Failed to fetch courses';
          try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (parseError) {
            // If we can't parse the error, just use the status text
            errorMessage = `Failed to fetch courses: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format: expected an array of courses');
        }
        
        setCourses(data);
      } catch (error) {
        console.error('Error fetching courses:', error);
        // Set error state here if needed
        setCourses([]); // Empty the courses array to prevent displaying stale data
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target as Node)) {
        setShowColumnSelector(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Load saved column preferences from localStorage
    const savedColumns = localStorage.getItem('courseColumnPreferences');
    if (savedColumns) {
      try {
        const savedVisibility = JSON.parse(savedColumns);
        setColumns(prevColumns => 
          prevColumns.map(col => ({
            ...col,
            visible: savedVisibility[col.id] !== undefined ? savedVisibility[col.id] : col.visible
          }))
        );
      } catch (e) {
        console.error('Error parsing saved column preferences:', e);
      }
    }
  }, []);

  // Save column preferences when they change
  useEffect(() => {
    const visibilityState = columns.reduce((acc, col) => {
      acc[col.id] = col.visible;
      return acc;
    }, {} as Record<string, boolean>);
    
    localStorage.setItem('courseColumnPreferences', JSON.stringify(visibilityState));
  }, [columns]);

  const visibleColumns = columns.filter(col => col.visible);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your course catalog here. Add, edit, or remove courses.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 space-x-4">
          <button
            onClick={async () => {
              if (!confirm('Are you sure you want to delete ALL courses? This action cannot be undone!')) return;
              try {
                const response = await fetch('/api/courses', {
                  method: 'DELETE',
                });
                if (!response.ok) throw new Error('Failed to delete all courses');
                setCourses([]);
              } catch (error) {
                console.error('Error deleting all courses:', error);
                alert('Failed to delete all courses. Please try again.');
              }
            }}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete All Courses
          </button>
          <Link
            href="/admin/courses/new"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add New Course
          </Link>
        </div>
      </div>

      <div className="flex justify-end mb-4 relative">
        <button
          onClick={() => setShowColumnSelector(!showColumnSelector)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Customize Columns
        </button>
        {showColumnSelector && (
          <div ref={columnSelectorRef} className="absolute right-0 top-10 z-10 w-72 bg-white rounded-md shadow-lg p-4 border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-900">Show/Hide Columns</h3>
              <div className="space-x-2">
                <button 
                  onClick={selectAllColumns} 
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button 
                  onClick={deselectAllColumns} 
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Deselect All
                </button>
              </div>
            </div>
            
            {/* Group: Basic Info */}
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Basic Info</h4>
              <div className="space-y-1">
                {columns.filter(col => col.group === 'basic').map(column => (
                  <div key={column.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`column-${column.id}`}
                      checked={column.visible}
                      onChange={() => toggleColumn(column.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`column-${column.id}`} className="ml-2 text-sm text-gray-700">
                      {column.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Group: Course Details */}
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Course Details</h4>
              <div className="space-y-1">
                {columns.filter(col => col.group === 'details').map(column => (
                  <div key={column.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`column-${column.id}`}
                      checked={column.visible}
                      onChange={() => toggleColumn(column.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`column-${column.id}`} className="ml-2 text-sm text-gray-700">
                      {column.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Group: Files */}
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Files</h4>
              <div className="space-y-1">
                {columns.filter(col => col.group === 'files').map(column => (
                  <div key={column.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`column-${column.id}`}
                      checked={column.visible}
                      onChange={() => toggleColumn(column.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`column-${column.id}`} className="ml-2 text-sm text-gray-700">
                      {column.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Group: Dates */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Dates</h4>
              <div className="space-y-1">
                {columns.filter(col => col.group === 'dates').map(column => (
                  <div key={column.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`column-${column.id}`}
                      checked={column.visible}
                      onChange={() => toggleColumn(column.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`column-${column.id}`} className="ml-2 text-sm text-gray-700">
                      {column.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">
              No courses yet.{' '}
              <Link href="/admin/courses/new" className="text-blue-600 hover:text-blue-500">
                Add your first course
              </Link>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  {visibleColumns.map((column) => (
                    <th 
                      key={column.id}
                      className={`py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 ${column.width || ''}`}
                    >
                      {column.name}
                    </th>
                  ))}
                  <th className="relative py-3.5 pl-3 pr-4 sm:pr-6 w-24">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    {visibleColumns.map((column) => (
                      <td key={`${course.id}-${column.id}`} className="px-3 py-4 text-sm text-gray-900 truncate max-w-xs">
                        <div className="truncate" title={String(column.renderFn(course))}>
                          {column.renderFn(course)}
                        </div>
                      </td>
                    ))}
                    <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium">
                      <Link
                        href={`/admin/courses/edit/${course.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={async () => {
                          if (!confirm('Are you sure you want to delete this course?')) return;
                          try {
                            const response = await fetch(`/api/courses/${course.id}`, {
                              method: 'DELETE',
                            });
                            if (!response.ok) throw new Error('Failed to delete course');
                            setCourses(courses.filter(c => c.id !== course.id));
                          } catch (error) {
                            console.error('Error deleting course:', error);
                            alert('Failed to delete course. Please try again.');
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
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