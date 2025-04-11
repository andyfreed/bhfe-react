'use client';
import { useState, useEffect, useMemo } from 'react';
import CourseCard from '@/components/courses/CourseCard';
import { Course, CourseType } from '@/types/course';
import type { CourseWithRelations } from '@/types/database';
import Link from 'next/link';
import BackgroundEffect from '@/components/ui/BackgroundEffect';
import { sanitizeText } from '@/utils/text';

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
  
  // Organize credits by type
  const creditsByType: Record<string, number> = {};
  if (course.credits && course.credits.length > 0) {
    course.credits.forEach(credit => {
      creditsByType[credit.credit_type] = credit.amount;
    });
  }
  
  return {
    id: course.id,
    title: sanitizeText(course.title),
    description: sanitizeText(course.description),
    type: type,
    price: price,
    duration: `${totalCredits} hours`, // Assuming 1 credit = 1 hour
    credits: totalCredits,
    slug: course.sku.toLowerCase().replace(/\s+/g, '-'),
    features: [],
    objectives: [],
    instructor: {
      name: sanitizeText(course.author),
      bio: '',
      image: '/images/instructors/default.jpg'
    },
    subject: sanitizeText(course.main_subject),
    mainSubject: sanitizeText(course.main_subject),
    creditsByType: creditsByType
  };
};

export default function CoursesPage() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'title-asc' | 'title-desc' | 'credits-asc' | 'credits-desc'>('title-asc');
  const [showFilters, setShowFilters] = useState(false);

  // Function to load courses data
  const loadCourses = async () => {
    try {
      setIsLoading(true);
      
      // Build query string with filter parameters
      const params = new URLSearchParams();
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (selectedSubjects.length === 1) {
        params.append('subject', selectedSubjects[0]);
      }
      
      if (selectedTypes.length === 1) {
        params.append('creditType', selectedTypes[0]);
      }
      
      // Add sorting if not the default
      if (sortBy !== 'title-asc') {
        params.append('sort', sortBy);
      }
      
      // Build the URL with query parameters
      const url = `/api/public/courses${params.toString() ? `?${params.toString()}` : ''}`;
      
      // Get courses from the public API
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      
      console.log(`Loaded ${data.length} courses from API`);
      const adaptedCourses = data.map(adaptCourse);
      setCourses(adaptedCourses);
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
    loadCourses();
  }, [searchQuery, selectedTypes.length === 1 ? selectedTypes[0] : null, selectedSubjects.length === 1 ? selectedSubjects[0] : null, sortBy]);

  // Extract all types, subjects, and price range
  const allTypes = useMemo(() => {
    return Array.from(new Set(courses.flatMap(course => course.type)));
  }, [courses]);

  const allSubjects = useMemo(() => {
    return Array.from(new Set(courses.map(course => course.mainSubject).filter(Boolean))) as string[];
  }, [courses]);

  const minMaxPrice = useMemo(() => {
    if (courses.length === 0) return [0, 1000];
    const prices = courses.map(c => c.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min !== minPrice) setMinPrice(min);
    if (max !== maxPrice) setMaxPrice(max);
    return [min, max];
  }, [courses]);

  // Filter functions
  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedSubjects([]);
    setSearchQuery('');
    setMinPrice(minMaxPrice[0]);
    setMaxPrice(minMaxPrice[1]);
    
    // Reload data without filters
    loadCourses();
  };

  // Apply all filters
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      // Filter by credit type
      const typeMatch = selectedTypes.length === 0 || 
        course.type.some(type => selectedTypes.includes(type));
      
      // Filter by subject
      const subjectMatch = selectedSubjects.length === 0 || 
        (course.mainSubject && selectedSubjects.includes(course.mainSubject));
      
      // Filter by search query
      const searchMatch = !searchQuery || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (course.instructor.name && course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filter by price range
      const priceMatch = course.price >= minPrice && course.price <= maxPrice;
      
      return typeMatch && subjectMatch && searchMatch && priceMatch;
    });
  }, [courses, selectedTypes, selectedSubjects, searchQuery, minPrice, maxPrice]);

  // Apply sorting
  const sortedCourses = useMemo(() => {
    return [...filteredCourses].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'credits-asc':
          return a.credits - b.credits;
        case 'credits-desc':
          return b.credits - a.credits;
        default:
          return 0;
      }
    });
  }, [filteredCourses, sortBy]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 9;
  const totalPages = Math.ceil(sortedCourses.length / coursesPerPage);
  
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * coursesPerPage;
    return sortedCourses.slice(startIndex, startIndex + coursesPerPage);
  }, [sortedCourses, currentPage]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshData = async () => {
    setError(null);
    await loadCourses();
  };

  return (
    <main className="min-h-screen">
      {/* Background effect */}
      <div className="relative overflow-hidden">
        <BackgroundEffect intensity="light" color="primary" />
        
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="text-center mb-12 animate-fadeInUp">
            <h1 className="text-5xl font-bold mb-4 primary-gradient-text">
              Available Courses
            </h1>
            <p className="text-theme-neutral-600 text-lg max-w-2xl mx-auto">
              Browse our selection of professional development courses designed to enhance your skills and advance your career.
            </p>
          </div>

          {/* Mobile filter button */}
          <div className="lg:hidden mb-6 animate-fadeIn">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full py-3 px-4 bg-gradient-to-r from-theme-primary-DEFAULT to-theme-primary-dark text-white rounded-lg shadow-md"
            >
              <span className="font-medium">Filters</span>
              <svg 
                className={`w-5 h-5 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Skeleton sidebar */}
              <aside className="lg:w-1/4 bg-white p-6 rounded-xl shadow-sm border border-theme-neutral-200">
                <div className="mb-6">
                  <div className="h-8 w-32 bg-theme-neutral-200 animate-pulse rounded-md mb-4"></div>
                  <div className="h-12 w-full bg-theme-neutral-200 animate-pulse rounded-lg"></div>
                </div>
                
                <div className="mb-6">
                  <div className="h-8 w-32 bg-theme-neutral-200 animate-pulse rounded-md mb-3"></div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex items-center">
                        <div className="h-4 w-4 bg-theme-neutral-200 animate-pulse rounded mr-2"></div>
                        <div className="h-4 w-20 bg-theme-neutral-200 animate-pulse rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="h-8 w-32 bg-theme-neutral-200 animate-pulse rounded-md mb-3"></div>
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center">
                        <div className="h-4 w-4 bg-theme-neutral-200 animate-pulse rounded mr-2"></div>
                        <div className="h-4 w-28 bg-theme-neutral-200 animate-pulse rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="h-10 w-full bg-theme-neutral-200 animate-pulse rounded-lg"></div>
              </aside>
              
              {/* Skeleton courses */}
              <div className="lg:w-3/4">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-theme-neutral-200">
                  <div className="h-6 w-48 bg-theme-neutral-200 animate-pulse rounded"></div>
                  <div className="flex gap-4">
                    <div className="h-10 w-32 bg-theme-neutral-200 animate-pulse rounded-lg"></div>
                    <div className="h-10 w-20 bg-theme-neutral-200 animate-pulse rounded-lg"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden border border-theme-neutral-200 h-full animate-pulse">
                      <div className="h-48 bg-theme-neutral-200"></div>
                      <div className="p-6">
                        <div className="h-6 w-3/4 bg-theme-neutral-200 rounded mb-4"></div>
                        <div className="h-4 w-full bg-theme-neutral-200 rounded mb-2"></div>
                        <div className="h-4 w-2/3 bg-theme-neutral-200 rounded mb-4"></div>
                        <div className="flex justify-between mb-4">
                          <div className="h-4 w-1/3 bg-theme-neutral-200 rounded"></div>
                          <div className="h-4 w-1/3 bg-theme-neutral-200 rounded"></div>
                        </div>
                        <div className="pt-4 border-t border-theme-neutral-200 flex justify-between">
                          <div className="h-8 w-1/4 bg-theme-neutral-200 rounded"></div>
                          <div className="h-10 w-1/3 bg-theme-neutral-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
              <button 
                onClick={() => refreshData()} 
                className="mt-4 px-4 py-2 bg-theme-primary-DEFAULT text-white rounded-lg"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters sidebar - hidden on mobile unless toggled */}
              <aside className={`lg:w-1/4 bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-md border border-theme-neutral-200 ${showFilters ? 'block animate-fadeInLeft' : 'hidden lg:block'} transition-all duration-300`}>
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-4 primary-gradient-text">Search</h2>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search courses..."
                      className="w-full p-3 pl-10 rounded-lg border border-theme-neutral-300 focus:outline-none focus:ring-2 focus:ring-theme-primary-DEFAULT transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <svg 
                      className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-theme-primary-DEFAULT"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {allTypes.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold mb-3 secondary-gradient-text">Credit Types</h2>
                    <div className="space-y-2">
                      {allTypes.map((type, index) => {
                        // Count courses with this type
                        const typeCount = courses.filter(course => 
                          course.type.includes(type)
                        ).length;
                        
                        return (
                          <div 
                            key={type} 
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-theme-neutral-100 transition-colors"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`type-${type}`}
                                checked={selectedTypes.includes(type)}
                                onChange={() => toggleType(type)}
                                className="h-4 w-4 text-theme-primary-DEFAULT focus:ring-theme-primary-DEFAULT rounded"
                              />
                              <label htmlFor={`type-${type}`} className="ml-2 text-theme-neutral-700 font-medium">
                                {type}
                              </label>
                            </div>
                            <span className="text-xs font-semibold text-white bg-theme-primary-DEFAULT px-2 py-1 rounded-full">
                              {typeCount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {allSubjects.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold mb-3 accent-gradient-text">Subjects</h2>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {allSubjects.map((subject, index) => {
                        // Count courses with this subject
                        const subjectCount = courses.filter(course => 
                          course.mainSubject === subject
                        ).length;
                        
                        return (
                          <div 
                            key={subject} 
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-theme-neutral-100 transition-colors"
                            style={{ animationDelay: `${(index + allTypes.length) * 50}ms` }}
                          >
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`subject-${subject}`}
                                checked={selectedSubjects.includes(subject)}
                                onChange={() => toggleSubject(subject)}
                                className="h-4 w-4 text-theme-accent-DEFAULT focus:ring-theme-accent-DEFAULT rounded"
                              />
                              <label htmlFor={`subject-${subject}`} className="ml-2 text-theme-neutral-700 font-medium truncate max-w-[160px]">
                                {subject}
                              </label>
                            </div>
                            <span className="text-xs font-semibold text-white bg-theme-accent-DEFAULT px-2 py-1 rounded-full flex-shrink-0">
                              {subjectCount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-3 secondary-gradient-text">Price Range</h2>
                  <div className="px-2">
                    <div className="flex justify-between mb-2 text-sm font-medium">
                      <span>${minPrice}</span>
                      <span>${maxPrice}</span>
                    </div>
                    <input
                      type="range"
                      min={minMaxPrice[0]}
                      max={minMaxPrice[1]}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                      className="w-full accent-theme-primary-DEFAULT cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={resetFilters}
                    className="w-full py-2 text-theme-neutral-600 bg-theme-neutral-100 rounded-lg hover:bg-theme-neutral-200 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset Filters
                  </button>
                  
                  <button
                    onClick={() => setShowFilters(false)}
                    className="lg:hidden w-full py-2 text-white bg-gradient-to-r from-theme-primary-DEFAULT to-theme-primary-dark rounded-lg transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply Filters
                  </button>
                </div>
              </aside>

              {/* Courses content */}
              <div className="lg:w-3/4 animate-fadeInUp">
                {/* Sorting and layout controls */}
                <div className="flex flex-wrap justify-between items-center mb-6 pb-4 border-b border-theme-neutral-200">
                  <div className="text-theme-neutral-700 mb-3 sm:mb-0">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-theme-primary-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Showing <span className="font-semibold">{paginatedCourses.length}</span> of <span className="font-semibold">{sortedCourses.length}</span> courses</span>
                    </div>
                    {sortedCourses.length !== courses.length && (
                      <div className="flex items-center mt-1 ml-7">
                        <span className="inline-block">
                          (filtered from <span className="font-semibold">{courses.length}</span> total courses)
                        </span>
                        <button 
                          onClick={resetFilters}
                          className="ml-2 text-theme-primary-DEFAULT hover:underline text-sm flex items-center"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Clear filters
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="relative">
                      <label htmlFor="sortBy" className="sr-only">Sort by</label>
                      <select 
                        id="sortBy" 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="py-2 pl-3 pr-8 border border-theme-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary-DEFAULT appearance-none bg-white"
                      >
                        <option value="title-asc">Title (A-Z)</option>
                        <option value="title-desc">Title (Z-A)</option>
                        <option value="price-asc">Price (Low-High)</option>
                        <option value="price-desc">Price (High-Low)</option>
                        <option value="credits-asc">Credits (Low-High)</option>
                        <option value="credits-desc">Credits (High-Low)</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-theme-neutral-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="flex rounded-lg border border-theme-neutral-300 overflow-hidden shadow-sm">
                      <button 
                        onClick={() => setLayout('grid')}
                        className={`p-2 ${layout === 'grid' ? 'bg-theme-primary-DEFAULT text-white' : 'bg-white text-theme-neutral-700 hover:bg-theme-neutral-100'}`}
                        title="Grid View"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setLayout('list')}
                        className={`p-2 ${layout === 'list' ? 'bg-theme-primary-DEFAULT text-white' : 'bg-white text-theme-neutral-700 hover:bg-theme-neutral-100'}`}
                        title="List View"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {sortedCourses.length > 0 ? (
                  <>
                    {layout === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedCourses.map((course, index) => (
                          <div 
                            key={course.slug} 
                            className="animate-fadeInUp" 
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <CourseCard
                              key={course.slug}
                              course={course}
                              featured={index === 0 && currentPage === 1}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {paginatedCourses.map((course, index) => (
                          <div 
                            key={course.slug} 
                            className="animate-fadeInUp" 
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-md overflow-hidden border border-theme-neutral-200 hover:shadow-lg transition-all duration-300">
                              <div className="md:w-1/4 relative h-48 md:h-auto">
                                <img
                                  src={course.image || '/images/course-placeholder.jpg'}
                                  alt={course.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                                  {course.type.map((type) => (
                                    <span
                                      key={type}
                                      className="px-2 py-1 text-xs font-semibold rounded-full bg-theme-primary-light/10 text-theme-primary-light backdrop-blur-sm"
                                    >
                                      {type}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="p-6 md:w-3/4 flex flex-col justify-between">
                                <div>
                                  <h3 className="text-xl font-bold mb-2 text-theme-neutral-800">
                                    {course.title}
                                  </h3>
                                  <p className="text-theme-neutral-600 mb-4">{course.description}</p>
                                  {course.subject && (
                                    <p className="text-sm text-theme-neutral-500 mb-2">
                                      <span className="font-medium">Subject:</span> {course.subject}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-4 text-sm mb-4">
                                    <div className="flex items-center text-theme-neutral-500">
                                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="font-medium">{course.duration}</span>
                                    </div>
                                    <div className="flex items-center text-theme-neutral-500">
                                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                      </svg>
                                      <span className="font-medium">{course.credits} Credits</span>
                                    </div>
                                    <div className="flex items-center text-theme-neutral-500">
                                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span className="font-medium">{course.instructor.name}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-theme-neutral-200">
                                  <span className="text-2xl font-bold text-theme-accent-DEFAULT">
                                    ${course.price.toFixed(2)}
                                  </span>
                                  <Link
                                    href={`/courses/${course.slug}`}
                                    className="px-6 py-2 rounded-lg font-semibold text-white bg-theme-accent-DEFAULT hover:bg-theme-accent-dark transition-all duration-300"
                                  >
                                    Learn More →
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Pagination controls */}
                    {totalPages > 1 && (
                      <div className="mt-8 flex flex-wrap justify-center items-center gap-2 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
                        <button
                          onClick={() => goToPage(1)}
                          disabled={currentPage === 1}
                          className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                            currentPage === 1 
                              ? 'bg-theme-neutral-100 text-theme-neutral-400 cursor-not-allowed' 
                              : 'bg-white border border-theme-primary-DEFAULT text-theme-primary-DEFAULT hover:bg-theme-primary-DEFAULT hover:text-white shadow-sm'
                          }`}
                          aria-label="Go to first page"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                            currentPage === 1 
                              ? 'bg-theme-neutral-100 text-theme-neutral-400 cursor-not-allowed' 
                              : 'bg-white border border-theme-primary-DEFAULT text-theme-primary-DEFAULT hover:bg-theme-primary-DEFAULT hover:text-white shadow-sm'
                          }`}
                          aria-label="Go to previous page"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, index) => {
                          // Show limited page buttons
                          const pageNum = index + 1;
                          const showPageButton = 
                            pageNum === 1 || 
                            pageNum === totalPages || 
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
                            
                          if (!showPageButton) {
                            // Show ellipsis for skipped pages
                            if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                              return (
                                <span key={pageNum} className="px-2 py-1 text-theme-neutral-700">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                                currentPage === pageNum 
                                  ? 'bg-gradient-to-r from-theme-primary-DEFAULT to-theme-primary-dark text-white shadow-md' 
                                  : 'bg-white border border-theme-neutral-200 text-theme-neutral-700 hover:border-theme-primary-DEFAULT hover:text-theme-primary-DEFAULT'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                            currentPage === totalPages 
                              ? 'bg-theme-neutral-100 text-theme-neutral-400 cursor-not-allowed'
                              : 'bg-white border border-theme-primary-DEFAULT text-theme-primary-DEFAULT hover:bg-theme-primary-DEFAULT hover:text-white shadow-sm'
                          }`}
                          aria-label="Go to next page"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => goToPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                            currentPage === totalPages 
                              ? 'bg-theme-neutral-100 text-theme-neutral-400 cursor-not-allowed' 
                              : 'bg-white border border-theme-primary-DEFAULT text-theme-primary-DEFAULT hover:bg-theme-primary-DEFAULT hover:text-white shadow-sm'
                          }`}
                          aria-label="Go to last page"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-theme-neutral-200 animate-fadeInUp">
                    <div className="mb-4 relative inline-block">
                      <svg className="mx-auto h-16 w-16 text-theme-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-0 right-0 rounded-full bg-theme-neutral-100 p-1">
                        <svg className="h-5 w-5 text-theme-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="mt-2 text-xl font-bold text-theme-neutral-800 primary-gradient-text">No courses found</h3>
                    <p className="mt-1 text-theme-neutral-600">We couldn't find any courses matching your search criteria.</p>
                    <button
                      onClick={resetFilters}
                      className="mt-6 px-6 py-3 bg-gradient-to-r from-theme-primary-DEFAULT to-theme-primary-dark text-white rounded-lg hover:shadow-md transition-all duration-300 font-medium flex items-center mx-auto"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 