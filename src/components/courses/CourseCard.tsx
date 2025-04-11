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
      className="bg-white rounded-xl overflow-hidden border border-theme-neutral-200 h-full flex flex-col group card-hover-effect"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Display course type tags at the top of the card */}
      <div className="p-4 bg-theme-neutral-50">
        <div className="flex flex-wrap gap-1">
          {course.type.map((type) => (
            <span
              key={type}
              className="px-3 py-1 text-xs font-semibold rounded-full bg-theme-primary-light text-theme-primary-DEFAULT"
            >
              {type}
            </span>
          ))}
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold mb-2 primary-gradient-text">
          {sanitizedTitle}
        </h3>
        <p className="text-theme-neutral-600 mb-4 line-clamp-2">{course.description}</p>
        
        {course.subject && (
          <p className="text-sm text-theme-neutral-500 mb-3">
            <span className="font-medium">Subject: </span>
            {sanitizeText(course.subject)}
          </p>
        )}
        
        {/* Display credits by license type */}
        <div className="bg-theme-neutral-50 p-3 rounded-lg mb-4">
          <h4 className="text-sm font-semibold mb-2 text-theme-neutral-700">Credits By License Type:</h4>
          <div className="grid grid-cols-2 gap-2">
            {course.creditsByType && Object.entries(course.creditsByType).map(([type, amount]) => (
              amount > 0 ? (
                <div key={type} className="flex items-center">
                  <span className="text-sm font-medium text-theme-primary-DEFAULT mr-2">{type}:</span>
                  <span className="text-sm text-theme-neutral-700">{amount}</span>
                </div>
              ) : null
            ))}
            {(!course.creditsByType || Object.keys(course.creditsByType).length === 0) && (
              <span className="text-sm text-theme-neutral-500 col-span-2">No credits information available</span>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-theme-neutral-200 mt-auto">
          <span className="text-2xl font-bold accent-gradient-text">
            ${course.price.toFixed(2)}
          </span>
          <Link
            href={`/courses/${course.slug}`}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
              featured
                ? 'bg-theme-accent-DEFAULT text-white hover:bg-theme-accent-dark shadow-lg shadow-theme-accent-DEFAULT/20 hover:shadow-theme-accent-DEFAULT/30'
                : 'relative overflow-hidden bg-theme-primary-DEFAULT text-white hover:bg-theme-primary-dark group-hover:scale-105'
            }`}
          >
            {featured ? (
              <span className="relative z-10">Enroll Now</span>
            ) : (
              <>
                <span className="relative z-10">Learn More</span>
                <span className="absolute right-0 transform transition-transform duration-300 group-hover:translate-x-1">→</span>
              </>
            )}
            {!featured && (
              <span className="absolute inset-0 h-full w-full bg-gradient-to-r from-theme-primary-DEFAULT to-theme-primary-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
} 