'use client';
import { Course } from '@/types/course';
import Link from 'next/link';
import Image from 'next/image';
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
      <div className="relative h-48 overflow-hidden">
        <Image
          src={course.image || '/images/course-placeholder.jpg'}
          alt={sanitizedTitle}
          fill
          style={{ 
            objectFit: 'cover',
            transition: 'transform 0.5s ease'
          }}
          className={isHovered ? 'scale-110' : ''}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
        <div className="absolute top-4 left-4 flex flex-wrap gap-1 animate-fadeIn">
          {course.type.map((type) => (
            <span
              key={type}
              className="px-3 py-1 text-xs font-semibold rounded-full glass-effect text-white backdrop-blur-sm"
            >
              {type}
            </span>
          ))}
        </div>
        
        {featured && (
          <div className="absolute top-4 right-4">
            <span className="bg-theme-accent-DEFAULT text-white px-3 py-1 text-xs font-bold rounded-full uppercase animate-pulse">
              Featured
            </span>
          </div>
        )}
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
        
        <div className="flex justify-between items-center mb-4 text-sm">
          <div className="flex items-center text-theme-neutral-500">
            <svg className="w-5 h-5 mr-2 text-theme-primary-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{course.duration}</span>
          </div>
          <div className="flex items-center text-theme-neutral-500">
            <svg className="w-5 h-5 mr-2 text-theme-secondary-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="font-medium">{course.credits} Credits</span>
          </div>
        </div>
        
        {course.instructor && course.instructor.name && (
          <div className="flex items-center text-theme-neutral-500 text-sm mb-4">
            <svg className="w-5 h-5 mr-2 text-theme-accent-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-medium">{sanitizeText(course.instructor.name)}</span>
          </div>
        )}
        
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