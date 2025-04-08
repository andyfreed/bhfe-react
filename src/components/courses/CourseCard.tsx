'use client';
import { Course } from '@/types/course';
import Link from 'next/link';
import Image from 'next/image';

interface CourseCardProps {
  course: Course;
  featured?: boolean;
}

export default function CourseCard({ course, featured = false }: CourseCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-theme-neutral-200">
      <div className="relative h-48">
        <Image
          src={course.image || '/images/course-placeholder.jpg'}
          alt={course.title}
          fill
          style={{ objectFit: 'cover' }}
        />
        <div className="absolute top-4 left-4 flex gap-2">
          {course.type.map((type) => (
            <span
              key={type}
              className="px-3 py-1 text-xs font-semibold rounded-full bg-theme-primary-light/10 text-theme-primary-light backdrop-blur-sm"
            >
              {type}
            </span>
          ))}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 text-theme-neutral-800 hover:text-theme-primary-light transition-colors">
          {course.title}
        </h3>
        <p className="text-theme-neutral-600 mb-4 line-clamp-2">{course.description}</p>
        <div className="flex justify-between items-center mb-4 text-sm">
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
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-theme-neutral-200">
          <span className="text-2xl font-bold text-theme-accent-DEFAULT">
            ${course.price.toFixed(2)}
          </span>
          <Link
            href={`/courses/${course.slug}`}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
              featured
                ? 'bg-theme-accent-DEFAULT text-white hover:bg-theme-accent-dark shadow-lg shadow-theme-accent-DEFAULT/20 hover:shadow-theme-accent-DEFAULT/30'
                : 'text-theme-accent-DEFAULT hover:bg-theme-accent-DEFAULT/10'
            }`}
          >
            {featured ? 'Enroll Now' : 'Learn More →'}
          </Link>
        </div>
      </div>
    </div>
  );
} 