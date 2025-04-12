'use client';
import { Course } from '@/types/course';
import Link from 'next/link';
import { useState } from 'react';
import { sanitizeText } from '@/utils/text';

interface CourseCardProps {
  course: Course;
  featured?: boolean;
}

export default function CourseCard({ course, featured = false }: CourseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Sanitize the course title
  const sanitizedTitle = sanitizeText(course.title);
  
  return (
    <div 
      className={`backdrop-blur-sm bg-gradient-to-br from-slate-50/95 to-white/95 rounded-2xl overflow-hidden border border-neutral-200/50 h-full flex flex-col group transition-all duration-300 ${
        isHovered ? 'shadow-xl transform -translate-y-1' : 'shadow-md'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-6 flex flex-col flex-grow relative">
        {/* Price tag */}
        <div className="absolute -right-2 top-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-l-full shadow-lg transform group-hover:scale-105 transition-transform">
          <span className="text-xl font-bold">
            ${course.price.toFixed(2)}
          </span>
        </div>

        <h3 className="text-2xl font-bold mb-4 text-slate-800 pr-24">
          {sanitizedTitle}
        </h3>
        
        {course.subject && (
          <p className="text-sm text-slate-600 mb-4 flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-600 mr-2"></span>
            {sanitizeText(course.subject)}
          </p>
        )}
        
        {/* Credits section with modern design */}
        <div className="bg-slate-100 p-4 rounded-xl mb-6 border border-slate-200">
          <h4 className="text-sm font-semibold mb-3 text-slate-700">
            This course offers the following credit
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {course.creditsByType && Object.entries(course.creditsByType).map(([type, amount]) => (
              amount > 0 ? (
                <div key={type} className="flex items-center bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-sm font-medium text-blue-600 mr-2">{type}:</span>
                  <span className="text-sm text-slate-700">{amount}</span>
                </div>
              ) : null
            ))}
            {(!course.creditsByType || Object.keys(course.creditsByType).length === 0) && (
              <span className="text-sm text-slate-500 col-span-2">No credits information available</span>
            )}
          </div>
        </div>
        
        {/* Action button */}
        <div className="mt-auto">
          <Link
            href={`/courses/${course.slug}`}
            className={`w-full inline-flex items-center justify-center py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
              featured
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:scale-105'
                : 'bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:scale-105'
            }`}
          >
            <span className="mr-2">{featured ? 'Enroll Now' : 'Learn More'}</span>
            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
} 