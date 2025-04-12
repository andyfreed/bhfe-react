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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-8">
        {/* Compact Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Professional Education Courses
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Browse our selection of professional development courses
          </p>
        </div>

        {/* Top Search and Sort Bar */}
        <div className="bg-white shadow-md rounded-xl p-3 sm:p-4 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
            {/* Search */}
            <div className="flex-grow">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <svg className="absolute right-3 top-2.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex-shrink-0 w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-700"
              >
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="credits-asc">Credits (Low to High)</option>
                <option value="credits-desc">Credits (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar Filters */}
          <div className="w-full lg:w-64 lg:flex-shrink-0">
            <div className="bg-white shadow-md rounded-xl p-4 sm:p-6 lg:sticky lg:top-8">
              <div className="space-y-6">
                {/* Credit Types */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Credit Types</h3>
                  <div className="flex flex-col gap-2">
                    {allTypes.map((type) => {
                      const typeCount = courses.filter(course => 
                        course.type.includes(type)
                      ).length;
                      
                      return (
                        <label
                          key={type}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedTypes.includes(type)}
                              onChange={() => toggleType(type)}
                              className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-slate-700">{type}</span>
                          </div>
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            {typeCount}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Subjects Dropdown */}
                {allSubjects.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Subject</h3>
                    <select
                      value={selectedSubjects[0] || ''}
                      onChange={(e) => setSelectedSubjects(e.target.value ? [e.target.value] : [])}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-700"
                    >
                      <option value="">All Subjects</option>
                      {allSubjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject} ({courses.filter(course => course.mainSubject === subject).length})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Price Range */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Price Range</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">$</span>
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        min={0}
                        max={maxPrice}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">$</span>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        min={minPrice}
                      />
                    </div>
                  </div>
                </div>

                {/* Reset Filters */}
                {(selectedTypes.length > 0 || selectedSubjects.length > 0 || searchQuery || minPrice > minMaxPrice[0] || maxPrice < minMaxPrice[1]) && (
                  <div className="pt-4 border-t border-slate-200">
                    <button
                      onClick={resetFilters}
                      className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-grow min-w-0">
            {/* Course Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {paginatedCourses.map((course, index) => (
                <div key={course.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-fadeIn">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 sm:mt-8 flex justify-center">
                <div className="flex flex-wrap justify-center items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 sm:px-4 py-2 rounded-lg bg-white border border-neutral-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-8 sm:w-10 h-8 sm:h-10 rounded-lg ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-neutral-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 sm:px-4 py-2 rounded-lg bg-white border border-neutral-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 