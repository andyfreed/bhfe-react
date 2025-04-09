'use client';
import { useState, useEffect } from 'react';
import CourseCard from '@/components/courses/CourseCard';
import { Course, CourseType } from '@/types/course';
import type { CourseWithRelations } from '@/types/database';
import { courses as dummyCourses } from '@/data/courses';

// Adapting database course to frontend course format
const adaptCourse = (course: CourseWithRelations): Course => {
  // Find the lowest price format
  const price = course.formats && course.formats.length > 0
    ? Math.min(...course.formats.map(f => f.price))
    : 0;

  // Get all credit types
  const creditTypes = course.credits
    ? course.credits.map(c => c.credit_type.toUpperCase() as CourseType)
    : [];
  
  // Make sure we have at least one credit type, or use OTHER
  const type = creditTypes.length > 0 ? creditTypes : ['OTHER' as CourseType];
  
  // Calculate total credits
  const totalCredits = course.credits
    ? course.credits.reduce((total, credit) => total + credit.amount, 0)
    : 0;
  
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    type: type,
    price: price,
    duration: `${totalCredits} hours`, // Assuming 1 credit = 1 hour
    credits: totalCredits,
    slug: course.sku.toLowerCase().replace(/\s+/g, '-'),
    features: [],
    objectives: [],
    instructor: {
      name: course.author,
      bio: '',
      image: '/images/instructors/default.jpg'
    }
  };
};

export default function CoursesPage() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useDummyData, setUseDummyData] = useState(false);
  const [sourcesChecked, setSourcesChecked] = useState(0); // Track how many data sources we've checked

  // Function to load real courses data
  const loadRealCourses = async () => {
    try {
      setIsLoading(true);
      
      // Try to get real courses from the public API
      const response = await fetch('/api/public/courses');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && Array.isArray(data) && data.length > 0) {
          console.log('Using real course data from API', data);
          const adaptedCourses = data.map(adaptCourse);
          setCourses(adaptedCourses);
          setUseDummyData(false);
          return true;
        }
      }
      
      return false;
    } catch (err) {
      console.error('Error loading real courses:', err);
      return false;
    }
  };

  // Function to load dummy courses as fallback
  const loadDummyCourses = () => {
    console.log('Using dummy course data');
    setCourses(dummyCourses);
    setUseDummyData(true);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // First try to get real data
        const gotRealData = await loadRealCourses();
        setSourcesChecked(prev => prev + 1);
        
        // If real data failed, use dummy data
        if (!gotRealData) {
          loadDummyCourses();
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
        loadDummyCourses();
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const allTypes = Array.from(new Set(courses.flatMap(course => course.type)));

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const filteredCourses = selectedTypes.length > 0
    ? courses.filter(course =>
        course.type.some(type => selectedTypes.includes(type))
      )
    : courses;

  const refreshData = async () => {
    setError(null);
    await loadRealCourses();
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-theme-neutral-800 mb-4">
            Available Courses
          </h1>
          <p className="text-theme-neutral-600 text-lg max-w-2xl mx-auto">
            Browse our selection of professional development courses designed to enhance your skills and advance your career.
          </p>
          {useDummyData && (
            <div className="mt-4 text-amber-600 bg-amber-50 p-2 rounded-md inline-block">
              <span className="font-semibold">Note:</span> Currently displaying demo courses. 
              <button 
                onClick={refreshData}
                className="ml-2 text-theme-primary-DEFAULT hover:underline"
              >
                Check for real courses
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-primary-DEFAULT"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-theme-primary-DEFAULT text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {allTypes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-theme-neutral-800 mb-4">
                  Filter by Course Type
                </h2>
                <div className="flex flex-wrap gap-3">
                  {allTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        selectedTypes.includes(type)
                          ? 'bg-theme-primary-DEFAULT text-white shadow-md'
                          : 'bg-theme-neutral-50 text-theme-neutral-800 border border-theme-neutral-200 hover:bg-theme-neutral-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course, index) => (
                  <CourseCard
                    key={course.slug}
                    course={course}
                    featured={index === 0}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-theme-neutral-600">No courses found matching your filters.</p>
                {selectedTypes.length > 0 && (
                  <button
                    onClick={() => setSelectedTypes([])}
                    className="mt-4 px-4 py-2 bg-theme-neutral-100 text-theme-neutral-800 rounded-lg hover:bg-theme-neutral-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
} 